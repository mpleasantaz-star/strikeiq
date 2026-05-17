from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json
import os
import subprocess
import sys
import sqlite3
import re


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DB_PATH", ROOT / "data" / "bowling_oil_patterns.sqlite"))
STATIC_DIR = ROOT / "web"
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


class ApiError(Exception):
    def __init__(self, status: HTTPStatus, message: str) -> None:
        self.status = status
        self.message = message


def dict_rows(cursor: sqlite3.Cursor) -> list[dict]:
    return [dict(row) for row in cursor.fetchall()]


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def ensure_mobile_sync_table(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS mobile_sync_records (
          sync_key TEXT PRIMARY KEY,
          payload_json TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def get_mobile_sync() -> dict:
    with get_connection() as connection:
        ensure_mobile_sync_table(connection)
        row = connection.execute(
            """
            SELECT payload_json, updated_at
            FROM mobile_sync_records
            WHERE sync_key = 'default'
            """
        ).fetchone()

    if row is None:
        return {
            "updated_at": None,
            "payload": {
                "customPatterns": [],
                "balls": [],
                "spares": [],
                "shots": [],
                "chat": [],
            },
        }

    return {"updated_at": row["updated_at"], "payload": json.loads(row["payload_json"])}


def update_mobile_sync(payload: dict) -> dict:
    sync_payload = payload.get("payload")
    if not isinstance(sync_payload, dict):
        raise ApiError(HTTPStatus.BAD_REQUEST, "payload object is required")

    allowed_keys = {"customPatterns", "balls", "spares", "shots", "chat"}
    clean_payload = {}
    for key in allowed_keys:
        value = sync_payload.get(key, [])
        if not isinstance(value, list):
            raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be a list")
        clean_payload[key] = value

    payload_json = json.dumps(clean_payload, ensure_ascii=True)
    with get_connection() as connection:
        ensure_mobile_sync_table(connection)
        connection.execute(
            """
            INSERT INTO mobile_sync_records (sync_key, payload_json, updated_at)
            VALUES ('default', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(sync_key) DO UPDATE SET
              payload_json = excluded.payload_json,
              updated_at = CURRENT_TIMESTAMP
            """,
            (payload_json,),
        )
        connection.commit()

    return get_mobile_sync()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "custom-pattern"


def unique_pattern_slug(connection: sqlite3.Connection, name: str) -> str:
    base = slugify(name)
    slug = base
    suffix = 2
    while connection.execute("SELECT 1 FROM oil_patterns WHERE slug = ?", (slug,)).fetchone():
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def ensure_tracker_tables(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS bowling_balls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          cover TEXT,
          surface TEXT,
          layout TEXT,
          motion TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS spare_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          leave TEXT NOT NULL,
          attempts INTEGER NOT NULL CHECK (attempts > 0),
          makes INTEGER NOT NULL CHECK (makes >= 0),
          ball TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS shot_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          oil_pattern_id INTEGER,
          ball TEXT,
          target TEXT,
          breakpoint TEXT,
          result TEXT NOT NULL,
          adjustment TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE SET NULL
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_spare_logs_created ON spare_logs(created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_shot_logs_pattern ON shot_logs(oil_pattern_id, created_at)")


def require_text(payload: dict, key: str, label: str) -> str:
    value = str(payload.get(key, "")).strip()
    if not value:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{label} is required")
    return value


def optional_text(payload: dict, key: str) -> str | None:
    value = str(payload.get(key, "")).strip()
    return value or None


def int_from_payload(payload: dict, key: str, default: int, minimum: int | None = None, maximum: int | None = None) -> int:
    raw = payload.get(key, default)
    try:
        value = int(raw)
    except (TypeError, ValueError) as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be a number") from exc
    if minimum is not None and value < minimum:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be at least {minimum}")
    if maximum is not None and value > maximum:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be at most {maximum}")
    return value


def create_custom_pattern(payload: dict) -> dict:
    name = require_text(payload, "name", "Pattern name")
    length_ft = int_from_payload(payload, "length_ft", 40, 1)
    difficulty = int_from_payload(payload, "difficulty", 3, 1, 5)
    ratio = optional_text(payload, "ratio") or "Custom"
    summary = optional_text(payload, "summary") or "Custom oil pattern."
    play_strategy = optional_text(payload, "play_strategy") or "Use practice shots and tracker notes to build the line."
    suggested_line_right = optional_text(payload, "suggested_line_right") or "Set after practice shots."
    suggested_line_left = optional_text(payload, "suggested_line_left") or "Set after practice shots."
    recommended_equipment = optional_text(payload, "recommended_equipment") or "Start with a benchmark ball and adjust from ball reaction."
    common_adjustments = optional_text(payload, "common_adjustments") or "Track misses and move from breakpoint response."

    with get_connection() as connection:
        slug = unique_pattern_slug(connection, name)
        cursor = connection.execute(
            """
            INSERT INTO oil_patterns (
              slug, name, organization, pattern_type, length_ft, volume_ml, ratio, difficulty,
              summary, play_strategy, ball_motion, suggested_line_right, suggested_line_left,
              recommended_equipment, common_adjustments, source_note
            )
            VALUES (?, ?, 'User-defined', 'custom', ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created in StrikeIQ.')
            """,
            (
                slug,
                name,
                length_ft,
                ratio,
                difficulty,
                summary,
                play_strategy,
                optional_text(payload, "ball_motion") or "User tracked",
                suggested_line_right,
                suggested_line_left,
                recommended_equipment,
                common_adjustments,
            ),
        )
        tag = connection.execute("SELECT id FROM pattern_tags WHERE name = 'custom'").fetchone()
        if tag is None:
            tag_cursor = connection.execute("INSERT INTO pattern_tags (name) VALUES ('custom')")
            tag_id = tag_cursor.lastrowid
        else:
            tag_id = tag["id"]
        connection.execute(
            "INSERT OR IGNORE INTO oil_pattern_tags (oil_pattern_id, tag_id) VALUES (?, ?)",
            (cursor.lastrowid, tag_id),
        )
        connection.commit()
    return get_pattern(slug)


def get_balls() -> list[dict]:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        return dict_rows(
            connection.execute(
                """
                SELECT id, name, cover, surface, layout, motion, notes, created_at, updated_at
                FROM bowling_balls
                ORDER BY updated_at DESC, id DESC
                """
            )
        )


def create_ball(payload: dict) -> dict:
    name = require_text(payload, "name", "Ball name")
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        cursor = connection.execute(
            """
            INSERT INTO bowling_balls (name, cover, surface, layout, motion, notes)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                optional_text(payload, "cover"),
                optional_text(payload, "surface"),
                optional_text(payload, "layout"),
                optional_text(payload, "motion"),
                optional_text(payload, "notes"),
            ),
        )
        connection.commit()
        row = connection.execute(
            """
            SELECT id, name, cover, surface, layout, motion, notes, created_at, updated_at
            FROM bowling_balls
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return dict(row)


def get_spares() -> dict:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        rows = dict_rows(
            connection.execute(
                """
                SELECT id, leave, attempts, makes, ball, notes, created_at
                FROM spare_logs
                ORDER BY created_at DESC, id DESC
                LIMIT 100
                """
            )
        )
    attempts = sum(row["attempts"] for row in rows)
    makes = sum(row["makes"] for row in rows)
    return {"spares": rows, "attempts": attempts, "makes": makes, "rate": round((makes / attempts) * 100) if attempts else 0}


def create_spare(payload: dict) -> dict:
    leave = require_text(payload, "leave", "Leave")
    attempts = int_from_payload(payload, "attempts", 1, 1)
    makes = int_from_payload(payload, "makes", 0, 0, attempts)
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        connection.execute(
            """
            INSERT INTO spare_logs (leave, attempts, makes, ball, notes)
            VALUES (?, ?, ?, ?, ?)
            """,
            (leave, attempts, makes, optional_text(payload, "ball"), optional_text(payload, "notes")),
        )
        connection.commit()
    return get_spares()


def get_shots() -> list[dict]:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        return dict_rows(
            connection.execute(
                """
                SELECT
                  s.id,
                  s.ball,
                  s.target,
                  s.breakpoint,
                  s.result,
                  s.adjustment,
                  s.notes,
                  s.created_at,
                  p.slug AS pattern_slug,
                  p.name AS pattern_name
                FROM shot_logs s
                LEFT JOIN oil_patterns p ON p.id = s.oil_pattern_id
                ORDER BY s.created_at DESC, s.id DESC
                LIMIT 100
                """
            )
        )


def create_shot(payload: dict) -> dict:
    result = require_text(payload, "result", "Result")
    pattern_slug = optional_text(payload, "pattern_slug")
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        pattern_id = None
        if pattern_slug:
            pattern = connection.execute("SELECT id FROM oil_patterns WHERE slug = ?", (pattern_slug,)).fetchone()
            pattern_id = pattern["id"] if pattern else None
        connection.execute(
            """
            INSERT INTO shot_logs (oil_pattern_id, ball, target, breakpoint, result, adjustment, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pattern_id,
                optional_text(payload, "ball"),
                optional_text(payload, "target"),
                optional_text(payload, "breakpoint"),
                result,
                optional_text(payload, "adjustment"),
                optional_text(payload, "notes"),
            ),
        )
        connection.commit()
    return get_shots()


def get_patterns(query: dict[str, list[str]]) -> list[dict]:
    conditions = []
    params = []

    search = query.get("q", [""])[0].strip()
    if search:
        conditions.append(
            "(p.name LIKE ? OR p.summary LIKE ? OR p.play_strategy LIKE ?)"
        )
        term = f"%{search}%"
        params.extend([term, term, term])

    pattern_type = query.get("type", [""])[0].strip()
    if pattern_type:
        conditions.append("p.pattern_type = ?")
        params.append(pattern_type)

    source = query.get("source", [""])[0].strip()
    if source:
        conditions.append("COALESCE(p.organization, 'Reference pattern') = ?")
        params.append(source)

    tag = query.get("tag", [""])[0].strip()
    if tag:
        conditions.append(
            """
            EXISTS (
              SELECT 1
              FROM oil_pattern_tags opt
              JOIN pattern_tags t ON t.id = opt.tag_id
              WHERE opt.oil_pattern_id = p.id AND t.name = ?
            )
            """
        )
        params.append(tag)

    length_bucket = query.get("length", [""])[0].strip()
    if length_bucket == "short":
        conditions.append("p.length_ft <= 36")
    elif length_bucket == "medium":
        conditions.append("p.length_ft BETWEEN 37 AND 42")
    elif length_bucket == "long":
        conditions.append("p.length_ft >= 43")

    difficulty = query.get("difficulty", [""])[0].strip()
    if difficulty:
        conditions.append("p.difficulty = ?")
        params.append(difficulty)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    sql = f"""
      SELECT
        p.id,
        p.slug,
        p.name,
        p.organization,
        p.pattern_type,
        p.length_ft,
        p.volume_ml,
        p.ratio,
        p.difficulty,
        p.summary,
        p.suggested_line_right,
        p.suggested_line_left,
        p.recommended_equipment,
        COALESCE(GROUP_CONCAT(t.name, ','), '') AS tags
      FROM oil_patterns p
      LEFT JOIN oil_pattern_tags opt ON opt.oil_pattern_id = p.id
      LEFT JOIN pattern_tags t ON t.id = opt.tag_id
      {where}
      GROUP BY p.id
      ORDER BY p.length_ft, p.difficulty, p.name
    """

    with get_connection() as connection:
        rows = dict_rows(connection.execute(sql, params))

    for row in rows:
        row["tags"] = [tag for tag in row["tags"].split(",") if tag]

    return rows


def get_pattern(slug: str) -> dict:
    with get_connection() as connection:
        pattern = connection.execute(
            "SELECT * FROM oil_patterns WHERE slug = ?",
            (slug,),
        ).fetchone()

        if pattern is None:
            raise ApiError(HTTPStatus.NOT_FOUND, "Pattern not found")

        tags = dict_rows(
            connection.execute(
                """
                SELECT t.name
                FROM pattern_tags t
                JOIN oil_pattern_tags opt ON opt.tag_id = t.id
                WHERE opt.oil_pattern_id = ?
                ORDER BY t.name
                """,
                (pattern["id"],),
            )
        )
        zones = dict_rows(
            connection.execute(
                """
                SELECT board_start, board_end, distance_start_ft, distance_end_ft, oil_level, note
                FROM pattern_zones
                WHERE oil_pattern_id = ?
                ORDER BY board_start, distance_start_ft
                """,
                (pattern["id"],),
            )
        )
        profile = connection.execute(
            """
            SELECT
              rule_of_31_board,
              breakpoint_range,
              ideal_axis_rotation,
              friction_response,
              inside_miss_room,
              outside_miss_room,
              hold_area,
              recovery_area,
              speed_control,
              rev_rate_matchup,
              spare_priority
            FROM pattern_play_profiles
            WHERE oil_pattern_id = ?
            """,
            (pattern["id"],),
        ).fetchone()
        transitions = dict_rows(
            connection.execute(
                """
                SELECT phase_order, phase_name, frame_window, what_to_watch, move_strategy, ball_change
                FROM pattern_transition_phases
                WHERE oil_pattern_id = ?
                ORDER BY phase_order
                """,
                (pattern["id"],),
            )
        )
        equipment_options = dict_rows(
            connection.execute(
                """
                SELECT option_order, bowler_style, ball_type, surface, when_to_use
                FROM pattern_equipment_options
                WHERE oil_pattern_id = ?
                ORDER BY option_order
                """,
                (pattern["id"],),
            )
        )
        lane_intelligence = connection.execute(
            """
            SELECT
              oil_shape,
              volume_class,
              friction_expectation,
              scoring_pace,
              target_window_right,
              target_window_left,
              breakpoint_window,
              miss_risk,
              first_move_trigger,
              surface_guidance,
              practice_focus
            FROM pattern_lane_intelligence
            WHERE oil_pattern_id = ?
            """,
            (pattern["id"],),
        ).fetchone()
        external_refs = dict_rows(
            connection.execute(
                """
                SELECT
                  source_name,
                  source_home_url,
                  pattern_page_url,
                  search_url,
                  pdf_url,
                  download_url,
                  kosi_url,
                  reference_note
                FROM pattern_external_refs
                WHERE oil_pattern_id = ?
                ORDER BY source_name
                """,
                (pattern["id"],),
            )
        )
        notes = dict_rows(
            connection.execute(
                """
                SELECT id, lane_center, ball_used, starting_line, score, note, created_at
                FROM user_pattern_notes
                WHERE oil_pattern_id = ?
                ORDER BY created_at DESC
                """,
                (pattern["id"],),
            )
        )

    data = dict(pattern)
    data["tags"] = [tag["name"] for tag in tags]
    data["zones"] = zones
    data["play_profile"] = dict(profile) if profile else None
    data["transitions"] = transitions
    data["equipment_options"] = equipment_options
    data["lane_intelligence"] = dict(lane_intelligence) if lane_intelligence else None
    data["external_refs"] = external_refs
    data["notes"] = notes
    return data


def get_tags() -> list[dict]:
    with get_connection() as connection:
        return dict_rows(
            connection.execute(
                """
                SELECT t.name, COUNT(opt.oil_pattern_id) AS pattern_count
                FROM pattern_tags t
                LEFT JOIN oil_pattern_tags opt ON opt.tag_id = t.id
                GROUP BY t.id
                ORDER BY t.name
                """
            )
        )


def get_sources() -> list[dict]:
    with get_connection() as connection:
        return dict_rows(
            connection.execute(
                """
                SELECT
                  COALESCE(organization, 'Reference pattern') AS source_name,
                  COUNT(*) AS pattern_count
                FROM oil_patterns
                GROUP BY COALESCE(organization, 'Reference pattern')
                ORDER BY pattern_count DESC, source_name
                """
            )
        )


def get_pattern_types() -> list[dict]:
    labels = {
        "house": "House",
        "sport": "Sport",
        "challenge": "Challenge",
        "pba": "PBA-style",
        "custom": "Custom",
    }
    with get_connection() as connection:
        rows = dict_rows(
            connection.execute(
                """
                SELECT pattern_type, COUNT(*) AS pattern_count
                FROM oil_patterns
                GROUP BY pattern_type
                ORDER BY
                  CASE pattern_type
                    WHEN 'house' THEN 1
                    WHEN 'sport' THEN 2
                    WHEN 'challenge' THEN 3
                    WHEN 'pba' THEN 4
                    WHEN 'custom' THEN 5
                    ELSE 99
                  END,
                  pattern_type
                """
            )
        )
    for row in rows:
        row["label"] = labels.get(row["pattern_type"], row["pattern_type"].replace("-", " ").title())
    return rows


def get_sync_summary() -> dict:
    with get_connection() as connection:
        latest_run = connection.execute(
            """
            SELECT id, source_name, started_at, finished_at, status, checked_count, changed_count, error_count, message
            FROM sync_runs
            ORDER BY started_at DESC, id DESC
            LIMIT 1
            """
        ).fetchone()
        needs_review = connection.execute(
            """
            SELECT COUNT(*)
            FROM external_ref_checks
            WHERE needs_review = 1
            """
        ).fetchone()[0]
        linked_refs = connection.execute(
            """
            SELECT COUNT(*)
            FROM pattern_external_refs
            WHERE pattern_page_url IS NOT NULL OR pdf_url IS NOT NULL OR download_url IS NOT NULL OR kosi_url IS NOT NULL
            """
        ).fetchone()[0]
        total_refs = connection.execute("SELECT COUNT(*) FROM pattern_external_refs").fetchone()[0]
        recent_checks = dict_rows(
            connection.execute(
                """
                SELECT
                  p.slug,
                  p.name,
                  c.url_type,
                  c.url,
                  c.http_status,
                  c.changed,
                  c.needs_review,
                  c.error_message,
                  c.checked_at
                FROM external_ref_checks c
                JOIN pattern_external_refs r ON r.id = c.external_ref_id
                JOIN oil_patterns p ON p.id = r.oil_pattern_id
                ORDER BY c.checked_at DESC, c.id DESC
                LIMIT 12
                """
            )
        )

    return {
        "latest_run": dict(latest_run) if latest_run else None,
        "needs_review": needs_review,
        "linked_refs": linked_refs,
        "total_refs": total_refs,
        "recent_checks": recent_checks,
    }


def get_catalog_status() -> dict:
    with get_connection() as connection:
        sources = dict_rows(
            connection.execute(
                """
                SELECT
                  source_name,
                  source_home_url,
                  official_count,
                  imported_count,
                  max(official_count - imported_count, 0) AS remaining_count,
                  source_note,
                  checked_at
                FROM source_catalog_status
                ORDER BY source_name
                """
            )
        )
        backlog = dict_rows(
            connection.execute(
                """
                SELECT
                  source_name,
                  pattern_name,
                  pattern_page_url,
                  pdf_url,
                  kosi_url,
                  length_ft,
                  volume_ml,
                  import_status,
                  note
                FROM source_catalog_backlog
                WHERE import_status IN ('not_imported', 'queued', 'blocked')
                ORDER BY source_name, pattern_name
                LIMIT 12
                """
            )
        )

    return {"sources": sources, "backlog": backlog}


def get_import_queue() -> dict:
    with get_connection() as connection:
        rows = dict_rows(
            connection.execute(
                """
                SELECT
                  i.id,
                  i.file_name,
                  i.file_type,
                  i.source_name,
                  i.source_url,
                  i.extracted_name,
                  i.extracted_length_ft,
                  i.extracted_volume_ml,
                  i.extracted_ratio,
                  i.review_status,
                  i.created_at,
                  i.reviewed_at,
                  p.name AS matched_pattern_name,
                  p.slug AS matched_pattern_slug
                FROM official_pattern_imports i
                LEFT JOIN oil_patterns p ON p.id = i.oil_pattern_id
                ORDER BY
                  CASE i.review_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
                  i.created_at DESC
                LIMIT 30
                """
            )
        )
        pending = connection.execute(
            "SELECT COUNT(*) FROM official_pattern_imports WHERE review_status = 'pending'"
        ).fetchone()[0]

    return {"pending": pending, "imports": rows}


def update_import_status(import_id: int, payload: dict) -> dict:
    status = str(payload.get("review_status", "")).strip()
    if status not in {"approved", "rejected", "pending"}:
        raise ApiError(HTTPStatus.BAD_REQUEST, "review_status must be approved, rejected, or pending")

    with get_connection() as connection:
        row = connection.execute(
            "SELECT id FROM official_pattern_imports WHERE id = ?",
            (import_id,),
        ).fetchone()
        if row is None:
            raise ApiError(HTTPStatus.NOT_FOUND, "Import not found")

        connection.execute(
            """
            UPDATE official_pattern_imports
            SET review_status = ?, reviewed_at = CASE WHEN ? = 'pending' THEN NULL ELSE CURRENT_TIMESTAMP END
            WHERE id = ?
            """,
            (status, status, import_id),
        )
        connection.commit()

    return get_import_queue()


def run_external_ref_sync() -> dict:
    script_path = ROOT / "scripts" / "check_external_refs.py"
    result = subprocess.run(
        [sys.executable, str(script_path), "--db", str(DB_PATH)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        timeout=180,
    )
    if result.returncode != 0:
        raise ApiError(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            (result.stderr or result.stdout or "Sync failed").strip(),
        )
    summary = get_sync_summary()
    summary["output"] = result.stdout.strip()
    return summary


def create_note(slug: str, payload: dict) -> dict:
    note = str(payload.get("note", "")).strip()
    if not note:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Note is required")

    score = payload.get("score")
    if score in ("", None):
        score = None
    else:
        try:
            score = int(score)
        except (TypeError, ValueError) as exc:
            raise ApiError(HTTPStatus.BAD_REQUEST, "Score must be a number") from exc

    with get_connection() as connection:
        pattern = connection.execute(
            "SELECT id FROM oil_patterns WHERE slug = ?",
            (slug,),
        ).fetchone()
        if pattern is None:
            raise ApiError(HTTPStatus.NOT_FOUND, "Pattern not found")

        cursor = connection.execute(
            """
            INSERT INTO user_pattern_notes (
              oil_pattern_id,
              lane_center,
              ball_used,
              starting_line,
              score,
              note
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                pattern["id"],
                str(payload.get("lane_center", "")).strip() or None,
                str(payload.get("ball_used", "")).strip() or None,
                str(payload.get("starting_line", "")).strip() or None,
                score,
                note,
            ),
        )
        connection.commit()

        created = connection.execute(
            """
            SELECT id, lane_center, ball_used, starting_line, score, note, created_at
            FROM user_pattern_notes
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(created)


def clean_optional_url(value: object) -> str | None:
    text = str(value or "").strip()
    if not text:
        return None
    if not (text.startswith("https://") or text.startswith("http://")):
        raise ApiError(HTTPStatus.BAD_REQUEST, "Reference URLs must start with http:// or https://")
    return text


def update_kegel_reference(slug: str, payload: dict) -> dict:
    pattern_page_url = clean_optional_url(payload.get("pattern_page_url"))
    pdf_url = clean_optional_url(payload.get("pdf_url"))
    kosi_url = clean_optional_url(payload.get("kosi_url"))

    with get_connection() as connection:
        pattern = connection.execute(
            "SELECT id FROM oil_patterns WHERE slug = ?",
            (slug,),
        ).fetchone()
        if pattern is None:
            raise ApiError(HTTPStatus.NOT_FOUND, "Pattern not found")

        connection.execute(
            """
            INSERT INTO pattern_external_refs (
              oil_pattern_id,
              source_name,
              source_home_url,
                  pattern_page_url,
                  search_url,
                  pdf_url,
                  download_url,
                  kosi_url,
                  reference_note
            )
            VALUES (?, 'Kegel Pattern Library', 'https://patternlibrary.kegel.net/', ?, 'https://patternlibrary.kegel.net/', ?, NULL, ?, ?)
            ON CONFLICT(oil_pattern_id, source_name) DO UPDATE SET
              pattern_page_url = excluded.pattern_page_url,
              pdf_url = excluded.pdf_url,
              kosi_url = excluded.kosi_url,
              reference_note = excluded.reference_note
            """,
            (
                pattern["id"],
                pattern_page_url,
                pdf_url,
                kosi_url,
                "Kegel is the official reference source for pattern graph, load, PDF, and KOSI data. StrikeIQ uses this entry for strategy and visualization context.",
            ),
        )
        connection.commit()

        updated = connection.execute(
            """
            SELECT
              source_name,
              source_home_url,
              pattern_page_url,
              search_url,
              pdf_url,
              download_url,
              kosi_url,
              reference_note
            FROM pattern_external_refs
            WHERE oil_pattern_id = ? AND source_name = 'Kegel Pattern Library'
            """,
            (pattern["id"],),
        ).fetchone()

    return dict(updated)


def compact_items(items: object, allowed_keys: set[str], limit: int) -> list[dict]:
    if not isinstance(items, list):
        return []

    compacted = []
    for item in items[:limit]:
        if isinstance(item, dict):
            compacted.append({key: item.get(key) for key in allowed_keys if item.get(key) not in (None, "")})
    return compacted


def extract_response_text(response_data: dict) -> str:
    output_text = response_data.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    parts = []
    for item in response_data.get("output", []):
        if not isinstance(item, dict):
            continue
        for content in item.get("content", []):
            if isinstance(content, dict) and isinstance(content.get("text"), str):
                parts.append(content["text"])
    return "\n".join(parts).strip()


def create_ai_coach_reply(payload: dict) -> dict:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise ApiError(HTTPStatus.SERVICE_UNAVAILABLE, "OPENAI_API_KEY is not configured on the backend")

    question = str(payload.get("question", "")).strip()
    if not question:
        raise ApiError(HTTPStatus.BAD_REQUEST, "question is required")

    pattern = payload.get("pattern") if isinstance(payload.get("pattern"), dict) else {}
    context = {
        "selected_pattern": {
            "name": pattern.get("name"),
            "type": pattern.get("pattern_type"),
            "length_ft": pattern.get("length_ft"),
            "ratio": pattern.get("ratio"),
            "difficulty": pattern.get("difficulty"),
            "summary": pattern.get("summary"),
            "right_line": pattern.get("suggested_line_right"),
            "left_line": pattern.get("suggested_line_left"),
            "equipment": pattern.get("recommended_equipment"),
            "adjustments": pattern.get("common_adjustments"),
        },
        "balls": compact_items(payload.get("balls"), {"name", "cover", "surface", "layout", "motion", "notes"}, 12),
        "recent_shots": compact_items(
            payload.get("shots"),
            {"date", "ball", "target", "breakpoint", "result", "adjustment", "notes"},
            12,
        ),
        "recent_spares": compact_items(payload.get("spares"), {"date", "leave", "attempts", "makes", "ball", "notes"}, 12),
    }

    prompt = (
        "You are StrikeIQ Lane Coach, a practical bowling coach for oil-pattern strategy. "
        "Use the provided pattern, arsenal, spare, and shot-tracker context. "
        "Give concise, actionable advice. Do not claim official lane-machine settings unless supplied. "
        "If the user asks for medical, legal, gambling, or unrelated advice, redirect to bowling context.\n\n"
        f"Context JSON:\n{json.dumps(context, ensure_ascii=True)}\n\n"
        f"Bowler question:\n{question}"
    )

    request_body = json.dumps(
        {
            "model": os.environ.get("OPENAI_MODEL", "gpt-5.2"),
            "input": prompt,
        }
    ).encode("utf-8")
    request = Request(
        OPENAI_RESPONSES_URL,
        data=request_body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=45) as response:
            response_data = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"OpenAI request failed: {error_body}") from error
    except URLError as error:
        raise ApiError(HTTPStatus.BAD_GATEWAY, f"OpenAI request failed: {error.reason}") from error

    reply = extract_response_text(response_data)
    if not reply:
        raise ApiError(HTTPStatus.BAD_GATEWAY, "OpenAI response did not include text")

    return {
        "reply": reply,
        "model": response_data.get("model"),
        "response_id": response_data.get("id"),
    }


class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path: str) -> str:
        parsed = urlparse(path)
        if parsed.path.startswith("/api/"):
            return str(STATIC_DIR / "index.html")

        requested = parsed.path.lstrip("/") or "index.html"
        return str(STATIC_DIR / requested)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/patterns":
                self.send_json(get_patterns(parse_qs(parsed.query)))
            elif parsed.path == "/api/sync/summary":
                self.send_json(get_sync_summary())
            elif parsed.path == "/api/imports":
                self.send_json(get_import_queue())
            elif parsed.path == "/api/catalog/status":
                self.send_json(get_catalog_status())
            elif parsed.path == "/api/mobile-sync":
                self.send_json(get_mobile_sync())
            elif parsed.path == "/api/balls":
                self.send_json(get_balls())
            elif parsed.path == "/api/spares":
                self.send_json(get_spares())
            elif parsed.path == "/api/shots":
                self.send_json(get_shots())
            elif parsed.path == "/api/tags":
                self.send_json(get_tags())
            elif parsed.path == "/api/sources":
                self.send_json(get_sources())
            elif parsed.path == "/api/pattern-types":
                self.send_json(get_pattern_types())
            elif parsed.path.startswith("/api/patterns/"):
                slug = parsed.path.removeprefix("/api/patterns/")
                self.send_json(get_pattern(slug))
            else:
                super().do_GET()
        except ApiError as error:
            self.send_error_json(error.status, error.message)
        except sqlite3.Error as error:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/sync/run":
                self.send_json(run_external_ref_sync(), HTTPStatus.CREATED)
            elif parsed.path == "/api/coach/chat":
                self.send_json(create_ai_coach_reply(self.read_json()))
            elif parsed.path == "/api/mobile-sync":
                self.send_json(update_mobile_sync(self.read_json()))
            elif parsed.path == "/api/custom-patterns":
                self.send_json(create_custom_pattern(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/balls":
                self.send_json(create_ball(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/spares":
                self.send_json(create_spare(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/shots":
                self.send_json(create_shot(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path.startswith("/api/imports/") and parsed.path.endswith("/status"):
                import_id_text = parsed.path.removeprefix("/api/imports/").removesuffix("/status")
                self.send_json(update_import_status(int(import_id_text), self.read_json()))
            elif parsed.path.startswith("/api/patterns/") and parsed.path.endswith("/notes"):
                slug = parsed.path.removeprefix("/api/patterns/").removesuffix("/notes")
                payload = self.read_json()
                self.send_json(create_note(slug, payload), HTTPStatus.CREATED)
            elif parsed.path.startswith("/api/patterns/") and parsed.path.endswith("/external-refs/kegel"):
                slug = parsed.path.removeprefix("/api/patterns/").removesuffix("/external-refs/kegel")
                payload = self.read_json()
                self.send_json(update_kegel_reference(slug, payload))
            else:
                self.send_error_json(HTTPStatus.NOT_FOUND, "Route not found")
        except ApiError as error:
            self.send_error_json(error.status, error.message)
        except json.JSONDecodeError:
            self.send_error_json(HTTPStatus.BAD_REQUEST, "Invalid JSON")
        except sqlite3.Error as error:
            self.send_error_json(HTTPStatus.INTERNAL_SERVER_ERROR, str(error))

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8") or "{}")

    def send_json(self, data: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status: HTTPStatus, message: str) -> None:
        self.send_json({"error": message}, status)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit("Database not found. Run: python scripts/build_database.py")

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), AppHandler)
    print(f"Serving Bowling Oil Patterns at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
