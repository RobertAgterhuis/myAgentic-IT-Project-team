# SP-R2-006-003: Analytics Review & Insights Report

> **Story ID:** SP-R2-006-003 | **Sprint:** SP-R2-006 | **Type:** ANALYSIS | **Priority:** MEDIUM | **SP:** 2
> **Date:** 2026-03-08 | **Source:** Agent 10 (UX Researcher)
> **Dependencies:** SP-R2-004-008 (analytics layer ✅)
> **Data period:** 2026-03-07 to 2026-03-08 (since analytics layer deployment in Sprint 4)

---

## 1. Analytics Infrastructure Status

### 1.1 Implementation Review

The analytics layer was implemented in Sprint 4 (SP-R2-004-008) with the following architecture:

| Component | Status | Location |
|-----------|--------|----------|
| **Frontend tracker** (`trackEvent()`) | ✅ Deployed | `.github/webapp/index.html` — batches events in `_analyticsQueue`, flushes on 250ms timeout or 50-event batch |
| **Backend endpoint** (POST `/api/analytics`) | ✅ Deployed | `.github/webapp/server.js` — accepts batched events, validates structure, appends server timestamps |
| **Storage** | ✅ Operational | `.github/docs/analytics-events.json` — JSON array, max 5,000 events |
| **Retrieval** (GET `/api/analytics`) | ✅ Deployed | Returns `{ events: [...], total: <count> }` |
| **Opt-out mechanism** (`_analyticsOptOut`) | ✅ Available | Frontend flag disables all tracking |

### 1.2 Currently Instrumented Events

| Event Name | Trigger | Properties | Status |
|------------|---------|------------|--------|
| `tab_switch` | User switches between tabs | `{ tab: "questionnaires"\|"decisions"\|"commandcenter" }` | ✅ Collecting |
| `onboarding_complete` | User completes onboarding wizard | `{ steps_seen: <number> }` | ✅ Instrumented, no data yet |
| `onboarding_skip` | User skips onboarding | `{ step: <number> }` | ✅ Instrumented, no data yet |
| `app_start` | Application loads | `{ tab: <activeTab> }` | ✅ Instrumented, no data yet |

### 1.3 Instrumentation Gaps

The following user actions are **not instrumented** and represent coverage gaps:

| Missing Event | User Action | Impact on Analysis |
|---------------|-------------|-------------------|
| `questionnaire_save` | User saves a questionnaire answer | Cannot measure questionnaire task completion rate |
| `questionnaire_open` | User opens a questionnaire file | Cannot measure questionnaire engagement |
| `decision_create` | User creates a new decision | Cannot measure decision creation frequency |
| `decision_action` | User performs action (answer/decide/defer/expire/reopen) | Cannot measure decision workflow usage |
| `command_launch` | User launches a command | Cannot measure command center usage |
| `command_copy` | User copies command to clipboard | Cannot measure command completion rate |
| `export_data` | User exports session data | Cannot measure export feature usage |
| `help_open` | User opens help panel | Cannot measure help-seeking behavior |
| `error_shown` | Error toast displayed to user | Cannot measure error frequency from client perspective |
| `search_filter` | User filters decisions | Cannot measure filter feature adoption |
| `session_duration` | Session start/end | Cannot measure engagement duration |

**Coverage assessment:** 4 event types instrumented out of ~15 recommended. Effective coverage: **~27%**.

---

## 2. Collected Data Analysis

### 2.1 Data Volume

| Metric | Value |
|--------|-------|
| Total events collected | **9** |
| Time period | 2026-03-07 20:46 to 2026-03-07 21:18 |
| Unique event types | **1** (`tab_switch` only) |
| Unique sessions (estimated) | **2** (based on timestamp clustering) |

### 2.2 Event Breakdown

| Event Type | Count | % of Total |
|------------|-------|------------|
| `tab_switch` | 9 | 100% |

