from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import base64
import binascii
import csv
import hashlib
import json
import math
import os
import subprocess
import sys
import sqlite3
import re
import uuid


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DB_PATH", ROOT / "data" / "bowling_oil_patterns.sqlite"))
STATIC_DIR = ROOT / "web"
LANE_VIDEO_DIR = Path(os.environ.get("LANE_VIDEO_DIR", ROOT / "data" / "lane_videos"))
MAX_LANE_VIDEO_UPLOAD_BYTES = 30 * 1024 * 1024
OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
BALL_IMPORT_PATH = ROOT / "data" / "imports" / "balls.csv"
LANE_TRACKER_IMPORT_PATH = ROOT / "data" / "imports" / "lane_tracker_sessions.csv"
OVERPASS_INTERPRETER_URL = "https://overpass-api.de/api/interpreter"
BOWLING_CENTER_FALLBACKS = [
    {"name": "AMF Peoria Lanes", "address": "Peoria, AZ", "lat": 33.581, "lon": -112.239},
    {"name": "Bowlero Glendale", "address": "17210 N 59th Ave, Glendale, AZ 85308", "lat": 33.641, "lon": -112.186},
    {"name": "AMF Union Hills Lanes", "address": "Phoenix, AZ", "lat": 33.654, "lon": -112.132},
    {"name": "AMF Desert Hills Lanes", "address": "Phoenix, AZ", "lat": 33.64, "lon": -112.02},
    {"name": "Let it Roll Bowl", "address": "8925 N 12th St, Phoenix, AZ 85020", "lat": 33.566, "lon": -112.056},
    {"name": "Bowlero Christown", "address": "Phoenix, AZ", "lat": 33.523, "lon": -112.099},
    {"name": "Lucky Strike North Scottsdale", "address": "Scottsdale, AZ", "lat": 33.622, "lon": -111.925},
    {"name": "Bowlero Via Linda", "address": "Scottsdale, AZ", "lat": 33.569, "lon": -111.89},
    {"name": "Bowlero Old Town", "address": "Scottsdale, AZ", "lat": 33.494, "lon": -111.926},
    {"name": "AMF Tempe Village Lanes", "address": "Tempe, AZ", "lat": 33.378, "lon": -111.91},
    {"name": "AMF Mesa Lanes", "address": "Mesa, AZ", "lat": 33.392, "lon": -111.84},
    {"name": "AMF Chandler Lanes", "address": "Chandler, AZ", "lat": 33.333, "lon": -111.842},
    {"name": "AMF McRay Plaza Lanes", "address": "Chandler, AZ", "lat": 33.319, "lon": -111.91},
]


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


