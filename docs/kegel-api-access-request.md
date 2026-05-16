# Kegel Pattern Library API Access Request

## Outreach Email

Subject: Request for official Kegel Pattern Library API or partner data-feed access

Hello Kegel team,

I am building StrikeIQ, a bowling lane-pattern analysis app. We would like to use Kegel Pattern Library as the official source of truth for oil pattern metadata, official pattern graphs, PDFs, and KOSI files.

We are not looking to scrape or republish Kegel Pattern Library without permission. We would like to discuss official API, data-feed, or partner access for:

- Pattern names and stable pattern IDs
- Pattern length, volume, ratio, conditioner, and category
- Official graph/lane-zone data
- Official PDF URLs
- KOSI file URLs
- Last-updated timestamps or version identifiers
- Allowed local caching rules
- Attribution requirements
- Rate limits and commercial/licensing terms
- Whether Smart ID authentication can support third-party app access

StrikeIQ would use Kegel data as the official reference source while adding bowler-facing analysis, 3D lane visualization, user notes, equipment guidance, and transition planning.

Can you point us to the right person for Pattern Library API access, data licensing, or partner integration?

Thank you,

StrikeIQ team

## Contact Targets

- Kegel contact page: https://www.kegel.net/contact-us
- Kegel software page: https://www.kegel.net/kegel-software
- Kegel Pattern Library: https://patternlibrary.kegel.net/
- Phone listed by Kegel: +1 (863) 734-0200
- US 24/7 tech support listed by Kegel: (800) 280-2695

## Integration Position

StrikeIQ should present Kegel as the official source of truth only through permissioned access. Until API or data-feed access is approved, StrikeIQ should:

- Keep local strategy, notes, and visualization data in SQLite.
- Link to Kegel Pattern Library for official verification.
- Let users paste exact official Kegel pattern-page, PDF, and KOSI URLs.
- Monitor saved official links for availability and content-hash changes.
- Avoid scraping hidden or undocumented endpoints.

## Requested API Shape

Ideal endpoints:

```text
GET /patterns
GET /patterns/{patternId}
GET /patterns/{patternId}/graph
GET /patterns/{patternId}/downloads/pdf
GET /patterns/{patternId}/downloads/kosi
GET /patterns/changes?since={timestamp}
```

Ideal authentication:

```text
Authorization: Bearer <api_key_or_smart_id_token>
```

Ideal update metadata:

```json
{
  "id": "stable-kegel-pattern-id",
  "name": "Pattern Name",
  "updatedAt": "2026-05-06T00:00:00Z",
  "version": "optional-version",
  "hash": "optional-source-hash"
}
```

## Fields StrikeIQ Needs

Minimum:

- `id`
- `name`
- `lengthFeet`
- `volumeMl`
- `ratio`
- `category`
- `pdfUrl`
- `kosiUrl`
- `updatedAt`

Preferred:

- `forwardVolumeMl`
- `reverseVolumeMl`
- `conditionerName`
- `cleanerName`
- `machineTypeCompatibility`
- `laneGraph`
- `boardOilLevels`
- `zoneData`
- `downloadHash`
- `publicShareUrl`

## Local App Mapping

Kegel data should map into existing StrikeIQ tables:

- `pattern_external_refs`: official Kegel URLs and source metadata
- `external_ref_checks`: link status, hashes, and review flags
- future `official_pattern_snapshots`: raw approved API snapshots
- future `official_pattern_versions`: normalized, versioned Kegel fields

StrikeIQ-generated interpretation should remain separate:

- `pattern_play_profiles`
- `pattern_transition_phases`
- `pattern_equipment_options`
- `user_pattern_notes`

## Questions For Kegel

- Is there an official Pattern Library API or partner data feed?
- Are pattern IDs stable across web, mobile, PDF, and KOSI downloads?
- Can third-party apps use Smart ID for delegated access?
- What data can be cached locally, and for how long?
- Are PDF/KOSI direct links stable?
- Is commercial redistribution allowed if attribution is shown?
- Are there rate limits or usage reporting requirements?
- Can StrikeIQ store derived analysis linked to official Kegel pattern IDs?