### 2.3 Tab Switch Analysis

| Tab Target | Count | % of Switches |
|------------|-------|---------------|
| `questionnaires` | 3 | 33.3% |
| `decisions` | 3 | 33.3% |
| `commandcenter` | 3 | 33.3% |

**Session 1** (2026-03-07 20:46:27): 4 rapid tab switches (questionnaires → decisions → commandcenter → questionnaires). All within the same second — indicates systematic exploration or automated testing, not organic user behavior.

**Session 2** (2026-03-07 21:17:50 – 21:18:22): 3 tab switches over ~32 seconds (commandcenter → questionnaires → decisions → commandcenter). The time gaps suggest more deliberate navigation.

### 2.4 Data Quality Assessment

| Criterion | Assessment | Notes |
|-----------|------------|-------|
| Sample size | **INSUFFICIENT** | 9 events from ~2 sessions is too small for statistical analysis |
| Event diversity | **INSUFFICIENT** | Only 1 of 4 instrumented event types has data; 0 onboarding/app_start events |
| Time coverage | **INSUFFICIENT** | ~32 minutes of data vs. weeks since Sprint 4 deployment |
| User diversity | **INSUFFICIENT** | Cannot distinguish users (no user ID or session ID in events) |

---

## 3. Feature Usage Patterns

### 3.1 Feature Usage Breakdown

Based on available data (tab_switch events only):

| Feature Area | Usage Indicator | Assessment |
|--------------|----------------|------------|
| Questionnaires tab | 3 visits (33% of switches) | Equal usage across tabs |
| Decisions tab | 3 visits (33% of switches) | Equal usage across tabs |
| Command Center tab | 3 visits (33% of switches) | Equal usage across tabs |
| Onboarding wizard | 0 `onboarding_complete` events | INSUFFICIENT_DATA — either not triggered or users are returning users who skip onboarding |
| App startup | 0 `app_start` events | INSUFFICIENT_DATA — event may not fire correctly or sample is too small |

**Assessment:** The even distribution across tabs suggests exploratory behavior rather than task-focused usage. With only 9 events, no meaningful usage patterns can be identified.

### 3.2 Most/Least Used Features

**Cannot be determined.** The current instrumentation only captures tab switches. Feature-level usage data (saves, creates, edits, commands, exports) is not captured. This is the #1 instrumentation gap.

---

## 4. Error Frequency Analysis

### 4.1 Client-Side Errors

**No error events are instrumented.** The `trackEvent()` function is not called from error handlers (`showError()`, `announceError()`), API failure callbacks, or retry exhaustion paths.

**Recommendation:** Add `error_shown` event to the `showError()` function with properties: `{ type: <error_code>, context: <action>, recovery: <recovery_text> }`.

### 4.2 Server-Side Errors

Server-side error logging exists (structured JSON logger in `server.js`) but is not aggregated into analytics. HTTP 4xx/5xx responses are logged to console but not persisted for analysis.

**Recommendation:** Periodically aggregate server log error counts into analytics or a separate error-tracking report.

---

## 5. Task Completion Rate per Primary Flow

### 5.1 Available Data

| Flow | Instrumented? | Completion Rate |
|------|--------------|----------------|
| Questionnaire: answer + save | ❌ No | Cannot measure |
| Decision: create | ❌ No | Cannot measure |
| Decision: action (answer/decide/defer) | ❌ No | Cannot measure |
| Command: launch | ❌ No | Cannot measure |
| Export: download | ❌ No | Cannot measure |

**Assessment:** Task completion rates cannot be measured from analytics data. The usability testing report (SP-R2-006-001) provides observational task success rates as a proxy: overall 86% across 7 tasks.

---

## 6. Session Duration Distribution

**Cannot be determined.** No session start/end events are tracked. The two observed sessions span approximately:
- Session 1: <1 second (automated/rapid clicking)
- Session 2: ~32 seconds

