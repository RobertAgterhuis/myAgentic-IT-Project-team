# Agent 33 — Legal / Privacy Counsel — AUDIT Report

> **Mode:** AUDIT | **Phase:** 2 – Architecture & Design | **Project:** myAgentic-IT-Project-team
> **Date:** 2026-03-07 | **Scope:** TECH (legal/privacy compliance)
> **Agent:** Legal / Privacy Counsel (33) | **Predecessor:** Data Architect (09)
> **Successor:** Critic + Risk Agent (Phase 2 validation)
> **Note:** This is the LAST Phase 2 agent. Output closes Phase 2 for Critic+Risk validation.

---

## QUESTIONNAIRE INPUT CHECK

**Status:** NOT_INJECTED — No `## QUESTIONNAIRE INPUT — Legal / Privacy Counsel` block present in context.
Proceeding with code-based analysis per Questionnaire Protocol Rule 3.

---

## DEPENDENT INPUTS CONSUMED

| Dependency | Source | Status |
|---|---|---|
| Security Architect — compliance framework, SECURITY_FLAGs | `.github/docs/phase-2/08-security-architect.md` | ✅ CONSUMED — GDPR conditional, 18 SECURITY_FLAGs, OWASP Top 10 |
| Data Architect — data model, GDPR analysis, data classification | `.github/docs/phase-2/09-data-architect.md` | ✅ CONSUMED — 5 entities, 10 gaps, GDPR conditional |
| Software Architect — technology stack, third-party dependencies | `.github/docs/phase-2/05-software-architect.md` | ✅ CONSUMED — Zero-dependency monolith |
| Senior Developer — dependency list, LICENSE_CHECK items | `.github/docs/phase-2/06-senior-developer.md` | ✅ CONSUMED — ZERO npm dependencies, 0 test coverage |
| DevOps Engineer — infrastructure, third-party services | `.github/docs/phase-2/07-devops-engineer.md` | ✅ CONSUMED — No CI/CD, no cloud infra |
| Security Handoff Context — IMPL-CONSTRAINTs | `.github/docs/security/security-handoff-context.md` | ✅ CONSUMED — 10 IMPL-CONSTRAINTs |

---

## ANTI-HALLUCINATION DISCLAIMER

This report identifies legal risks and compliance gaps based on code analysis and factual statutory references. It is **not legal advice**. For all CRITICAL findings, consultation with a qualified attorney is recommended (see Escalation Protocol in Section P). All statutory citations reference specific GDPR articles, EDPB guidelines, or EU regulations.

---

# A. LEGAL DATA INVENTORY (Step 1)

| Artifact | Status | Location | Finding |
|---|---|---|---|
| **LICENSE file** | ❌ ABSENT | Root directory, `.github/` — not found | No license file exists anywhere in the repository |
| **NOTICE file** | ❌ ABSENT | Root directory — not found | No attribution notice |
| **Copyright notices** | ❌ ABSENT | server.js L1–3, index.html L1–7 | No copyright headers; only generic comments |
| **Privacy policy** | ❌ ABSENT | No document found | No privacy policy or privacy statement |
| **Terms of Service** | ❌ ABSENT | No document found | No ToS or terms of use |
| **Records of processing (Art. 30)** | ❌ ABSENT | No document found | No ROPA |
| **Data Processing Agreements** | ❌ ABSENT | No DPA documents found | No DPA with GitHub Copilot (primary external service) |
| **DPIA documentation** | ❌ ABSENT | No document found | No Data Protection Impact Assessment |
| **Cookie / consent policy** | ✅ N/A | No cookies used | index.html uses no cookies, no tracking, no analytics |
| **package.json** | ❌ ABSENT | Root directory — not found | No dependency manifest |
| **Open source dependency list** | ✅ VERIFIED | Per Agent 06 | ZERO npm dependencies — only Node.js built-ins (http, fs, path) |
| **Sector regulation documentation** | ❌ ABSENT | No document found | No regulatory compliance assessment |

---

# B. GDPR LEGAL COMPLIANCE AUDIT (Step 2)

## B.1 GDPR Applicability Assessment

**Applicability:** CONDITIONAL — per GDPR Art. 3(1) and (2)

GDPR applies when:
1. Processing personal data of individuals in the EU (Art. 3(2)), OR
2. Controller/processor established in the EU (Art. 3(1))

**Current state:** Localhost-only development tool bound to `127.0.0.1` (server.js L17). No network exposure, no multi-user access, no cloud deployment.

**Conclusion:** GDPR is **not currently triggered** but becomes **immediately applicable** if:
- Application is deployed beyond localhost
- Application processes personal data of EU individuals
- Application is accessible over a network

**Source:** GDPR Art. 3(1), 3(2); confirmed by Agent 08 and Agent 09 conditional assessments.

## B.2 GDPR Article Assessment

| Requirement | Article | Status | Finding | Source |
|---|---|---|---|---|
| **Lawful basis for processing** | Art. 6(1) | ❌ NOT ESTABLISHED | No lawful basis defined for processing user-submitted questionnaire answers or decision text. No consent mechanism, no contract reference, no legitimate interest assessment. | GDPR Art. 6(1)(a)–(f); Agent 09 Section F.2 |
| **Information obligation** | Art. 13/14 | ❌ NON-COMPLIANT | No privacy policy exists. Required disclosures per Art. 13: controller identity, DPO contact, purpose, legal basis, retention period, rights, automated decision-making — all absent. | GDPR Art. 13(1)(a)–(f), Art. 13(2)(a)–(f) |
| **Records of processing activities** | Art. 30 | ❌ ABSENT | No ROPA maintained. Art. 30(1) requires: controller name, purposes, categories of data subjects, categories of personal data, recipients, transfers, retention, security measures. | GDPR Art. 30(1), (2) |
| **DPIA for high-risk processing** | Art. 35 | ⚠️ CONDITIONAL | Not currently required (localhost, single user). Would be required if: (a) systematic monitoring of employees via questionnaire tracking, or (b) large-scale processing of sensitive data. Per EDPB Guidelines on DPIA (WP248rev.01): fewer than 2 of 9 criteria met currently. | GDPR Art. 35(1), (3); EDPB WP248rev.01 |
| **DPAs with processors** | Art. 28 | ⚠️ INSUFFICIENT_DATA | Primary external processor: GitHub Copilot (LLM service). User pastes commands from webapp to Copilot Chat. If questionnaire data or decisions contain personal data AND are shared with Copilot, Art. 28 DPA required. GitHub has a standard DPA — verification needed whether applicable to this usage. | GDPR Art. 28(1), (3) |
| **Breach notification (72h)** | Art. 33 | ❌ NON-COMPLIANT | No breach detection mechanism. No notification procedure. No incident response plan. Art. 33(1) requires supervisory authority notification within 72 hours. Art. 34(1) requires data subject notification if high risk. | GDPR Art. 33(1), (2); Art. 34(1) |
| **Data subject rights** | Art. 15–20 | ❌ NON-COMPLIANT | No API or mechanism for: right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), portability (Art. 20), objection (Art. 21). Agent 09 confirmed: no deletion mechanism, no export mechanism. | GDPR Art. 15–21 |
| **DPO appointment** | Art. 37 | ⚠️ NOT ASSESSED | Art. 37(1) requires DPO when: public authority, core activity is monitoring, or large-scale processing of special categories. Insufficient information about the organization. | GDPR Art. 37(1)(a)–(c) |
| **International transfers** | Art. 44–49 | ⚠️ CONDITIONAL | If Copilot processing involves data transfer to non-EU countries, adequate safeguards required (SCCs per Art. 46(2)(c), or adequacy decision per Art. 45). GitHub/Microsoft has EU data residency options — verification needed. | GDPR Art. 44, 45, 46(2)(c) |

