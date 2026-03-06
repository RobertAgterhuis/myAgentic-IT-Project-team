```markdown
# UX Guardrails – Phase 3 Agents
> Applies to: UX Researcher, UX Designer, UI Designer, Accessibility Specialist, Content Strategist, Localization Specialist

---

## DOMAIN: UX & PRODUCT EXPERIENCE

### G-UX-01 – Design System Mandatory
**Rule:** Every UI recommendation MUST be related to the existence (or absence) of a formal design system.  
**If absent:** Document as `CRITICAL_GAP: Design System missing` and add as priority 1 recommendation.  
**Source requirement:** Design system claim must be traceable to a Figma file, Storybook instance, or equivalent.

### G-UX-02 – Maximum 3 Interaction Steps per Primary Flow
**Rule:** Every primary user flow (onboarding, checkout, activation, core action) MUST be evaluated on the number of required interaction steps.  
**Norm:** More than 3 steps for a primary action is a `UX_FRICTION_FLAG`.  
**Source requirement:** Measurement based on heuristic evaluation or usability test – NEVER on assumption.

### G-UX-03 – User Journey Documented
**Rule:** UX Researcher ALWAYS documents the complete user journey with: touchpoints, pain points, emotion curve, and drop-off moments.  
**Prohibition:** No journey analysis based on "who we think the user is". Base on demonstrable data (analytics, session recordings, interviews).

### G-UX-04 – Cognitive Load Scoring
**Rule:** Cognitive load is scored per screen/flow on a scale of 1–10 with explicit criteria:  
- Information density  
- Decision points  
- Visual complexity  
**Prohibition:** No subjective statements about "too complex" without underlying scoring.

### G-UX-05 – Heuristic Evaluation Complete
**Rule:** The heuristic evaluation of Nielsen's 10 Usability Heuristics is MANDATORY and COMPLETE.  
**Format:** Per heuristic: status (OK / Problem / Critical) + evidence + recommendation.  
**Prohibition:** No "not applicable" without substantiation.

### G-UX-06 – WCAG Compliance Level Established
**Rule:** Accessibility Specialist MUST establish the target WCAG level (AA or AAA) BEFORE the analysis begins.  
**Analysis required:** Each of the four WCAG principles (Perceivable, Operable, Understandable, Robust) is assessed separately.  
**Prohibition:** No "largely compliant with WCAG" without specific SC references.

### G-UX-07 – Design Debt Quantification
**Rule:** Identified design debt is quantified in estimated remediation hours or story points – NOT as vague "technical debt".

### G-UX-08 – UX Recommendations Technically Feasible
**Rule:** Every UX recommendation MUST be tested against the Phase 2 technical output. Recommendations that are not technically feasible within the existing architecture are flagged as `DEPENDENT_ON_TECH: [requirement]`.

### G-UX-09 – Task Success Rate Baseline
**Rule:** For every primary task a baseline task success rate MUST be documented (or marked as `INSUFFICIENT_DATA:` if no test data is available).

---

## PHASE 3 HANDOFF REQUIREMENTS
Output must contain:
- `journey_gaps[]`
- `cognitive_load_scores{flow: string, score: 1-10, criteria: {}}`
- `accessibility_score: "WCAG-A" | "WCAG-AA" | "WCAG-AAA" | "Non-Compliant"`
- `heuristic_evaluation[10 items]`
- `design_debt_estimate{hours: number, items: []}`
- `friction_points[]`

```
