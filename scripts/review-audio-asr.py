"""Second-pass ASR review for files flagged by the tiny English model."""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

from faster_whisper import WhisperModel


ROOT = Path(__file__).resolve().parents[1]
REPORT_PATH = ROOT / "audit" / "release-audit.json"

EQUIVALENTS = {
    "centre": {"center"},
    "labour": {"labor"},
    "programme": {"program"},
    "programmes": {"programs"},
    "behaviour": {"behavior"},
    "defence": {"defense"},
    "colour": {"color"},
    "organisation": {"organization"},
    "theatre": {"theater"},
    "grey": {"gray"},
    "recognised": {"recognized"},
    "centres": {"centers"},
    "to": {"two"},
    "for": {"four"},
    "by": {"bye"},
    "know": {"no"},
    "too": {"two"},
    "seen": {"scene"},
    "knew": {"new"},
    "high": {"hi"},
    "whose": {"whos"},
    "sea": {"see"},
    "buy": {"bye"},
    "won": {"one"},
    "write": {"right"},
    "site": {"sight"},
    "piece": {"peace"},
    "sale": {"sail"},
    "weight": {"wait"},
    "principle": {"principal"},
    "manner": {"manor"},
    "wear": {"where"},
    "the": {"d"},
    "i": {"a"},
}

NUMBER_EQUIVALENTS = {
    "zero": "0",
    "ten": "10",
    "eleven": "11",
    "twelve": "12",
    "thirteen": "13",
    "fourteen": "14",
    "fifteen": "15",
    "sixteen": "16",
    "seventeen": "17",
    "eighteen": "18",
    "nineteen": "19",
    "twenty": "20",
    "thirty": "30",
    "forty": "40",
    "fifty": "50",
    "hundred": "100",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return "".join(character for character in value if character.isalnum())


def matches(expected: str, transcript: str) -> bool:
    expected_key = normalize(expected)
    transcript_key = normalize(transcript)
    if expected_key == transcript_key:
        return True
    if transcript_key in EQUIVALENTS.get(expected_key, set()):
        return True
    return transcript_key == NUMBER_EQUIVALENTS.get(expected_key)


def main() -> None:
    report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    review_records = [record for record in report["records"] if record["audio"]["status"] == "review"]
    model = WhisperModel(
        "base.en",
        device="cpu",
        compute_type="int8",
        download_root=str(ROOT / ".audit-tools" / "models"),
        local_files_only=True,
    )

    remaining = []
    for index, record in enumerate(review_records, start=1):
        audio_path = ROOT / "audio" / "en-us" / "geffen-32" / f"{record['english'].lower()}.mp3"
        segments, _ = model.transcribe(
            str(audio_path),
            language="en",
            beam_size=5,
            temperature=0,
            vad_filter=False,
            condition_on_previous_text=False,
            without_timestamps=True,
            initial_prompt="One English word.",
        )
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        record["audio"]["secondary_transcript"] = transcript
        if matches(record["english"], transcript):
            record["audio"]["status"] = "ok"
            record["audio"]["issue"] = ""
            record["audio"]["verification"] = "base.en secondary ASR"
        else:
            remaining.append((record["id"], record["english"], transcript))
        if index % 25 == 0 or index == len(review_records):
            print(f"Second-pass reviewed {index}/{len(review_records)}", flush=True)

    statuses = {status: 0 for status in ("ok", "review", "error")}
    for record in report["records"]:
        statuses[record["audio"]["status"]] += 1
    report["summary"]["audio_ok"] = statuses["ok"]
    report["summary"]["audio_review"] = statuses["review"]
    report["summary"]["audio_error"] = statuses["error"]
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Remaining secondary mismatches:")
    for word_id, english, transcript in remaining:
        print(f"{word_id}|{english}|{transcript}")


if __name__ == "__main__":
    main()
