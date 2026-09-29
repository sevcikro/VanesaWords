import json
import re
import sys
import unicodedata
from pathlib import Path

from pypdf import PdfReader


ENTRY_RE = re.compile(r"^(.+?)\s+(\d{1,4})\s+(.+)$")
PAGE_RE = re.compile(r"^strana\s*\d+$", re.IGNORECASE)


def normalize_answer(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold().strip()
    value = re.sub(r"[\s\-_]+", " ", value)
    value = re.sub(r"[^\w\s]", "", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", value).strip()


def split_translations(value: str) -> list[str]:
    """Split top-level comma-separated alternatives, keeping parenthetical commas."""
    items: list[str] = []
    current: list[str] = []
    depth = 0
    for char in value:
        if char == "(":
            depth += 1
        elif char == ")" and depth:
            depth -= 1
        if char == "," and depth == 0:
            item = "".join(current).strip()
            if item:
                items.append(item)
            current = []
        else:
            current.append(char)
    item = "".join(current).strip()
    if item:
        items.append(item)
    return items


def extract_entries(pdf_path: Path) -> list[dict]:
    reader = PdfReader(str(pdf_path))
    rows: list[dict] = []

    for page_number, page in enumerate(reader.pages, start=1):
        lines = [line.strip() for line in (page.extract_text() or "").splitlines()]
        for line in lines:
            if not line or PAGE_RE.fullmatch(line):
                continue
            if line in {
                "2000 NA JPOUŽÍVANEJŠÍCH",
                "ANGLICKÝCH SLOV",
                "Slovo Poradie Preklad",
            }:
                continue
            match = ENTRY_RE.match(line)
            if match:
                english, rank_text, slovak = match.groups()
                rank = int(rank_text)
                if 1 <= rank <= 2000:
                    rows.append(
                        {
                            "id": rank,
                            "english": english.strip(),
                            "slovak": slovak.strip(),
                            "source_page": page_number,
                        }
                    )
                    continue
            if not rows:
                raise ValueError(f"Unexpected content before first entry on page {page_number}: {line!r}")
            rows[-1]["slovak"] += " " + line

    ranks = [row["id"] for row in rows]
    expected = list(range(1, 2001))
    if ranks != expected:
        missing = sorted(set(expected) - set(ranks))
        duplicates = sorted({rank for rank in ranks if ranks.count(rank) > 1})
        raise ValueError(
            f"Rank validation failed: rows={len(rows)}, missing={missing[:20]}, "
            f"duplicates={duplicates[:20]}"
        )

    for row in rows:
        alternatives = split_translations(row["slovak"])
        row["accepted_answers"] = alternatives
        row["normalized_answers"] = sorted(
            {normalize_answer(answer) for answer in alternatives if normalize_answer(answer)}
        )
    return rows


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract_words.py INPUT.pdf OUTPUT.json")
    input_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    rows = extract_entries(input_path)
    payload = {
        "schema_version": 1,
        "language_pair": {"prompt": "en", "answer": "sk"},
        "answer_matching": {
            "case_sensitive": False,
            "punctuation_sensitive": False,
            "trim_whitespace": True,
        },
        "supported_pack_sizes": [10, 20, 50, 100],
        "count": len(rows),
        "words": rows,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {len(rows)} entries to {output_path}")


if __name__ == "__main__":
    main()
