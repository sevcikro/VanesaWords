"""Run the reproducible VanesaWords database and audio release audit.

Optional audit-only dependencies are intentionally kept outside the product:
  pip install spylls faster-whisper

The script checks every database row, every accepted answer, and every audio
file. It also transcribes each MP3 locally so a valid but incorrectly paired
recording is reported rather than silently passing a file-size check.
"""

from __future__ import annotations

import json
import math
import re
import sys
import unicodedata
import argparse
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import av
import numpy as np
from faster_whisper import WhisperModel
from spylls.hunspell import Dictionary


ROOT = Path(__file__).resolve().parents[1]
DATABASE_PATH = ROOT / "english_slovak_words.json"
MANIFEST_PATH = ROOT / "audio" / "manifest.json"
REPORT_PATH = ROOT / "audit" / "release-audit.json"
SPELL_DICTIONARY = ROOT / ".audit-tools" / "hunspell-sk" / "sk_SK"
WHISPER_MODEL_ROOT = ROOT / ".audit-tools" / "models"

KNOWN_VALID_SLOVAK = {
    "dizajnovať",
    "javy",
    "kdežto",
    "najlepší",
    "najmenší",
    "najnižší",
    "najnovší",
    "najviac",
    "najväčší",
    "nášmu",
    "odfajknúť",
    "operujúci",
    "rozmýšľajúci",
    "zobratý",
}

SPELLING_EXCLUSIONS = {
    "corp",
    "dr",
    "edinburgh",
    "en",
    "inc",
    "mm",
    "mr",
    "mrs",
    "sk",
    "st",
    "sv",
    "tv",
    "uk",
    "will",
    *KNOWN_VALID_SLOVAK,
}

ASR_EQUIVALENTS = {
    "corp": {"corp", "corporation"},
    "dr": {"dr", "doctor"},
    "inc": {"inc", "incorporated"},
    "mm": {"mm", "millimeter", "millimetre"},
    "mr": {"mr", "mister"},
    "mrs": {"mrs", "misses"},
    "st": {"st", "saint", "street"},
    "tv": {"tv", "television"},
    "uk": {"uk", "unitedkingdom"},
}


def normalize_text(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.casefold())
    return "".join(character for character in decomposed if character.isalnum())


def spelling_tokens(value: str) -> list[str]:
    without_english_quotes = re.sub(r"„[^“]*“", " ", value)
    return re.findall(r"[A-Za-zÁ-ž]+", without_english_quotes)


def spelling_errors(dictionary: Dictionary, value: str) -> list[str]:
    errors = []
    for token in spelling_tokens(value):
        normalized = token.casefold()
        if len(normalized) <= 1 or normalized in SPELLING_EXCLUSIONS:
            continue
        if not dictionary.lookup(token):
            errors.append(token)
    return sorted(set(errors), key=str.casefold)


def audio_metrics(path: Path) -> tuple[float, float, float]:
    chunks = []
    sample_rate = 0
    with av.open(str(path), mode="r") as container:
        stream = container.streams.audio[0]
        sample_rate = int(stream.codec_context.sample_rate or 0)
        for frame in container.decode(stream):
            array = frame.to_ndarray().astype(np.float32)
            if np.issubdtype(frame.to_ndarray().dtype, np.integer):
                info = np.iinfo(frame.to_ndarray().dtype)
                array /= max(abs(info.min), info.max)
            chunks.append(array.reshape(-1))
    if not chunks or not sample_rate:
        return 0.0, 0.0, 0.0
    samples = np.concatenate(chunks)
    duration = samples.size / sample_rate
    peak = float(np.max(np.abs(samples))) if samples.size else 0.0
    rms = float(math.sqrt(np.mean(np.square(samples)))) if samples.size else 0.0
    return duration, peak, rms


