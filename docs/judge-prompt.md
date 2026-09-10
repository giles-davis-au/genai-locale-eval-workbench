# LLM judge prompt and intake process

This project's provisional LLM-judge assessments are **not** produced by Claude. They are produced independently by Giles running the prompt below against a separate model (GPT-5.6 Sol), then imported into this repository. This document is both the exact prompt used and the instructions for that import, so the process is fully inspectable.

## Why a separate model, and why blind

The reference assessment, the app, and this documentation were all produced with help from the same assistant (Claude) in the same session. Using that same assistant as the "independent" LLM judge would be a real conflict of interest, not just an appearance of one. Using a different model (GPT-5.6 Sol), run by Giles outside this session, keeps the judge genuinely independent of the reference-assessment drafting process.

The judge is also kept blind to two things, by construction of what it is given:

- **Blind to the reference assessment** — it is never shown Giles's annotations, status, or points.
- **Blind, where practical, to whether the output is V1 or V2** — the judge is given only the task brief, facts, constraints, target locale, the rubric, and the output text. It is never given the V2 locale profile or glossary context packet, and the prompt shape is identical for V1 and V2 outputs. This is "where practical" because a careful reader could sometimes infer version from writing style, but nothing in the input labels it.

## The exact prompt (one call per output, 20 calls total: 10 V1 + 10 V2)

Fill in the bracketed fields from `data/tasks.json` (brief, facts, constraints, target_locale) and the relevant `output.text` from `data/v1-results.json` or `data/v2-results.json`. Do not include anything else — no version label, no reference assessment, no other outputs.

```text
You are an independent quality reviewer for locale-conditioned marketing copy. You are assessing ONE piece of generated marketing copy against the rubric below. You have not seen and must not ask for any other assessment of this output. Base your judgement only on the material provided in this prompt.

TASK BRIEF:
[brief]

TARGET LOCALE: [target_locale]

FACTS THE COPY MUST PRESERVE:
[facts, one per line]

CONSTRAINTS THE COPY MUST SATISFY:
[constraints, one per line]

GENERATED COPY TO ASSESS:
"""
[output.text]
"""

RUBRIC:
Dimensions and subtypes:
- factual_accuracy: invented_fact, altered_fact, omitted_fact
- constraint_compliance: length_violation, missing_required_element, format_violation
- locale_conventions: spelling, date_format, currency_format, measurement_units
- terminology: non_locale_term, brand_wording
- style_voice: register_mismatch, awkward_phrasing

Severities and points: minor = 1, major = 5, critical = 25.

Status bands (computed from total points across all your annotations for this output; any critical annotation forces Fail regardless of total):
- 0-1 points: Pass
- 2-4 points: Needs revision
- 5+ points: Fail

INSTRUCTIONS:
Identify zero or more annotations. For each, choose one dimension and one subtype from the lists above, a severity, a short quoted span from the copy if applicable (or null), a concise one-sentence rationale, and a suggested correction only if useful (or null). Do not invent dimensions or subtypes outside this list. Then compute total_points and status yourself using the bands above.

Respond with ONLY valid JSON in exactly this shape, no other text:

{
  "annotations": [
    {
      "dimension": "...",
      "subtype": "...",
      "severity": "minor|major|critical",
      "span": "..." or null,
      "rationale": "...",
      "suggested_correction": "..." or null
    }
  ],
  "total_points": 0,
  "status": "Pass|Needs revision|Fail"
}
```

## Import process

1. Run the prompt above once per output (20 total) against GPT-5.6 Sol.
2. Save each response as its own file in `data/judge-intake/`, named `<task_id>-<version>.json`, e.g. `T01-v1.json`, `T01-v2.json`. The file content is exactly the JSON object the judge returned (nothing else).
3. Run:

   ```bash
   python3 scripts/import_judge_results.py
   ```

   This merges each file into the matching record's `judge_assessment` in `data/v1-results.json` or `data/v2-results.json` (filling in `annotations`, `total_points`, `status`, `run_date`, and setting `import_status` to `"imported"`), then reports which of the 20 are still missing.
4. Run `python3 scripts/validate_data.py` to confirm everything is internally consistent (recomputed points match, dimensions/subtypes/severities are valid, etc.).

Until a given file is imported, that record's `judge_assessment.import_status` stays `"awaiting_external_run"` and the UI shows it as pending rather than displaying placeholder data.