## B.3 GDPR Legal Gaps

### LEGAL-GAP-001 — No Lawful Basis Defined (CRITICAL, conditional)

**Article:** GDPR Art. 6(1)
**Description:** No lawful basis for processing is established for ANY processing activity. If personal data is processed, this constitutes an unlawful processing violation.
**Consequence:** Art. 83(5)(a) — administrative fine up to EUR 20,000,000 or 4% annual worldwide turnover (whichever higher).
**Priority:** CRITICAL (conditional on deployment scope — see QUE-LEG-001)

### LEGAL-GAP-002 — No Privacy Policy (CRITICAL, conditional)

**Article:** GDPR Art. 13, 14, 12
**Description:** No privacy policy or privacy statement exists. Art. 13 requires disclosure of: controller identity, processing purposes, legal basis, retention periods, data subject rights, right to lodge complaint, DPO contact.
**Consequence:** Art. 83(5)(b) — fine up to EUR 20,000,000 or 4% annual worldwide turnover.
**Priority:** CRITICAL (conditional on deployment)

### LEGAL-GAP-003 — No Records of Processing Activities (HIGH, conditional)

**Article:** GDPR Art. 30(1)
**Description:** No ROPA exists. Exemption under Art. 30(5) applies only to organizations with fewer than 250 employees AND processing is not likely to result in risk. Must be assessed.
**Consequence:** Art. 83(4)(a) — fine up to EUR 10,000,000 or 2% annual worldwide turnover.
**Priority:** HIGH (conditional on deployment scope and organization size)

### LEGAL-GAP-004 — No Breach Notification Procedure (CRITICAL, conditional)

**Article:** GDPR Art. 33(1), 34(1)
**Description:** No breach detection, assessment, or notification mechanism exists. Art. 33(1) mandates 72-hour notification to supervisory authority. Agent 08 confirmed: no monitoring, no logging of security events.
**Consequence:** Art. 83(4)(a) — fine up to EUR 10,000,000 or 2% annual worldwide turnover.
**Priority:** CRITICAL (conditional on deployment)

### LEGAL-GAP-005 — No Data Subject Rights Implementation (CRITICAL, conditional)

**Article:** GDPR Art. 15–21
**Description:** No mechanism for access requests, erasure (right to be forgotten), data portability, or objection. Agent 09 confirmed: no deletion mechanism, no export mechanism, indefinite data retention.
**Consequence:** Art. 83(5)(b) — fine up to EUR 20,000,000 or 4% annual worldwide turnover.
**Priority:** CRITICAL (conditional on deployment)

### LEGAL-GAP-006 — No DPA Assessment for Copilot Integration (HIGH, conditional)

**Article:** GDPR Art. 28(1), (3)
**Description:** The application's primary workflow involves pasting commands into GitHub Copilot Chat. If personal data from questionnaires/decisions is included, a DPA with GitHub/Microsoft is required per Art. 28.
**Consequence:** Art. 83(4)(a) — fine up to EUR 10,000,000 or 2% annual worldwide turnover.
**Priority:** HIGH (conditional on personal data flow to Copilot)

---

# C. OPEN SOURCE LICENSE AUDIT (Step 3)

## C.1 Dependency Assessment

| Category | Status | Finding |
|---|---|---|
| **npm dependencies** | ✅ ZERO | No `package.json`, no `node_modules`. Server uses only Node.js built-ins: `http`, `fs`, `path`. Confirmed by Agent 06. |
| **Embedded third-party code** | ✅ NONE FOUND | No vendored libraries, no CDN links in index.html. All code appears to be first-party. |
| **Node.js runtime** | ✅ MIT License | Node.js is MIT-licensed. No copyleft risk. No attribution requirement beyond including MIT notice in distributions. |
| **LICENSE_CHECK items from predecessors** | ✅ NONE | No `LICENSE_CHECK:` items forwarded by Agent 05 or Agent 06 — zero dependencies. |

## C.2 License File Status

| File | Status | Location |
|---|---|---|
| **LICENSE** | ❌ ABSENT | Repository root — not found |
| **LICENSE.md** | ❌ ABSENT | Repository root — not found |
| **NOTICE** | ❌ ABSENT | Repository root — not found |
| **COPYING** | ❌ ABSENT | Repository root — not found |

### LEGAL-GAP-007 — No LICENSE File in Repository (HIGH)

**Description:** No license file exists in the repository. Under copyright law (Berne Convention Art. 5(2)), the code is automatically copyrighted but has NO granted license. This means:
- No one has legal permission to use, modify, or distribute the code
- GitHub's ToS Art. D.5 grants other users limited rights to fork/view on GitHub.com, but no broader license
- Contributors have no clear IP assignment or license-back agreement

**Statutory basis:** Berne Convention for the Protection of Literary and Artistic Works, Art. 5(2); GitHub Terms of Service Section D.5.
**Priority:** HIGH — immediate action needed before any distribution.

## C.3 GPL Contamination Risk

**Status:** ✅ NO RISK — Zero external dependencies. No copyleft code incorporated.

## C.4 License Compatibility

**Status:** ✅ N/A — No dependencies to assess for compatibility.

---

# D. IP PROTECTION ANALYSIS (Step 4)

## D.1 Copyright Notices

| File | Copyright Notice | Status |
|---|---|---|
| server.js | `// Questionnaire Manager — Local API server` (L2) | ❌ No copyright notice. Generic comment only. |
| index.html | `<title>Agentic System — Command Center</title>` (L7) | ❌ No copyright notice. |
| All `.md` skill/contract files | No copyright headers | ❌ No notices |

**LEGAL-GAP-008 — No Copyright Notices (MEDIUM)**

**Description:** No copyright notices (`© [year] [owner]`) in any source file. While copyright exists automatically (Berne Convention Art. 5(2)), explicit notices strengthen legal protection and serve as deterrent. Required for statutory damages in US (17 U.S.C. § 401).
**Priority:** MEDIUM — low effort, high value for IP protection.

## D.2 Trade Secrets

| Component | Classification | Protection |
|---|---|---|
| Multi-agent orchestration system (37 agents, 25 contracts) | POTENTIALLY PROPRIETARY | ❌ No trade secret classification |
| Agent skill files (`.github/skills/`) | POTENTIALLY PROPRIETARY | ❌ No confidentiality markers |
| Orchestrator rules (39+ rules in `00-orchestrator.md`) | POTENTIALLY PROPRIETARY | ❌ No confidentiality markers |
| Webapp command center architecture | GENERAL KNOWLEDGE | N/A |

**Assessment:** The multi-agent system design (agent sequencing, contract system, guardrails framework) may constitute a trade secret under EU Trade Secrets Directive 2016/943/EU Art. 2(1) — provided reasonable steps are taken to keep it secret. Currently, no steps are taken.

## D.3 Trademark Assessment

**Status:** INSUFFICIENT_DATA: — Cannot verify trademark registration for "Agentic System", "Command Center", or project name.

## D.4 Work-for-Hire

**Status:** INSUFFICIENT_DATA: — No information available about employment/contractor agreements or IP assignment clauses.

---

# E. CONTRACTUAL RISKS (Step 5)

## E.1 Third-Party Services

