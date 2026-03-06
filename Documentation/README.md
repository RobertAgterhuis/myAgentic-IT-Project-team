# Documentation

This directory is the output location for the **Documentation Agent** (skill 26) during Phase 5 — Implementation.

## Expected Structure

Once populated, this directory will contain:

```
Documentation/
  user-manual/
    NL/           ← Dutch user manual (chapter structure derived per project)
    EN/           ← English user manual (mirror of NL chapters)
  technical-manual/
    NL/           ← Dutch technical manual (architecture, API, security, etc.)
    EN/           ← English technical manual (mirror of NL chapters)
```

## When Is This Populated?

The Documentation Agent runs **per sprint** during Phase 5. After each sprint's stories are implemented and tested, the agent:

1. Derives or updates the user-manual chapter structure from Domain Expert and UX Designer output
2. Updates both user-manual and technical-manual for all implemented changes
3. Maintains bilingual (NL/EN) parity

## Before Phase 5

This directory remains empty until the first Phase 5 sprint begins. All pre-implementation documentation lives in:

- `.github/docs/synthesis/` — Master report and department reports
- `BusinessDocs/` — Questionnaires, official documents, and decisions
