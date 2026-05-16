from __future__ import annotations

from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import argparse
import hashlib
import sqlite3
import sys
import time


ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "data" / "bowling_oil_patterns.sqlite"
MAX_BYTES = 8 * 1024 * 1024
TIMEOUT_SECONDS = 20


def dict_rows(cursor: sqlite3.Cursor) -> list[dict]:
    return [dict(row) for row in cursor.fetchall()]


def read_url(url: str) -> tuple[int | None, bytes, str | None]:
    request = Request(
        url,
        headers={
            "User-Agent": "StrikeIQ link monitor/1.0 (+local app)",
            "Accept": "*/*",
        },
    )

    try:
        with urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            status = getattr(response, "status", None)
            body = response.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES:
                body = body[:MAX_BYTES]
            return status, body, None
    except HTTPError as error:
        body = error.read(MAX_BYTES)
        return error.code, body, f"HTTP {error.code}"
    except URLError as error:
        return None, b"", str(error.reason)
    except TimeoutError:
        return None, b"", "Request timed out"


def previous_hash(
    connection: sqlite3.Connection,
    external_ref_id: int,
    url_type: str,
    url: str,
) -> str | None:
    row = connection.execute(
        """
        SELECT content_hash
        FROM external_ref_checks
        WHERE external_ref_id = ?
          AND url_type = ?
          AND url = ?
          AND content_hash IS NOT NULL
        ORDER BY checked_at DESC, id DESC
        LIMIT 1
        """,
        (external_ref_id, url_type, url),
    ).fetchone()
    return row["content_hash"] if row else None


def urls_for_ref(ref: dict) -> list[tuple[str, str]]:
    urls = []
    if ref["source_home_url"]:
        urls.append(("source_home", ref["source_home_url"]))
    if ref["pattern_page_url"]:
        urls.append(("pattern_page", ref["pattern_page_url"]))
    if ref["pdf_url"]:
        urls.append(("pdf", ref["pdf_url"]))
    if ref["download_url"]:
        urls.append(("download", ref["download_url"]))
    if ref["kosi_url"]:
        urls.append(("kosi", ref["kosi_url"]))
    return urls


def run_sync(db_path: Path = DB_PATH, source_name: str | None = None) -> int:
    run_source_name = source_name or "All Official Sources"
    with sqlite3.connect(db_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        run_id = connection.execute(
            """
            INSERT INTO sync_runs (source_name, status, message)
            VALUES (?, 'running', ?)
            """,
            (run_source_name, "Checking saved external references"),
        ).lastrowid
        connection.commit()

        checked_count = 0
        changed_count = 0
        error_count = 0

        if source_name:
            refs = dict_rows(
                connection.execute(
                    """
                    SELECT id, source_name, source_home_url, pattern_page_url, pdf_url, download_url, kosi_url
                    FROM pattern_external_refs
                    WHERE source_name = ?
                    ORDER BY id
                    """,
                    (source_name,),
                )
            )
        else:
            refs = dict_rows(
                connection.execute(
                    """
                    SELECT id, source_name, source_home_url, pattern_page_url, pdf_url, download_url, kosi_url
                    FROM pattern_external_refs
                    ORDER BY source_name, id
                    """
                )
            )

        try:
            for ref in refs:
                for url_type, url in urls_for_ref(ref):
                    status, body, error = read_url(url)
                    content_hash = hashlib.sha256(body).hexdigest() if body else None
                    old_hash = previous_hash(connection, ref["id"], url_type, url)
                    tracks_content = url_type in {"pdf", "download", "kosi"}
                    changed = int(
                        tracks_content
                        and old_hash is not None
                        and content_hash is not None
                        and old_hash != content_hash
                    )
                    needs_review = int(changed and url_type in {"pdf", "download", "kosi"})
                    checked_count += 1
                    changed_count += changed
                    error_count += int(error is not None and status is None)

                    connection.execute(
                        """
                        INSERT INTO external_ref_checks (
                          sync_run_id,
                          external_ref_id,
                          url_type,
                          url,
                          http_status,
                          content_hash,
                          content_length,
                          changed,
                          needs_review,
                          error_message
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            run_id,
                            ref["id"],
                            url_type,
                            url,
                            status,
                            content_hash,
                            len(body) if body else None,
                            changed,
                            needs_review,
                            error,
                        ),
                    )
                    connection.commit()
                    time.sleep(0.2)

            connection.execute(
                """
                UPDATE sync_runs
                SET
                  finished_at = CURRENT_TIMESTAMP,
                  status = 'completed',
                  checked_count = ?,
                  changed_count = ?,
                  error_count = ?,
                  message = ?
                WHERE id = ?
                """,
                (
                    checked_count,
                    changed_count,
                    error_count,
                    f"Checked {checked_count} URLs; {changed_count} changed; {error_count} errors.",
                    run_id,
                ),
            )
            connection.commit()
            print(f"Sync completed: checked={checked_count} changed={changed_count} errors={error_count}")
            return 0
        except Exception as error:
            connection.execute(
                """
                UPDATE sync_runs
                SET finished_at = CURRENT_TIMESTAMP, status = 'failed', message = ?
                WHERE id = ?
                """,
                (str(error), run_id),
            )
            connection.commit()
            raise


def main() -> int:
    parser = argparse.ArgumentParser(description="Check saved external pattern references for changes.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    parser.add_argument("--source", default=None)
    args = parser.parse_args()
    return run_sync(args.db, args.source)


if __name__ == "__main__":
    sys.exit(main())
