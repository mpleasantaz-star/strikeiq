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
LANE_TRACKER_IMPORT_PATH = ROOT / "data" / "imports" / "lane_tracker_sessions.csv"
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

    shot_columns = {
        row[1]
        for row in connection.execute("PRAGMA table_info(shot_logs)").fetchall()
    }
    shot_migrations = {
        "session_date": "ALTER TABLE shot_logs ADD COLUMN session_date TEXT",
        "lane_center": "ALTER TABLE shot_logs ADD COLUMN lane_center TEXT",
        "lane_number": "ALTER TABLE shot_logs ADD COLUMN lane_number TEXT",
        "game_number": "ALTER TABLE shot_logs ADD COLUMN game_number INTEGER",
        "frame_number": "ALTER TABLE shot_logs ADD COLUMN frame_number TEXT",
        "feet_board": "ALTER TABLE shot_logs ADD COLUMN feet_board TEXT",
        "arrows_board": "ALTER TABLE shot_logs ADD COLUMN arrows_board TEXT",
        "ball_speed": "ALTER TABLE shot_logs ADD COLUMN ball_speed TEXT",
        "speed_mph": "ALTER TABLE shot_logs ADD COLUMN speed_mph REAL",
        "lane_condition": "ALTER TABLE shot_logs ADD COLUMN lane_condition TEXT",
        "miss_direction": "ALTER TABLE shot_logs ADD COLUMN miss_direction TEXT",
        "leave_pin": "ALTER TABLE shot_logs ADD COLUMN leave_pin TEXT",
        "next_move": "ALTER TABLE shot_logs ADD COLUMN next_move TEXT",
        "analysis_run_id": "ALTER TABLE shot_logs ADD COLUMN analysis_run_id TEXT",
        "video_name": "ALTER TABLE shot_logs ADD COLUMN video_name TEXT",
        "hook_inches": "ALTER TABLE shot_logs ADD COLUMN hook_inches REAL",
        "boards_crossed": "ALTER TABLE shot_logs ADD COLUMN boards_crossed REAL",
        "release_board": "ALTER TABLE shot_logs ADD COLUMN release_board TEXT",
        "entry_board": "ALTER TABLE shot_logs ADD COLUMN entry_board TEXT",
        "pocket_quality": "ALTER TABLE shot_logs ADD COLUMN pocket_quality TEXT",
        "pin_result": "ALTER TABLE shot_logs ADD COLUMN pin_result TEXT",
        "impact_result": "ALTER TABLE shot_logs ADD COLUMN impact_result TEXT",
        "confidence": "ALTER TABLE shot_logs ADD COLUMN confidence INTEGER",
        "confidence_label": "ALTER TABLE shot_logs ADD COLUMN confidence_label TEXT",
        "confidence_notes": "ALTER TABLE shot_logs ADD COLUMN confidence_notes TEXT",
        "quality_score": "ALTER TABLE shot_logs ADD COLUMN quality_score INTEGER",
        "quality_label": "ALTER TABLE shot_logs ADD COLUMN quality_label TEXT",
        "quality_notes": "ALTER TABLE shot_logs ADD COLUMN quality_notes TEXT",
        "consistency_label": "ALTER TABLE shot_logs ADD COLUMN consistency_label TEXT",
        "consistency_notes": "ALTER TABLE shot_logs ADD COLUMN consistency_notes TEXT",
        "output_preview": "ALTER TABLE shot_logs ADD COLUMN output_preview TEXT",
        "tracking_mode": "ALTER TABLE shot_logs ADD COLUMN tracking_mode TEXT",
        "shot_source": "ALTER TABLE shot_logs ADD COLUMN shot_source TEXT",
    }
    for column, statement in shot_migrations.items():
        if shot_columns and column not in shot_columns:
            connection.execute(statement)


def csv_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def csv_int(value: str | None, default: int = 0) -> int:
    if value is None or value == "":
        return default
    return int(value)


def csv_text(row: dict, key: str) -> str | None:
    value = str(row.get(key) or "").strip()
    return value or None


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


