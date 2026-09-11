# Data schema reference

This document is the source of truth for the shape of every JSON file in `data/`. The app (`assets/app.js`) and the validator (`scripts/validate_data.py`) both read against this schema. If you change a field name, update this file, the validator and the app together.

## `data/rubric.json`

See the file directly; it is small and self-describing. Key fields consumed elsewhere:

- `dimensions[].id`, `dimensions[].subtypes[].id`: the only valid values for `annotation.dimension` / `annotation.subtype` in results files.
- `dimensions[].source` / `dimensions[].subtypes[].source`: `"mqm_core"` or `"project_addition"`, rendered as the app's Source column (with an asterisk when a subtype's source differs from its dimension's). Optional `source_note` fields on either give the reason and render as a hover tooltip.
- `framing`: an array of paragraph strings (not a single block), rendered as separate `<p>` elements so it stays readable; any `http(s)://` URL inside a paragraph is auto-linked.
- `severities.<minor|major|critical>.points`: the only valid severities and their point values.
- `status_policy.critical_forces_fail` and `status_policy.bands`: the only source of status-threshold logic. Nothing else in the repository should hardcode `0-1 = Pass` etc.

## `data/locale-profiles.json`

Keyed by locale code (only `en-AU` is used). Each profile is free-text guidance shown verbatim in the UI and supplied verbatim in the V2 context packet for tasks with that `target_locale`.

## `data/terminology.csv`

One row per glossary entry: a flat, universally-applicable list of everyday AU-English word choices, not tied to any business, category or task. Columns:

| column | meaning |
|---|---|
| `term_id` | unique row ID (a plain sequential number) |
| `trigger_terms` | pipe-separated everyday/generic terms this entry corrects, shown for transparency |
| `preferred_term` | the AU-locale wording |
| `note` | short human-readable explanation |

There is deliberately no `dimension_subtype` column: every row in this file corrects the same kind of issue (an everyday word used where AU English has a different one), which the `terminology`/`wrong_term` rubric subtype always covers; a real generation platform also has no way to know in advance which business categories it will ever be asked to generate copy for, so a row can't be scoped to one either. `scripts/build_v2_context.py` and any code annotating a `wrong_term` issue can treat that subtype as a constant rather than reading it from the file.

**Retrieval rule (V2 only, deterministic, no embeddings):** every V2 task's `retrieved_context.glossary_entries` is the entire contents of `terminology.csv`, unfiltered. This is universal context, supplied alongside the locale profile regardless of the task's category: a real platform would not know ahead of time which of its glossary terms a given customer's brief will end up needing, so it isn't retrieval in the sense of selecting a subset, it's simply always-on reference material the model is free to draw on where its trigger concept genuinely arises (see [provenance.md](provenance.md) for the disclosed rule that a glossary entry is only ever applied in generated text where its trigger concept naturally arose; none are forced in). See [methodology.md](methodology.md) for why this counts as lightweight retrieval-augmented context rather than semantic RAG.

An earlier version of this file also carried brand-specific rows (a named loyalty program, membership tier, etc.), scoped to an individual `task_id` via now-removed `scope`/`match_key` columns. Those rows were removed entirely, not just relabelled: keying brand-specific terminology to a `task_id` was an artifact of this demo's 1:1 task-to-business structure with no real platform analog, and a brand's own product/program naming is a fundamentally different kind of content from an AU-vs-US vocabulary pair, not something that belongs in this glossary at all.

## `data/tasks.json`

Array of exactly 10 task objects:

```json
{
  "task_id": "T01",
  "content_category": "clothing",
  "category_label": "Clothing",
  "target_locale": "en-AU",
  "business_name": "Rowan & Ash",
  "brief": "one-sentence third-person framing of who wants the copy and why, shown in the task-list UI",
  "user_prompt": "first-person free text, the way a real small-business owner would type a request into a marketing-copy prompt box"
}
```

`user_prompt` is the model's actual input (combined with the system instruction, and for V2 the retrieved context; see below), and the sole specification of what each task asks for. It is identical across V1 and V2 for a given task, because a real user's own prompt does not change when the platform's retrieval behaviour changes behind the scenes.

