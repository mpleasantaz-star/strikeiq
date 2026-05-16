from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json
import sys


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT / "mobile" / "src" / "data" / "patterns.json"

sys.path.insert(0, str(ROOT))

from app import get_pattern, get_pattern_types, get_patterns, get_sources, get_tags  # noqa: E402


def main() -> None:
    cards = get_patterns({})
    patterns = [get_pattern(card["slug"]) for card in cards]
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "patterns": patterns,
        "tags": get_tags(),
        "sources": get_sources(),
        "pattern_types": get_pattern_types(),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    print(f"Exported {len(patterns)} patterns to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
