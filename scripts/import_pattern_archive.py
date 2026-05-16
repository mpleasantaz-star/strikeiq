from __future__ import annotations

from pathlib import Path
import argparse
import sqlite3
import sys
import tempfile
import zipfile

from import_official_pattern import DB_PATH, import_file


SUPPORTED_PATTERN_EXTENSIONS = {".pdf", ".dat", ".dba", ".pat", ".kosi"}


def pattern_name_from_member(member_name: str) -> str:
    path = Path(member_name)
    stem = path.stem.replace("_", " ").replace("-", " ")
    return " ".join(stem.split()) or path.name


def import_archive(
    archive_path: Path,
    source_name: str,
    source_url: str | None,
    db_path: Path = DB_PATH,
    limit: int | None = None,
) -> int:
    imported = 0
    total_supported = 0
    queued_members: list[tuple[str, str, int | None]] = []

    with zipfile.ZipFile(archive_path) as archive:
        all_supported_members = [
            info
            for info in archive.infolist()
            if not info.is_dir() and Path(info.filename).suffix.lower() in SUPPORTED_PATTERN_EXTENSIONS
        ]
        total_supported = len(all_supported_members)
        members = all_supported_members
        if limit is not None:
            members = members[:limit]

        with tempfile.TemporaryDirectory(prefix="strikeiq-patterns-") as temp_dir:
            temp_root = Path(temp_dir)
            for info in members:
                temp_path = temp_root / Path(info.filename).name
                temp_path.write_bytes(archive.read(info))
                import_file(temp_path, source_url, db_path, source_name)
                imported += 1
                queued_members.append((info.filename, pattern_name_from_member(info.filename), None))

    with sqlite3.connect(db_path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute(
            """
            INSERT INTO source_catalog_status (
              source_name,
              source_home_url,
              official_count,
              imported_count,
              source_note
            )
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(source_name) DO UPDATE SET
              source_home_url = excluded.source_home_url,
              official_count = excluded.official_count,
              imported_count = excluded.imported_count,
              source_note = excluded.source_note,
              checked_at = CURRENT_TIMESTAMP
            """,
            (
                source_name,
                source_url or "",
                total_supported,
                connection.execute(
                    "SELECT COUNT(*) FROM official_pattern_imports WHERE source_name = ?",
                    (source_name,),
                ).fetchone()[0],
                "Shared Brunswick Pattern Library archive queued for review. Pattern files are stored as official imports until each one is approved into the app database.",
            ),
        )
        for member_name, pattern_name, length_ft in queued_members:
            connection.execute(
                """
                INSERT INTO source_catalog_backlog (
                  source_name,
                  pattern_name,
                  pattern_page_url,
                  length_ft,
                  import_status,
                  note
                )
                VALUES (?, ?, ?, ?, 'queued', ?)
                ON CONFLICT(source_name, pattern_name) DO UPDATE SET
                  pattern_page_url = excluded.pattern_page_url,
                  length_ft = excluded.length_ft,
                  import_status = excluded.import_status,
                  note = excluded.note
                """,
                (
                    source_name,
                    pattern_name,
                    source_url,
                    length_ft,
                    f"Queued from archive member: {member_name}",
                ),
            )
        connection.commit()

    return imported


def main() -> int:
    parser = argparse.ArgumentParser(description="Import official pattern files from a ZIP archive into the review queue.")
    parser.add_argument("archive", type=Path)
    parser.add_argument("--source-name", default="Brunswick Pattern Library")
    parser.add_argument("--source-url")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    if not args.archive.exists():
        print(f"Archive not found: {args.archive}", file=sys.stderr)
        return 1

    try:
        imported = import_archive(args.archive, args.source_name, args.source_url, args.db, args.limit)
    except zipfile.BadZipFile as exc:
        print(f"Archive is not a complete readable ZIP: {args.archive}", file=sys.stderr)
        print(str(exc), file=sys.stderr)
        return 1

    print(f"Queued {imported} pattern files from {args.archive}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
