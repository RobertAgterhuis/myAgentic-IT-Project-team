---
layout: default
title: Brand Guidelines
---

# Brand Guidelines
> **Version:** 1.0 | **Created:** 2026-03-08 | **Source:** Phase 3 UX Audit + design-tokens.json
> **Application:** Questionnaire & Decisions Manager (Command Center Web Application)
> **Token Source:** `.github/docs/brand/design-tokens.json`

---

## 1. Brand Overview

**Product Name:** Questionnaire & Decisions Manager (Command Center)

**Mission:** Enable AI Project Leads to orchestrate multi-agent software creation and audit workflows through a clear, accessible, and trustworthy web interface.

**Brand Personality:**

| Attribute | Expression |
|-----------|-----------|
| **Professional** | Clean design, structured layouts, semantic color usage |
| **Trustworthy** | Consistent patterns, reliable status feedback, transparent error messages |
| **Efficient** | Keyboard shortcuts, minimal clicks, progressive disclosure |
| **Accessible** | WCAG AA target, forced-colors support, screen reader compatibility |
| **Technical** | Developer-oriented vocabulary, monospace code display, structured data presentation |

**Design Philosophy:** Zero-dependency, single-file architecture. Every visual decision must work within inline CSS/JS constraints. Simplicity over decoration.

---

## 2. Logo Usage

**Current State:** The application uses a text-based header with an emoji logo mark.

| Element | Value | Source |
|---------|-------|--------|
| Logo mark | `🤖` (Robot emoji) | `index.html` header |
| Product title | "Questionnaire & Decisions Manager" | `index.html` header `<h1>` |
| Short title | "Command Center" | Tab label, page title |

**Logo Rules:**

