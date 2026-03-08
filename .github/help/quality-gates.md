# Quality Gates — Critic + Risk Validation

Every phase in this system must pass **two independent quality gates** before the next phase can begin. This page explains what these gates check, how they work, and what happens when they fail.

---

## How It Works

After every phase completes (all agents in that phase have handed off), the Orchestrator automatically triggers a two-step validation:

```
Phase agents complete
  ↓
Critic Agent — checks quality of deliverables
  ↓
Risk Agent — checks strategic and implementation risks
  ↓
Both PASSED? → next phase starts
Either FAILED? → failing agent must revise and resubmit
```

This gate runs **4 times** during a full creation cycle (once per Phase 1–4) and **once per sprint** during Phase 5 implementation.

> **Rule ORC-01:** The next phase NEVER starts before the current phase is fully completed AND validated by both the Critic Agent and the Risk Agent.

---

## What the Critic Agent Checks

The Critic Agent is the **quality guardian**. It does not produce analyses or make recommendations — it only validates. It checks five things:

### 1. Contract Compliance
Every agent produces deliverables that must match an output contract. The Critic checks:

| Contract | Key Checks |
|----------|-----------|
| **Analysis** | Minimum 5 findings with sources, gaps with priorities, risks scored, KPI baseline present, valid JSON export |
| **Recommendations** | Every recommendation references an analysis finding, no empty impact fields, SMART measurement criteria, priority matrix |
| **Sprint Plan** | Capacity assumptions documented, all stories have acceptance criteria, Definition of Done present, all P1/P2 recommendations covered by stories |
| **Guardrails** | All guardrails formulated testably, violation action present for each |

### 2. Anti-Hallucination Compliance
- Numbers, percentages, or KPIs without a source → `HALLUCINATION_FLAG`
- Claims not traceable to input artifacts → `UNVERIFIED_CLAIM`
- `UNCERTAIN:` claims later repeated as fact → `INCONSISTENCY_FLAG`
- Recommendations outside the agent's domain → `SCOPE_VIOLATION`

### 3. Internal Consistency
- Contradictions within one agent's output
- Contradictions between agents in the same phase

### 4. Completeness
- All mandatory sections present and non-empty (no placeholders)
- All `INSUFFICIENT_DATA:` items have matching `QUESTIONNAIRE_REQUEST`
- Code coverage ≥ 60% for Senior Developer entry points and business logic

### 5. Decision Register Compliance
The Critic loads `.github/docs/decisions.md` and verifies no recommendation contradicts a `DECIDED` item. Conflicts are flagged as `CRITIC_DECISION_CONFLICT`.

### Critic Verdicts

Each agent receives one of two verdicts:

| Verdict | Meaning |
|---------|---------|
| **APPROVED** | All checks passed — agent output is valid |
| **NEEDS_REVISION** | One or more checks failed — specific remediation instructions are sent back |

The phase verdict is:
- **Phase APPROVED** — all agents in the phase received APPROVED
- **Phase NEEDS_REVISION** — one or more agents received NEEDS_REVISION

---

## What the Risk Agent Checks

The Risk Agent performs an **independent risk assessment** on the same phase output. It runs in parallel with (or immediately after) the Critic. Its focus is broader:

### 1. Strategic Alignment
Are the phase outputs consistent with the business goals from Phase 1? For example:
- Do technical recommendations (Phase 2) respect business constraints?
- Do UX recommendations (Phase 3) respect technical constraints?
- Misalignment → `STRATEGIC_MISALIGNMENT`

### 2. Implementation Feasibility
- Are capacity assumptions in sprint plans realistic?
- Are dependencies correctly mapped?
- Are items technically feasible within the suggested sprint?
- Unrealistic items → `PLANNING_RISK`

### 3. Compliance Risks
- Do any recommendations introduce legal or regulatory risks?
- Are there regulatory deadlines that affect the roadmap?

### 4. Recommendation Risks
- Risks of executing a recommendation
- Risks of NOT executing a recommendation
- Second-order effects

### 5. System (Cross-Domain) Risks
- Conflicting recommendations between disciplines
- Dependencies that could block the entire roadmap
- Single points of failure

### 6. Decision Register Compliance
Like the Critic, the Risk Agent loads `.github/docs/decisions.md`. Any recommendation that contradicts a `DECIDED` item automatically receives risk score `HIGH`.

