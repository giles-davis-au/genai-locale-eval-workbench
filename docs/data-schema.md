# Data schema reference

This document is the source of truth for the shape of every JSON file in `data/`. The app (`assets/app.js`) and the validator (`scripts/validate_data.py`) both read against this schema. If you change a field name, update this file, the validator and the app together.

## `data/rubric.json`

See the file directly — it is small and self-describing. Key fields consumed elsewhere:

- `dimensions[].id`, `dimensions[].subtypes[].id` — the only valid values for `annotation.dimension` / `annotation.subtype` in results files.
- `severities.<minor|major|critical>.points` — the only valid severities and their point values.
- `status_policy.critical_forces_fail` and `status_policy.bands` — the only source of status-threshold logic. Nothing else in the repository should hardcode `0-1 = Pass` etc.

## `data/locale-profiles.json`

Keyed by locale code (only `en-AU` is used). Each profile is free-text guidance shown verbatim in the UI and supplied verbatim in the V2 context packet for tasks with that `target_locale`.

## `data/terminology.csv`

One row per glossary entry. Columns:

| column | meaning |
|---|---|
| `term_id` | unique ID, `G##` for category-level entries, `B##` for brand-specific entries |
| `scope` | `category` (matches on `content_category`) or `task` (matches on `task_id`) |
| `match_key` | the `content_category` or `task_id` value this entry is retrieved for |
| `trigger_terms` | pipe-separated everyday/generic terms this entry corrects, shown for transparency |
| `preferred_term` | the AU-locale or brand-approved wording |
| `dimension_subtype` | `non_locale_term` or `brand_wording` (must match a `terminology` subtype in `rubric.json`) |
| `note` | short human-readable explanation |

**Retrieval rule (V2 only, deterministic, no embeddings):** for a given task, select every row where (`scope == "category"` and `match_key == task.content_category`) or (`scope == "task"` and `match_key == task.task_id`). This is the entire retrieval mechanism — see [methodology.md](methodology.md) for why this counts as lightweight retrieval-augmented context rather than semantic RAG.

## `data/tasks.json`

Array of exactly 10 task objects:

```json
{
  "task_id": "T01",
  "content_category": "clothing",
  "category_label": "Clothing",
  "target_locale": "en-AU",
  "business_name": "Rowan & Ash",
  "brief": "one-sentence framing of who wants the copy and why",
  "facts": ["fact 1", "fact 2", "..."],
  "constraints": ["constraint 1", "constraint 2", "..."]
}
```

`facts` and `constraints` are supplied to the model in **both** V1 and V2 — the only thing that changes between versions is the addition of the locale profile and glossary entries. This keeps the V1→V2 comparison isolated to the retrieval-augmented context, not to a change in what the task asks for.

## `data/v1-results.json` and `data/v2-results.json`

Array of exactly 10 records each (one per task), same task IDs in both files.

```json
{
  "task_id": "T01",
  "version": "v1",
  "context_packet": {
    "system_instruction": "exact system instruction text used for this version",
    "locale_profile": null,
    "glossary_entries": [],
    "task_brief": "copied from tasks.json for a self-contained record",
    "facts": ["..."],
    "constraints": ["..."]
  },
  "output": {
    "text": "raw, unedited generated marketing copy",
    "model_name": "claude-sonnet-5",
    "run_date": "2026-09-10",
    "generation_notes": "free text — how and when this was generated, and any honesty caveats"
  },
  "reference_assessment": {
    "label": "Reference assessment — created by the MVP author for demonstration",
    "status": "Pass",
    "total_points": 0,
    "annotations": [
      {
        "annotation_id": "T01-V1-REF-1",
        "dimension": "locale_conventions",
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
    "label": "Provisional LLM-judge assessment",
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

For V2 records, `context_packet.locale_profile` is the full object from `locale-profiles.json` for the task's `target_locale`, and `context_packet.glossary_entries` is the array of matched rows from `terminology.csv` (see retrieval rule above), stored as objects, so an interviewer can see exactly what was retrieved and supplied.

`review_status` is `"pending_review"` until Giles has explicitly reviewed and approved that specific annotation set, at which point it becomes `"approved"` and `review_date` is filled in. **No record may be described in the UI or docs as a finished reference assessment while `review_status` is `"pending_review"`.**

`judge_assessment.import_status` is `"awaiting_external_run"` until Giles supplies the judge's structured output (see [judge-prompt.md](judge-prompt.md)), at which point it becomes `"imported"`, `status`/`total_points`/`annotations`/`run_date` are filled in, and `judge_assessment.label` stays `"Provisional LLM-judge assessment"`.

## `data/findings.json`

Array of finding objects used by View 3 (pattern investigation):

```json
{
  "finding_id": "F1",
  "title": "short title",
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
  "hypothesis": "bounded hypothesis about the V1 generation configuration",
  "proposed_intervention": "the specific V2 change this motivates",
  "expected_effect": "what should change in V2 if the hypothesis is right"
}
```

Every `task_id` and `annotation_id` referenced here must resolve to a real record in `v1-results.json` (the validator checks this).

## Validation summary

`scripts/validate_data.py` checks the structural rules above plus everything listed in the brief (exactly 10 unique task IDs, one V1 and one V2 output per task, valid dimension/subtype/severity references, recomputed points and status matching stored values, findings referencing real IDs, required provenance fields present, no duplicate IDs). Run it after any data edit:

```bash
python3 scripts/validate_data.py
```
