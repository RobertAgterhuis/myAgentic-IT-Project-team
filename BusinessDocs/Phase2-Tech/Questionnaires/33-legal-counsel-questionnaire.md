# Questionnaire: Legal Counsel
> Phase: Phase 2 — Technology & Architecture | Generated: 2026-03-07T15:00:00Z | Version: v1
> **Instructions:** Please fill in your answers directly below each question.
> For yes/no questions, delete the option that does not apply.
> Questions marked [REQUIRED] must be answered for the analysis to proceed.
> Questions marked [OPTIONAL] improve analysis quality but are not blocking.
> When done, save this file — the system will pick up your answers automatically.
> **Tip:** You can also use the Questionnaire & Decisions Manager web UI for a guided experience: run `node .github/webapp/server.js` and open http://127.0.0.1:3000

---

## Section 1: Product Classification

### Q-33-001 [REQUIRED]
**Question:** Is this product consumer-facing or internal-only?
**Why we need this:** Consumer-facing products have different regulatory obligations (consumer protection laws, accessibility mandates like EAA/ADA) compared to internal tools. This determines the scope of legal compliance work.
**Expected format:** Choose one
**Options:** Consumer-facing / Internal-only / Both (internal now, consumer-facing planned)
**Example:** "Internal-only — used by our development team for project management."

**Your answer:**
> Internal only

---

### Q-33-002 [REQUIRED]
**Question:** What is the intended product type?
**Why we need this:** Different product types have different legal requirements for Terms of Service, Privacy Policies, and distribution agreements. A SaaS product needs different legal artifacts than an open-source tool.
**Expected format:** Choose one or describe
**Options:** SaaS / On-premise tool / Open-source project / Internal enterprise tool / Other (describe)
**Example:** "Internal enterprise tool distributed within our organization."

**Your answer:**
> Internal tool 

---

## Section 2: Intellectual Property

### Q-33-003 [REQUIRED]
**Question:** What license should the project use?
**Why we need this:** The audit found no LICENSE file, which means the default "all rights reserved" applies. A LICENSE file is needed for code distribution, contributor clarity, and compliance. The choice affects what others can do with the code.
**Expected format:** Choose one or describe
**Options:** MIT / Apache 2.0 / GPL v3 / Proprietary (all rights reserved) / Not sure — need recommendation
**Example:** "MIT — we want it to be open source with minimal restrictions."

**Your answer:**
> MIT — we want it to be open source with minimal restrictions

---

### Q-33-004 [REQUIRED]
**Question:** Who owns the intellectual property for this project?
**Why we need this:** IP ownership determines copyright notices, contributor agreements, and licensing authority. The audit found no copyright information anywhere in the codebase.
**Expected format:** Free text
**Example:** "Owned by Acme Corp. Developed by in-house team under employment agreement."

**Your answer:**
> Owned by Robert Agterhuis not affiliated with any current or former Employer

---

### Q-33-005 [OPTIONAL]
**Question:** Are there plans to register trademarks for names used in the project (e.g., "Agentic System", "Command Center")?
**Why we need this:** The audit could not verify trademark registration status. If these names are important to the brand, trademark registration should be considered to protect them.
**Expected format:** Yes / No / Not applicable
**Example:** "No — these are internal working names, not brand names."

**Your answer:**
> No — these are internal working names, not brand names.

---

## Section 3: Legal Resources

### Q-33-006 [OPTIONAL]
**Question:** Is external legal counsel available for critical items such as license selection, privacy policy drafting, and data breach procedure validation?
**Why we need this:** Several recommendations require legal expertise (GDPR compliance, Terms of Service, privacy policy). Knowing whether external legal support is available affects how we plan these work items.
**Expected format:** Yes / No / On retainer / Ad-hoc basis
**Example:** "Yes — we have a law firm on retainer for IP and privacy matters."

**Your answer:**
> No not appllicable

---

### Q-33-007 [OPTIONAL]
**Question:** What industry sector does this tool serve? Are there any sector-specific regulations to consider?
**Why we need this:** Some industries (healthcare, finance, government) have additional regulatory requirements beyond GDPR. Knowing the sector helps prioritize compliance work.
**Expected format:** Free text
**Example:** "Software development / IT sector. No sector-specific regulations beyond standard data protection."

**Your answer:**
> Software development / IT sector.

---

## Answer Status
| Question ID | Status | Last updated |
|-------------|--------|--------------|
| Q-33-001 | ANSWERED | 2026-03-07 |
| Q-33-002 | ANSWERED | 2026-03-07 |
| Q-33-003 | ANSWERED | 2026-03-07 |
| Q-33-004 | ANSWERED | 2026-03-07 |
| Q-33-005 | ANSWERED | 2026-03-07 |
| Q-33-006 | ANSWERED | 2026-03-07 |
| Q-33-007 | ANSWERED | 2026-03-07 |

---
*This questionnaire was automatically generated by the system. Do not modify question IDs or headings.*
