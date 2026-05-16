from __future__ import annotations

from pathlib import Path
import argparse
import hashlib
import re
import sqlite3
import sys


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "bowling_oil_patterns.sqlite"


def read_text(path: Path) -> str:
    data = path.read_bytes()
    if path.suffix.lower() == ".pdf":
        # Lightweight fallback: many Kegel PDFs expose enough text-like bytes for metadata review.
        return data.decode("latin-1", errors="ignore")
    return data.decode("utf-8", errors="ignore")


def detect_name(text: str, fallback: str) -> str | None:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for line in lines[:20]:
        cleaned = re.sub(r"\s+", " ", line)
        if 3 <= len(cleaned) <= 64 and not re.search(r"https?://|distance|volume|ratio", cleaned, re.I):
            return cleaned
    return Path(fallback).stem.replace("_", " ").replace("-", " ").title()


def detect_int(label: str, text: str) -> int | None:
    match = re.search(rf"(?:{label})\s*:?\s*(\d+)", text, re.I)
    return int(match.group(1)) if match else None


def detect_float(label: str, text: str) -> float | None:
    match = re.search(rf"(?:{label})\s*:?\s*(\d+(?:\.\d+)?)", text, re.I)
    return float(match.group(1)) if match else None


def detect_ratio(text: str) -> str | None:
    match = re.search(r"ratio\s*:?\s*([0-9.]+\s*:?\s*1|[A-Za-z ]{3,32})", text, re.I)
    return match.group(1).strip() if match else None


def best_pattern_match(connection: sqlite3.Connection, name: str | None) -> int | None:
    if not name:
        return None
    normalized = re.sub(r"\s+", " ", name).strip().lower()
    rows = connection.execute("SELECT id, name FROM oil_patterns").fetchall()
    for row in rows:
        local = row["name"].lower().replace(" style", "")
        if local in normalized or normalized in local:
            return row["id"]
    return None


def import_file(
    path: Path,
    source_url: str | None,
    db_path: Path = DB_PATH,
    source_name: str = "Kegel Pattern Library",
) -> int:
    data = path.read_bytes()
    file_hash = hashlib.sha256(data).hexdigest()
    raw_text = read_text(path)
    extracted_name = detect_name(raw_text, path.name)
    extracted_length_ft = detect_int("distance|length", raw_text)
    extracted_volume_ml = detect_float("volume", raw_text)
    extracted_ratio = detect_ratio(raw_text)

    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        oil_pattern_id = best_pattern_match(connection, extracted_name)
        cursor = connection.execute(
            """
            INSERT INTO official_pattern_imports (
              oil_pattern_id,
              source_name,
              source_url,
              file_name,
              file_type,
              file_hash,
              extracted_name,
              extracted_length_ft,
              extracted_volume_ml,
              extracted_ratio,
              raw_text
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(file_hash) DO UPDATE SET
              source_name = excluded.source_name,
              source_url = excluded.source_url,
              extracted_name = excluded.extracted_name,
              extracted_length_ft = excluded.extracted_length_ft,
              extracted_volume_ml = excluded.extracted_volume_ml,
              extracted_ratio = excluded.extracted_ratio,
              raw_text = excluded.raw_text
            """,
            (
                oil_pattern_id,
                source_name,
                source_url,
                path.name,
                path.suffix.lower().lstrip(".") or "unknown",
                file_hash,
                extracted_name,
                extracted_length_ft,
                extracted_volume_ml,
                extracted_ratio,
                raw_text[:20000],
            ),
        )
        connection.commit()
        row = connection.execute(
            "SELECT id FROM official_pattern_imports WHERE file_hash = ?",
            (file_hash,),
        ).fetchone()

    print(f"Imported {path.name} as review item {row['id']}")
    return row["id"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Import an official pattern file into the review queue.")
    parser.add_argument("path", type=Path)
    parser.add_argument("--source-name", default="Kegel Pattern Library")
    parser.add_argument("--source-url")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    args = parser.parse_args()

    if not args.path.exists():
        print(f"File not found: {args.path}", file=sys.stderr)
        return 1

    import_file(args.path, args.source_url, args.db, args.source_name)
    return 0


if __name__ == "__main__":
    sys.exit(main())