There is deliberately no separate structured `facts`/`constraints` breakdown. An earlier draft of this schema had one, reasoned as a "grading checklist" the human evaluator and LLM-as-a-judge could consult, but on reflection that doesn't correspond to any real evaluation mechanism: a real evaluator, human or LLM-as-a-judge, only ever receives prompt, response, and rubric, and derives what matters from the prompt themselves. A pre-extracted checklist was never given to the LLM-as-a-judge (see [judge-prompt.md](judge-prompt.md), which has always used only `user_prompt`) and has been removed everywhere else too, rather than kept as an unused artifact that could be mistaken for a real pipeline step. Each annotation's own `rationale` field cites the specific requirement it's checking, in context, exactly as a real evaluator would.

**Disclosed build note:** V1 generation was originally performed against a structured breakdown of this same request (a brief, a facts list, a constraints list) rather than by typing the `user_prompt` text shown above. That breakdown has since been deleted from this repository's data model for the reason above; the generated output was not regenerated to match its removal. Both forms carried identical informational content, and the frozen output was never edited, regenerated, or cherry-picked to fit either; see [provenance.md](provenance.md) for the full disclosure.

## `data/v1-results.json` and `data/v2-results.json`

Array of exactly 10 records each (one per task), same task IDs in both files.

```json
{
  "task_id": "T01",
  "version": "v1",
  "context_packet": {
    "system_instruction": "exact platform-level system instruction for this version: hidden from the user, never typed by them",
    "user_prompt": "copied verbatim from tasks.json: identical in v1 and v2",
    "retrieved_context": null
  },
  "output": {
    "text": "raw, unedited generated marketing copy",
    "model_name": "claude-sonnet-5",
    "run_date": "2026-09-10",
    "generation_notes": "free text: how and when this was generated, and any honesty caveats"
  },
  "reference_assessment": {
    "label": "Human evaluator assessment: created by the MVP author for demonstration",
    "status": "Pass",
    "total_points": 0,
    "annotations": [
      {
        "annotation_id": "T01-V1-REF-1",
        "dimension": "linguistic_conventions",
        "subtype": "spelling",
        "severity": "minor",
        "span": "the exact quoted text this annotation is about, or null",
        "rationale": "concise reason",
        "suggested_correction": "optional, or null"
      }
    ],
    "reviewed_by": "Giles Davis",
    "review_status": "pending_review",
    "review_date": null
  },
  "judge_assessment": {
    "label": "Provisional LLM-as-a-judge assessment",
    "status": "pending",
    "total_points": null,
    "annotations": [],
    "judge_model_name": "GPT-5.6 Sol",
    "judge_prompt_ref": "docs/judge-prompt.md",
    "run_date": null,
    "blind_to_reference": true,
    "blind_to_version_label": true,
    "import_status": "awaiting_external_run"
  }
}
```

For V2 records, `context_packet.retrieved_context` is `{ "locale_profile": ..., "glossary_entries": [...] }`: `locale_profile` is the full object from `locale-profiles.json` for the task's `target_locale`, and `glossary_entries` is the entire, unfiltered array of rows from `terminology.csv` (see retrieval rule above), stored as objects. This block is injected by the platform alongside the system instruction (the user never sees or types it), so an interviewer can see exactly what was retrieved and supplied without mistaking it for something the user asked for.

`review_status` is `"pending_review"` until Giles has explicitly reviewed and approved that specific annotation set, at which point it becomes `"approved"` and `review_date` is filled in. **No record may be described in the UI or docs as a finished human evaluator assessment while `review_status` is `"pending_review"`.**

`judge_assessment.import_status` is `"awaiting_external_run"` until Giles supplies the LLM-as-a-judge's structured output (see [judge-prompt.md](judge-prompt.md)), at which point it becomes `"imported"`, `status`/`total_points`/`annotations`/`run_date` are filled in, and `judge_assessment.label` stays `"Provisional LLM-as-a-judge assessment"`.

## `data/findings.json`

Array of finding objects used by View 4 (pattern investigation):