def miles_between(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_miles = 3958.8
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    return radius_miles * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def fallback_bowling_centers(lat: float, lon: float, limit: int = 12) -> list[dict]:
    return sorted(
        (
            {
                **center,
                "distance": round(miles_between(lat, lon, center["lat"], center["lon"]), 1),
                "source": "saved",
            }
            for center in BOWLING_CENTER_FALLBACKS
        ),
        key=lambda center: center["distance"],
    )[:limit]


def get_nearby_bowling_centers(query: dict) -> list[dict]:
    try:
        lat = float((query.get("lat") or [""])[0])
        lon = float((query.get("lon") or [""])[0])
    except (TypeError, ValueError) as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Latitude and longitude are required") from exc

    fallback = fallback_bowling_centers(lat, lon)
    overpass_query = f"""
    [out:json][timeout:10];
    (
      node(around:32000,{lat},{lon})["sport"~"^(10pin|bowling)$"];
      way(around:32000,{lat},{lon})["sport"~"^(10pin|bowling)$"];
      relation(around:32000,{lat},{lon})["sport"~"^(10pin|bowling)$"];
      node(around:32000,{lat},{lon})["leisure"="bowling_alley"];
      way(around:32000,{lat},{lon})["leisure"="bowling_alley"];
      relation(around:32000,{lat},{lon})["leisure"="bowling_alley"];
      node(around:32000,{lat},{lon})["name"~"(bowling|bowlero|amf|lanes)",i];
      way(around:32000,{lat},{lon})["name"~"(bowling|bowlero|amf|lanes)",i];
      relation(around:32000,{lat},{lon})["name"~"(bowling|bowlero|amf|lanes)",i];
    );
    out center tags 24;
    """
    try:
        request = Request(
            OVERPASS_INTERPRETER_URL,
            data=urlencode({"data": overpass_query}).encode("utf-8"),
            headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "StrikeIQ local development"},
        )
        with urlopen(request, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, OSError):
        return fallback

    centers: dict[str, dict] = {}
    for element in data.get("elements", []):
        tags = element.get("tags") or {}
        name = str(tags.get("name") or "").strip()
        if not name:
            continue
        center_lat = element.get("lat") or (element.get("center") or {}).get("lat")
        center_lon = element.get("lon") or (element.get("center") or {}).get("lon")
        if center_lat is None or center_lon is None:
            continue
        address = ", ".join(
            part
            for part in [
                tags.get("addr:housenumber") and f"{tags.get('addr:housenumber')} {tags.get('addr:street', '')}".strip(),
                tags.get("addr:city"),
                tags.get("addr:state"),
            ]
            if part
        ) or tags.get("operator") or "Nearby bowling center"
        centers[name.lower()] = {
            "name": name,
            "address": address,
            "lat": center_lat,
            "lon": center_lon,
            "distance": round(miles_between(lat, lon, center_lat, center_lon), 1),
            "source": "openstreetmap",
        }

    return sorted(centers.values(), key=lambda center: center["distance"])[:12] or fallback


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
          brand TEXT,
          name TEXT NOT NULL,
          cover TEXT,
          core TEXT,
          rg REAL,
          differential REAL,
          mass_bias REAL,
          surface TEXT,
          layout TEXT,
          condition TEXT,
          motion TEXT,
          strength INTEGER,
          price REAL,
          colors_json TEXT NOT NULL DEFAULT '[]',
          image_url TEXT,
          research_url TEXT,
          notes TEXT,
          source_name TEXT,
          source_url TEXT,
          last_imported_at TEXT,
          last_seen_at TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          discontinued_at TEXT,
          spec_hash TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    ensure_ball_catalog_columns(connection)
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
        CREATE TABLE IF NOT EXISTS spare_count_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_date TEXT NOT NULL,
          alley TEXT,
          games_json TEXT NOT NULL,
          metrics_json TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS shot_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          oil_pattern_id INTEGER,
          session_date TEXT,
          lane_center TEXT,
          lane_number TEXT,
          game_number INTEGER,
          frame_number TEXT,
          ball TEXT,
          target TEXT,
          feet_board TEXT,
          arrows_board TEXT,
          breakpoint TEXT,
          ball_speed TEXT,
          speed_mph REAL,
          lane_condition TEXT,
          result TEXT NOT NULL,
          miss_direction TEXT,
          leave_pin TEXT,
          adjustment TEXT,
          next_move TEXT,
          notes TEXT,
          analysis_run_id TEXT,
          video_name TEXT,
          hook_inches REAL,
          boards_crossed REAL,
          release_board TEXT,
          entry_board TEXT,
          pocket_quality TEXT,
          pin_result TEXT,
          impact_result TEXT,
          confidence INTEGER,
          confidence_label TEXT,
          confidence_notes TEXT,
          quality_score INTEGER,
          quality_label TEXT,
          quality_notes TEXT,
          consistency_label TEXT,
          consistency_notes TEXT,
          output_preview TEXT,
          tracking_mode TEXT,
          shot_source TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (oil_pattern_id) REFERENCES oil_patterns(id) ON DELETE SET NULL
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS lane_video_uploads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          upload_id TEXT NOT NULL UNIQUE,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          relative_path TEXT NOT NULL,
          video_size INTEGER NOT NULL,
          video_type TEXT,
          sha256 TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS lane_video_analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          analysis_run_id TEXT NOT NULL UNIQUE,
          upload_id TEXT,
          tracking_mode TEXT,
          video_name TEXT,
          video_size INTEGER,
          video_type TEXT,
          lane_center TEXT,
          ball TEXT,
          detection_options_json TEXT NOT NULL DEFAULT '{}',
          result_json TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'ready',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (upload_id) REFERENCES lane_video_uploads(upload_id) ON DELETE SET NULL
        )
        """
    )
    ensure_lane_video_analysis_columns(connection)
    ensure_shot_log_columns(connection)
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS community_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          channel TEXT NOT NULL,
          title TEXT NOT NULL,
          user_name TEXT,
          shot_type TEXT,
          feedback_request TEXT,
          video_url TEXT,
          video_name TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_spare_logs_created ON spare_logs(created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_spare_sessions_date ON spare_count_sessions(session_date, updated_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_shot_logs_pattern ON shot_logs(oil_pattern_id, created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_shot_logs_session ON shot_logs(session_date, lane_center, created_at)")
    connection.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_shot_logs_analysis_run ON shot_logs(analysis_run_id)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_lane_video_uploads_created ON lane_video_uploads(created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_lane_video_analyses_created ON lane_video_analyses(created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_community_posts_channel ON community_posts(channel, created_at)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_bowling_balls_brand ON bowling_balls(brand)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_bowling_balls_cover ON bowling_balls(cover)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_bowling_balls_condition ON bowling_balls(condition)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_bowling_balls_active ON bowling_balls(is_active)")
    seed_ball_catalog(connection)
    seed_lane_tracker_sessions(connection)


def ensure_lane_video_analysis_columns(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(lane_video_analyses)").fetchall()}
    migrations = {
        "upload_id": "ALTER TABLE lane_video_analyses ADD COLUMN upload_id TEXT",
    }
    for column, statement in migrations.items():
        if column not in columns:
            connection.execute(statement)


def ensure_shot_log_columns(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(shot_logs)").fetchall()}
    migrations = {
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
    for column, statement in migrations.items():
        if column not in columns:
            connection.execute(statement)


def ensure_ball_catalog_columns(connection: sqlite3.Connection) -> None:
    columns = {row["name"] for row in connection.execute("PRAGMA table_info(bowling_balls)").fetchall()}
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
        if column not in columns:
            connection.execute(statement)


def csv_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    return float(value)


def csv_int(value: str | None, default: int = 0) -> int:
    if value is None or value == "":
        return default
    return int(value)


def csv_bool(value: str | None, default: int = 1) -> int:
    if value is None or value == "":
        return default
    return 1 if str(value).strip().lower() in {"1", "true", "yes", "active"} else 0


def seed_ball_catalog(connection: sqlite3.Connection) -> None:
    if not BALL_IMPORT_PATH.exists():
        return
    existing = connection.execute(
        "SELECT COUNT(*) AS count FROM bowling_balls WHERE source_name = 'StrikeIQ ball package'"
    ).fetchone()["count"]
    if existing:
        return

    with BALL_IMPORT_PATH.open("r", encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            brand = (row.get("brand") or "").strip()
            name = (row.get("name") or "").strip()
            if not brand or not name:
                continue
            colors = [color.strip() for color in (row.get("colors") or "").split("|") if color.strip()]
            payload = {
                "brand": brand,
                "name": name,
                "cover": (row.get("cover") or "").strip() or None,
                "core": (row.get("core") or "").strip() or None,
                "rg": csv_float(row.get("rg")),
                "differential": csv_float(row.get("differential")),
                "mass_bias": csv_float(row.get("massBias")),
                "surface": (row.get("surface") or "").strip() or None,
                "condition": (row.get("condition") or "").strip() or None,
                "motion": (row.get("motion") or "").strip() or None,
                "strength": csv_int(row.get("strength")),
                "price": csv_float(row.get("price")),
                "colors_json": json.dumps(colors),
                "image_url": (row.get("imageUrl") or "").strip() or None,
                "research_url": (row.get("researchUrl") or "").strip() or None,
                "notes": (row.get("notes") or "").strip() or None,
                "source_name": "StrikeIQ ball package",
                "source_url": (row.get("sourceUrl") or "").strip() or None,
                "last_seen_at": (row.get("lastSeenAt") or "").strip() or None,
                "is_active": csv_bool(row.get("isActive")),
                "discontinued_at": (row.get("discontinuedAt") or "").strip() or None,
                "spec_hash": (row.get("specHash") or "").strip() or None,
            }
            current = connection.execute(
                """
                SELECT id FROM bowling_balls
                WHERE lower(coalesce(brand, '')) = lower(?) AND lower(name) = lower(?)
                """,
                (brand, name),
            ).fetchone()
            if current:
                connection.execute(
                    """
                    UPDATE bowling_balls
                    SET cover = ?, core = ?, rg = ?, differential = ?, mass_bias = ?, surface = ?,
                        condition = ?, motion = ?, strength = ?, price = ?, colors_json = ?,
                        image_url = ?, research_url = ?, notes = ?, source_name = ?, source_url = ?,
                        last_imported_at = CURRENT_TIMESTAMP, last_seen_at = COALESCE(?, CURRENT_TIMESTAMP),
                        is_active = ?, discontinued_at = ?, spec_hash = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        payload["cover"], payload["core"], payload["rg"], payload["differential"],
                        payload["mass_bias"], payload["surface"], payload["condition"], payload["motion"],
                        payload["strength"], payload["price"], payload["colors_json"], payload["image_url"],
                        payload["research_url"], payload["notes"], payload["source_name"], payload["source_url"],
                        payload["last_seen_at"], payload["is_active"], payload["discontinued_at"],
                        payload["spec_hash"], current["id"],
                    ),
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
                    (
                        payload["brand"], payload["name"], payload["cover"], payload["core"], payload["rg"],
                        payload["differential"], payload["mass_bias"], payload["surface"], payload["condition"],
                        payload["motion"], payload["strength"], payload["price"], payload["colors_json"],
                        payload["image_url"], payload["research_url"], payload["notes"], payload["source_name"],
                        payload["source_url"], payload["last_seen_at"], payload["is_active"],
                        payload["discontinued_at"], payload["spec_hash"],
                    ),
                )