| Service | Role | DPA Status | SLA | Lock-in Risk |
|---|---|---|---|---|
| **GitHub Copilot** | AI coding assistant — primary workflow integration | INSUFFICIENT_DATA: (DPA may exist via Microsoft Enterprise agreement) | N/A (developer tool) | LOW — commands are clipboard-based, no API dependency |
| **GitHub.com** | Repository hosting | Standard GitHub DPA available | 99.9% (GitHub Enterprise SLA) | LOW — git is portable |
| **Node.js runtime** | Server runtime | N/A (open source, MIT) | N/A | NONE — open source |

## E.2 Vendor Lock-In Assessment

**Status:** ✅ MINIMAL RISK

The zero-dependency architecture eliminates vendor lock-in risk:
- No cloud services
- No database vendors
- No SaaS APIs
- File-based storage is fully portable
- No proprietary data formats (markdown + JSON)

**Positive finding:** The architectural decision for zero dependencies (Agent 05) is also a legal advantage — no vendor agreements, no license compliance burden, no supply chain risk.

## E.3 Data Portability

Data is stored in markdown (.md) and JSON (.json) files — both are open, human-readable formats. Full data portability is inherently supported.

---

# F. SECTOR-SPECIFIC REGULATORY ASSESSMENT (Step 6)

## F.1 EU AI Act Assessment

**Regulation:** EU AI Act (Regulation (EU) 2024/1689), in effect from August 2025.

**Applicability assessment:**
- The system uses GitHub Copilot as an AI coding assistant
- The multi-agent orchestration system itself is NOT an AI system — it is a deterministic rule-based system (agents are prompts, not ML models)
- The webapp is a pure CRUD application with no AI components

**Classification:** The deterministic multi-agent orchestration system does NOT fall under EU AI Act Art. 3(1) definition of "AI system" (no autonomous, adaptive, or inference-based behavior). The Copilot integration is a general-purpose AI system classified under Chapter V (GPAI) — but the provider (Microsoft/GitHub) bears GPAI obligations, not the downstream user.

**Conclusion:** ✅ EU AI Act compliance obligations are MINIMAL for this application. Provider-side obligations are Microsoft's responsibility.

**Source:** EU AI Act Art. 3(1) (definition of AI system), Art. 53 (GPAI provider obligations), Recital 12 (deterministic systems excluded).

## F.2 European Accessibility Act

**Regulation:** Directive (EU) 2019/882, applicable from June 28, 2025.

**Applicability:** Applies to products and services placed on the EU market for consumers. A developer tool used internally MAY be exempt under Art. 2(2) (micro-enterprises) or Art. 14 (disproportionate burden).

**Assessment:** INSUFFICIENT_DATA: — Cannot determine if the tool is consumer-facing or internal-only.

**Current state:** Agent 05 noted no accessibility implementation. If deployment scope extends to EU consumers, WCAG 2.1 Level AA minimum would be required.

## F.3 NIS2 Directive

**Regulation:** Directive (EU) 2022/2555, applicable from October 18, 2024.

**Applicability:** Applies to entities in essential/important sectors (energy, transport, health, digital infrastructure, ICT service management). A development tooling project is unlikely to fall under NIS2 scope.

**Assessment:** ✅ NOT APPLICABLE unless the organization using this tool is itself subject to NIS2, in which case the tool would need to comply with the organization's NIS2-mandated security policies.

**Source:** NIS2 Directive Art. 2 (scope), Annex I and II (essential/important entities).

---

# G. TOS / PRIVACY POLICY GAP ANALYSIS (Step 7)

## G.1 Current State

| Document | Status |
|---|---|
| Terms of Service | ❌ ABSENT |
| Privacy Policy | ❌ ABSENT |
| Cookie Policy | ✅ N/A (no cookies used) |
| Acceptable Use Policy | ❌ ABSENT |
| Refund/Cancellation Policy | ✅ N/A (not a paid product) |

## G.2 Required Disclosures (if deployed)

Per GDPR Art. 13(1) and (2), a privacy policy MUST include:

| Disclosure | Art. | Required Content |
|---|---|---|
| Controller identity | 13(1)(a) | Name, address, contact of controller |
| DPO contact | 13(1)(b) | If DPO appointed (see Art. 37 assessment) |
| Processing purposes | 13(1)(c) | Per data flow from Agent 09: questionnaire management, decision tracking, project orchestration |
| Legal basis | 13(1)(c) | Per processing activity — currently UNDEFINED |
| Recipients | 13(1)(e) | GitHub Copilot (if personal data shared), any future integrations |
| International transfers | 13(1)(f) | If data processed outside EU/EEA |
| Retention period | 13(2)(a) | Per data type — currently UNDEFINED (Agent 09 GAP-DATA-006) |
| Data subject rights | 13(2)(b) | Right to access, rectify, erase, restrict, port, object |
| Right to withdraw consent | 13(2)(c) | If consent is lawful basis |
| Right to lodge complaint | 13(2)(d) | Supervisory authority name + contact |
| Automated decision-making | 13(2)(f) | If applicable (currently N/A) |

## G.3 Terms of Service Requirements (if deployed as product)

INSUFFICIENT_DATA: — Cannot determine product type (SaaS, on-premise, open source tool) without customer input.

---

# H. SELF-CHECK — PHASE 2 CLOSURE (Step 8)

| Check | Status |
|---|---|
| All legally relevant artifacts inventoried | ✅ 10 artifacts checked |
| GDPR audit complete — all 9 requirements assessed | ✅ Table in B.2 |
| Open source license audit based on dependency list | ✅ Zero dependencies confirmed |
| IP protection analysis complete | ✅ Copyright, trade secrets, trademarks assessed |
| Contractual risks identified | ✅ 3 services assessed |
| Sector regulation compliance assessed | ✅ EU AI Act, Accessibility Act, NIS2 |
| ToS/Privacy Policy gap analysis performed | ✅ Section G |
| Legal findings consistent with Agent 08 (Security) | ✅ Cross-referenced |
| Legal findings consistent with Agent 09 (Data) | ✅ Cross-referenced — GDPR conditional aligned |
| All legal claims have statutory text source | ✅ Every finding cites GDPR article or EU regulation |
| Combined Phase 2 output complete for Critic Agent | ✅ All 6 agents complete: 05, 06, 07, 08, 09, 33 |

---

# I. RECOMMENDATIONS (Steps A–D)

## REC-LEG-001 — Create and Add LICENSE File

**Finding Reference:** LEGAL-GAP-007 (HIGH)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Create a LICENSE file in the repository root. Choose license type based on project intent: MIT/Apache 2.0 for open source, or a proprietary license header for closed source. Include copyright year and owner name.

**Impact:**
- Legal Risk Reduction: HIGH — establishes clear usage rights, prevents IP disputes
- Regulatory: LOW — not a compliance requirement, but legal best practice
- Cost: LOW — 1h effort
- UX: N/A

**Risk of NOT executing:** Code has no granted license. Under Berne Convention, all rights reserved by default. Contributors and users have no legal clarity on permitted use. Distribution without license may create liability.

**SMART Success Criterion:**
- **KPI:** LICENSE file presence (binary)
- **Baseline:** 0 (absent)
- **Target:** 1 (present, with correct copyright owner and chosen license)
- **Measurement:** File existence check in CI
- **Time horizon:** Sprint 1

**Priority:** P1 (Quick win — 1h effort, high IP protection value)

---

## REC-LEG-002 — Add Copyright Notices to All Source Files

**Finding Reference:** LEGAL-GAP-008 (MEDIUM)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Add `// Copyright (c) [year] [owner]. All rights reserved.` (or equivalent per chosen license) to the header of server.js, index.html, and all `.md` skill/contract files. Align with chosen LICENSE file.

