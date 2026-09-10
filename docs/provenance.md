# Provenance

This file is the authoritative record of who/what produced each part of the evaluation data, and what Giles has personally reviewed. It is updated as each phase lands — entries are appended, not rewritten, so the project's own construction history stays inspectable.

## Generation (V1 and V2 outputs)

- **Model under test:** Claude Sonnet 5 (`claude-sonnet-5`), used as the model under test within this build session, in the same Claude Code conversation that authored the surrounding application. This is a disclosed conflict of interest, not a hidden one — see [limitations.md](limitations.md).
- **Process:** for each task and version, the model was given exactly the stored `context_packet` (V1: system instruction + task brief + facts + constraints; V2: the same, plus the retrieved locale profile and glossary entries) and asked to produce marketing copy. The raw output was stored unedited as `output.text`. No output was regenerated, cherry-picked, or hand-edited after the fact to manufacture a convenient result.
- **Run date:** recorded per-record in `output.run_date` once generation happens (Phase 2 for V1, Phase 4 for V2).

## Reference assessment

- **Drafting:** candidate annotations for each output were drafted with assistant help, following the rubric in `data/rubric.json`, without access to the provisional LLM-judge assessment.
- **Review:** no record is described as a finished reference assessment until Giles has explicitly reviewed and approved it. Each record's `reference_assessment.review_status` is `"pending_review"` until that happens, then `"approved"` with a `review_date` filled in.
- **Review log:** *(appended as reviews happen)*
  - Phase 2, not yet started: 0 of 10 V1 reference assessments reviewed.
  - Phase 4, not yet started: 0 of 10 V2 reference assessments reviewed.

## Provisional LLM judge

- **Model:** GPT-5.6 Sol, run by Giles outside this build session and outside this repository's tooling — see [judge-prompt.md](judge-prompt.md) for the exact prompt and process.
- **Independence measures:** the judge prompt never includes the reference assessment; it is not told whether the output is V1 or V2 (the prompt omits the V2-only locale profile/glossary context and is otherwise identical in shape for both versions).
- **Import log:** *(appended as judge results are imported)*
  - Not yet started: 0 of 20 judge assessments (10 V1 + 10 V2) imported. See `data/judge-intake/` and `scripts/import_judge_results.py`.

## Summary: what Giles has personally reviewed so far

*(This list is the actual audit trail — keep it accurate and append-only.)*

- Nothing yet. This repository is at Phase 1 (scaffolding); no evaluation data exists to review.
