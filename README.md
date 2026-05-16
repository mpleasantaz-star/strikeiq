# Bowling Oil Patterns Database

This project contains a portable SQLite database for an app that helps bowlers view oil patterns and use them for lane-play decisions.

## What Is Included

- `db/schema.sql`: tables, indexes, and the `oil_pattern_cards` list view.
- `db/seed.sql`: starter data for common house, sport, and PBA-style reference patterns.
- `scripts/build_database.py`: rebuilds the SQLite file.
- `data/bowling_oil_patterns.sqlite`: generated app database.
- `web/brand`: StrikeIQ brand tokens and logo assets adapted from the provided brand package.
- `web/vendor/three.module.js`: local Three.js runtime for the 3D oil-map visuals.

## Build The Database

```powershell
python .\scripts\build_database.py
```

## Run The App

```powershell
python .\app.py
```

Then open:

```text
http://127.0.0.1:8000
```

The app uses only Python's standard library, so there are no packages to install.

If port 8000 is busy:

```powershell
$env:PORT = "8001"
python .\app.py
```

## Run The Expo Mobile App

The React Native/Expo app lives in `mobile` and bundles a JSON export of the same oil-pattern database for Expo Go.

```powershell
cd .\mobile
npm install
npm start
```

The mobile app currently includes:

- oil-pattern library search and detail views
- add-your-own oil pattern entries
- bowling ball database
- spare count log with conversion rate
- shot tracker tied to the selected pattern
- local lane-coach chat that uses the selected pattern, ball database, spare log, and recent shots

Install Expo Go on your iPhone or Android phone, then scan the QR code from the Expo terminal. If your phone cannot reach the computer on the same Wi-Fi network, use:

```powershell
npx expo start --tunnel
```

Refresh the bundled mobile data after changing the SQLite database:

```powershell
cd .\mobile
npm run refresh-data
```

## Build iOS And Android

Expo Go is for fast testing. For installable builds, sign in to Expo and use EAS Build:

```powershell
cd .\mobile
npx eas-cli login
npx eas-cli build:configure
```

Create an Android APK for internal testing:

```powershell
npm run build:android:preview
```

Create production store builds:

```powershell
npm run build:android
npm run build:ios
```

iOS production builds require an Apple Developer Program account. Android store submission requires a Google Play Console account. EAS can manage signing credentials during the build prompts.

## GitHub Setup

This repository includes `.github/workflows/mobile.yml`, which runs `npm ci` and `npx tsc --noEmit` for the Expo app on pushes and pull requests.

Do not commit large source archives such as `data/*.zip`; GitHub rejects normal Git files over 100 MB. The generated SQLite database is small enough to keep in this repo for now.

## Main Tables

- `oil_patterns`: one row per oil pattern with length, difficulty, lane-play strategy, left/right-handed suggested lines, equipment notes, and adjustment notes.
- `pattern_tags`: filter labels such as `short`, `long`, `league`, and `inside-line`.
- `oil_pattern_tags`: many-to-many connection between patterns and tags.
- `pattern_zones`: simplified board/distance/oil-level zones for visual lane diagrams.
- `pattern_play_profiles`: advanced reads such as Rule of 31 breakpoint, miss room, friction response, speed control, rev-rate matchup, and spare priority.
- `pattern_transition_phases`: fresh, middle-set, and late-set transition guidance for each pattern.
- `pattern_equipment_options`: ball and surface choices for different bowler styles.
- `pattern_external_refs`: external official-reference links such as Kegel Pattern Library lookup, pattern-page, PDF, and KOSI URLs.
- `official_pattern_imports`: imported official files awaiting review.
- `user_pattern_notes`: app-user notes for lane center, ball used, score, and what worked.

## Kegel Coordination

The app links out to [Kegel Pattern Library](https://patternlibrary.kegel.net/) as an official reference point. This keeps the StrikeIQ database focused on bowler strategy and visualization while sending users to Kegel for official pattern graphs, load data, PDFs, and KOSI machine files.

When you have an exact Kegel pattern-page URL, PDF URL, or KOSI URL, store it in `pattern_external_refs` for that local pattern.

The app detail screen includes a Kegel reference form for each pattern. Paste official Kegel pattern-page, PDF, or KOSI links there to make Kegel the verification source while StrikeIQ keeps local strategy, 3D visualization, and user notes.

API access request materials are in:

- `docs/kegel-api-access-request.md`
- `docs/kegel-api-integration-plan.md`

## Update Monitoring

Run an external-reference check manually:

```powershell
python .\scripts\check_external_refs.py
```

The checker records each run in `sync_runs` and each URL check in `external_ref_checks`. Kegel's homepage is checked for availability only. Exact pattern-page, PDF, and KOSI links are hash-checked so changes can be flagged for review.

The app sidebar also includes a `Kegel Sync` panel with a `Check updates` button.

## Official File Imports

Import an official pattern file into the review queue:

```powershell
python .\scripts\import_official_pattern.py "C:\path\to\pattern.pdf" --source-url "https://patternlibrary.kegel.net/..."
```

The importer stores the file hash, raw extracted text, detected name, length, volume, and ratio in `official_pattern_imports`. Imported files stay in a review queue and do not overwrite StrikeIQ strategy or 3D visualization data automatically.

The app sidebar includes an `Import Review` panel where pending imports can be approved or rejected.

## Useful Queries

List app cards:

```sql
SELECT * FROM oil_pattern_cards ORDER BY length_ft, difficulty;
```

Find beginner-friendly or league patterns:

```sql
SELECT p.name, p.length_ft, p.summary
FROM oil_patterns p
JOIN oil_pattern_tags pt ON pt.oil_pattern_id = p.id
JOIN pattern_tags t ON t.id = pt.tag_id
WHERE t.name IN ('beginner-friendly', 'league')
GROUP BY p.id
ORDER BY p.difficulty, p.length_ft;
```

Load a pattern detail screen:

```sql
SELECT *
FROM oil_patterns
WHERE slug = 'pba-shark-style';
```

Load the lane-zone data for a diagram:

```sql
SELECT board_start, board_end, distance_start_ft, distance_end_ft, oil_level, note
FROM pattern_zones
WHERE oil_pattern_id = (
  SELECT id FROM oil_patterns WHERE slug = 'typical-house-shot'
)
ORDER BY board_start, distance_start_ft;
```

## App Notes

The PBA-style entries are intended as educational references. For sanctioned tournament play, use the official lane graph and current pattern sheet from the event.
