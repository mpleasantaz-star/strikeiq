from pathlib import Path
import csv
import json
import sqlite3
import sys


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "bowling_oil_patterns.sqlite"
SCHEMA_PATH = ROOT / "db" / "schema.sql"
SEED_PATH = ROOT / "db" / "seed.sql"
BALL_IMPORT_PATH = ROOT / "data" / "imports" / "balls.csv"
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

    ball_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(bowling_balls)").fetchall()
    }
    migrations = {
        "brand": "ALTER TABLE bowling_balls ADD COLUMN brand TEXT",
        "core": "ALTER TABLE bowling_balls ADD COLUMN core TEXT",
        "rg": "ALTER TABLE bowling_balls ADD COLUMN rg REAL",
        "differential": "ALTER TABLE bowling_balls ADD COLUMN differential REAL",
        "mass_bias": "ALTER TABLE bowling_balls ADD COLUMN mass_bias REAL",
        "condition": "ALTER TABLE bowling_balls ADD COLUMN condition TEXT",
        "strength": "ALTER TABLE bowling_balls ADD COLUMN strength INTEGER",
        "price": "ALTER TABLE bowling_balls ADD COLUMN price REAL",
        "colors_json": "ALTER TABLE bowling_balls ADD COLUMN colors_json TEXT NOT NULL DEFAULT '[]'",
        "image_url": "ALTER TABLE bowling_balls ADD COLUMN image_url TEXT",
        "research_url": "ALTER TABLE bowling_balls ADD COLUMN research_url TEXT",
        "source_name": "ALTER TABLE bowling_balls ADD COLUMN source_name TEXT",
        "source_url": "ALTER TABLE bowling_balls ADD COLUMN source_url TEXT",
        "last_imported_at": "ALTER TABLE bowling_balls ADD COLUMN last_imported_at TEXT",
        "last_seen_at": "ALTER TABLE bowling_balls ADD COLUMN last_seen_at TEXT",
        "is_active": "ALTER TABLE bowling_balls ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1",
        "discontinued_at": "ALTER TABLE bowling_balls ADD COLUMN discontinued_at TEXT",
        "spec_hash": "ALTER TABLE bowling_balls ADD COLUMN spec_hash TEXT",
    }
    for column, statement in migrations.items():
        if ball_columns and column not in ball_columns:
            connection.execute(statement)


def csv_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def csv_int(value: str | None, default: int = 0) -> int:
    if value is None or value == "":
        return default
    return int(value)


def seed_bowling_balls(connection: sqlite3.Connection) -> None:
    if not BALL_IMPORT_PATH.exists():
        return
    with BALL_IMPORT_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            brand = (row.get("brand") or "").strip()
            name = (row.get("name") or "").strip()
            if not brand or not name:
                continue
            colors = [color.strip() for color in (row.get("colors") or "").split("|") if color.strip()]
            current = connection.execute(
                """
                SELECT id FROM bowling_balls
                WHERE lower(coalesce(brand, '')) = lower(?) AND lower(name) = lower(?)
                """,
                (brand, name),
            ).fetchone()
            values = (
                brand,
                name,
                (row.get("cover") or "").strip() or None,
                (row.get("core") or "").strip() or None,
                csv_float(row.get("rg")),
                csv_float(row.get("differential")),
                csv_float(row.get("massBias")),
                (row.get("surface") or "").strip() or None,
                (row.get("condition") or "").strip() or None,
                (row.get("motion") or "").strip() or None,
                csv_int(row.get("strength")),
                csv_float(row.get("price")),
                json.dumps(colors),
                (row.get("imageUrl") or "").strip() or None,
                (row.get("researchUrl") or "").strip() or None,
                (row.get("notes") or "").strip() or None,
                "StrikeIQ ball package",
                (row.get("sourceUrl") or "").strip() or None,
                (row.get("lastSeenAt") or "").strip() or None,
                1,
                (row.get("discontinuedAt") or "").strip() or None,
                (row.get("specHash") or "").strip() or None,
            )
            if current:
                connection.execute(
                    """
                    UPDATE bowling_balls
                    SET brand = ?, name = ?, cover = ?, core = ?, rg = ?, differential = ?,
                        mass_bias = ?, surface = ?, condition = ?, motion = ?, strength = ?,
                        price = ?, colors_json = ?, image_url = ?, research_url = ?, notes = ?,
                        source_name = ?, source_url = ?, last_imported_at = CURRENT_TIMESTAMP,
                        last_seen_at = COALESCE(?, CURRENT_TIMESTAMP), is_active = ?,
                        discontinued_at = ?, spec_hash = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (*values, current[0]),
                )
            else:
                connection.execute(
                    """
                    INSERT INTO bowling_balls (
                      brand, name, cover, core, rg, differential, mass_bias, surface, condition,
                      motion, strength, price, colors_json, image_url, research_url, notes,
                      source_name, source_url, last_imported_at, last_seen_at, is_active,
                      discontinued_at, spec_hash
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP,
                            COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?)
                    """,
                    values,
                )


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        migrate_existing_database(connection)
        run_sql_file(connection, SCHEMA_PATH)
        migrate_existing_database(connection)
        run_sql_file(connection, SCHEMA_PATH)
        run_sql_file(connection, SEED_PATH)
        seed_bowling_balls(connection)
        connection.commit()

    if BRUNSWICK_ARCHIVE_PATH.exists():
        import_archive(
            BRUNSWICK_ARCHIVE_PATH,
            BRUNSWICK_SOURCE_NAME,
            BRUNSWICK_SOURCE_URL,
            DB_PATH,
        )
        promote_source(BRUNSWICK_SOURCE_NAME, DB_PATH)

    with sqlite3.connect(DB_PATH) as connection:
        pattern_count = connection.execute(
            "SELECT COUNT(*) FROM oil_patterns"
        ).fetchone()[0]
        tag_count = connection.execute(
            "SELECT COUNT(*) FROM pattern_tags"
        ).fetchone()[0]
        ball_count = connection.execute(
            "SELECT COUNT(*) FROM bowling_balls WHERE is_active = 1 OR is_active IS NULL"
        ).fetchone()[0]

    print(f"Built {DB_PATH}")
    print(f"Seeded {pattern_count} oil patterns and {tag_count} tags")
    print(f"Seeded {ball_count} bowling balls")


if __name__ == "__main__":
    main()
