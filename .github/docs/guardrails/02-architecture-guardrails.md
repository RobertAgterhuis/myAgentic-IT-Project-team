# Architecture Guardrails – Phase 2 Agents
> Applies to: Software Architect, Senior Developer, DevOps Engineer, Security Architect, Data Architect, Legal Counsel

---

## DOMAIN: TECHNOLOGY & ARCHITECTURE

### G-ARCH-01 – Domain-Driven Design Mandatory
**Rule:** Architecture findings and recommendations MUST be evaluated in the context of DDD principles (Bounded Contexts, Aggregates, Domain Events).  
**Source requirement:** Every architecture claim must be traceable to a concrete artifact: code, diagram, or ADR.

### G-ARCH-02 – Infrastructure as Code Only
**Rule:** Infrastructure recommendations may ONLY relate to IaC-based solutions. Manual provisioning is documented as an anti-pattern.  
**Verification:** Verify whether existing infrastructure is described in IaC (Terraform, Bicep, Pulumi, CloudFormation). If not: mark as technical debt.

### G-ARCH-03 – No Shared Mutable State
**Rule:** Architecture patterns that introduce shared mutable state are always flagged as high-risk, with explicit motivation and mitigation strategy.

### G-ARCH-04 – Tech Debt Score Substantiation
**Rule:** The tech-debt score (0–100) may NEVER be estimated without explicit criteria.  
**Criteria required:** Each score dimension (coupling, testability, documentation, modularity, security) must be assessed separately.  
**Prohibition:** Do not use "gut feeling" scores.

### G-ARCH-05 – CI/CD Maturity Mandatory Documentation
**Rule:** DevOps Engineer ALWAYS documents the current CI/CD maturity based on provided pipeline configurations, not on verbal descriptions.  
**Maturity levels:** Level 0 (no CI/CD) through Level 5 (fully automated, self-healing).  
Maturity levels follow the DORA model: Level 0 (none), Level 1 (initial), Level 2 (developing), Level 3 (defined), Level 4 (measured), Level 5 (optimizing).

### G-ARCH-06 – Observability Coverage
**Rule:** Analysis of available observability (metrics, logs, traces, alerts) is MANDATORY. Missing dimensions are registered as a gap.

### G-ARCH-07 – Code Quality Verification
**Rule:** Senior Developer bases quality statements EXCLUSIVELY on actually analyzed code.  
**Prohibition:** No quality statements based on filenames, project structure, or README descriptions.  
**Minimum analysis:** SOLID principles, coupling, cohesion, test coverage (based on test files or coverage reports).

### G-ARCH-08 – Data Lineage Documented
**Rule:** Data Architect ALWAYS documents the source-to-destination lineage for the primary data domains.  
**Prohibition:** No data recommendations without a complete picture of the existing data model.

### G-ARCH-09 – Scalability Claim Substantiation
**Rule:** Every scalability claim (e.g. "this system does not scale well") MUST be substantiated with:  
- Concrete observation (code, config, or measurement data)  
- Expected behavior under increased load  
- Impact if the scalability constraint occurs

---

## PHASE 2 HANDOFF REQUIREMENTS
See `analysis-output-contract.md` for the formal schema.

Output is a combined JSON/Markdown document with:
- `architecture_gaps[]`
- `tech_debt_score{dimensions: {}, total: 0-100}`
- `scalability_risks[]`
- `security_findings[]`
- `ci_cd_maturity_level: 0-5`
- `observability_gaps[]`
- `data_lineage_map{}`

Any missing section blocks the start of Phase 3.