### Risk Verdicts

Each agent receives a risk profile scored as:

| Risk Level | Meaning |
|------------|---------|
| **LOW** | No significant risks identified |
| **MEDIUM** | Manageable risks that should be monitored |
| **HIGH** | Serious risks requiring mitigation before proceeding |
| **CRITICAL** | Showstopper — phase cannot proceed without resolution |

The phase risk verdict is:
- **Phase APPROVED** — no HIGH or CRITICAL risks unresolved
- **Phase NEEDS_REVIEW** — one or more HIGH risks remain
- **Phase BLOCKED** — one or more CRITICAL risks remain

---

## What Happens When Validation Fails

### Normal Remediation Flow

1. The Orchestrator receives the failing verdicts
2. Specific remediation instructions are sent to the failing agent(s)
3. The agent revises its output and resubmits
4. Critic + Risk validation runs again on the revised output

### Maximum 3 Cycles

If the same phase fails Critic/Risk validation **three times**, the Orchestrator escalates to you with three options:

| Option | What It Does |
|--------|-------------|
| **ACCEPT_WITH_RISK** | Proceed despite the gaps — documented as known risks |
| **MANUAL_OVERRIDE** | You edit the deliverable yourself |
| **RETRY_SIMPLIFIED** | Re-run the failing agent with reduced scope |

Your choice is documented in the Orchestrator Log.

### Critic Meta-Validation

If the Critic returns PASSED with **zero findings** despite the phase having open `UNCERTAIN:` or `INSUFFICIENT_DATA:` items, the Orchestrator flags this as `CRITIC_REVIEW_SUSPICIOUS` and requires the Critic to justify why each open item was not referenced.

---

## Quality Gates in Phase 5 (Sprints)

During implementation, a lighter version of Critic + Risk runs **per sprint**. The focus shifts to:
- Story acceptance criteria met
- Test coverage requirements satisfied
- No regression in existing tests
- Secret scan passed on PRs
- Implementation traceable to approved recommendations

---

## Quality Gates During Special Commands

| Command | Quality Gate Behavior |
|---------|----------------------|
| **FEATURE** | Full Critic + Risk cycle on the feature's mini-phases |
| **SCOPE CHANGE** | Critic + Risk on the re-analysis output (with scope change context) |
| **HOTFIX** | Sprint Gate BYPASS — abbreviated validation (secret scan still mandatory) |
| **REEVALUATE** | Critic + Risk on the re-evaluation output |

During a **Scope Change**, the Critic checks an additional requirement: every re-analysis agent must include a `## Scope Change Impact` section as the first section, stating which previous findings are confirmed, superseded, or net-new.

---

## Flags You May See

| Flag | Source | Meaning |
|------|--------|---------|
| `HALLUCINATION_FLAG` | Critic | Data cited without a verifiable source |
| `UNVERIFIED_CLAIM` | Critic | Claim not traceable to any input |
| `INCONSISTENCY_FLAG` | Critic | `UNCERTAIN:` item later stated as fact |
| `SCOPE_VIOLATION` | Critic | Recommendation outside the agent's domain |
| `INCOMPLETE` | Critic | Mandatory section missing or placeholder |
| `CRITIC_DECISION_CONFLICT` | Critic | Recommendation contradicts a DECIDED item |
| `CRITIC_REVIEW_SUSPICIOUS` | Orchestrator | Critic PASSED suspiciously — no findings despite open issues |
| `STRATEGIC_MISALIGNMENT` | Risk | Output conflicts with business strategy |
| `PLANNING_RISK` | Risk | Sprint plan has unrealistic assumptions |
| `DECISION_CONFLICT_RISK` | Risk | Recommendation contradicts a DECIDED item (scored HIGH) |

---

## Where to Find the Results

After Critic + Risk validation, the results are stored in the phase output directory and referenced in `session-state.json`. The Orchestrator Log (in the conversation) will also show whether the phase was approved, needs revision, or is blocked.

---

## See Also

- [Getting Started](getting-started.md) — overview of the full pipeline
- [Pipeline](pipeline.md) — what happens in each phase
- [Sprints](sprints.md) — how Sprint Gates work in Phase 5
- [Decisions](decisions.md) — how decisions influence quality gate checks
- [Troubleshooting](troubleshooting.md) — what to do when something fails