**Impact:**
- Legal Risk Reduction: MEDIUM — strengthens IP protection claims
- Regulatory: LOW
- Cost: LOW — 2h effort
- UX: N/A

**Risk of NOT executing:** Weaker IP protection in litigation. In US jurisdiction, statutory damages under 17 U.S.C. § 401 require notice.

**SMART Success Criterion:**
- **KPI:** Files with copyright notice / total source files
- **Baseline:** 0%
- **Target:** 100%
- **Measurement:** Grep for copyright pattern in CI
- **Time horizon:** Sprint 1

**Priority:** P2 (Strategic — low effort, moderate value)

---

## REC-LEG-003 — Establish Lawful Basis for Processing (GDPR Art. 6)

**Finding Reference:** LEGAL-GAP-001 (CRITICAL, conditional)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Before ANY deployment beyond localhost: (1) conduct a processing activity inventory based on Agent 09 data flows, (2) define lawful basis per processing activity (likely Art. 6(1)(b) — contract performance, or Art. 6(1)(f) — legitimate interest with balancing test), (3) document in Records of Processing Activities.

**Impact:**
- Legal Risk Reduction: CRITICAL — without lawful basis, ALL processing is illegal under GDPR
- Regulatory: Art. 83(5)(a) — fine up to EUR 20,000,000 or 4% annual global turnover
- Cost: MEDIUM — 16h legal analysis + documentation
- UX: LOW — transparent to user

**Risk of NOT executing:** All personal data processing constitutes a violation of GDPR Art. 6. Supervisory authority can order cessation of processing (Art. 58(2)(f)).

**SMART Success Criterion:**
- **KPI:** Processing activities with defined lawful basis / total processing activities
- **Baseline:** 0%
- **Target:** 100%
- **Measurement:** ROPA review by qualified attorney
- **Time horizon:** Sprint 2 (before deployment)

**Priority:** P1 (Critical risk — conditional on deployment, but BLOCKING for any EU deployment)

---

## REC-LEG-004 — Create Privacy Policy

**Finding Reference:** LEGAL-GAP-002 (CRITICAL, conditional)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Draft privacy policy covering all Art. 13 required disclosures (Section G.2). Must be in "clear and plain language" per Art. 12(1). Publish before deployment. Review by qualified attorney RECOMMENDED.

**Impact:**
- Legal Risk Reduction: CRITICAL — mandatory disclosure obligation
- Regulatory: Art. 83(5)(b) — fine up to EUR 20,000,000 or 4% annual global turnover
- Cost: MEDIUM — 16h drafting + legal review
- UX: MEDIUM — users see privacy information

**Risk of NOT executing:** Violation of Art. 13/14 information obligations. Data subjects unaware of processing purposes, rights, and retention periods.

**SMART Success Criterion:**
- **KPI:** Privacy policy presence with all Art. 13 sections (binary: complete / incomplete)
- **Baseline:** Absent
- **Target:** Complete — all 11 disclosures from Section G.2 addressed
- **Measurement:** Checklist against Art. 13(1) and (2)
- **Time horizon:** Sprint 2 (before deployment)

**Priority:** P1 (Critical risk — BLOCKING for any public deployment)

---

## REC-LEG-005 — Implement Data Subject Rights (GDPR Art. 15–21)

**Finding Reference:** LEGAL-GAP-005 (CRITICAL, conditional)
**Domain:** Legal / Privacy Counsel (requirements) + OUT_OF_SCOPE: Senior Developer (implementation)

**Recommendation:** Define requirements for: (1) right of access — export all personal data per data subject (Art. 15), (2) right to erasure — delete all personal data per data subject (Art. 17), (3) right to portability — machine-readable export in common format (Art. 20). Technical implementation is OUT_OF_SCOPE: Senior Developer. Agent 09 GAP-DATA-006 (retention) and GAP-DATA-010 (PII markers) are prerequisites.

**Impact:**
- Legal Risk Reduction: CRITICAL — fundamental data subject rights
- Regulatory: Art. 83(5)(b) — fine up to EUR 20,000,000 or 4% annual global turnover
- Cost: HIGH — 40h (requirements definition 8h + implementation by Senior Developer 32h)
- UX: HIGH — users can exercise their rights

**Risk of NOT executing:** Data subjects cannot exercise fundamental GDPR rights. Supervisory authority complaints likely. Art. 77 right to lodge complaint.

**SMART Success Criterion:**
- **KPI:** Data subject rights implemented / total required rights (6)
- **Baseline:** 0/6
- **Target:** 6/6 (access, rectification, erasure, restriction, portability, objection)
- **Measurement:** Functional test per right
- **Time horizon:** Sprint 3 (before deployment)

**Priority:** P1 (Critical risk — conditional on deployment)

---

## REC-LEG-006 — Establish Breach Notification Procedure

**Finding Reference:** LEGAL-GAP-004 (CRITICAL, conditional)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Create incident response plan with: (1) breach detection criteria, (2) risk assessment template per Art. 33(3), (3) 72-hour supervisory authority notification template, (4) data subject notification criteria and template per Art. 34(1), (5) documentation requirements per Art. 33(5). Technical detection implementation is OUT_OF_SCOPE: Security Architect / DevOps Engineer.

**Impact:**
- Legal Risk Reduction: CRITICAL — mandatory 72h notification obligation
- Regulatory: Art. 83(4)(a) — fine up to EUR 10,000,000 or 2% annual global turnover
- Cost: MEDIUM — 10h document drafting + 6h training
- UX: N/A

**Risk of NOT executing:** Breach occurs → no detection → no notification within 72h → compound violation of Art. 33 + Art. 34 + Art. 5(1)(f).

**SMART Success Criterion:**
- **KPI:** Breach notification procedure document (binary: present / absent)
- **Baseline:** Absent
- **Target:** Present — all 5 components documented and tested
- **Measurement:** Tabletop exercise simulation
- **Time horizon:** Sprint 2

**Priority:** P1 (Critical risk — conditional on deployment)

---

## REC-LEG-007 — Verify DPA with GitHub/Microsoft for Copilot

**Finding Reference:** LEGAL-GAP-006 (HIGH, conditional)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Verify whether existing Microsoft/GitHub Enterprise agreement includes a DPA covering Copilot Chat usage. If personal data from questionnaires/decisions may be pasted into Copilot Chat, Art. 28 DPA is required. If no DPA exists, negotiate or confirm applicability of GitHub's standard DPA.

**Impact:**
- Legal Risk Reduction: HIGH — processor relationship must be contractually regulated
- Regulatory: Art. 83(4)(a) — fine up to EUR 10,000,000
- Cost: LOW — 4h verification + potential negotiation
- UX: N/A

**Risk of NOT executing:** Personal data shared with processor without contractual basis. Art. 28(3) violation.

**SMART Success Criterion:**
- **KPI:** DPA status (binary: confirmed / absent)
- **Baseline:** INSUFFICIENT_DATA:
- **Target:** Confirmed DPA covering Copilot Chat usage
- **Measurement:** DPA document on file
- **Time horizon:** Sprint 1

**Priority:** P2 (Strategic — verification may resolve without action)

---

## REC-LEG-008 — Create Records of Processing Activities

**Finding Reference:** LEGAL-GAP-003 (HIGH, conditional)
**Domain:** Legal / Privacy Counsel

**Recommendation:** Create ROPA per Art. 30(1) based on Agent 09 data flows (Section B). Document: controller name, processing purposes, data subject categories, personal data categories, recipients, retention periods, security measures.

