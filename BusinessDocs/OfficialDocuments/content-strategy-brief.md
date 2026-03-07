# Content Strategy Brief
> Version: v2 | Last updated: 2026-03-08T12:00:00Z | Source: Phase 3 agent outputs (32-content-strategist, 35-localization-specialist) + Reevaluation R2
> Completeness: ~90% — updated with questionnaire answers (audience, localization scope, content ownership)

---

## Content Goals

Based on the Phase 3 audit findings, the content strategy serves three objectives:

1. **Error recovery:** Replace raw exception messages with user-friendly, actionable error content that guides users to resolution. (Source: Agent 32, REC-CNT-002 — 4-agent consensus on error recovery as #1 issue)
2. **Consistency:** Establish a unified voice and tone across all UI copy to reduce cognitive friction and build trust. (Source: Agent 32, 5 voice inconsistencies identified)
3. **Localization readiness:** ~~Externalize all 130+ hardcoded strings to enable future translation without code changes.~~ **SUPERSEDED (Q-35-001):** English only — no localization planned. String externalization is DEFERRED to ADVISORY status. i18n infrastructure work removed from mandatory sprint plan. (Source: Agent 35, Reevaluation R2)

**RESOLVED (Q-32-004):** Target audience is **semi-technical and technical** users. Content depth calibrated to developer-level terminology with plain-language explanations for project management concepts.

---

## Audience Needs by Segment

**Validated audience (Q-10-002, Q-32-004):**

| Segment | Content needs | Current gaps |
|---------|--------------|--------------|
| **Semi-technical users** (primary, Q-32-004) | Clear guidance with technical context, progress visibility, error recovery instructions | Raw error messages, no onboarding, inconsistent terminology |
| **Technical users** (primary, Q-32-004) | Technical accuracy, efficiency, keyboard shortcuts, API documentation | No JSDoc, no API docs, help files exist but loaded server-side |

**INSUFFICIENT_DATA:** Q-32-004 (technical proficiency) — **RESOLVED:** semi-technical and technical. Q-10-002 (actual user demographics) — **RESOLVED:** everyone using Agentic Code Generation.

---

## Content Types & Formats

| Content type | Current state | Recommended state |
|-------------|--------------|-------------------|
| **UI labels** | Hardcoded in `index.html` (~130+ strings) | Externalized to locale resource files (JSON/YAML) |
| **Error messages** | Raw exception text via `toast()` | Structured error framework: user-friendly message + recovery action + optional technical detail |
| **Help content** | 7 `.md` files in `.github/help/`, loaded via `/api/help` | Maintain current approach; add inline contextual help for complex interactions |
| **Onboarding copy** | None | First-run wizard with progressive disclosure (Sprint 2) |
| **Status messages** | Basic toast notifications | Differentiated by type (success/warning/error) with consistent formatting |
| **Empty states** | Minimal text | Contextual guidance explaining what to do next |
| **Confirmation dialogs** | None (no delete confirmations exist) | Add for destructive actions with clear consequence description |

---

## Tone & Style Guide (summary)

**Recommended voice attributes** (Source: Agent 32, REC-CNT-001):

| Attribute | Guideline | Example |
|-----------|-----------|---------|
| **Tone** | Professional but approachable | "Your changes have been saved" (not "Data persisted successfully" or "Done!") |
| **Clarity** | Plain language, no jargon without explanation | "This questionnaire has unanswered required questions" (not "INCOMPLETE status detected") |
| **Action orientation** | Tell users what to do, not just what happened | "Try saving again, or check if the file is locked" (not "Write operation failed") |
| **Consistency** | Same terms for same concepts everywhere | Always "questionnaire" (never "form" or "survey" interchangeably) |

**Error message framework** (Agent 32 + Agent 13 joint recommendation):
```
[What happened] — [Why it matters] — [What to do next]
Example: "Unable to save your answer. Your changes haven't been lost — they're still in the form. Try saving again in a moment."
```

**RESOLVED (Q-32-003):** No existing brand or writing guidelines exist. Content style guide will be created from scratch in Sprint 1.

---

## Localization Requirements

**RESOLVED (Q-35-001): English only — no localization planned.** No target languages, no translation budget, no RTL requirement (Q-35-002). All localization-related sprint work is **SUPERSEDED**.

**Retained as ADVISORY** (for potential future consideration):
- i18n readiness score: 2.25/10 (Source: Agent 35)
- 130+ hardcoded strings in `index.html` could be externalized if localization is ever needed
- CSS uses physical properties (`margin-left`) instead of logical properties

**DEFERRED i18n architecture:** The BLK-003 blocker (runtime vs. build-time i18n approach) is **SUPERSEDED** — no decision needed for English-only deployment.
