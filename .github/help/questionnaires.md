# Questionnaires

## What are questionnaires?

During each analysis phase, agents may encounter topics where they need your input. Instead of blocking, they mark items as `INSUFFICIENT_DATA` and the **Questionnaire Agent** generates customer-facing questions for you.

These questionnaires appear in the **Questionnaires tab** of this webapp.

## How to answer

1. Switch to the **Questionnaires tab**
2. Browse questionnaire files in the left sidebar — they're grouped by phase
3. Each question card shows:
   - **Question ID** (e.g. `Q-TECH-001`)
   - **Priority** badge: `REQUIRED` or `OPTIONAL`
   - **Status** badge: `OPEN` or `ANSWERED`
   - **Context** about why this question matters
4. Type your answer in the text area
5. Set the status to `ANSWERED`
6. Click **Save All** (or press `Ctrl+S`) to persist changes

## Where are they stored?

Questionnaire files live in:
```
BusinessDocs/Phase1-Business/Questionnaires/
BusinessDocs/Phase2-Tech/Questionnaires/
BusinessDocs/Phase3-UX/Questionnaires/
BusinessDocs/Phase4-Marketing/Questionnaires/
```

An index is maintained at `BusinessDocs/questionnaire-index.md`.

## Re-evaluation after answering

After answering questionnaires, you can trigger a **Reevaluate** to have the agents re-run their analysis with your new answers:

1. Click the **Reevaluate** button in the header
2. Select the scope (ALL, or a specific phase)
3. Click **Reevaluate**
4. Copy the generated command into Copilot chat

Items resolved by your answers will be marked `RESOLVED_BY_QUESTIONNAIRE`.