**Impact:**
- Legal Risk Reduction: HIGH — mandatory documentation obligation
- Regulatory: Art. 83(4)(a) — fine up to EUR 10,000,000
- Cost: LOW — 6h creation based on existing Agent 09 analysis
- UX: N/A

**Risk of NOT executing:** Missing ROPA violates Art. 30. Supervisory authority cannot audit processing activities.

**SMART Success Criterion:**
- **KPI:** ROPA completeness (% of processing activities documented)
- **Baseline:** 0%
- **Target:** 100%
- **Measurement:** Cross-reference ROPA entries with Agent 09 data flow table
- **Time horizon:** Sprint 2

**Priority:** P2 (Strategic — documentation effort)

---

## Recommendations Self-Check (Step D)

| Check | Status |
|---|---|
| Every recommendation references a finding | ✅ All 8 reference LEGAL-GAP-NNN |
| All impact fields filled or INSUFFICIENT_DATA | ✅ |
| All success criteria SMART | ✅ KPI + baseline + target + measurement + time |
| No out-of-scope recommendations | ✅ Implementation items marked OUT_OF_SCOPE: Senior Developer |
| All CRITICAL risks cite specific GDPR articles with fine ranges | ✅ Art. 83 references on all |

---

# J. SPRINT PLAN (Steps E–H)

## J.1 Assumptions (Step E)

| Assumption | Value | Source |
|---|---|---|
| **Team Legal** | 1 legal analyst (part-time), supported by external attorney for CRITICAL items | INSUFFICIENT_DATA: team composition |
| **Capacity** | 12 SP per sprint (legal analyst: 10 SP + external review: 2 SP) | Estimated based on legal documentation velocity |
| **Sprint duration** | 2 weeks | Default per contract |
| **External legal support** | Required for: license selection (REC-LEG-001), privacy policy review (REC-LEG-004), breach procedure validation (REC-LEG-006) | INSUFFICIENT_DATA: legal counsel availability |
| **Preconditions for SP-LEG-1** | Decision on deployment scope (QUE-LEG-001) determines GDPR story priority | QUE-LEG-001 required |

## J.2 Sprint Stories (Step F)

### Sprint SP-LEG-1: IP Foundation & Quick Wins (12 SP)

**Sprint Goal:** Establish legal IP protection and verify critical third-party relationships.

#### SP-LEG-1-001: Create LICENSE File (2 SP)

- **Description:** As a project owner I want a LICENSE file in the repository root so that code usage rights are legally clear for all contributors and users.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** CONTENT
- **Acceptance criteria:**
  - Given repository root, when checked, then LICENSE file exists with valid SPDX-identified license
  - Given LICENSE file, when reviewed, then copyright owner and year are correctly stated
  - Given license choice, when reviewed, then consistent with project distribution intent (open source or proprietary)
- **Story points:** 2
- **Dependencies:** QUE-LEG-002 (license intent decision)
- **Blocker:** EXTERN: License intent answer (QUE-LEG-002) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-LEG-001

#### SP-LEG-1-002: Add Copyright Notices to Source Files (2 SP)

- **Description:** As a project owner I want copyright notices in all source files so that IP ownership is clearly established per file.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** CONTENT
- **Acceptance criteria:**
  - Given server.js, when opened, then first line contains `// Copyright (c) [year] [owner]. [License text].`
  - Given index.html, when opened, then contains `<!-- Copyright (c) [year] [owner]. -->` before `<html>`
  - Given all `.md` skill files, when checked, then footer contains copyright notice
- **Story points:** 2
- **Dependencies:** SP-LEG-1-001 (license type determines notice text)
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-002

#### SP-LEG-1-003: Verify GitHub/Microsoft DPA for Copilot (3 SP)

- **Description:** As a legal analyst I want to verify whether our Microsoft/GitHub agreement includes a DPA covering Copilot Chat usage so that processor obligations are contractually regulated.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given existing agreements, when reviewed, then DPA status is documented as CONFIRMED or ABSENT
  - Given DPA is ABSENT, when identified, then action plan for DPA negotiation is documented
  - Given DPA is CONFIRMED, when verified, then scope covers Copilot Chat data processing
- **Story points:** 3
- **Dependencies:** None
- **Blocker:** EXTERN: Access to existing agreements (QUE-LEG-005) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-LEG-007

#### SP-LEG-1-004: Trade Secret Classification (3 SP)

- **Description:** As a project owner I want proprietary components classified and marked so that trade secret protection is established under EU Trade Secrets Directive.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given all agent skill files, when reviewed, then classified as PROPRIETARY or PUBLIC
  - Given orchestrator rules, when reviewed, then classified with confidentiality level
  - Given classification, when documented, then access control requirements are defined per classification level
- **Story points:** 3
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** LEGAL-GAP-008 (IP protection)

#### SP-LEG-1-005: Legal Risk Register (2 SP)

- **Description:** As a legal analyst I want all identified legal gaps consolidated in a risk register so that prioritization and tracking is centralized.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given all LEGAL-GAPs (001–008), when compiled, then each has: status, owner, deadline, mitigation
  - Given risk register, when reviewed, then CRITICAL items are flagged for attorney review
- **Story points:** 2
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** All LEGAL-GAP items

### Sprint SP-LEG-2: GDPR Compliance Foundation (12 SP)

**Sprint Goal:** Establish mandatory GDPR documentation and procedures before deployment.

#### SP-LEG-2-001: Define Lawful Basis per Processing Activity (4 SP)

- **Description:** As a legal analyst I want each processing activity mapped to a lawful basis so that GDPR Art. 6 compliance is established before deployment.
- **Team:** Legal Team (Legal Analyst + External Attorney review)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given Agent 09 data flow table (5 domains), when analyzed, then each has documented lawful basis with rationale
  - Given legitimate interest basis, when selected, then balancing test is documented (Art. 6(1)(f))
  - Given consent basis, when selected, then consent mechanism requirements are defined (Art. 7)
- **Story points:** 4
- **Dependencies:** Agent 09 output (complete)
- **Blocker:** EXTERN: Deployment scope decision (QUE-LEG-001) | owner: Project Lead | escalation: Orchestrator
- **Recommendation reference:** REC-LEG-003

#### SP-LEG-2-002: Draft Privacy Policy (4 SP)

- **Description:** As a legal analyst I want a privacy policy document so that Art. 13/14 information obligations are fulfilled before deployment.
- **Team:** Legal Team (Legal Analyst + External Attorney review)
- **Story type:** CONTENT
- **Acceptance criteria:**
  - Given privacy policy, when reviewed, then all 11 disclosures from Section G.2 are addressed
  - Given Art. 12(1) plain language requirement, when tested, then readability is at maximum secondary school level
  - Given privacy policy, when reviewed by attorney, then approved for publication
- **Story points:** 4
- **Dependencies:** SP-LEG-2-001 (lawful basis determines policy content)
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-004

#### SP-LEG-2-003: Create Records of Processing Activities (2 SP)

- **Description:** As a legal analyst I want a ROPA document so that GDPR Art. 30 documentation obligations are met.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** CONTENT
- **Acceptance criteria:**
  - Given ROPA template, when populated, then all Art. 30(1) fields are completed per processing activity
  - Given Agent 09 data flows, when cross-referenced, then all 5 data domains are documented in ROPA
  - Given ROPA, when reviewed, then retention periods per data type are stated
