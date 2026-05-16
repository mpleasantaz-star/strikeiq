from pathlib import Path
import sqlite3
import sys


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "bowling_oil_patterns.sqlite"
SCHEMA_PATH = ROOT / "db" / "schema.sql"
SEED_PATH = ROOT / "db" / "seed.sql"
BRUNSWICK_ARCHIVE_PATH = ROOT / "data" / "brunswick_pattern_library.zip"
BRUNSWICK_SOURCE_NAME = "Brunswick Pattern Library"
BRUNSWICK_SOURCE_URL = (
    "https://www.dropbox.com/scl/fo/1wcd61pyhemhpycbfhaac/"
    "ALqu1R_WvOpYsTOq8FzIBNY?rlkey=mg2dzh93xz248750bsnsbj9pz&e=1&st=8zgtziwx&dl=0"
)

sys.path.insert(0, str(ROOT / "scripts"))

from import_pattern_archive import import_archive  # noqa: E402
from promote_catalog_imports import promote_source  # noqa: E402


def run_sql_file(connection: sqlite3.Connection, path: Path) -> None:
    connection.executescript(path.read_text(encoding="utf-8"))


def migrate_existing_database(connection: sqlite3.Connection) -> None:
    refs_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(pattern_external_refs)").fetchall()
    }
    if refs_columns and "download_url" not in refs_columns:
        connection.execute("ALTER TABLE pattern_external_refs ADD COLUMN download_url TEXT")

    checks_row = connection.execute(
        """
        SELECT sql
        FROM sqlite_master
        WHERE type = 'table' AND name = 'external_ref_checks'
        """
    ).fetchone()
    if checks_row and "'download'" not in (checks_row[0] or ""):
        connection.execute("DROP TABLE external_ref_checks")


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        run_sql_file(connection, SCHEMA_PATH)
        migrate_existing_database(connection)
        run_sql_file(connection, SCHEMA_PATH)
        run_sql_file(connection, SEED_PATH)

        if BRUNSWICK_ARCHIVE_PATH.exists():
            import_archive(
                BRUNSWICK_ARCHIVE_PATH,
                BRUNSWICK_SOURCE_NAME,
                BRUNSWICK_SOURCE_URL,
                DB_PATH,
            )
            promote_source(BRUNSWICK_SOURCE_NAME, DB_PATH)

        pattern_count = connection.execute(
            "SELECT COUNT(*) FROM oil_patterns"
        ).fetchone()[0]
        tag_count = connection.execute(
            "SELECT COUNT(*) FROM pattern_tags"
        ).fetchone()[0]

    print(f"Built {DB_PATH}")
    print(f"Seeded {pattern_count} oil patterns and {tag_count} tags")


if __name__ == "__main__":
    main()