**Recommendation:** Instrument `app_start` with a session ID and add a `session_end` event (fired on `beforeunload` or visibility change).

---

## 7. Insights & Recommendations for Sprint 7

### 7.1 Critical Instrumentation Gaps (Prioritized)

| Priority | Event to Add | Why | Effort |
|----------|-------------|-----|--------|
| **P1** | `questionnaire_save` | Core workflow — must measure to establish KPI baselines | Low (1 line in `saveOne()` and `saveAll()`) |
| **P1** | `decision_create` / `decision_action` | Core workflow — decision tracking is primary use case | Low (1 line per action function) |
| **P1** | `error_shown` | Error frequency is a key quality metric and WCAG compliance indicator | Low (1 line in `showError()`) |
| **P2** | `command_launch` / `command_copy` | Measures command center usage and completion rate | Low (1 line in `launchCommand()`) |
| **P2** | `app_start` with session ID | Enables session duration calculation and user-level analysis | Low (add `uuid()` or timestamp-based session ID) |
| **P2** | `session_end` | Paired with `app_start` for duration calculation | Low (beforeunload handler) |
| **P3** | `export_data` | Measures export feature adoption | Low (1 line in export handler) |
| **P3** | `help_open` | Measures help-seeking behavior | Low (1 line in help handler) |

### 7.2 Architecture Recommendations

1. **Add session identifiers:** Include a `sessionId` property in all events (generated on page load) to correlate events within a session and calculate session duration.

2. **Add user-type markers:** Include an `isReturningUser` property (check local storage for previous visit flag) to segment analytics by user experience level.

3. **Add error tracking to analytics:** Call `trackEvent('error_shown', { code, context })` from `showError()` to capture client-side error frequency.

4. **Consider funnel definitions:** Define explicit funnels (e.g., "Questionnaire completion funnel": tab_switch → questionnaire_open → questionnaire_save) to measure drop-off rates.

5. **Data retention:** The current 5,000-event cap is adequate for single-user local usage. Consider archiving or rotating data monthly for long-term trend analysis.

### 7.3 Sprint 7 Analytics Story Recommendation

**Proposed story:** "Expand analytics instrumentation coverage to ≥80% of primary user actions"
- **Acceptance criteria:** 
  - All 8 P1/P2 events from Section 7.1 are instrumented
  - Session IDs included in all events
  - Error tracking integrated with `showError()`
  - Analytics coverage ≥80% of primary flows
- **Estimated effort:** 3 SP
- **Dependency:** None (frontend-only changes)

---

## 8. Data Limitations & Caveats

1. **Sample size is statistically insignificant.** 9 events cannot support any quantitative conclusions. All findings in this report are structural/qualitative assessments of the analytics infrastructure, not data-driven insights.

2. **No user segmentation possible.** Events lack user identifiers or session IDs. All events appear to come from a single development environment.

3. **`app_start` and `onboarding_*` events show zero data.** This may indicate: (a) the events are not firing correctly, (b) no new-user sessions occurred during the data period, or (c) the analytics layer was deployed after the initial sessions. Requires investigation.

4. **Data period is short.** Analytics layer was deployed in Sprint 4 but only ~32 minutes of meaningful data exists. The application may not have been used extensively in production during this period.

---

## 9. Handoff Checklist

- [x] Feature usage breakdown provided (Section 3 — limited by data availability)
- [x] Error frequency analysis provided (Section 4 — identified as uninstrumented gap)
- [x] Task completion rate per primary flow assessed (Section 5 — cannot measure, proxy from usability testing)
- [x] Session duration distribution assessed (Section 6 — cannot measure, identified as gap)
- [x] Insights report with recommendations for Sprint 7 (Section 7 — 8 events to add, architecture recommendations)
- [x] Analytics report written
- [x] All findings include source references
- [x] Deliverable written to file per MEMORY MANAGEMENT PROTOCOL
