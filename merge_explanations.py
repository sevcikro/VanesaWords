import csv
import json
import re
import sys
from pathlib import Path


SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1IDPqZx37Nzft0udEVoMO021MzBhf3GcjtwLwjHeefAQ/edit?gid=164914202"
)


def clean_text(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n").replace("\u00a0", " ")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in value.split("\n")]
    value = "\n".join(lines)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def explanation_without_translation(full_text: str, translation: str) -> str:
    full_text = clean_text(full_text)
    translation = clean_text(translation)
    if full_text.casefold().startswith(translation.casefold()):
        remainder = full_text[len(translation) :].lstrip(" ;,:.-\n")
        if remainder:
            return remainder
    return full_text


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit(
            "Usage: merge_explanations.py DATABASE.json SOURCE.csv OUTPUT.json"
        )

    database_path = Path(sys.argv[1]).resolve()
    source_path = Path(sys.argv[2]).resolve()
    output_path = Path(sys.argv[3]).resolve()

    database = json.loads(database_path.read_text(encoding="utf-8"))
    with source_path.open(encoding="utf-8-sig", newline="") as stream:
        source_rows = list(csv.DictReader(stream))

    source_by_rank = {
        int(row["Poradie"]): row
        for row in source_rows
        if row["Poradie"].strip().isdigit() and row["Anglické slovo"].strip()
    }

    words = database.get("words", [])
    expected_ranks = {word["id"] for word in words}
    missing_ranks = sorted(expected_ranks - set(source_by_rank))
    if missing_ranks:
        raise ValueError(f"Definitions are missing for ranks: {missing_ranks[:20]}")

    word_mismatches = []
    for word in words:
        row = source_by_rank[word["id"]]
        sheet_word = clean_text(row["Anglické slovo"])
        if sheet_word.casefold() != word["english"].casefold():
            word_mismatches.append((word["id"], word["english"], sheet_word))

        # The original PDF repeats "work" at rank 104 even though its translation
        # and definition are for "between". The expanded source corrects it.
        if word["id"] == 104 and sheet_word.casefold() == "between":
            word["english"] = "between"

        full_slovak = clean_text(row["Slovenský preklad"])
        word["explanation_sk"] = explanation_without_translation(
            full_slovak, word["slovak"]
        )
        word["definition_en"] = clean_text(row["Definícia v angličtine"])

    if any(not word["explanation_sk"] for word in words):
        raise ValueError("At least one Slovak explanation is empty")
    if any(not word["definition_en"] for word in words):
        raise ValueError("At least one English definition is empty")

    database["count"] = len(words)
    database["explanations_source"] = {
        "url": SHEET_URL,
        "sheet_gid": 164914202,
        "matched_records": len(words),
    }
    database["merge_notes"] = {
        "source_word_mismatches": [
            {"id": rank, "database": database_word, "source": sheet_word}
            for rank, database_word, sheet_word in word_mismatches
        ],
        "corrected_source_error_ids": [104],
    }

    output_path.write_text(
        json.dumps(database, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(
        f"Merged explanations for {len(words)} words; "
        f"source word mismatches: {len(word_mismatches)}"
    )


if __name__ == "__main__":
    main()