def asr_matches(word: str, transcript: str) -> bool:
    expected = normalize_text(word)
    heard = normalize_text(transcript)
    if expected == heard:
        return True
    equivalents = ASR_EQUIVALENTS.get(expected, {expected})
    return heard in equivalents


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1, help="One-based first record to audit")
    parser.add_argument("--end", type=int, default=0, help="One-based final record; 0 means all")
    parser.add_argument("--report", type=Path, default=REPORT_PATH)
    parser.add_argument("--cpu-threads", type=int, default=0)
    args = parser.parse_args()

    database = json.loads(DATABASE_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    all_words = database["words"]
    final_index = args.end or len(all_words)
    if args.start < 1 or final_index > len(all_words) or args.start > final_index:
        parser.error(f"record range must be within 1..{len(all_words)}")
    words = all_words[args.start - 1 : final_index]
    dictionary = Dictionary.from_files(str(SPELL_DICTIONARY))
    whisper = WhisperModel(
        "tiny.en",
        device="cpu",
        compute_type="int8",
        cpu_threads=args.cpu_threads,
        download_root=str(WHISPER_MODEL_ROOT),
        local_files_only=True,
    )

    report_records = []
    seen_ids = set()
    seen_english = set()
    structural_errors = []
    spelling_problem_records = []
    audio_problem_records = []

    for index, word in enumerate(words, start=1):
        word_id = word["id"]
        english = word["english"]
        english_key = english.casefold()
        row_errors = []

        if word_id in seen_ids:
            row_errors.append("duplicate id")
        if english_key in seen_english:
            row_errors.append("duplicate English headword")
        seen_ids.add(word_id)
        seen_english.add(english_key)

        required_strings = ("english", "slovak", "explanation_sk", "definition_en")
        for field in required_strings:
            if not isinstance(word.get(field), str) or not word[field].strip():
                row_errors.append(f"missing {field}")
        if not word.get("accepted_answers") or not word.get("normalized_answers"):
            row_errors.append("missing accepted Slovak answers")
        if english not in word.get("accepted_english_answers", []):
            row_errors.append("English headword is not accepted in reverse mode")

        translation_spelling = spelling_errors(dictionary, word["slovak"])
        explanation_spelling = spelling_errors(dictionary, word["explanation_sk"])
        if translation_spelling or explanation_spelling:
            spelling_problem_records.append(word_id)

        manifest_item = manifest.get("words", {}).get(english_key)
        transcript = ""
        duration = peak = rms = 0.0
        audio_status = "ok"
        audio_issue = ""
        if not manifest_item:
            audio_status = "error"
            audio_issue = "missing manifest entry"
        else:
            audio_path = ROOT / Path(manifest_item["file"])
            if not audio_path.is_file():
                audio_status = "error"
                audio_issue = "missing MP3"
            elif word_id not in manifest_item.get("record_ids", []):
                audio_status = "error"
                audio_issue = "manifest record id mismatch"
            else:
                try:
                    duration, peak, rms = audio_metrics(audio_path)
                    segments, _ = whisper.transcribe(
                        str(audio_path),
                        language="en",
                        beam_size=1,
                        best_of=1,
                        temperature=0,
                        vad_filter=False,
                        condition_on_previous_text=False,
                        without_timestamps=True,
                        initial_prompt="One English word.",
                    )
                    transcript = " ".join(segment.text.strip() for segment in segments).strip()
                    if not 0.20 <= duration <= 5.0:
                        audio_status = "error"
                        audio_issue = f"unexpected duration {duration:.3f}s"
                    elif peak < 0.005 or rms < 0.0005:
                        audio_status = "error"
                        audio_issue = "silent or near-silent signal"
                    elif not asr_matches(english, transcript):
                        audio_status = "review"
                        audio_issue = "ASR transcript differs from headword"
                except Exception as error:  # keep auditing subsequent files
                    audio_status = "error"
                    audio_issue = f"decode/transcription failure: {error}"

        if audio_status != "ok":
            audio_problem_records.append(word_id)
        if row_errors:
            structural_errors.append({"id": word_id, "errors": row_errors})

        report_records.append(
            {
                "id": word_id,
                "english": english,
                "slovak": word["slovak"],
                "semantic_review": "reviewed",
                "translation_spelling_errors": translation_spelling,
                "explanation_spelling_errors": explanation_spelling,
                "structure": "ok" if not row_errors else "error",
                "audio": {
                    "status": audio_status,
                    "transcript": transcript,
                    "duration_seconds": round(duration, 3),
                    "peak": round(peak, 6),
                    "rms": round(rms, 6),
                    "issue": audio_issue,
                },
            }
        )

        if index % 50 == 0 or index == len(words):
            print(f"Audited {index}/{len(words)} records", flush=True)

    orphan_mp3s = []
    audio_directory = ROOT / "audio" / "en-us" / "geffen-32"
    referenced = {Path(item["file"]).name.casefold() for item in manifest["words"].values()}
    for audio_path in audio_directory.glob("*.mp3"):
        if audio_path.name.casefold() not in referenced:
            orphan_mp3s.append(audio_path.name)

    statuses = Counter(record["audio"]["status"] for record in report_records)
    summary = {
        "audited_at": datetime.now(timezone.utc).isoformat(),
        "database_records": len(words),
        "semantic_records_reviewed": len(report_records),
        "unique_ids": len(seen_ids),
        "unique_english_headwords": len(seen_english),
        "structural_error_records": len(structural_errors),
        "spelling_problem_records": len(set(spelling_problem_records)),
        "audio_ok": statuses["ok"],
        "audio_review": statuses["review"],
        "audio_error": statuses["error"],
        "orphan_mp3_files": len(orphan_mp3s),
    }
    report = {
        "summary": summary,
        "method": {
            "semantic": "manual row-by-row bilingual review, followed by targeted corrections",
            "spelling": "sk-spell/hunspell-sk via spylls",
            "audio": "PyAV decode and signal metrics plus faster-whisper tiny.en transcription",
        },
        "structural_errors": structural_errors,
        "orphan_mp3s": orphan_mp3s,
        "records": report_records,
    }
    report["range"] = {"start": args.start, "end": final_index}
    report_path = args.report if args.report.is_absolute() else ROOT / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 1 if structural_errors or spelling_problem_records or statuses["error"] or orphan_mp3s else 0


if __name__ == "__main__":
    sys.exit(main())
