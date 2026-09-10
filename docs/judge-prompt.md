# LLM judge prompt and intake process

This project's provisional LLM-judge assessments are **not** produced by Claude. They are produced independently by Giles, uploading a generated file (`docs/judge-run-<version>.md`, see below) to a separate model (GPT-5.6 Sol), then importing its response into this repository. This document explains that process and is the reusable source for the generated file, so the process is fully inspectable.

## Why a separate model, and why blind

The reference assessment, the app, and this documentation were all produced with help from the same assistant (Claude) in the same session. Using that same assistant as the "independent" LLM judge would be a real conflict of interest, not just an appearance of one. Using a different model (GPT-5.6 Sol), run by Giles outside this session, keeps the judge genuinely independent of the reference-assessment drafting process.

The judge is also kept blind to two things, by construction of what it is given:

- **Blind to the reference assessment** — it is never shown Giles's annotations, status, or points.
- **Blind, where practical, to whether the output is V1 or V2** — the judge is given only the user's own prompt, the target locale, the rubric, and the output text. It is never given the V2 locale profile or glossary context packet, and the prompt shape is identical for V1 and V2 outputs. This is "where practical" because a careful reader could sometimes infer version from writing style, but nothing in the input labels it.

## The generated artefact: `docs/judge-run-<version>.md`

Rather than 20 separate one-record calls, the actual process used is one batched upload per version (`docs/judge-run-v1.md`, and later `docs/judge-run-v2.md`) — practical for a human running this through a chat UI, and it produces one combined response to import instead of 20. `scripts/build_judge_run.py` generates it from `data/rubric.json`, `data/tasks.json` and the relevant `data/v1-results.json`/`data/v2-results.json`, so it is always in sync with the live rubric and outputs rather than hand-maintained. Generate (or regenerate) it with:

```bash
python3 scripts/build_judge_run.py v1
```

The generated file contains **no version-identifying text anywhere in its content** — no "V1"/"V2" string appears in the role instructions, rubric, format spec, or task list — specifically so that uploading the *whole* file, not just an excerpt, still preserves blindness to which generation version it's assessing. (The filename itself does say `v1`, purely for Giles's own bookkeeping across runs; the judge model only ever sees the file's contents, not its filename.)

The file's shape: a role instruction, the rubric (dimension/subtype ids, severities, status bands — mirrors `data/rubric.json` exactly, regenerated from it), a required-output-format spec, then each task as its user prompt, target locale, and raw generated copy. It asks for **one combined JSON response**, an object keyed by task ID, each value in the same `{annotations, total_points, status}` shape as an individual assessment.

## Import process

1. Generate the file: `python3 scripts/build_judge_run.py v1`.
2. Upload or paste the full content of `docs/judge-run-v1.md` to a separate model (GPT-5.6 Sol), run outside this repository's tooling and outside the session that built this project.
3. Save the model's raw JSON response to a local file (anywhere — it doesn't need to live in this repo).
4. Split it into the per-record files the importer expects:

   ```bash
   python3 scripts/split_judge_response.py v1 path/to/saved-response.json
   ```

   This writes `data/judge-intake/<task_id>-v1.json` for each task ID present in the response.
5. Import:

   ```bash
   python3 scripts/import_judge_results.py
   ```

   This merges each file into the matching record's `judge_assessment` in `data/v1-results.json` (filling in `annotations`, `total_points`, `status`, `run_date`, and setting `import_status` to `"imported"`), then reports which of the 20 (10 V1 + 10 V2, once V2 exists) are still missing.
6. Run `python3 scripts/validate_data.py` to confirm everything is internally consistent (recomputed points match, dimensions/subtypes/severities are valid, etc.).

Until a given task's judge file is imported, that record's `judge_assessment.import_status` stays `"awaiting_external_run"` and the UI shows it as pending rather than displaying placeholder data.
