# Mode Guide: CREATE vs AUDIT

> This guide explains how to use the system in its two operating modes.  
> **CREATE** mode is the primary mode — it creates new software solutions from scratch.  
> **AUDIT** mode is the secondary mode — it analyzes and audits existing software.

---

## Quick Reference

| Aspect | CREATE Mode | AUDIT Mode |
|--------|-------------|------------|
| **Command** | `CREATE [project]` | `AUDIT [project]` |
| **Input** | Project brief, business goals, target market | Existing codebase, documentation, running system |
| **Output** | Complete solution design + implementation plan | Audit report with findings + improvement plan |
| **Primary question** | "What should we build?" | "How good is what we have?" |
| **Phase 1 focus** | Define business model, requirements, strategy | Analyze business alignment, gaps, risks |
| **Phase 2 focus** | Design architecture, tech stack, data model | Audit architecture, code quality, security |
| **Phase 3 focus** | Design UX/UI, accessibility, content strategy | Evaluate usability, accessibility, content |
| **Phase 4 focus** | Create brand identity, growth strategy | Assess brand consistency, marketing effectiveness |
| **Synthesis output** | Solution Blueprint + Roadmap | Capability Heatmap + Improvement Roadmap |
| **Phase 5** | Implement the designed solution | Implement the recommended improvements |

---

## CREATE Mode

### When to Use

Use CREATE mode when you are starting a new software project and need:
- Business model and requirements definition
- Technical architecture and stack selection
- UX/UI design and accessibility planning
- Brand identity and go-to-market strategy
- A complete, sprint-ready implementation plan

### How to Start

**Full creation (all 4 phases):**
```
CREATE [project name]
```

**Partial creation (single discipline):**
```
CREATE BUSINESS [project]    → Phase 1 only
CREATE TECH [project]        → Phase 2 only
CREATE UX [project]          → Phase 3 only
CREATE MARKETING [project]   → Phase 4 only
```

**Combination creation (2-3 disciplines):**
```
CREATE TECH UX [project]              → Phase 2 + Phase 3
CREATE BUSINESS MARKETING [project]   → Phase 1 + Phase 4
CREATE TECH UX MARKETING [project]    → Phase 2 + Phase 3 + Phase 4
```

**Synthesis (after all phases are complete):**
```
CREATE SYNTHESIS
```

### What You Need to Provide

The Onboarding Agent will ask you for:
1. **Project name** — identifier for the solution
2. **Project brief** — what you want to build and why
3. **Target market** — who the users/customers are
4. **Business goals** — revenue model, growth targets, key metrics
5. **Constraints** — budget, timeline, technology preferences, regulatory requirements
6. **Competitive landscape** — known competitors or alternatives

### What You Get Back

After a full `CREATE` cycle, the system produces:

| Document | Location | Content |
|----------|----------|---------|
| Master Report | `.github/docs/synthesis/final-report-master.md` | Executive summary, Solution Blueprint, Risk Matrix, Roadmap, KPIs |
| Business Report | `.github/docs/synthesis/final-report-business.md` | Business model, requirements, strategy, financial projections |
| Tech Report | `.github/docs/synthesis/final-report-tech.md` | Architecture, tech stack, data model, security, DevOps |
| UX Report | `.github/docs/synthesis/final-report-ux.md` | Personas, journeys, wireframes, design system, a11y, content, i18n |
| Marketing Report | `.github/docs/synthesis/final-report-marketing.md` | Brand identity, growth strategy, conversion design |
| Blocker Matrix | `.github/docs/synthesis/cross-team-blocker-matrix.md` | Cross-team dependencies (BLOCKING or ADVISORY) |
| Design Tokens | `.github/docs/brand/design-tokens.json` | Brand colors, typography, spacing |
| Component Inventory | `.github/docs/storybook/component-inventory.md` | UI component library specification |
| Sprint Plan | Generated per synthesis | Implementable sprint stories with estimates |
| Questionnaires | `BusinessDocs/[Phase]/Questionnaires/` | Questions for missing information |
| Official Documents | `BusinessDocs/OfficialDocuments/` | 8 living documents (vision, tech overview, legal, etc.) |

### CREATE Mode Agent Behavior

Each agent operates in **design mode**:
- **Business Analyst** defines the business model rather than analyzing an existing one
- **Software Architect** designs architecture from first principles rather than auditing existing code
- **UX Designer** creates wireframes and information architecture rather than evaluating existing interfaces
- **Brand Strategist** builds brand identity rather than assessing brand consistency

---

## AUDIT Mode

### When to Use

Use AUDIT mode when you have an existing software system and need:
- Assessment of business alignment and market fit
- Architecture and code quality evaluation
- Security and compliance audit
- UX/UI usability and accessibility evaluation
- Brand and marketing effectiveness analysis
- Prioritized improvement roadmap

### How to Start

**Full audit (all 4 phases):**
```
AUDIT [project name]
```

**Partial audit (single discipline):**
```
AUDIT BUSINESS [project]    → Phase 1 only
AUDIT TECH [project]        → Phase 2 only
AUDIT UX [project]          → Phase 3 only
AUDIT MARKETING [project]   → Phase 4 only
```

**Combination audit (2-3 disciplines):**
```
AUDIT TECH UX [project]
AUDIT BUSINESS MARKETING [project]
```

**Synthesis (after all phases are complete):**
```
AUDIT SYNTHESIS
```

### What You Need to Provide

The Onboarding Agent will ask you for:
1. **Project name** — identifier for the system being audited
2. **Codebase access** — repository URL or local path
3. **Documentation** — existing docs, architecture diagrams, API specs
4. **Business context** — what the system does, who uses it, revenue model
5. **Known pain points** — areas of concern or specific questions
6. **Compliance requirements** — regulatory or industry standards