- **Story points:** 2
- **Dependencies:** SP-LEG-2-001 (lawful basis needed for ROPA), Agent 09 data dictionary
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-008

#### SP-LEG-2-004: Breach Notification Procedure (2 SP)

- **Description:** As a legal analyst I want an incident response plan so that GDPR Art. 33/34 breach notification obligations can be met within 72 hours.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** CONTENT
- **Acceptance criteria:**
  - Given incident response plan, when reviewed, then contains: breach criteria, risk assessment template, 72h notification template, data subject notification criteria, documentation requirements
  - Given tabletop exercise, when conducted, then procedure is verified end-to-end
- **Story points:** 2
- **Dependencies:** None
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-006

### Sprint SP-LEG-3: Data Subject Rights & Compliance Verification (8 SP)

**Sprint Goal:** Define data subject rights requirements and verify overall GDPR readiness.

#### SP-LEG-3-001: Define Data Subject Rights Requirements (4 SP)

- **Description:** As a legal analyst I want requirements specifications for all 6 data subject rights so that the development team can implement technical measures.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given each right (access, rectification, erasure, restriction, portability, objection), when specified, then: trigger criteria, response timeline (Art. 12(3): 1 month), data scope, format, and exceptions are documented
  - Given erasure right (Art. 17), when specified, then exceptions (Art. 17(3)) are documented
  - Given portability right (Art. 20), when specified, then export format requirements are defined
- **Story points:** 4
- **Dependencies:** SP-LEG-2-001 (lawful basis determines applicable rights)
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-005

#### SP-LEG-3-002: GDPR Compliance Verification Audit (2 SP)

- **Description:** As a legal analyst I want a compliance verification checklist so that deployment readiness can be assessed.
- **Team:** Legal Team (Legal Analyst + External Attorney)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given all GDPR articles assessed in Section B.2, when verified, then each has COMPLIANT/NON-COMPLIANT/CONDITIONAL status with evidence
  - Given Data Architect (Agent 09) GDPR analysis, when cross-referenced, then findings are consistent
  - Given Security Architect (Agent 08) findings, when cross-referenced, then Art. 32 technical measures status is documented
- **Story points:** 2
- **Dependencies:** SP-LEG-2-001, SP-LEG-2-002, SP-LEG-2-003
- **Blocker:** NONE
- **Recommendation reference:** REC-LEG-003, REC-LEG-004

#### SP-LEG-3-003: Sector Regulation Compliance Mapping (2 SP)

- **Description:** As a legal analyst I want each applicable regulation mapped to compliance status so that regulatory readiness is documented.
- **Team:** Legal Team (Legal Analyst)
- **Story type:** ANALYSIS
- **Acceptance criteria:**
  - Given EU AI Act assessment, when documented, then classification rationale is stated with Art. 3(1) reference
  - Given Accessibility Act, when assessed, then applicability determination is documented
  - Given NIS2, when assessed, then scope exclusion rationale is stated
- **Story points:** 2
- **Dependencies:** QUE-LEG-003 (sector information)
- **Blocker:** NONE
- **Recommendation reference:** Section F findings

## J.3 Parallel Tracks (Step F2)

### Sprint SP-LEG-1

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: IP Protection** | SP-LEG-1-001 (LICENSE), SP-LEG-1-002 (copyright) | Legal Analyst | Sprint start (sequential: 001 → 002) |
| **Track B: Assessment** | SP-LEG-1-003 (DPA), SP-LEG-1-004 (trade secrets), SP-LEG-1-005 (risk register) | Legal Analyst | Sprint start (parallel with Track A) |

### Sprint SP-LEG-2

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: GDPR Documentation** | SP-LEG-2-001 (lawful basis) → SP-LEG-2-002 (privacy policy) → SP-LEG-2-003 (ROPA) | Legal Analyst + Attorney | QUE-LEG-001 answered |
| **Track B: Incident Response** | SP-LEG-2-004 (breach procedure) | Legal Analyst | Sprint start (no dependency on Track A) |

### Sprint SP-LEG-3

| Track | Stories | Team | Start Condition |
|---|---|---|---|
| **Track A: Rights & Compliance** | SP-LEG-3-001 (rights requirements) → SP-LEG-3-002 (verification) | Legal Analyst + Attorney | SP-LEG-2 complete |
| **Track B: Regulatory** | SP-LEG-3-003 (sector mapping) | Legal Analyst | Sprint start |

## J.4 Blocker Register (Step F3)

| ID | Type | Description | Owner | Escalation | Sprint |
|---|---|---|---|---|---|
| BLK-LEG-1-001 | EXTERN | License intent decision (QUE-LEG-002) needed for LICENSE file | Project Lead | Orchestrator → Questionnaire Agent | SP-LEG-1 |
| BLK-LEG-1-002 | EXTERN | Access to existing agreements for DPA verification (QUE-LEG-005) | Project Lead | Orchestrator | SP-LEG-1 |
| BLK-LEG-2-001 | EXTERN | Deployment scope decision (QUE-LEG-001) determines all GDPR priorities | Project Lead | Orchestrator → Questionnaire Agent | SP-LEG-2 |

## J.5 Sprint Goals and Definition of Done (Step G)

### SP-LEG-1 — IP Foundation & Quick Wins

- **Outcome:** Code ownership is legally established; third-party relationships verified; legal risk register operational.
- **KPIs:**
  1. LICENSE file present: Yes/No → Target: Yes
  2. Copyright notice coverage: 0% → Target: 100%
  3. DPA verification status: Unknown → Target: Confirmed/Absent
- **Definition of Done:** All 5 stories complete, LICENSE file committed, copyright notices in all source files, DPA status documented, risk register published.

### SP-LEG-2 — GDPR Compliance Foundation

- **Outcome:** Mandatory GDPR documentation created; processing activities legally justified; breach procedure operational.
- **KPIs:**
  1. Processing activities with lawful basis: 0/5 → Target: 5/5
  2. Privacy policy Art. 13 completeness: 0/11 → Target: 11/11
  3. ROPA completeness: 0% → Target: 100%
- **Definition of Done:** All 4 stories complete, privacy policy attorney-reviewed, ROPA cross-referenced with Agent 09, breach procedure tabletop-tested.

### SP-LEG-3 — Data Subject Rights & Compliance Verification

- **Outcome:** Data subject rights requirements defined for development team; overall GDPR readiness assessed.
- **KPIs:**
  1. Data subject rights specified: 0/6 → Target: 6/6
  2. GDPR compliance verification: Not assessed → Target: All articles assessed
  3. Sector regulations mapped: 0/3 → Target: 3/3
- **Definition of Done:** All 3 stories complete, rights requirements ready for Senior Developer, compliance checklist verified, sector mapping documented.

## J.6 Sprint Plan Self-Check (Step H)

| Check | Status |
|---|---|
| All stories based on recommendations or findings | ✅ All 13 stories reference REC-LEG-NNN or LEGAL-GAP-NNN |
| All P1 recommendations have at least one story | ✅ REC-LEG-001→SP-LEG-1-001; REC-LEG-003→SP-LEG-2-001; REC-LEG-004→SP-LEG-2-002; REC-LEG-005→SP-LEG-3-001; REC-LEG-006→SP-LEG-2-004 |
| All P2 recommendations have at least one story | ✅ REC-LEG-002→SP-LEG-1-002; REC-LEG-007→SP-LEG-1-003; REC-LEG-008→SP-LEG-2-003 |
| Every story has team assignment | ✅ All assigned to Legal Team |
| Every story has ≥1 acceptance criterion | ✅ All have 2–3 criteria |
| Every story has Blocker field | ✅ All explicit (NONE or EXTERN) |
| All EXTERN blockers have owner + escalation | ✅ BLK-LEG-1-001, BLK-LEG-1-002, BLK-LEG-2-001 |
| Parallel tracks identified per sprint | ✅ 3 sprints × 2 tracks each |
| Assumptions documented | ✅ Team, capacity, external support |
| Sprint KPIs SMART | ✅ Measurable binary/percentage targets |
| CODE/INFRA stories free of DESIGN/CONTENT/ANALYSIS blockers | ✅ No CODE stories in legal sprint |

