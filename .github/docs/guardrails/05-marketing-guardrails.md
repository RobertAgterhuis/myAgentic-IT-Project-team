```markdown
# Marketing & Brand Guardrails – Phase 4 Agents
> Applies to: Brand Strategist, Growth Marketer, CRO Specialist

---

## DOMAIN: BRAND, MARKETING & GROWTH

### G-MKT-01 – Message-Market Fit Validation
**Rule:** Every marketing or brand recommendation MUST be based on demonstrable message-market fit data.  
**Source requirement:** Based on: A/B test results, customer interviews, conversion rates, NPS data, or survey results – NEVER on "this sounds good".

### G-MKT-02 – No Campaign Without Measurable KPI
**Rule:** Every recommendation for a campaign, experiment, or marketing action MUST be accompanied by:  
- Primary KPI (measurable, with baseline if available)  
- Success criterion (when is the action successful?)  
- Time horizon  
**Prohibition:** No vague objectives such as "more visibility" or "better brand awareness" without a measurable criterion.

### G-MKT-03 – Funnel Analysis Completeness (AARRR)
**Rule:** The funnel analysis MUST cover ALL five AARRR stages: Acquisition, Activation, Retention, Revenue, Referral.  
**Source requirement:** Each stage based on measurement data (analytics, CRM data, cohort analysis) – not on assumptions about user behavior.  
**Prohibition:** No funnel recommendations for stages for which no data is available (mark as `INSUFFICIENT_DATA:`).

### G-MKT-04 – Brand Consistency Audit Completeness
**Rule:** Brand Strategist evaluates ALL brand expressions: product UI, website, documentation, sales materials, support communications.  
**Format:** Per channel: consistent / inconsistent + concrete deviation + remediation measure.

### G-MKT-05 – Positioning vs Competition Substantiated
**Rule:** Competitive positioning statements MUST be based on demonstrable competitor analysis (publicly available data, pricing pages, feature matrices).  
**Prohibition:** No "we are better than X" without a concrete comparison on specific dimensions.

### G-MKT-06 – CRO Experiment Backlog Prioritization
**Rule:** CRO Specialist ALWAYS delivers a prioritized experiment backlog, sorted by:  
1. Expected impact (based on funnel data)  
2. Implementation effort  
3. Statistical power (sample requirements documented)  
**Prohibition:** No experiments without statistical substantiation of required sample size.

### G-MKT-07 – Messaging Alignment with Product
**Rule:** Every marketing message is explicitly tested against the actual product capabilities (established in Phase 1 + 2).  
**Violation:** If marketing claims promise things the product does not deliver, this is reported as `CRITICAL_MISALIGNMENT`.

### G-MKT-08 – Retention Analysis Mandatory
**Rule:** Growth Marketer ALWAYS analyzes retention, even if not explicitly requested. Acquisition recommendations without retention context are incomplete.

### G-MKT-09 – SEO Analysis Data-Driven and Technical SEO Escalated
**Rule 1:** SEO claims (keyword positions, backlink profile, organic traffic) MUST be based on tooling data (Search Console, Ahrefs, SEMrush, or equivalent) or explicitly marked as `INSUFFICIENT_DATA:`.
**Rule 2:** Technical SEO findings (Core Web Vitals, crawlability, structured data, canonical tags, indexability) are outside the domain of the Growth Marketer. These MUST be documented as `SEO_TECH_ISSUE: [description]` + `OUT_OF_SCOPE: TECH` and forwarded to the Orchestrator for escalation to the Software Architect or Senior Developer.
**Prohibition:** No organic growth projections or projected traffic increases without historical traffic data or explicit `INSUFFICIENT_DATA:` marking.

---

## PHASE 4 HANDOFF REQUIREMENTS
Output must contain:
- `message_alignment_score: 0-100` (only based on data, not estimated)
- `funnel_dropoffs[]{stage, dropoff_rate, source, recommendation}`
- `experiment_backlog[]{hypothesis, kpi, sample_size, priority}`
- `brand_consistency_audit[]{channel, status, deviation, remedy}`
- `competitive_positioning{dimensions: [], score_vs_competitor: {}}`
- `seo_analysis{organic_channel_assessment, keyword_positions[], backlink_profile, content_seo_gaps[], tech_issues[]}` (fields may be empty with INSUFFICIENT_DATA:)

```
