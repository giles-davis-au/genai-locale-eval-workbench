# Methodology

## Why locale-conditioned generation, not translation

The goal of this project is to practise evaluating a common real generative-AI task: producing same-language marketing copy conditioned on a target locale (spelling, date/currency conventions, terminology, brand voice). This is a different problem from translation quality, which is what the MQM framework was originally built to assess. This project borrows MQM's *concepts* — selecting a bounded error taxonomy, assigning severities, deriving a status from points — without claiming to be a translation-quality evaluation. Results here are described as **MQM-informed**, never "MQM-compliant."

## Why `en-AU`

Australian English has well-documented, checkable divergences from the more common training-data defaults: British-derived spelling (colour, customise, moisturiser), day-before-month dates, and everyday terminology differences (doona, takeaway, trolley, chemist). A reviewer with no specialist localisation background can verify most findings here directly against the stored context and output — which keeps the whole case study inspectable, rather than requiring the reader to trust an opaque judgement.

## Why synthetic data

Every task, business name, brief and user prompt in `data/tasks.json` is invented for this project. No real user, customer, or production data is used anywhere. This keeps the repository safe to share and inspect, and avoids any implication that this reproduces a real organisation's data or workflow.

## The rubric

Seven dimensions, each with two to eight subtypes. See `data/rubric.json` for the exact, current definitions (this file should never restate them in a way that could drift out of sync — read the data file directly).

Six of the seven dimensions are adopted directly from the **MQM Council's MQM Core error typology** (verified live at <https://www.themqm.org/mqm-pillars/the-mqm-core-typology/> rather than recalled from memory — an earlier draft of this rubric got several names wrong by relying on memory, which is exactly the failure mode this note exists to avoid repeating): Terminology, Accuracy, Linguistic conventions (named "Fluency" in MQM v1), Style, Locale conventions, and Audience appropriateness (named "Verity" in MQM v1). MQM Core's seventh dimension, Design and markup, is omitted entirely — the generated output is always a single plain-text paragraph, so a dimension about headings, layout and markup has nothing to apply to here.

Within each adopted dimension, only the subtypes plausible for locale-conditioned marketing-copy generation are kept. Most notably, Accuracy's MQM subtypes `Mistranslation`/`Overtranslation`/`Undertranslation`/`Untranslated`/`Do not translate` are dropped rather than renamed, because they are all source-text/target-text bitext concepts with no equivalent in monolingual generation against a brief. Every dimension and subtype in `data/rubric.json` carries a `source` field (`"mqm_core"` or `"project_addition"`) so this mapping is inspectable in the data itself, not just asserted in prose.

The seventh dimension, **Instruction & constraint compliance**, has no MQM equivalent and is this project's own addition — MQM assumes a translation task with no concept of an arbitrary user-supplied constraint like a word-count ceiling, because a source text doesn't have one; this project's ten tasks do.

Severities carry fixed point values (minor=1, major=5, critical=10) chosen to make critical errors dominate a status regardless of how many minor issues are also present, while still letting several minor issues accumulate into "Needs revision." Status classification does not actually depend on critical's exact magnitude — `status_policy.critical_forces_fail` makes any critical annotation an automatic Fail regardless of point total — but the magnitude does matter for severity-weighted aggregates (e.g. "error points by dimension" charts), where a single critical annotation can visually dominate a chart out of proportion to how many records it actually affects. The original brief (drafted with ChatGPT's help before this build) specified minor=1/major=5/critical=25, a ×5 step at each tier; that was revised down to critical=10 (a ×2 step from major) specifically to reduce that skew risk, since 25 had no other justification behind it. These point values and the status bands below are project-specific choices, not taken from MQM's own scoring model. Status bands (0–1 Pass, 2–4 Needs revision, 5+ or any critical Fail) are a simple, disclosed policy choice for this MVP, not a validated production threshold — see `data/rubric.json`'s `status_policy` for the authoritative version.

**All seven dimensions are weighted equally.** A minor-severity annotation costs the same 1 point whether it's tagged `linguistic_conventions`, `accuracy`, or `style` — only severity determines points; which dimension it's filed under does not. `data/rubric.json` has no per-dimension weight or multiplier field. This is a deliberate simplification, not an oversight: a more mature rubric might reasonably weight some dimensions more heavily than others at the same severity (e.g. treating a minor factual slip as worse than a minor style slip), but this MVP keeps scoring uniform across dimensions to keep the points-to-status arithmetic easy to audit by hand. Dimension-level weighting is a reasonable extension this project doesn't attempt.

## Reference assessment vs provisional LLM judge

Both assessments see the same task, target-locale information, output, and rubric. Neither is exposed to the other during its own creation:

- The **reference assessment** is the primary curated record for this MVP. It was drafted with assistant help and then explicitly reviewed and approved by Giles before being committed — see [provenance.md](provenance.md) for exactly what was reviewed and when. It is labelled *"Reference assessment — created by the MVP author for demonstration"* throughout, and is never called expert judgement, gold-standard data, or validated ground truth.
- The **provisional LLM-judge assessment** comes from a separate model (GPT-5.6 Sol), run independently by Giles outside the build session, using the exact prompt in [judge-prompt.md](judge-prompt.md). It never sees the reference assessment, and — because its prompt omits the V2-only locale profile and glossary context and is otherwise identical in shape for V1 and V2 — it is not told which generation version it is judging. It is a comparison signal, not a source of truth; ten examples do not validate or calibrate it (see Zheng et al. in the README references for documented LLM-judge biases).

## Lightweight retrieval-augmented context (V2)

V2 augments the same `user_prompt` with two deterministically retrieved inputs: the `en-AU` locale profile, and any glossary rows from `data/terminology.csv` whose scope matches the task's content category or task ID (see [data-schema.md](data-schema.md) for the exact retrieval rule). This is plain keyword/alias matching over a CSV file — no embeddings, vector database, semantic search, or external retrieval service. It is described honestly as **lightweight retrieval-augmented context**: it demonstrates retrieval, context construction and grounded generation, not sophisticated semantic RAG.

Task-specific fixes are never written directly into the V2 system instruction. Any correction a task's output needs must come from a glossary row that would also apply to other tasks sharing its category, or from a row explicitly scoped to that task as brand guidance — never as an ad hoc patch invented after seeing the V1 error.

## From V1 observation to V2 intervention

The V1 evidence now exists and is approved (`data/v1-results.json`, Phase 2 complete). This section itself is still written in Phase 3: it will state the specific recurring observation drawn from the actual V1 results, the alternative explanations considered and why they were or weren't ruled out, and the bounded hypothesis that motivated the V2 glossary/locale-profile intervention. Nothing here was written before the V1 data existed to support it — see the "Project status" note in [README.md](../README.md) for current phase.

## Scoring-threshold selection

The point values and status bands were chosen before seeing the V1 results, as a simple, legible policy: one minor issue alone should not fail an otherwise-good output; a handful of minor issues, or a single major issue, should trigger revision rather than an automatic pass; and any critical issue, or five-plus points of any kind, should fail regardless of how the rest of the copy reads. They are stored in `data/rubric.json` specifically so they can be inspected and challenged rather than taken on faith.