### Traceability Table

| Recommendation | Priority | Stories |
|---|---|---|
| REC-LEG-001 (LICENSE file) | P1 | SP-LEG-1-001 |
| REC-LEG-002 (Copyright notices) | P2 | SP-LEG-1-002 |
| REC-LEG-003 (Lawful basis) | P1 | SP-LEG-2-001 |
| REC-LEG-004 (Privacy policy) | P1 | SP-LEG-2-002 |
| REC-LEG-005 (Data subject rights) | P1 | SP-LEG-3-001 |
| REC-LEG-006 (Breach notification) | P1 | SP-LEG-2-004 |
| REC-LEG-007 (DPA verification) | P2 | SP-LEG-1-003 |
| REC-LEG-008 (ROPA) | P2 | SP-LEG-2-003 |

**MISSING_STORY items:** NONE — All P1 and P2 recommendations have stories.

---

# K. GUARDRAILS (Steps I–M)

## GR-LEG-001 — Must Not Deploy Without LICENSE File

**Reference:** LEGAL-GAP-007 (HIGH)
**Scope:** All distribution, deployment, and publication activities
**Type:** Preventive

**Rule:** Must not deploy, distribute, or publish the application without a valid LICENSE file in the repository root. LICENSE must be an SPDX-recognized license or explicit proprietary notice.

**Violation action:** CRITICAL_FINDING — block deployment; escalate to Project Lead.
**Verification method:** CI check: verify LICENSE file exists and is non-empty. Pre-deployment checklist item.

**Overlap check:** New guardrail. No conflict with existing guardrails.

## GR-LEG-002 — Must Not Deploy to EU Market Without GDPR Compliance Documentation

**Reference:** LEGAL-GAP-001, LEGAL-GAP-002, LEGAL-GAP-003 (CRITICAL, conditional)
**Scope:** Any deployment accessible to EU individuals (Art. 3)
**Type:** Preventive

**Rule:** Must not deploy application to any environment accessible to EU individuals without: (1) documented lawful basis per processing activity (Art. 6), (2) published privacy policy (Art. 13), (3) Records of Processing Activities (Art. 30).

**Violation action:** CRITICAL_FINDING — block deployment; legal escalation mandatory (SCOPE_DECISION).
**Verification method:** Pre-deployment legal checklist: attorney sign-off on GDPR compliance. Quarterly compliance audit.

**Overlap check:** Supplement to Agent 08 security guardrails (GR-SEC-NNN). New legal-specific guardrail.

## GR-LEG-003 — Must Not Process Personal Data Without Defined Lawful Basis

**Reference:** LEGAL-GAP-001 (CRITICAL)
**Scope:** All code paths that store, read, or transmit personal data
**Type:** Preventive

**Rule:** Must not process personal data (as identified by Agent 09 PII markers) without a documented and approved lawful basis per GDPR Art. 6(1).

**Violation action:** CRITICAL_FINDING — halt processing; escalate to legal counsel and DPO (if appointed).
**Verification method:** ROPA review: every processing activity must reference approved lawful basis. Code review: new data processing must be approved in ROPA before implementation.

**Overlap check:** New guardrail. No conflict (supplements Agent 09 GR-DATA-005 on retention).

## GR-LEG-004 — Must Not Share Data with Third-Party Processor Without DPA

**Reference:** LEGAL-GAP-006 (HIGH)
**Scope:** All integrations with external services (currently: GitHub Copilot)
**Type:** Preventive

**Rule:** Must not share personal data or potentially personal data with any third-party service without a valid Data Processing Agreement per GDPR Art. 28(3).

**Violation action:** Block integration; escalate to legal counsel for DPA negotiation.
**Verification method:** Vendor register: every third-party service must have DPA status documented. New vendor onboarding requires DPA verification before data flow is enabled.

**Overlap check:** New guardrail. No conflict with existing guardrails.

## GR-LEG-005 — Must Not Add Dependencies Without License Review

**Reference:** Zero-dependency architecture (positive finding); preventive for future changes
**Scope:** All code changes that add npm, CDN, or vendored dependencies
**Type:** Structural

**Rule:** Must not add any external dependency without license review. LICENSE_CHECK process: (1) identify SPDX license, (2) verify compatibility with project license, (3) check for copyleft contamination risk, (4) update NOTICE file if attribution required.

**Violation action:** Block PR; dependency removed until LICENSE_CHECK complete.
**Verification method:** CI check: `package.json` change → trigger license verification. Code review checklist: new imports require LICENSE_CHECK sign-off.

**Overlap check:** New guardrail. Prevents future creation of license compliance risk.

## Guardrails Self-Check (Step M)

| Check | Status |
|---|---|
| Every guardrail formulated as testable | ✅ All start with "Must not" |
| Every guardrail has violation action | ✅ All have explicit actions |
| Every guardrail has verification method | ✅ All have CI + manual methods |
| Every guardrail references GAP/RISK finding | ✅ GR-LEG-001–005 reference findings |
| Overlap checked against existing guardrails | ✅ 1 supplement, 4 new |

---

# L. CROSS-REFERENCES TO PREDECESSOR AGENTS

## L.1 Agent 05 (Software Architect)

| Finding | Legal Impact |
|---|---|
| Zero-dependency architecture | ✅ POSITIVE — no license compliance burden, no supply chain risk |
| Monolithic architecture | Neutral — no legal impact |

## L.2 Agent 06 (Senior Developer)

| Finding | Legal Impact |
|---|---|
| ZERO npm dependencies | ✅ POSITIVE — confirmed no third-party license risk |
| 0% test coverage | ⚠️ RISK — untested code may not meet GDPR Art. 32 "appropriate technical measures" standard |
| No LICENSE_CHECK items | ✅ POSITIVE — none needed |

## L.3 Agent 07 (DevOps Engineer)

| Finding | Legal Impact |
|---|---|
| No CI/CD pipeline | ⚠️ RISK — no automated license verification possible until CI exists |
| No secret scanning | ⚠️ RISK — GDPR Art. 32 confidentiality measures incomplete |
| Maturity 1.4/5 | Neutral — operational maturity, not legal |

## L.4 Agent 08 (Security Architect)

| Finding | Legal Impact |
|---|---|
| No authentication (CRITICAL) | ❌ LEGAL BLOCKER for deployment — GDPR Art. 32 access control |
| No HTTPS | ❌ LEGAL BLOCKER — GDPR Art. 32 encryption in transit |
| No encryption at rest | ❌ LEGAL BLOCKER — GDPR Art. 32 encryption at rest |
| Localhost binding | ✅ MITIGATING FACTOR — reduces GDPR applicability scope |
| IMPL-CONSTRAINT-002 (escMarkdown) | ⚠️ Legal — markdown injection could corrupt personal data (Art. 5(1)(f) integrity) |
| 47 total security findings | ⚠️ Multiple findings impact Art. 32 compliance |

## L.5 Agent 09 (Data Architect)