def seed_lane_tracker_sessions(connection: sqlite3.Connection) -> None:
    if not LANE_TRACKER_IMPORT_PATH.exists():
        return
    connection.execute("DELETE FROM shot_logs WHERE shot_source = 'video_analysis_import'")
    with LANE_TRACKER_IMPORT_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            run_id = csv_text(row, "run_id")
            if not run_id:
                continue
            timestamp = csv_text(row, "timestamp")
            speed_mph = csv_float(row.get("speed_mph"))
            hook_inches = csv_float(row.get("hook_in"))
            boards_crossed = csv_float(row.get("boards"))
            release_board = csv_text(row, "release_board")
            arrows_board = csv_text(row, "arrows_board")
            breakpoint_board = csv_text(row, "breakpoint_board")
            entry_board = csv_text(row, "entry_board")
            result = (
                csv_text(row, "pin_result_label")
                or csv_text(row, "impact_result_label")
                or csv_text(row, "shot_type")
                or "Video Analysis"
            )
            leave_type = csv_text(row, "leave_type_label")
            if leave_type and "strike" in leave_type.lower():
                leave_type = None
            target_parts = [
                release_board and f"Release {release_board}",
                arrows_board and f"Arrows {arrows_board}",
                breakpoint_board and f"Breakpoint {breakpoint_board}",
                entry_board and f"Entry {entry_board}",
            ]
            target_summary = " | ".join(item for item in target_parts if item) or None
            notes = " | ".join(
                item
                for item in [
                    csv_text(row, "confidence_notes"),
                    csv_text(row, "quality_notes"),
                    csv_text(row, "consistency_notes"),
                    csv_text(row, "lane_quality_notes"),
                ]
                if item
            ) or None
            connection.execute(
                """
                INSERT OR IGNORE INTO shot_logs (
                  session_date,
                  ball,
                  target,
                  arrows_board,
                  breakpoint,
                  ball_speed,
                  speed_mph,
                  result,
                  miss_direction,
                  leave_pin,
                  next_move,
                  notes,
                  analysis_run_id,
                  video_name,
                  hook_inches,
                  boards_crossed,
                  release_board,
                  entry_board,
                  pocket_quality,
                  pin_result,
                  impact_result,
                  confidence,
                  confidence_label,
                  confidence_notes,
                  quality_score,
                  quality_label,
                  quality_notes,
                  consistency_label,
                  consistency_notes,
                  output_preview,
                  tracking_mode,
                  shot_source,
                  created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    timestamp[:10] if timestamp else None,
                    csv_text(row, "video_name"),
                    target_summary,
                    arrows_board,
                    breakpoint_board,
                    f"{speed_mph:.2f} mph" if speed_mph is not None else None,
                    speed_mph,
                    result,
                    csv_text(row, "shot_type"),
                    leave_type,
                    csv_text(row, "consistency_notes"),
                    notes,
                    run_id,
                    csv_text(row, "video_name"),
                    hook_inches,
                    boards_crossed,
                    release_board,
                    entry_board,
                    csv_text(row, "pocket_quality_label"),
                    csv_text(row, "pin_result_label"),
                    csv_text(row, "impact_result_label"),
                    csv_int(row.get("confidence"), None),
                    csv_text(row, "confidence_label"),
                    csv_text(row, "confidence_notes"),
                    csv_int(row.get("quality_score"), None),
                    csv_text(row, "quality_label"),
                    csv_text(row, "quality_notes"),
                    csv_text(row, "consistency_label"),
                    csv_text(row, "consistency_notes"),
                    csv_text(row, "output_preview"),
                    csv_text(row, "tracking_mode"),
                    "video_analysis_import",
                    timestamp,
                ),
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
        seed_lane_tracker_sessions(connection)
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
        shot_count = connection.execute(
            "SELECT COUNT(*) FROM shot_logs"
        ).fetchone()[0]

    print(f"Built {DB_PATH}")
    print(f"Seeded {pattern_count} oil patterns and {tag_count} tags")
    print(f"Seeded {ball_count} bowling balls")
    print(f"Seeded {shot_count} lane tracker sessions")


if __name__ == "__main__":
    main()