```json
{
  "finding_id": "F1",
  "title": "short title",
  "recommendation_type": "system_change",
  "observation": {
    "summary": "what occurred and in how many records",
    "affected_task_ids": ["T01", "T05"],
    "count": 2,
    "denominator": 10
  },
  "evidence_links": [
    { "task_id": "T01", "version": "v1", "annotation_id": "T01-V1-REF-1" }
  ],
  "alternative_explanations": ["..."],
  "hypothesis": "bounded hypothesis about the V1 generation system configuration",
  "proposed_recommendation": "the specific change this motivates",
  "expected_effect": "what should change if the hypothesis is right"
}
```

`finding_id` is a short internal reference (`F1`, `F2`, ...), analogous to `task_id`; the app displays it spelled out ("Finding 1"). Every finding drives a recommendation; `recommendation_type` states, as authored fact rather than something the reader has to infer from `proposed_recommendation`'s wording, which kind: `"system_change"` (a change to the V1/V2 generation system configuration, e.g. Finding 1's locale-profile retrieval or Finding 2's proposed no-fabrication instruction) or `"evaluator_training"` (a change to how the human evaluator works, not to the generation system, e.g. Finding 3). A third value, `"monitor"`, exists for the same field but is only ever used in `data/monitoring-notes.json` below, never in `findings.json` itself: nothing in this file should carry `"monitor"`, since a finding by definition has a full evidence-to-recommendation chain, and a monitoring note by definition doesn't. The app's step-5 heading and coloured badge both read `recommendation_type` directly ("Recommendation: system change" / "Recommendation: evaluator training"), so the two never drift apart. Findings are ordered in the array by this field, `"system_change"` findings first: not every `"system_change"` finding has actually been built, though (Finding 1's has, Finding 2's hasn't yet), so a reader still needs each finding's own text to know which recommendations this artifact has acted on; the `"evaluator_training"` finding, which nothing in this build implements, comes last.

Every `task_id` and `annotation_id` referenced here must resolve to a real record in `v1-results.json` (the validator checks this). An `evidence_links` entry's `annotation_id` is `null` when the entry points at an LLM-as-a-judge annotation, since judge annotations (imported from external output) carry no per-annotation id; only reference/human annotations do.

## `data/monitoring-notes.json`

Array of monitoring-note objects, rendered in a separate, visually distinct section below the findings in View 4:

```json
{
  "note_id": "M1",
  "title": "short title",
  "recommendation_type": "monitor",
  "observation": {
    "summary": "what occurred and in how many records",
    "affected_task_ids": ["T09"],
    "count": 1,
    "denominator": 10
  },
  "evidence_links": [
    { "task_id": "T09", "version": "v1", "annotation_id": "T09-V1-REF-2" }
  ],
  "why_not_actioned": "why this evidence doesn't clear the bar for a full finding and a recommendation"
}
```

A monitoring note is real, disclosed signal that stops short of a finding, almost always because it's a single instance rather than an established pattern: treating n=1 as a pattern would be exactly the kind of overclaiming this project's own diagnostic-sample disclaimers exist to prevent, but silently dropping a severe single instance understates what the evaluation actually found. `note_id` is a short internal reference (`M1`, `M2`, ...), analogous to `finding_id`, and `recommendation_type` is always `"monitor"` here (the only place that value is valid). There is deliberately no `alternative_explanations`, `hypothesis` or `proposed_recommendation` field: a monitoring note doesn't get the full reasoning chain a finding does, since there's no pattern to reason about yet; `why_not_actioned` replaces all three, stating plainly why the evidence stops short of the bar for action. The same `task_id`/`annotation_id` resolution rule as `findings.json` applies, and is checked by the same validator logic.

## Validation summary

`scripts/validate_data.py` checks the structural rules above plus everything listed in the brief (exactly 10 unique task IDs, one V1 and one V2 output per task, valid dimension/subtype/severity references, recomputed points and status matching stored values, findings referencing real IDs, required provenance fields present, no duplicate IDs). Run it after any data edit:

```bash
python3 scripts/validate_data.py
```