- The robot emoji + product title combination is the primary identifier
- Always display on the gradient header background (`header-bg` token)
- Header text uses `header-text` token (#ffffff light / #e2e8f0 dark)
- Minimum font size: `h2` token (20px)

**Prohibited Usage:**

- Do not replace the emoji with a bitmap image without updating the token system
- Do not display the logo on backgrounds that fail WCAG AA contrast against `header-text`
- Do not abbreviate the product name in the header

---

## 3. Color System

All colors are defined in `design-tokens.json` under the `color` category. Both light and dark themes are supported.

### Primary Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | #6366f1 | #818cf8 | Primary actions, active states, links |
| `primary-dark` | #4f46e5 | #6366f1 | Hover states on primary elements |
| `primary-light` | rgba(99,102,241,.1) | rgba(129,140,248,.12) | Primary backgrounds, highlights |
| `accent` | #8b5cf6 | #a78bfa | Secondary emphasis, tags |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `success` | #10b981 | #34d399 | Answered questions, positive status, completion |
| `warning` | #f59e0b | #fbbf24 | Required/pending items, caution states |
| `danger` | #ef4444 | #f87171 | Errors, expired decisions, destructive actions |

### Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `bg` | #f4f6fb | #0f1117 | Page background |
| `surface` | #ffffff | #1a1d2e | Cards, panels |
| `surface-raised` | #ffffff | #1e2235 | Elevated elements (dropdowns, modals) |
| `text` | #1e293b | #e2e8f0 | Primary text |
| `text-sec` | #5b6b7e | #94a3b8 | Secondary/meta text |
| `border` | #e2e8f0 | #2a2f45 | Default borders |

### Header Gradient

| Theme | Value |
|-------|-------|
| Light | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)` |
| Dark | `linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3b0764 100%)` |

### Contrast Requirements

- **Text on `bg`:** Must meet WCAG AA (≥4.5:1 normal text, ≥3:1 large text)
- **Text on `surface`:** Must meet WCAG AA
- **`header-text` on `header-bg`:** Must meet WCAG AA
- **Interactive elements:** Focus ring (`primary`) on `bg`/`surface` must meet ≥3:1 non-text contrast
- **Status colors on `surface`:** `success`, `warning`, `danger` must be paired with icons/text — never color alone (colorblind safety)

**Colorblind Safety Rule:** All status indicators must use color + icon + text. Decision badges use Unicode symbols alongside color: ✓ (decided), ○ (open), ◇ (deferred).

### Forbidden Combinations

- Never use `danger` as a background color for large areas
- Never use `warning` text on light `bg` without bold weight (insufficient contrast risk)
- Never hardcode hex values — always reference design tokens
- Never mix light theme tokens with dark theme tokens

---

## 4. Typography

All typography tokens are defined in `design-tokens.json` under the `typography` category.

### Font Families

| Token | Stack | Usage |
|-------|-------|-------|
| `sans` | 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif | All UI text |
| `mono` | 'SF Mono', 'Cascadia Code', 'Consolas', monospace | Code snippets, question IDs, command names |

### Type Scale (base 13px body, ~1.2 minor third ratio)

| Token | Size | Usage |
|-------|------|-------|
| `h1` | 26px | Logo/hero (header only) |
| `h2` | 20px | Main title, section headers |
| `h3` | 18px | Subsection headers, icon buttons |
| `h4` | 16px | Card titles, header subtitle |
| `lg` | 15px | Card questions, emphasis text |
| `md` | 14px | Card IDs, form inputs |
| `body` | 13px | Default body text |
| `sm` | 12px | Meta text, secondary labels |
| `label` | 11px | Status indicators, sidebar labels |
| `caption` | 10px | Badges, timestamps |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `normal` | 400 | Body text, descriptions |
| `medium` | 500 | Labels, button text |
| `semibold` | 600 | Card titles, emphasis |
| `bold` | 700 | Section headers, stats |
| `extrabold` | 800 | Reserved for hero/marketing (not currently used in app) |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.25 | Headings, compact labels |
| `normal` | 1.5 | Body text, form inputs |
| `relaxed` | 1.6 | Long-form content (help panel, descriptions) |

### Typography Rules

- Always use the `sans` family for UI; `mono` only for code, IDs, and command syntax
- Never go below `caption` (10px) for any visible text
- Headings use `semibold` (600) or `bold` (700); body uses `normal` (400)
- Maintain the type scale — do not introduce intermediate sizes

---

## 5. Imagery & Iconography

### Icon System

The application uses an inline SVG icon system defined in JavaScript (`iconFor()` function in `index.html`).

| Icon | SVG | Usage |
|------|-----|-------|
| Clipboard | 📋 path-based SVG | Phase 1 (Business) |
| Code | 💻 path-based SVG | Phase 2 (Tech) |
| Palette | 🎨 path-based SVG | Phase 3 (UX) |
| Megaphone | 📣 path-based SVG | Phase 4 (Marketing) |
| Rocket | 🚀 path-based SVG | Phase 5 (Implementation) |
| Chat | 💬 path-based SVG | Synthesis |

**Icon Rules:**

- All icons are rendered as inline SVG with `aria-hidden="true"` — adjacent text provides the accessible name
- Icon size follows the context: 16px in badges, 18px in sidebar, 24px in headers
- Icons use `currentColor` for fill — they inherit the text color from their container
- Status dots: 8px circles using `success`/`warning`/`danger` tokens

### Status Indicators

| Indicator | Visual | Meaning |
|-----------|--------|---------|
| Green dot (8px) | `success` token | Connected / Answered / Completed |
| Amber dot (8px) | `warning` token | Pending / Required / In Progress |
| Red dot (8px) | `danger` token | Disconnected / Error / Expired |

### Photography / Illustration Direction

Not applicable — this is a developer tool with no photographic or illustrative content. All visual communication is through icons, color-coded status, and data visualization (pipeline, progress bars).

---

## 6. Voice & Tone

Full voice & tone guidelines are maintained in the companion document: **`.github/docs/brand/content-style-guide.md`**.

### Summary

| Attribute | Description |
|-----------|-------------|
| **Clear** | Plain language, no unexplained jargon |
| **Confident** | Declarative statements, no hedging |
| **Action-oriented** | Tell users what to do, not just what happened |
| **Respectful** | Treat users as capable professionals |
| **Concise** | Shortest phrasing that preserves meaning |

### Error Message Pattern

```
[What happened]. [Why / reassurance]. [What to do next].
```

Example: "Unable to save. The server may be temporarily unavailable — try again in a moment."

### Terminology

Use canonical terms only (see `content-style-guide.md` Section 2):
- "Questionnaire" (not form/survey), "Decision" (not issue/ticket), "Agent" (not bot/assistant)
- "Sprint" (not iteration), "Phase" (not step), "Command" (not action/task)

### Tone by Context

| Context | Tone |
|---------|------|
| Success | Confident, matter-of-fact — no exclamation marks for routine actions |
| Error | Calm, helpful — never alarming or blaming |
| Guidance | Patient, instructional — assume good intent |
| Warning | Informative, non-alarming — state consequence clearly |

---

## INSUFFICIENT_DATA Log

| Item | Impact | Status |
|------|--------|--------|
| No formal logo asset (SVG/PNG) — emoji used as logo mark | Cannot define logo clear space or minimum size precisely | OPEN — acceptable for current scope |
| No photography/illustration guidelines needed | N/A for developer tool | RESOLVED — section 5 documents this explicitly |
