# Provenance

This file is the authoritative record of who/what produced each part of the evaluation data, and what Giles has personally reviewed. It is updated as each phase lands: entries are appended, not rewritten, so the project's own construction history stays inspectable.

**V1 baseline: 2026-09-10.** With all 10 human evaluator assessments approved (see the review log below), `data/tasks.json` and `data/v1-results.json` are now the frozen V1 baseline. Any further change to either file past this point should be a deliberate, recorded amendment (a new entry here explaining what changed and why), not a silent edit; this is what the brief calls "preserve it and record subsequent changes."

## Generation (V1 and V2 outputs)

- **Model under test:** Claude Sonnet 5 (`claude-sonnet-5`), used as the model under test within this build session, in the same Claude Code conversation that authored the surrounding application. This is a disclosed conflict of interest, not a hidden one; see [limitations.md](limitations.md).
- **Process:** for each task and version, the model was given a system instruction plus a request for marketing copy and asked to produce it. The raw output was stored unedited as `output.text`. No output was regenerated, cherry-picked, or hand-edited after the fact to manufacture a convenient result.
- **Disclosed build note, `context_packet.user_prompt` vs. actual generation input:** the app displays `context_packet.user_prompt` as the model's complete input. For V1, generation was actually performed against a structured breakdown of the same request (a brief, a facts list, a constraints list) rather than by typing that prose. That structured breakdown was subsequently deleted from this repository's data model entirely: on review, it didn't correspond to any real product or evaluation mechanism (a real generation pipeline or evaluator only ever sees prompt, response, and rubric; the structured breakdown was never given to the LLM-as-a-judge, and kept it as unused data risked it being mistaken for a real pipeline step), so `user_prompt` is now the *only* specification of what each task asked for. Both forms carried identical informational content when the breakdown existed (nothing was added to or withheld from either form to change the outcome), and the frozen output was not edited, regenerated, or cherry-picked to fit either representation, or to fit its later removal. This is disclosed here, in [data-schema.md](data-schema.md), and in each V1 record's `output.generation_notes`, rather than left implicit.
- **Run date:** recorded per-record in `output.run_date` once generation happens (Phase 2 for V1, Phase 4 for V2).

## Human evaluator assessment

- **Drafting:** candidate annotations for each output were drafted with assistant help, following the rubric in `data/rubric.json`, without access to the provisional LLM-as-a-judge assessment.
- **Review:** no record is described as a finished human evaluator assessment until Giles has explicitly reviewed and approved it. Each record's `reference_assessment.review_status` is `"pending_review"` until that happens, then `"approved"` with a `review_date` filled in.
- **Review log:** *(appended as reviews happen)*
  - Phase 2, 2026-09-10: all 10 V1 human evaluator assessments reviewed and approved by Giles Davis (`review_status: "approved"`, `review_date: "2026-09-10"` on every record in `data/v1-results.json`). Review covered the raw output text, every annotation's dimension/subtype/severity/rationale, and the resulting status/points for each of the 10 tasks; see the conversation history for the specific spot-checks performed (T01 and T10 shown in full immediately before approval).
  - Phase 4, not yet started: 0 of 10 V2 human evaluator assessments reviewed.

## Provisional LLM-as-a-judge

- **Model:** GPT-5.6 Sol, run by Giles outside this build session and outside this repository's tooling; see [judge-prompt.md](judge-prompt.md) for the exact prompt and process.
- **Independence measures:** the LLM-as-a-judge prompt never includes the human evaluator's assessment; it is not told whether the output is V1 or V2 (the prompt omits the V2-only locale profile/glossary context and is otherwise identical in shape for both versions).
- **Import log:** *(appended as results are imported)*
  - 2026-09-10: 10 of 20 LLM-as-a-judge assessments imported: all 10 V1, via `data/judge-intake/responses/judge-response-v1.json` (Giles's raw combined response from GPT-5.6 Sol) split by `scripts/split_judge_response.py` and merged by `scripts/import_judge_results.py`. 10 V2 still pending (Phase 4 not started).
  - **Human-evaluator-vs-LLM-as-a-judge status agreement, V1 (10 records):** 4 agree, 6 disagree. In every one of the 6 disagreements the LLM-as-a-judge rated the output *more* severely than the human evaluator (Pass→Fail or Needs revision→Fail), never the reverse. This one-directional pattern is disclosed here as a raw fact; it has not yet been investigated (that's Phase 3 work) and no claim is made about which assessor is "right"; see [limitations.md](limitations.md) on the LLM-as-a-judge being provisional, not validated.

## Summary: what Giles has personally reviewed so far

*(This list is the actual audit trail: keep it accurate and append-only.)*

- **2026-09-10:** all 10 V1 raw outputs and their human-evaluator-assessment annotations (`data/v1-results.json`). This included substantive back-and-forth that changed the data itself, not just a read-through: the context-packet schema was reworked twice for realism (task_brief/facts/constraints → a natural `user_prompt`, then the `grading_reference` breakdown was removed entirely as not representative of any real evaluation mechanism); the rubric was rebuilt against the live MQM Core typology (dimensions/subtypes relabelled, `critical` severity reduced from 25 to 10 points); and one stale rationale wording was corrected.
- **2026-09-10:** the 10 imported V1 LLM-as-a-judge assessments, spot-checked via View 2 in the running app (T01 specifically) after import. Noted but not yet acted on: the LLM-as-a-judge's `accuracy`/`addition` findings on T01 (flagging "our best-selling outerwear" and "made to keep you warm" as unsupported claims) look like a stricter reading of ordinary marketing puffery than a human would likely apply: a candidate example for Phase 3's "is the LLM-as-a-judge creating the pattern" check, not a conclusion. Nothing else (V2 outputs, `findings.json`) has been reviewed yet.
