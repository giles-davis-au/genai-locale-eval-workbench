# Methodology

## Why locale-conditioned generation, not translation

The goal of this project is to practise evaluating a common real generative-AI task: producing same-language marketing copy conditioned on a target locale (spelling, date/currency conventions, terminology, brand voice). This is a different problem from translation quality, which is what the MQM framework was originally built to assess. This project borrows MQM's *concepts* — selecting a bounded error taxonomy, assigning severities, deriving a status from points — without claiming to be a translation-quality evaluation. Results here are described as **MQM-informed**, never "MQM-compliant."

## Why `en-AU`

Australian English has well-documented, checkable divergences from the more common training-data defaults: British-derived spelling (colour, customise, moisturiser), day-before-month dates, and everyday terminology differences (doona, takeaway, trolley, chemist). A reviewer with no specialist localisation background can verify most findings here directly against the stored context and output — which keeps the whole case study inspectable, rather than requiring the reader to trust an opaque judgement.

## Why synthetic data

Every task, business name, brief, fact and constraint in `data/tasks.json` is invented for this project. No real user, customer, or production data is used anywhere. This keeps the repository safe to share and inspect, and avoids any implication that this reproduces a real organisation's data or workflow.

## The rubric

Five dimensions — factual accuracy, instruction/constraint compliance, locale conventions, terminology & approved brand wording, and style & brand voice — each with two or three subtypes. See `data/rubric.json` for the exact, current definitions (this file should never restate them in a way that could drift out of sync — read the data file directly).

Severities carry fixed point values (minor=1, major=5, critical=25) chosen to make critical errors dominate a status regardless of how many minor issues are also present, while still letting several minor issues accumulate into "Needs revision." Status bands (0–1 Pass, 2–4 Needs revision, 5+ or any critical Fail) are a simple, disclosed policy choice for this MVP, not a validated production threshold — see `data/rubric.json`'s `status_policy` for the authoritative version.

## Reference assessment vs provisional LLM judge

Both assessments see the same task, target-locale information, output, and rubric. Neither is exposed to the other during its own creation:

- The **reference assessment** is the primary curated record for this MVP. It was drafted with assistant help and then explicitly reviewed and approved by Giles before being committed — see [provenance.md](provenance.md) for exactly what was reviewed and when. It is labelled *"Reference assessment — created by the MVP author for demonstration"* throughout, and is never called expert judgement, gold-standard data, or validated ground truth.
- The **provisional LLM-judge assessment** comes from a separate model (GPT-5.6 Sol), run independently by Giles outside the build session, using the exact prompt in [judge-prompt.md](judge-prompt.md). It never sees the reference assessment, and — because its prompt omits the V2-only locale profile and glossary context and is otherwise identical in shape for V1 and V2 — it is not told which generation version it is judging. It is a comparison signal, not a source of truth; ten examples do not validate or calibrate it (see Zheng et al. in the README references for documented LLM-judge biases).

## Lightweight retrieval-augmented context (V2)

V2 augments the same task, facts and constraints with two deterministically retrieved inputs: the `en-AU` locale profile, and any glossary rows from `data/terminology.csv` whose scope matches the task's content category or task ID (see [data-schema.md](data-schema.md) for the exact retrieval rule). This is plain keyword/alias matching over a CSV file — no embeddings, vector database, semantic search, or external retrieval service. It is described honestly as **lightweight retrieval-augmented context**: it demonstrates retrieval, context construction and grounded generation, not sophisticated semantic RAG.

Task-specific fixes are never written directly into the V2 system instruction. Any correction a task's output needs must come from a glossary row that would also apply to other tasks sharing its category, or from a row explicitly scoped to that task as brand guidance — never as an ad hoc patch invented after seeing the V1 error.

## From V1 observation to V2 intervention

This section is completed in Phase 3, once the V1 evidence exists: it will state the specific recurring observation drawn from the actual V1 results, the alternative explanations considered and why they were or weren't ruled out, and the bounded hypothesis that motivated the V2 glossary/locale-profile intervention. Nothing here will be written before the V1 data exists to support it — see the "Project status" note in [README.md](../README.md) for current phase.

## Scoring-threshold selection

The point values and status bands were chosen before seeing the V1 results, as a simple, legible policy: one minor issue alone should not fail an otherwise-good output; a handful of minor issues, or a single major issue, should trigger revision rather than an automatic pass; and any critical issue, or five-plus points of any kind, should fail regardless of how the rest of the copy reads. They are stored in `data/rubric.json` specifically so they can be inspected and challenged rather than taken on faith.