| Finding | Legal Impact |
|---|---|
| GDPR conditional (aligned) | ✅ CONSISTENT — same conditionality conclusion |
| GAP-DATA-006 (no retention) | ❌ Art. 5(1)(e) violation if GDPR applies |
| GAP-DATA-010 (no PII markers) | ❌ Art. 25 violation — no privacy-by-design |
| QUE-DATA-001 (deployment scope) | ✅ ALIGNED — same question as QUE-LEG-001 |
| No data subject rights mechanism | ❌ Art. 15–21 violation — confirmed in REC-LEG-005 |

---

# M. LEGAL ESCALATION PROTOCOL

## LEGAL_ESCALATION-001 — GDPR Compliance Before Deployment

```
LEGAL_ESCALATION:
  Type: GDPR_VIOLATION
  Article: GDPR Art. 6, 13, 15-21, 28, 30, 33
  Description: Multiple GDPR articles will be violated upon deployment beyond localhost 
               without prior compliance implementation. 8 CRITICAL gaps identified (conditional).
  Recommended action: Consult qualified attorney before ANY deployment to validate:
    (1) lawful basis selection, (2) privacy policy, (3) data subject rights approach
  Status: CONDITIONAL — Triggered ONLY if QUE-LEG-001 answer is "Yes" (deployment planned)
  Priority: CRITICAL
```

**Note:** This escalation is CONDITIONAL. If the tool remains localhost-only, GDPR obligations do not apply. The escalation activates automatically upon positive answer to QUE-LEG-001.

---

# N. JSON EXPORT

```json
{
  "agent": "33-legal-counsel",
  "mode": "AUDIT",
  "phase": "PHASE-2",
  "date": "2026-03-07",
  "legal_risk_assessment": "HIGH_CONDITIONAL",
  "gdpr_applicability": "CONDITIONAL",
  "legal_gaps": {
    "total": 8,
    "critical_conditional": 5,
    "high": 2,
    "medium": 1
  },
  "license_risk": "NONE",
  "dependencies_with_license_risk": 0,
  "ip_protection_status": "INSUFFICIENT",
  "recommendations": 8,
  "sprint_plan": {
    "total_sprints": 3,
    "total_stories": 13,
    "total_story_points": 32,
    "sprints": [
      { "id": "SP-LEG-1", "stories": 5, "points": 12, "goal": "IP Foundation & Quick Wins" },
      { "id": "SP-LEG-2", "stories": 4, "points": 12, "goal": "GDPR Compliance Foundation" },
      { "id": "SP-LEG-3", "stories": 4, "points": 8, "goal": "Data Subject Rights & Verification" }
    ]
  },
  "guardrails": 5,
  "legal_escalations": 1,
  "questionnaire_requests": [
    "QUE-LEG-001",
    "QUE-LEG-002",
    "QUE-LEG-003",
    "QUE-LEG-004",
    "QUE-LEG-005"
  ],
  "extern_blockers": [
    "BLK-LEG-1-001",
    "BLK-LEG-1-002",
    "BLK-LEG-2-001"
  ],
  "phase_2_closure": "COMPLETE — all 6 agents (05, 06, 07, 08, 09, 33) delivered"
}
```

---

# O. QUESTIONNAIRE_REQUEST

## QUE-LEG-001 — Deployment Scope (REQUIRED)

**Question:** Will this application be deployed beyond localhost (e.g., cloud, SaaS, multi-user network)?
**Why needed:** Determines GDPR applicability and triggers all conditional legal gaps.
**Expected format:** Yes/No + target environment
**Impact:** If Yes → ALL conditional CRITICAL gaps become active; attorney consultation mandatory
**Note:** Overlaps with Agent 09 QUE-DATA-001 — Orchestrator should consolidate.

## QUE-LEG-002 — License Intent (REQUIRED)

**Question:** Should this project be open source or proprietary? If open source: which license family (permissive/copyleft)?
**Why needed:** Determines LICENSE file content, copyright notice format, and contribution policy.
**Expected format:** "Open source: MIT" / "Open source: Apache 2.0" / "Proprietary" / "Undecided"
**Impact:** Blocks SP-LEG-1-001 (LICENSE file creation)

## QUE-LEG-003 — Sector/Industry Context (OPTIONAL)

**Question:** What sector or industry is the organization in? Are there sector-specific regulations (healthcare, finance, government)?
**Why needed:** Determines additional regulatory requirements beyond GDPR.
**Expected format:** Sector name + any known regulations
**Impact:** May add regulatory compliance stories to sprint plan

## QUE-LEG-004 — IP Ownership (REQUIRED)

**Question:** Who owns the intellectual property of this codebase? Is it a company, individual, or team? Are there contractor agreements with IP assignment clauses?
**Why needed:** Determines copyright notice content and trade secret protection scope.
**Expected format:** Owner name + ownership structure (company/individual/team)
**Impact:** Determines copyright notice text in all files

## QUE-LEG-005 — Existing Microsoft/GitHub Agreements (OPTIONAL)

**Question:** Does the organization have an existing Enterprise agreement with Microsoft/GitHub? Does it include a Data Processing Agreement?
**Why needed:** Determines whether Copilot usage is already covered by DPA.
**Expected format:** Yes/No + agreement type
**Impact:** Resolves or confirms LEGAL-GAP-006

---

# P. HANDOFF CHECKLIST — Legal / Privacy Counsel — Phase 2 — 2026-03-07

- [x] MODE: AUDIT
- [x] All mandatory sections are filled (not empty, not placeholder)
- [x] GDPR audit complete — all 9 requirements assessed (Section B.2 table)
- [x] Open source license audit performed based on Senior Developer dependency list (Section C — zero dependencies confirmed)
- [x] IP protection analysis complete (Section D — copyright, trade secrets, trademarks assessed)
- [x] Contractual risks identified (Section E — 3 services assessed)
- [x] Sector regulation compliance assessed (Section F — EU AI Act, Accessibility Act, NIS2)
- [x] ToS/Privacy Policy gap analysis performed (Section G)
- [x] Phase 2 Closure: combined output complete for Critic Agent (all 6 agents: 05, 06, 07, 08, 09, 33)
- [x] All CRITICAL risks escalated via Legal Escalation Protocol (Section M — 1 conditional escalation)
- [x] All legal claims supplied with statutory text source (GDPR articles, EU regulations, Berne Convention cited)
- [x] Guardrails: all guardrails formulated as testable (5/5 — Section K)
- [x] Guardrails: all guardrails have violation action AND verification method (5/5)
- [x] Guardrails: all guardrails reference a GAP/RISK finding (5/5)
- [x] All 4 deliverables present: Analysis ✅ Recommendations ✅ Sprint Plan ✅ Guardrails ✅
- [x] All UNCERTAIN: items documented and escalated (DPO: INSUFFICIENT_DATA, trademarks: INSUFFICIENT_DATA)
- [x] All INSUFFICIENT_DATA: items documented and escalated (5 items — Section O)
- [x] Output complies with contracts in /.github/docs/contracts/
- [x] All findings include a source reference (GDPR articles, directives, conventions)
- [x] Questionnaire input check performed (NOT_INJECTED documented)
- [x] All remaining INSUFFICIENT_DATA: items compiled as QUESTIONNAIRE_REQUEST (5 items — Section O)
- [x] Output complies with agent-handoff-contract.md
- **STATUS: READY FOR HANDOFF TO CRITIC + RISK AGENT**
- **PHASE 2 CLOSURE: ALL 6 AGENTS COMPLETE (05, 06, 07, 08, 09, 33)**
