from __future__ import annotations

from pathlib import Path
import argparse
import re
import sqlite3
import sys


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "bowling_oil_patterns.sqlite"


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "imported-pattern"


def display_name(value: str) -> str:
    cleaned = value.replace("_", " ").replace("-", " ").replace("#", "No. ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if cleaned.isupper() or cleaned.lower() == cleaned:
        return cleaned.title()
    return cleaned


def infer_length_ft(name: str, note: str) -> int:
    candidates = [int(match) for match in re.findall(r"\d+", f"{name} {note}")]
    for value in candidates:
        if 30 <= value <= 52:
            return value
    return 40


def difficulty_for_length(length_ft: int) -> int:
    if length_ft <= 35 or length_ft >= 46:
        return 4
    if length_ft in {36, 37, 44, 45}:
        return 3
    return 2


def length_tag(length_ft: int) -> str:
    if length_ft <= 36:
        return "short"
    if length_ft >= 43:
        return "long"
    return "medium"


def ensure_tag(connection: sqlite3.Connection, name: str) -> int:
    connection.execute("INSERT INTO pattern_tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING", (name,))
    return connection.execute("SELECT id FROM pattern_tags WHERE name = ?", (name,)).fetchone()[0]


def insert_pattern_details(connection: sqlite3.Connection, pattern_id: int, length_ft: int) -> None:
    breakpoint_board = max(3, min(18, length_ft - 31))
    zones = [
        (1, 8, 0, min(length_ft, 18), 30, "Outside boards from the imported catalog entry. Verify exact graph before tournament use."),
        (9, 15, 0, length_ft, 62, "Track area estimate for visualization until the official graph is approved."),
        (16, 25, 0, length_ft, 82, "Center hold estimate based on a typical blended lane pattern shape."),
        (26, 32, 0, length_ft, 62, "Mirrored track area estimate for left-handed views."),
        (33, 40, 0, min(length_ft, 18), 30, "Outside boards from the imported catalog entry. Verify exact graph before tournament use."),
    ]
    for zone in zones:
        connection.execute(
            """
            INSERT INTO pattern_zones (
              oil_pattern_id,
              board_start,
              board_end,
              distance_start_ft,
              distance_end_ft,
              oil_level,
              note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (pattern_id, *zone),
        )

    connection.execute(
        """
        INSERT INTO pattern_play_profiles (
          oil_pattern_id,
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            pattern_id,
            breakpoint_board,
            f"Start review near board {breakpoint_board} from the rule-of-31 estimate.",
            "Medium axis rotation until the exact graph is reviewed.",
            "Read the first 15 feet and confirm whether the outside friction is early or blended.",
            "Use small moves inside until exact ratio and volume are approved.",
            "Do not assume free recovery; imported catalog entries need graph review.",
            "Center boards are treated as hold in the starter visualization.",
            "Outside recovery is estimated and should be confirmed in practice.",
            "Match speed to pattern length; longer entries usually need more forward roll.",
            "Benchmark reactive first, then adjust surface from practice response.",
            "Keep spare shooting independent of the strike line.",
        ),
    )

    connection.execute(
        """
        INSERT INTO pattern_lane_intelligence (
          oil_pattern_id,
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
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            pattern_id,
            "Imported catalog entry with estimated blended shape pending graph approval.",
            "Unknown volume until the official PDF or machine file is parsed.",
            "Use practice shots to identify whether the outside boards are clean or cliffed.",
            "Treat as a review pattern until exact load and ratio are confirmed.",
            f"Right view estimate: breakpoint near board {breakpoint_board}.",
            f"Left view estimate: breakpoint near board {41 - breakpoint_board}.",
            f"Approximate {breakpoint_board}-{breakpoint_board + 3} at {length_ft} ft.",
            "Primary risk is trusting estimated oil shape before graph review.",
            "Move when the ball reads early in the track or misses the breakpoint twice.",
            "Start with benchmark surface; add surface for longer or tighter entries.",
            "Confirm length, breakpoint, and miss room before scoring play.",
        ),
    )

    connection.execute(
        """
        INSERT INTO pattern_transition_phases (
          oil_pattern_id,
          phase_order,
          phase_name,
          frame_window,
          what_to_watch,
          move_strategy,
          ball_change
        )
        VALUES
          (?, 1, 'Fresh read', 'Practice', 'Confirm oil length and breakpoint against the visual estimate.', 'Start direct and keep the breakpoint repeatable.', 'Benchmark reactive.'),
          (?, 2, 'Track opens', 'Game 1-2', 'Watch for early hook in the fronts and weak corners.', 'Move in small pairs and keep shape smooth.', 'Cleaner or smoother cover as needed.'),
          (?, 3, 'Late transition', 'Game 3+', 'Watch carry and pocket control as volume moves downlane.', 'Chase hold inside without over-sending the breakpoint.', 'Ball down when the lane opens.')
        """,
        (pattern_id, pattern_id, pattern_id),
    )

    connection.execute(
        """
        INSERT INTO pattern_equipment_options (
          oil_pattern_id,
          option_order,
          bowler_style,
          ball_type,
          surface,
          when_to_use
        )
        VALUES
          (?, 1, 'Balanced', 'Benchmark reactive', '3000-4000 grit', 'Use first while validating the imported pattern shape.'),
          (?, 2, 'Speed dominant', 'Stronger solid reactive', '2000-3000 grit', 'Use if the ball does not read the midlane.'),
          (?, 3, 'Rev dominant', 'Cleaner reactive or urethane', 'Polished or light surface', 'Use if the front part hooks too early.')
        """,
        (pattern_id, pattern_id, pattern_id),
    )


def promote_source(source_name: str, db_path: Path, limit: int | None = None) -> int:
    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        rows = connection.execute(
            """
            SELECT pattern_name, pattern_page_url, length_ft, note
            FROM source_catalog_backlog
            WHERE source_name = ?
              AND pattern_name <> 'Dropbox archive import'
            ORDER BY pattern_name
            """,
            (source_name,),
        ).fetchall()
        if limit is not None:
            rows = rows[:limit]

        promoted = 0
        tags = {name: ensure_tag(connection, name) for name in ["tournament", "imported", "needs-review"]}

        for row in rows:
            raw_name = row["pattern_name"]
            name = display_name(raw_name)
            length_ft = row["length_ft"] or infer_length_ft(raw_name, row["note"] or "")
            slug = f"{slugify(source_name)}-{slugify(raw_name)}"
            difficulty = difficulty_for_length(length_ft)
            pattern_type = "challenge"
            source_note = f"Imported from {source_name}. Exact oil graph, load, and ratio should be verified from the source file before tournament use."

            cursor = connection.execute(
                """
                INSERT INTO oil_patterns (
                  slug,
                  name,
                  organization,
                  pattern_type,
                  length_ft,
                  volume_ml,
                  ratio,
                  difficulty,
                  summary,
                  play_strategy,
                  ball_motion,
                  suggested_line_right,
                  suggested_line_left,
                  recommended_equipment,
                  common_adjustments,
                  source_note
                )
                VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(slug) DO NOTHING
                """,
                (
                    slug,
                    name,
                    source_name,
                    pattern_type,
                    length_ft,
                    "Pending graph review",
                    difficulty,
                    f"Imported {length_ft}-foot catalog pattern from {source_name}.",
                    "Use this as a source-backed starting record. Confirm the exact graph, volume, and ratio before competitive decisions.",
                    "Estimated blended motion until the source file is reviewed.",
                    f"Start with a controlled line toward board {max(3, min(18, length_ft - 31))} at the breakpoint.",
                    f"Start with a controlled line toward board {41 - max(3, min(18, length_ft - 31))} at the breakpoint.",
                    "Benchmark reactive first; adjust cover strength after practice shots confirm friction.",
                    "Make small moves and update the record after graph review or bowler notes.",
                    source_note,
                ),
            )
            if cursor.rowcount == 0:
                continue

            promoted += 1
            pattern_id = cursor.lastrowid
            for tag_name in ["tournament", "imported", "needs-review", length_tag(length_ft)]:
                tag_id = tags.get(tag_name) or ensure_tag(connection, tag_name)
                tags[tag_name] = tag_id
                connection.execute(
                    "INSERT OR IGNORE INTO oil_pattern_tags (oil_pattern_id, tag_id) VALUES (?, ?)",
                    (pattern_id, tag_id),
                )
            insert_pattern_details(connection, pattern_id, length_ft)
            connection.execute(
                """
                INSERT INTO pattern_external_refs (
                  oil_pattern_id,
                  source_name,
                  source_home_url,
                  pattern_page_url,
                  search_url,
                  reference_note
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    pattern_id,
                    source_name,
                    row["pattern_page_url"] or "",
                    row["pattern_page_url"],
                    row["pattern_page_url"] or "",
                    source_note,
                ),
            )
            connection.execute(
                """
                UPDATE source_catalog_backlog
                SET import_status = 'imported'
                WHERE source_name = ? AND pattern_name = ?
                """,
                (source_name, raw_name),
            )

        connection.execute(
            """
            UPDATE source_catalog_status
            SET imported_count = (
              SELECT COUNT(*)
              FROM oil_patterns
              WHERE organization = ?
            ),
            checked_at = CURRENT_TIMESTAMP
            WHERE source_name = ?
            """,
            (source_name, source_name),
        )
        connection.commit()

    return promoted


def main() -> int:
    parser = argparse.ArgumentParser(description="Promote queued source catalog entries into visible app patterns.")
    parser.add_argument("--source-name", default="Brunswick Pattern Library")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    promoted = promote_source(args.source_name, args.db, args.limit)
    print(f"Promoted {promoted} patterns from {args.source_name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
