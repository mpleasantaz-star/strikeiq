# Kegel API Integration Plan

## Current State

StrikeIQ currently uses Kegel Pattern Library as an external official-reference layer. The app stores Kegel lookup links and optional official pattern-page, PDF, and KOSI URLs in `pattern_external_refs`.

The app monitors saved official links with `scripts/check_external_refs.py`.

## Phase 1: Link-Based Coordination

Status: implemented.

- User pastes official Kegel links per pattern.
- App monitors links for availability.
- App hash-checks exact pattern-page, PDF, and KOSI links.
- Changes are recorded in `external_ref_checks`.
- Sync runs are recorded in `sync_runs`.

## Phase 2: Approved API Credentials

Add environment variables:

```powershell
$env:KEGEL_API_BASE_URL = "https://..."
$env:KEGEL_API_KEY = "..."
```

Add a sync script:

```text
scripts/sync_kegel_api.py
```

Responsibilities:

- Authenticate with official Kegel API.
- Fetch changed patterns since last successful sync.
- Store raw response snapshots.
- Normalize approved fields into local tables.
- Preserve StrikeIQ analysis fields.
- Flag material changes for review before replacing visual/strategy assumptions.

## Phase 3: Versioned Official Data

Suggested future tables:

```sql
CREATE TABLE official_pattern_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  external_ref_id INTEGER NOT NULL,
  source_pattern_id TEXT NOT NULL,
  source_version TEXT,
  content_hash TEXT NOT NULL,
  raw_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE official_pattern_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oil_pattern_id INTEGER NOT NULL,
  source_pattern_id TEXT NOT NULL,
  name TEXT NOT NULL,
  length_ft INTEGER,
  volume_ml REAL,
  ratio TEXT,
  pdf_url TEXT,
  kosi_url TEXT,
  effective_at TEXT,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  review_status TEXT NOT NULL DEFAULT 'pending'
);
```

## Review Rules

Automatically update:

- official PDF URL
- official KOSI URL
- source last-checked timestamp
- source availability status

Require review:

- pattern length changes
- volume changes
- ratio changes
- board/oil graph changes
- source pattern identity changes
- machine compatibility changes

Never overwrite automatically:

- user notes
- StrikeIQ strategy summaries
- equipment recommendations
- transition plans
- manually tuned 3D visualization notes

## Attribution

If Kegel approves integration, show source attribution near official fields:

```text
Official pattern source: Kegel Pattern Library
```

Keep StrikeIQ-generated analysis visually separate from official Kegel data.