def csv_text(row: dict, key: str) -> str | None:
    value = str(row.get(key) or "").strip()
    return value or None


def seed_lane_tracker_sessions(connection: sqlite3.Connection) -> None:
    if not LANE_TRACKER_IMPORT_PATH.exists():
        return
    imported = connection.execute(
        "SELECT COUNT(*) AS count FROM shot_logs WHERE shot_source = 'video_analysis_import'"
    ).fetchone()["count"]
    connection.execute(
        """
        UPDATE shot_logs
        SET leave_pin = NULL
        WHERE shot_source = 'video_analysis_import'
          AND lower(coalesce(leave_pin, '')) LIKE '%strike%'
        """
    )
    if imported:
        return

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


def optional_float_from_payload(payload: dict, key: str) -> float | None:
    raw = optional_text(payload, key)
    if raw is None:
        return None
    try:
        return float(raw)
    except ValueError as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be a number") from exc


def optional_int_from_payload(payload: dict, key: str, default: int = 0) -> int:
    raw = optional_text(payload, key)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, f"{key} must be a whole number") from exc


def safe_video_extension(name: str, video_type: str | None) -> str:
    suffix = Path(name or "").suffix.lower()
    if suffix in {".mp4", ".mov", ".m4v", ".webm", ".avi", ".mkv"}:
        return suffix
    return {
        "video/mp4": ".mp4",
        "video/quicktime": ".mov",
        "video/webm": ".webm",
        "video/x-msvideo": ".avi",
    }.get(video_type or "", ".mp4")


