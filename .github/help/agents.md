# Agents

## Overview

The system uses **38 specialized AI agents**, each with a fixed role and skill file. Agents work sequentially within their phase and hand off results via output contracts.

## Phase 1 — Requirements & Strategy
| # | Agent | Role |
|---|-------|------|
| 01 | Business Analyst | Market analysis, requirements definition |
| 02 | Domain Expert | Industry-specific knowledge and validation |
| 03 | Sales Strategist | Sales channels, pricing strategy |
| 04 | Financial Analyst | Revenue model, cost structure, projections |
| 34 | Product Manager | Product roadmap, feature prioritization |

## Phase 2 — Architecture & Design
| # | Agent | Role |
|---|-------|------|
| 05 | Software Architect | System design, patterns, technology selection |
| 06 | Senior Developer | Implementation feasibility, code standards |
| 07 | DevOps Engineer | CI/CD, infrastructure, deployment strategy |
| 08 | Security Architect | Threat modeling, security controls |
| 09 | Data Architect | Data model, storage, migration strategy |
| 33 | Legal Counsel | Compliance, licensing, privacy (GDPR, etc.) |

## Phase 3 — Experience Design
| # | Agent | Role |
|---|-------|------|
| 10 | UX Researcher | User research, personas, journey maps |
| 11 | UX Designer | Information architecture, interaction design |
| 12 | UI Designer | Visual design, component patterns |
| 13 | Accessibility Specialist | WCAG compliance, a11y testing plan |
| 32 | Content Strategist | Content model, voice & tone, UX writing |
| 35 | Localization Specialist | i18n plan, locale support matrix |

## Phase 4 — Brand & Growth
| # | Agent | Role |
|---|-------|------|
| 14 | Brand Strategist | Brand identity, positioning, messaging |
| 15 | Growth Marketer | Growth channels, acquisition strategy |
| 16 | CRO Specialist | Conversion optimization, funnel design |

## Cross-cutting Agents
| # | Agent | Role |
|---|-------|------|
| 00 | Orchestrator | Coordinates all phases and enforces rules |
| 18 | Critic Agent | Quality validation after each phase |
| 19 | Risk Agent | Risk assessment and mitigation |
| 17 | Synthesis Agent | Combines outputs into final reports |
| 36 | Questionnaire Agent | Generates customer-facing questions |
| 20 | Implementation Agent | Writes code per sprint stories |
| 21 | Test Agent | Unit/integration/e2e test generation |
| 22 | PR/Review Agent | Code review, secret scanning |
| 29 | KPI Agent | Metrics collection and reporting |
| 26 | Documentation Agent | User/technical manual updates |
| 27 | GitHub Integration Agent | Issue/board management |
| 28 | Retrospective Agent | Sprint lessons learned |
| 30 | Brand & Assets Agent | Design tokens, visual assets |
| 31 | Storybook Agent | Component library and a11y baseline |
| 24 | Feature Agent | Independent feature development cycle |
| 37 | Scope Change Agent | Handles major project pivots |
| 25 | Onboarding Agent | Project intake and workspace scanning |
| 23 | Reevaluate Agent | Re-analysis with new data |

## Anti-hallucination

All agents follow strict protocols:
- **UNCERTAIN:** prefix for any unverified claims
- **INSUFFICIENT_DATA:** for missing information (triggers questionnaires)
- All findings must cite a source (file, line number, document)
- No fabricated metrics or scores
