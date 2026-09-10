# Limitations

This project is a small, deliberately bounded learning and interview artefact. The limitations below are as important as the findings — read them before drawing any conclusion from this repository.

## Sample size and scope

- **Ten tasks is a diagnostic sample, not a statistically representative one.** Counts and percentages drawn from ten records are described as *concentration*, *recurring observation*, or *diagnostic signal* throughout the app and docs — never as a statistically significant trend or a production-quality rate.
- **The same ten tasks are reused for V1 and V2.** This lets every rubric dimension be re-checked on directly comparable inputs, which is useful for spotting regressions and improvements, but it is not an independent validation set. A generation configuration can look good on a reused set and still fail differently on new tasks.
- **Ordinary, low-risk domains only.** The task set deliberately avoids regulated or safety-sensitive domains (insurance, credit, healthcare, gambling, legal). Findings here say nothing about locale-conditioned generation in higher-stakes domains.
- **V1's frozen output was originally generated against a structured breakdown of each task (a brief, a facts list, a constraints list), not literally by typing the free-text `user_prompt` now shown as the model's input.** That structured breakdown has since been removed from this repository entirely (it didn't correspond to any real product or evaluation mechanism — see `docs/provenance.md`), but the already-generated V1 outputs were not regenerated to match its removal. Both forms carried identical informational content, and the output itself was never edited, regenerated, or cherry-picked either time. V2 generation, once it exists, is performed directly against `user_prompt`, so this specific gap is V1-only.

## The reference assessment

- **Not expert judgement or gold-standard data.** It is explicitly labelled *"Reference assessment — created by the MVP author for demonstration"* and represents the shape of a structured human evaluation record, not a validated ground truth.
- **Single reviewer, single pass.** There is no second reviewer, no adjudication, and no inter-annotator agreement measurement (no Cohen's kappa, no Fleiss' kappa) — this project deliberately does not simulate an evaluator workforce.
- **Assistant-drafted, human-approved.** Candidate annotations were drafted with assistant help; only annotations Giles has explicitly reviewed and approved are described as finished reference assessments (see [provenance.md](provenance.md) for exactly which records and when).

## The provisional LLM judge

- **Provisional by design, not a validated automated evaluator.** Ten examples cannot calibrate or validate an LLM judge. Known judge biases (self-preference, verbosity bias, position bias, limited consistency) are documented in Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* (<https://arxiv.org/abs/2306.05685>) and are not ruled out here.
- **Blind, where practical, to version and to the reference assessment** — but "where practical" is a real caveat: a careful reader could sometimes infer V1 vs V2 from writing style even though the prompt never labels it, and a single independent judge pass cannot fully rule out systematic judge blind spots.

## The V2 intervention and comparison

- **Lightweight retrieval, not sophisticated RAG.** V2's context construction is transparent, deterministic keyword/alias matching over a small CSV glossary — it demonstrates the mechanics of retrieval-augmented context, not a production-grade retrieval system.
- **A rudimentary regression check, not production regression testing.** The paired V1/V2 comparison re-evaluates every rubric dimension on the same ten tasks and surfaces new errors, which is useful, but it is not an independent validation set, a held-out test set, or longitudinal monitoring.
- **No claim of success is assumed.** The comparison view reports whatever the stored evidence shows, including the possibility of a null or negative result, and avoids celebratory language regardless of outcome.

## Generation process

- **The model under test and the LLM judge are not from the same evaluation-independence chain as a production setup would require**, since this MVP is authored end-to-end in a short build window. The generation model (Claude Sonnet 5) and the reference-assessment drafting both happened within the same build session; the judge model (GPT-5.6 Sol) was deliberately kept separate and run independently to reduce, though not eliminate, that conflict of interest. See [provenance.md](provenance.md).
- **Outputs were generated once and frozen.** They were not regenerated, cherry-picked, or edited after the fact to manufacture a convenient error or improvement. If an early exploratory pass had produced no useful variation, the task set itself would have been revised before baselining — not the outputs.

## What this repository does not claim at all

- Professional evaluator, localisation-specialist, ML-engineer, or production-platform experience.
- Any real company's data, workflow, internal tooling, or product resemblance.
- Multilingual expertise or translation-quality evaluation.
- A production evaluation platform, Label Studio functionality, or real evaluator-workforce operations.