def create_lane_video_upload(payload: dict) -> dict:
    original_name = require_text(payload, "name", "Video name")
    video_type = optional_text(payload, "type") or "video"
    content_base64 = require_text(payload, "content_base64", "Video content")
    if "," in content_base64 and content_base64.strip().lower().startswith("data:"):
        content_base64 = content_base64.split(",", 1)[1]
    try:
        video_bytes = base64.b64decode(content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Video content must be base64 encoded") from exc
    if not video_bytes:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Video content is empty")
    if len(video_bytes) > MAX_LANE_VIDEO_UPLOAD_BYTES:
        raise ApiError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "Video upload must be 30 MB or smaller for local development")

    upload_id = f"lane-upload-{uuid.uuid4().hex[:12]}"
    extension = safe_video_extension(original_name, video_type)
    stored_name = f"{upload_id}{extension}"
    LANE_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    stored_path = LANE_VIDEO_DIR / stored_name
    stored_path.write_bytes(video_bytes)
    try:
        relative_path = stored_path.relative_to(ROOT).as_posix()
    except ValueError:
        relative_path = stored_path.as_posix()
    digest = hashlib.sha256(video_bytes).hexdigest()
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        connection.execute(
            """
            INSERT INTO lane_video_uploads (
              upload_id,
              original_name,
              stored_name,
              relative_path,
              video_size,
              video_type,
              sha256
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (upload_id, original_name, stored_name, relative_path, len(video_bytes), video_type, digest),
        )
        connection.commit()
    return {
        "upload_id": upload_id,
        "name": original_name,
        "stored_name": stored_name,
        "relative_path": relative_path,
        "size": len(video_bytes),
        "type": video_type,
        "sha256": digest,
    }


def get_lane_video_upload(upload_id: str | None) -> dict | None:
    if not upload_id:
        return None
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        row = connection.execute(
            """
            SELECT upload_id, original_name, stored_name, relative_path, video_size, video_type, sha256, created_at
            FROM lane_video_uploads
            WHERE upload_id = ?
            """,
            (upload_id,),
        ).fetchone()
    return dict(row) if row else None


def get_lane_video_analyses() -> list[dict]:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        rows = connection.execute(
            """
            SELECT
              a.analysis_run_id,
              a.upload_id,
              a.tracking_mode,
              a.video_name,
              a.video_size,
              a.video_type,
              a.lane_center,
              a.ball,
              a.detection_options_json,
              a.result_json,
              a.status,
              a.created_at,
              u.relative_path,
              u.sha256
            FROM lane_video_analyses a
            LEFT JOIN lane_video_uploads u ON u.upload_id = a.upload_id
            ORDER BY a.created_at DESC, a.id DESC
            LIMIT 25
            """
        ).fetchall()

    analyses: list[dict] = []
    for row in rows:
        result_payload = json.loads(row["result_json"] or "{}")
        detection_options = json.loads(row["detection_options_json"] or "{}")
        fields = result_payload.get("fields") if isinstance(result_payload, dict) else {}
        analyses.append(
            {
                "analysis_run_id": row["analysis_run_id"],
                "upload_id": row["upload_id"],
                "tracking_mode": row["tracking_mode"],
                "video_name": row["video_name"],
                "video_size": row["video_size"],
                "video_type": row["video_type"],
                "lane_center": row["lane_center"],
                "ball": row["ball"],
                "detection": detection_options,
                "fields": fields if isinstance(fields, dict) else {},
                "status": row["status"],
                "created_at": row["created_at"],
                "relative_path": row["relative_path"],
                "sha256": row["sha256"],
            }
        )
    return analyses


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
        rows = dict_rows(
            connection.execute(
                """
                SELECT id, brand, name, cover, core, rg, differential, mass_bias, surface, layout,
                       condition, motion, strength, price, colors_json, image_url, research_url,
                       notes, source_name, source_url, last_imported_at, last_seen_at, is_active,
                       discontinued_at, spec_hash, created_at, updated_at
                FROM bowling_balls
                WHERE is_active = 1 OR is_active IS NULL
                ORDER BY
                  CASE WHEN source_name = 'StrikeIQ ball package' THEN 0 ELSE 1 END,
                  brand COLLATE NOCASE,
                  name COLLATE NOCASE
                """
            )
        )
    for row in rows:
        try:
            row["colors"] = json.loads(row.get("colors_json") or "[]")
        except json.JSONDecodeError:
            row["colors"] = []
    return rows


def create_ball(payload: dict) -> dict:
    name = require_text(payload, "name", "Ball name")
    colors = [color.strip() for color in str(payload.get("colors", "")).split("|") if color.strip()]
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        cursor = connection.execute(
            """
            INSERT INTO bowling_balls (
              brand, name, cover, core, rg, differential, mass_bias, surface, layout, condition,
              motion, strength, price, colors_json, image_url, research_url, notes, source_name,
              last_imported_at, last_seen_at, is_active
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'User arsenal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
            """,
            (
                optional_text(payload, "brand") or "Custom",
                name,
                optional_text(payload, "cover"),
                optional_text(payload, "core"),
                optional_float_from_payload(payload, "rg"),
                optional_float_from_payload(payload, "differential"),
                optional_float_from_payload(payload, "mass_bias"),
                optional_text(payload, "surface"),
                optional_text(payload, "layout"),
                optional_text(payload, "condition"),
                optional_text(payload, "motion"),
                optional_int_from_payload(payload, "strength", 0),
                optional_float_from_payload(payload, "price"),
                json.dumps(colors),
                optional_text(payload, "image_url"),
                optional_text(payload, "research_url"),
                optional_text(payload, "notes"),
            ),
        )
        connection.commit()
        row = connection.execute(
            """
            SELECT id, brand, name, cover, core, rg, differential, mass_bias, surface, layout,
                   condition, motion, strength, price, colors_json, image_url, research_url,
                   notes, source_name, source_url, last_imported_at, last_seen_at, is_active,
                   discontinued_at, spec_hash, created_at, updated_at
            FROM bowling_balls
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    result = dict(row)
    result["colors"] = json.loads(result.get("colors_json") or "[]")
    return result


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


def compute_spare_session_metrics(games: list[dict]) -> dict:
    frames_logged = 0
    strikes = 0
    spares = 0
    splits = 0
    ball_changes = 0
    speed_values: list[float] = []
    ball_usage: dict[str, int] = {}

    def add_ball(value: object) -> None:
        ball = str(value or "").strip()
        if ball:
            ball_usage[ball] = ball_usage.get(ball, 0) + 1

    for game in games:
        if not isinstance(game, dict):
            continue
        add_ball(game.get("ballUsed"))
        add_ball(game.get("spareBall"))
        rows = game.get("rows") if isinstance(game.get("rows"), list) else []
        for row in rows:
            if not isinstance(row, dict):
                continue
            has_data = any(
                str(row.get(key, "")).strip()
                for key in ("board", "boardArrow", "strike", "firstSpeed", "spare", "spareSpeed", "notes", "ballChange")
            ) or bool(row.get("split"))
            if has_data:
                frames_logged += 1
            if str(row.get("strike", "")).strip().upper() == "X":
                strikes += 1
            if str(row.get("spare", "")).strip() == "/":
                spares += 1
            if bool(row.get("split")):
                splits += 1
            if str(row.get("ballChange", "")).strip():
                ball_changes += 1
                add_ball(row.get("ballChange"))
            try:
                speed = float(str(row.get("firstSpeed", "")).strip())
            except ValueError:
                speed = 0
            if speed:
                speed_values.append(speed)

    average_speed = round(sum(speed_values) / len(speed_values), 1) if speed_values else None
    return {
        "frames_logged": frames_logged,
        "strikes": strikes,
        "spares": spares,
        "splits": splits,
        "ball_changes": ball_changes,
        "average_speed": average_speed,
        "ball_usage": ball_usage,
    }


def row_to_spare_session(row: sqlite3.Row) -> dict:
    result = dict(row)
    result["games"] = json.loads(result.pop("games_json") or "[]")
    result["metrics"] = json.loads(result.pop("metrics_json") or "{}")
    return result


def get_spare_sessions() -> dict:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        rows = connection.execute(
            """
            SELECT id, session_date, alley, games_json, metrics_json, created_at, updated_at
            FROM spare_count_sessions
            ORDER BY session_date DESC, updated_at DESC, id DESC
            LIMIT 20
            """
        ).fetchall()
    sessions = [row_to_spare_session(row) for row in rows]
    return {"sessions": sessions, "latest": sessions[0] if sessions else None}


def create_spare_session(payload: dict) -> dict:
    session_date = optional_text(payload, "session_date") or optional_text(payload, "date")
    if not session_date:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Session date is required")
    games = payload.get("games")
    if not isinstance(games, list) or not games:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Games are required")
    metrics = compute_spare_session_metrics(games)
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        connection.execute(
            """
            INSERT INTO spare_count_sessions (session_date, alley, games_json, metrics_json)
            VALUES (?, ?, ?, ?)
            """,
            (
                session_date,
                optional_text(payload, "alley"),
                json.dumps(games),
                json.dumps(metrics),
            ),
        )
        connection.commit()
    return get_spare_sessions()


def get_shots() -> list[dict]:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        return dict_rows(
            connection.execute(
                """
                SELECT
                  s.id,
                  s.session_date,
                  s.lane_center,
                  s.lane_number,
                  s.game_number,
                  s.frame_number,
                  s.ball,
                  s.target,
                  s.feet_board,
                  s.arrows_board,
                  s.breakpoint,
                  s.ball_speed,
                  s.speed_mph,
                  s.lane_condition,
                  s.result,
                  s.miss_direction,
                  s.leave_pin,
                  s.adjustment,
                  s.next_move,
                  s.notes,
                  s.analysis_run_id,
                  s.video_name,
                  s.hook_inches,
                  s.boards_crossed,
                  s.release_board,
                  s.entry_board,
                  s.pocket_quality,
                  s.pin_result,
                  s.impact_result,
                  s.confidence,
                  s.confidence_label,
                  s.confidence_notes,
                  s.quality_score,
                  s.quality_label,
                  s.quality_notes,
                  s.consistency_label,
                  s.consistency_notes,
                  s.output_preview,
                  s.tracking_mode,
                  s.shot_source,
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


def get_shot_stats() -> dict:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        summary = connection.execute(
            """
            SELECT
              COUNT(*) AS total,
              SUM(CASE WHEN shot_source LIKE 'video%' THEN 1 ELSE 0 END) AS video_total,
              SUM(CASE WHEN lower(coalesce(result, '')) LIKE '%strike%' THEN 1 ELSE 0 END) AS strikes,
              ROUND(AVG(speed_mph), 1) AS average_speed,
              ROUND(AVG(hook_inches), 1) AS average_hook
            FROM shot_logs
            """
        ).fetchone()
        common_leave = connection.execute(
            """
            SELECT leave_pin, COUNT(*) AS total
            FROM shot_logs
            WHERE leave_pin IS NOT NULL
              AND trim(leave_pin) <> ''
              AND lower(leave_pin) NOT LIKE '%strike%'
            GROUP BY leave_pin
            ORDER BY total DESC, leave_pin
            LIMIT 1
            """
        ).fetchone()
    return {
        "total": summary["total"] or 0,
        "video_total": summary["video_total"] or 0,
        "strikes": summary["strikes"] or 0,
        "average_speed": summary["average_speed"],
        "average_hook": summary["average_hook"],
        "common_leave": common_leave["leave_pin"] if common_leave else None,
    }


def create_lane_video_analysis(payload: dict) -> dict:
    tracking_mode = optional_text(payload, "tracking_mode") or "recorded_video"
    video = payload.get("video") if isinstance(payload.get("video"), dict) else {}
    context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
    detection = payload.get("detection") if isinstance(payload.get("detection"), dict) else {}
    upload_id = optional_text(payload, "upload_id")
    upload = get_lane_video_upload(upload_id)
    if upload_id and not upload:
        raise ApiError(HTTPStatus.NOT_FOUND, "Video upload not found")
    video_name = str(
        (upload or {}).get("original_name")
        or video.get("name")
        or optional_text(payload, "video_name")
        or f"{tracking_mode.replace('_', ' ')} capture"
    ).strip()
    video_type = str((upload or {}).get("video_type") or video.get("type") or "").strip() or None
    try:
        video_size = int((upload or {}).get("video_size") or video.get("size") or 0)
    except (TypeError, ValueError):
        video_size = 0
    ball = str(context.get("ball") or payload.get("ball") or "").strip() or "Selected ball"
    lane_center = str(context.get("lane_center") or payload.get("lane_center") or "").strip() or "Practice center"
    seed_text = f"{tracking_mode}|{video_name}|{ball}|{lane_center}|{video_size}"
    seed = sum(ord(char) for char in seed_text)
    speed_mph = round(15.2 + (seed % 31) / 10, 2)
    hook_inches = round(12.0 + ((seed // 3) % 95) / 5, 2)
    boards_crossed = round(8.0 + ((seed // 7) % 70) / 5, 2)
    release_board = str(14 + seed % 12)
    arrows_board = str(8 + seed % 9)
    breakpoint = f"{5 + seed % 8} board at {38 + seed % 12} ft"
    entry_board = f"{16 + (seed % 4) * 0.5:.1f}"
    miss_options = ["Flush", "High", "Light", "Through breakpoint"]
    pocket_options = ["Flush", "Light mixer", "High pocket", "Review angle"]
    pin_options = ["Strike", "10 pin", "4 pin", "2-8 leave"]
    miss_direction = miss_options[seed % len(miss_options)]
    pocket_quality = pocket_options[(seed // 5) % len(pocket_options)]
    pin_result = pin_options[(seed // 11) % len(pin_options)]
    confidence = 72 + seed % 22
    result = "Strike" if pin_result == "Strike" else pin_result
    output_preview = (
        f"Development analysis for {video_name}: detected {ball} at {speed_mph:.2f} mph, "
        f"release board {release_board}, arrows {arrows_board}, breakpoint {breakpoint}, "
        f"entry board {entry_board}, {hook_inches:.1f} in hook, {boards_crossed:.1f} boards crossed, "
        f"pocket read {pocket_quality}, pin result {pin_result}."
    )
    analysis_run_id = f"lane-video-{uuid.uuid4().hex[:12]}"
    fields = {
        "analysis_run_id": analysis_run_id,
        "tracking_mode": tracking_mode,
        "shot_source": "video_capture",
        "video_name": video_name,
        "ball": ball if ball != "Selected ball" else "",
        "lane_center": lane_center if lane_center != "Practice center" else "",
        "speed_mph": f"{speed_mph:.2f}",
        "ball_speed": f"{speed_mph:.2f} mph",
        "hook_inches": f"{hook_inches:.2f}",
        "boards_crossed": f"{boards_crossed:.2f}",
        "release_board": release_board,
        "arrows_board": arrows_board,
        "breakpoint": breakpoint,
        "entry_board": entry_board,
        "miss_direction": miss_direction,
        "pocket_quality": pocket_quality,
        "pin_result": pin_result,
        "impact_result": pin_result,
        "confidence": str(confidence),
        "confidence_label": "Development analysis",
        "result": result,
        "output_preview": output_preview,
    }
    result_payload = {
        "analysis_run_id": analysis_run_id,
        "status": "ready",
        "message": "Development video analysis complete from stored upload. Replace this estimator with the production vision model later.",
        "upload_id": upload_id,
        "fields": fields,
    }
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        connection.execute(
            """
            INSERT INTO lane_video_analyses (
              analysis_run_id,
              upload_id,
              tracking_mode,
              video_name,
              video_size,
              video_type,
              lane_center,
              ball,
              detection_options_json,
              result_json,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_run_id,
                upload_id,
                tracking_mode,
                video_name,
                video_size,
                video_type,
                lane_center,
                ball,
                json.dumps(detection, ensure_ascii=True),
                json.dumps(result_payload, ensure_ascii=True),
                "ready",
            ),
        )
        connection.commit()
    return result_payload


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
            INSERT INTO shot_logs (
              oil_pattern_id,
              session_date,
              lane_center,
              lane_number,
              game_number,
              frame_number,
              ball,
              target,
              feet_board,
              arrows_board,
              breakpoint,
              ball_speed,
              speed_mph,
              lane_condition,
              result,
              miss_direction,
              leave_pin,
              adjustment,
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
              shot_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pattern_id,
                optional_text(payload, "session_date"),
                optional_text(payload, "lane_center"),
                optional_text(payload, "lane_number"),
                optional_int_from_payload(payload, "game_number", None),
                optional_text(payload, "frame_number"),
                optional_text(payload, "ball"),
                optional_text(payload, "target"),
                optional_text(payload, "feet_board"),
                optional_text(payload, "arrows_board"),
                optional_text(payload, "breakpoint"),
                optional_text(payload, "ball_speed"),
                optional_float_from_payload(payload, "speed_mph"),
                optional_text(payload, "lane_condition"),
                result,
                optional_text(payload, "miss_direction"),
                optional_text(payload, "leave_pin"),
                optional_text(payload, "adjustment"),
                optional_text(payload, "next_move"),
                optional_text(payload, "notes"),
                optional_text(payload, "analysis_run_id"),
                optional_text(payload, "video_name"),
                optional_float_from_payload(payload, "hook_inches"),
                optional_float_from_payload(payload, "boards_crossed"),
                optional_text(payload, "release_board"),
                optional_text(payload, "entry_board"),
                optional_text(payload, "pocket_quality"),
                optional_text(payload, "pin_result"),
                optional_text(payload, "impact_result"),
                optional_int_from_payload(payload, "confidence", None),
                optional_text(payload, "confidence_label"),
                optional_text(payload, "confidence_notes"),
                optional_int_from_payload(payload, "quality_score", None),
                optional_text(payload, "quality_label"),
                optional_text(payload, "quality_notes"),
                optional_text(payload, "consistency_label"),
                optional_text(payload, "consistency_notes"),
                optional_text(payload, "output_preview"),
                optional_text(payload, "tracking_mode"),
                optional_text(payload, "shot_source") or "manual",
            ),
        )
        connection.commit()
    return get_shots()


def get_chat_posts() -> list[dict]:
    with get_connection() as connection:
        ensure_tracker_tables(connection)
        return dict_rows(
            connection.execute(
                """
                SELECT id, channel, title, user_name, shot_type, feedback_request, video_url, video_name, created_at
                FROM community_posts
                ORDER BY created_at DESC, id DESC
                LIMIT 100
                """
            )
        )


def create_chat_post(payload: dict) -> dict:
    title = require_text(payload, "title", "Video title")
    channel = optional_text(payload, "channel") or "# video-feedback"
    if not channel.startswith("#"):
        channel = f"# {channel.strip()}"

    with get_connection() as connection:
        ensure_tracker_tables(connection)
        connection.execute(
            """
            INSERT INTO community_posts (channel, title, user_name, shot_type, feedback_request, video_url, video_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                channel,
                title,
                optional_text(payload, "user_name") or "StrikeIQ member",
                optional_text(payload, "shot_type"),
                optional_text(payload, "feedback_request"),
                optional_text(payload, "video_url"),
                optional_text(payload, "video_name"),
            ),
        )
        connection.commit()
    return get_chat_posts()


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
            elif parsed.path == "/api/nearby-centers":
                self.send_json(get_nearby_bowling_centers(parse_qs(parsed.query)))
            elif parsed.path == "/api/balls":
                self.send_json(get_balls())
            elif parsed.path == "/api/spares":
                self.send_json(get_spares())
            elif parsed.path == "/api/spare-sessions":
                self.send_json(get_spare_sessions())
            elif parsed.path == "/api/shots/stats":
                self.send_json(get_shot_stats())
            elif parsed.path == "/api/shots":
                self.send_json(get_shots())
            elif parsed.path == "/api/lane-video/analyses":
                self.send_json(get_lane_video_analyses())
            elif parsed.path == "/api/chat/posts":
                self.send_json(get_chat_posts())
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
            elif parsed.path == "/api/spare-sessions":
                self.send_json(create_spare_session(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/lane-video/upload":
                self.send_json(create_lane_video_upload(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/lane-video/analyze":
                self.send_json(create_lane_video_analysis(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/shots":
                self.send_json(create_shot(self.read_json()), HTTPStatus.CREATED)
            elif parsed.path == "/api/chat/posts":
                self.send_json(create_chat_post(self.read_json()), HTTPStatus.CREATED)
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
        self.send_header("Cache-Control", "no-store, max-age=0")
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