### What You Get Back

The same document structure as CREATE mode, but with audit-focused content:
- **Capability Heatmap** instead of Solution Blueprint
- **Findings and gaps** instead of design specifications
- **Improvement recommendations** with priority and effort estimates
- **Risk assessment** based on actual system state

### AUDIT Mode Agent Behavior

Each agent operates in **evaluation mode**:
- **Business Analyst** analyzes existing business alignment rather than defining a new model
- **Software Architect** evaluates existing architecture rather than designing from scratch
- **UX Designer** assesses current usability rather than creating new wireframes
- **Brand Strategist** evaluates brand consistency rather than building new identity

---

## On-Demand Commands (Both Modes)

These commands work regardless of the active mode:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `REEVALUATE [scope]` | Re-run analysis on a specific scope | When conditions change and a section needs fresh analysis |
| `FEATURE [name]: [description]` | Add a new feature through the full pipeline | When a new feature is requested outside the current cycle |
| `SCOPE CHANGE [DIMENSION]: [description]` | Handle a fundamental change in project direction | When the business model, architecture, audience, or strategy pivots |
| `HOTFIX [description]` | Emergency fix bypassing Sprint Gate | Critical production issues only |
| `REFRESH ONBOARDING` | Re-scan tooling and environment | When the development environment changes |

### SCOPE CHANGE Dimensions

| Dimension | What Changed | Example |
|-----------|-------------|---------|
| `BUSINESS` | Business model, revenue model, ICP | "Pivoting from B2C to B2B" |
| `TECH` | Core architecture, platform, language | "Switching from monolith to microservices" |
| `UX` | Target audience, primary use case | "Redesigning for mobile-first" |
| `MARKETING` | Brand positioning, market segment | "Repositioning from enterprise to SMB" |
| `ALL` | Fundamental pivot affecting everything | "Complete product pivot" |

---

## Mode Differences by Phase

### Phase 1 — Requirements & Strategy

| Agent | CREATE | AUDIT |
|-------|--------|-------|
| Business Analyst | Define business model canvas, value proposition, revenue streams | Analyze existing business model alignment, identify gaps |
| Domain Expert | Map problem domain, identify bounded contexts | Evaluate domain model accuracy, find misalignments |
| Sales Strategist | Design go-to-market strategy, pricing model | Assess current sales effectiveness, conversion rates |
| Financial Analyst | Build financial projections, unit economics | Analyze financial health, cost structure, margins |
| Product Manager | Create product roadmap, feature prioritization | Evaluate product-market fit, backlog health |

### Phase 2 — Architecture & Design

| Agent | CREATE | AUDIT |
|-------|--------|-------|
| Software Architect | Design system architecture with ADRs | Evaluate architecture quality, identify tech debt |
| Senior Developer | Define coding standards, implementation patterns | Review code quality, assess maintainability |
| DevOps Engineer | Design CI/CD pipeline, infrastructure | Audit deployment process, infrastructure health |
| Security Architect | Define security posture, threat model | Perform security audit, vulnerability assessment |
| Data Architect | Design data model, storage strategy | Evaluate data architecture, identify data quality issues |
| Legal Counsel | Map compliance requirements | Audit compliance status, identify legal risks |

### Phase 3 — Experience Design

| Agent | CREATE | AUDIT |
|-------|--------|-------|
| UX Researcher | Create personas, journey maps from research | Conduct usability evaluation, heuristic analysis |
| UX Designer | Design IA, wireframes, interaction patterns | Assess information architecture, flow efficiency |
| UI Designer | Create visual design system, component specs | Evaluate visual consistency, design system adherence |
| Accessibility Specialist | Define WCAG baseline, a11y requirements | Audit accessibility compliance, identify barriers |
| Content Strategist | Design content model, voice guidelines | Evaluate content quality, consistency, gaps |
| Localization Specialist | Plan i18n architecture, locale support | Assess i18n readiness, identify localization issues |

### Phase 4 — Brand & Growth

| Agent | CREATE | AUDIT |
|-------|--------|-------|
| Brand Strategist | Design brand identity, positioning, visual language | Assess brand consistency, positioning effectiveness |
| Growth Marketer | Design acquisition funnels, channel strategy | Evaluate growth metrics, channel performance |
| CRO Specialist | Design conversion framework, experiment plan | Analyze conversion funnels, identify drop-off points |

---

## Frequently Asked Questions

### Can I switch modes mid-project?
No. A cycle runs in one mode from start to finish. If you need to audit an existing system and then design improvements as a new solution, run `AUDIT` first, then start a `CREATE` cycle using the audit findings as input to your project brief.

### Do I need to provide a codebase for CREATE mode?
No. CREATE mode starts from a project brief and goals. You do not need existing code, documentation, or a running system.

### Can I run partial commands in different modes?
Yes. `CREATE TECH MyApp` and `AUDIT UX MyApp` are independent cycles. However, `CREATE SYNTHESIS` only combines CREATE-mode phase outputs, and `AUDIT SYNTHESIS` only combines AUDIT-mode phase outputs.

### Which mode should I choose?
- **New project, no existing code** → `CREATE`
- **Existing system needing evaluation** → `AUDIT`
- **Existing system needing a major rewrite** → `AUDIT` first to understand the current state, then `CREATE` to design the replacement

### Are the quality standards different between modes?
No. The same guardrails, contracts, and validation gates apply to both modes. The Critic and Risk agents use the same scoring rubric regardless of whether they are evaluating a designed solution or an audited system.
