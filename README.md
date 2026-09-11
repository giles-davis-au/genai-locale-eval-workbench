# GenAI Locale Evaluation Workbench

> An inspectable case study of evaluating and improving locale-conditioned AI-generated text.

## Project status

**Phase 4 of 5 complete.** All 10 V1 tasks and all 10 V2 tasks have a frozen raw output, a reviewed and approved human evaluator assessment, and an imported LLM-as-a-judge assessment (`data/v1-results.json`, `data/v2-results.json`); see [docs/provenance.md](docs/provenance.md) for both versions' human-evaluator-vs-LLM-as-a-judge disagreement rates, including a 2026-09-11 amendment: `data/terminology.csv` was redesigned (its glossary rested on a category/task-scoping mechanism, and contained brand-specific rows, that didn't correspond to any real platform design), which changed T09 and T10's frozen V2 output text; both were regenerated, re-reviewed, and re-judged (see provenance for the full disclosure) and are back to fully approved/imported alongside the other 8. `data/findings.json` holds three evidence-linked findings from the V1 evidence (see [docs/methodology.md](docs/methodology.md)): two proposed a system change, both now built into V2 in a single bundled revision rather than tested as separate versions (see [docs/limitations.md](docs/limitations.md) for that trade-off), and one proposes evaluator training, not yet actioned. `data/monitoring-notes.json` holds one further piece of real signal that stops short of a finding (a single-instance word-count violation, disclosed rather than silently dropped). All five views are implemented, including **View 5** (compare V1 vs V2): every task re-evaluated by both assessors, before and after, with status/point deltas and any new issues V2 introduced surfaced explicitly rather than only what it fixed. Phase 5 (hardening and handoff) is what remains. Do not treat anything in this repository as a finished evaluation until this section says otherwise. See [Implementation phases](#implementation-phases) below for what each subsequent phase adds.

## 1. What does this demonstrate?

One bounded evaluation lifecycle for **locale-conditioned English marketing-copy generation**, worked through Australian English (`en-AU`):

1. A baseline (V1) generation system configuration and ten synthetic marketing-copy tasks.
2. A structured evaluation of the V1 outputs against a compact, MQM-informed rubric: both a human evaluator assessment and an independent, provisional LLM-as-a-judge assessment.
3. A short, evidence-linked investigation of one recurring pattern in the V1 results, including a check of alternative explanations.
4. A targeted V2 recommendation (lightweight, deterministic retrieval of a locale profile and glossary entries) and a paired comparison of the same ten tasks under V1 and V2.

It is a **preloaded, reproducible case study** built to help its author understand how an evaluation specification, structured annotations, aggregation, pattern investigation, a context recommendation and paired re-evaluation fit together, and to give an interviewer inspectable evidence of that learning. It is not a live AI product and does not claim professional evaluator, localisation-specialist, ML-engineer or production-platform experience.

## 2. What can an interviewer inspect?

- The ten task briefs and the exact free-text prompt each synthetic user typed (`data/tasks.json`), identical across V1 and V2.
- The exact V1 and V2 system instructions, and the exact retrieved context supplied to the model for every V2 task (`data/v1-results.json`, `data/v2-results.json`).
- The raw, frozen model outputs for every task and version.
- A **human evaluator assessment** for every output, labelled *"Human evaluator assessment: created by the MVP author for demonstration"*, and a separately produced **provisional LLM-as-a-judge assessment**, kept visibly distinct throughout the UI.
- The rubric, severities and status thresholds, stored as data rather than hardcoded (`data/rubric.json`).
- Every aggregate number in the app, drillable back to the source records it was computed from.
- The full evaluation-lifecycle narrative and methodology in [docs/methodology.md](docs/methodology.md), [docs/limitations.md](docs/limitations.md), [docs/provenance.md](docs/provenance.md) and [docs/judge-prompt.md](docs/judge-prompt.md).
- [CLAUDE.md](CLAUDE.md), which orients a reviewing coding agent to the implemented repository.

## 3. How can it be run safely?

This is a static, read-only web app. It makes **no network requests**, needs **no API key, model account, database or internet connection**, and **writes nothing to your machine**. All data is bundled JSON/CSV, frozen at build time.

From the repository root:

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080> in a browser. Press `Ctrl+C` in the terminal to stop the server.

The only dependency is Python's standard library (`http.server`) to serve static files; no package manager, bundler, or third-party runtime dependency is involved anywhere in this repository.

## 4. Suggested walkthrough order

For a reviewer short on time:

1. Read "Project status" above and skim [docs/limitations.md](docs/limitations.md), so you know what this repository does and doesn't claim before looking at any specific number.
2. Run the app (see above), then open **View 1** (setup) and **View 2** (one V1 record in full: context, output, both assessments).
3. Open **View 3** (V1 dashboard, the aggregate pattern) and **View 4** (the evidence-linked findings that pattern led to).
4. Open **View 5** (compare V1 vs V2), starting with its Summary section, then the full comparison table below it.
5. For depth beyond the app: [docs/methodology.md](docs/methodology.md) (why the rubric and design choices are what they are) and [docs/provenance.md](docs/provenance.md) (who/what produced each piece of data and when). [CLAUDE.md](CLAUDE.md) orients a reviewing coding agent to the repository, if that's relevant to how you're assessing this.

This follows the same order the five views and the project's own five build phases are already in.

## 5. What does it explicitly not prove?

The reasoning behind each of these lives in [docs/limitations.md](docs/limitations.md); this is the short version.

- Not a statistically representative measurement: ten tasks is a diagnostic sample.
- Not a validated automated evaluator: the LLM-as-a-judge is a provisional signal.
- Not gold-standard human evaluation: the human evaluator assessment is a demonstration record.
- Not sophisticated RAG: V2's context construction is plain, unfiltered inclusion of a small glossary file.
- Not production regression testing: the V1/V2 comparison is a rudimentary regression check on ten fixed tasks.
- Not translation evaluation, multilingual, or any real company's product.

## Why these design choices

- **Locale-conditioned generation, not translation**: the goal was to practise evaluating same-language, locale-conditioned output (a common real generative-AI task), not translation quality, which MQM was originally built for.
- **`en-AU`**: chosen because its divergences from the more common training-data defaults (spelling, date order, terminology) are well-documented and easy for any reviewer to check without specialist knowledge, keeping the whole case study inspectable.
- **Synthetic data throughout**: no real user, customer or production data is used anywhere, by design, so the repository is safe to share and inspect.
- **Frozen raw outputs**: outputs were generated once by the model under test and never edited afterwards. See [docs/provenance.md](docs/provenance.md) for exactly when, how, and by what model.
- **Human evaluator assessment created by the MVP author**: see [docs/provenance.md](docs/provenance.md) for how these were drafted and reviewed before being committed.
- **LLM-as-a-judge kept separate and provisional**: it's a different model, run independently by the author outside this build session, and never shown the human evaluator's assessment or (where practical) told which generation version it is judging. See [docs/judge-prompt.md](docs/judge-prompt.md) for the exact process.
- **V1 → V2**: the V2 recommendation follows from a specific V1 observation, not a predetermined "V2 is better" narrative. See [docs/methodology.md](docs/methodology.md) and the in-app pattern-investigation view.
- **Terminology glossary as universal context**: the entire glossary is supplied to every task rather than matched to it, since a real platform can't know in advance which categories or businesses it will serve; described honestly as lightweight retrieval-augmented context, not semantic RAG.
- **Scoring thresholds**: a simple, disclosed points-based policy (minor=1, major=5, critical=10; 0–1 Pass, 2–4 Needs revision, 5+ or any critical Fail), stored in `data/rubric.json` rather than scattered through code, and explicitly labelled as a project-specific choice rather than a universal standard.

## References

- MQM Council (error typology, selectable subsets, severity and scoring concepts): <https://www.themqm.org/mqm-pillars/>. This project's rubric specifically maps to the **MQM Core** typology (verified live, not from memory; see `docs/methodology.md`): <https://www.themqm.org/mqm-pillars/the-mqm-core-typology/>
- Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* (known LLM-as-a-judge biases and the need for human comparison): <https://arxiv.org/abs/2306.05685>

These sources inform this project's design; they are not cited as validating its specific results.

## Repository structure

```text
genai-locale-eval-workbench/
├── README.md
├── CLAUDE.md
├── LICENSE
├── .gitignore
├── index.html
├── assets/
│   ├── app.js
│   └── styles.css
├── data/
│   ├── rubric.json
│   ├── locale-profiles.json
│   ├── terminology.csv
│   ├── tasks.json
│   ├── v1-results.json
│   ├── v2-results.json
│   ├── findings.json
│   ├── monitoring-notes.json
│   └── judge-intake/        # staging area for externally-run LLM-as-a-judge output, see docs/judge-prompt.md
│       └── responses/       # raw combined LLM-as-a-judge responses, kept for provenance
├── docs/
│   ├── methodology.md
│   ├── limitations.md
│   ├── provenance.md
│   ├── judge-prompt.md
│   ├── judge-run-v1.md      # generated; see scripts/build_judge_run.py
│   ├── judge-run-v2.md      # generated; see scripts/build_judge_run.py
│   ├── judge-run-v2.1.md    # generated; a scoped partial re-run, see docs/judge-prompt.md
│   └── data-schema.md
└── scripts/
    ├── validate_data.py
    ├── build_v2_context.py
    ├── build_judge_run.py
    ├── split_judge_response.py
    └── import_judge_results.py
```

## Implementation phases

1. **Repository skeleton and contracts** *(done)*: app shell, data schemas, rubric, empty result files.
2. **V1 evidence and inspection** *(done)*: ten V1 outputs, human evaluator assessments reviewed and approved by Giles, setup and record-detail views.
3. **V1 exploration and pattern investigation** *(done)*: calculated summaries, filters, drilldown (View 3); evidence-linked findings, each with its own recommendation (View 4).
4. **V2 context and paired comparison** *(done)*: deterministic glossary retrieval (`scripts/build_v2_context.py`), all 10 V2 outputs generated, human evaluator assessment reviewed and approved, LLM-as-a-judge assessment imported, and the paired comparison view (View 5).
5. **Hardening and handoff**: completed documentation, full validation, offline/no-network confirmation.

Each phase is one Git commit; history is not squashed, so the project's own construction is part of what an interviewer can inspect.

## Data validation

```bash
python3 scripts/validate_data.py
```

Checks structural integrity: exactly ten unique task IDs, one V1 and one V2 result per task, valid rubric references, recomputed points/status matching stored values, findings referencing real records, required provenance fields present, and no duplicate IDs. At this phase it correctly reports zero errors and zero warnings: every V1 and V2 record has an approved human evaluator assessment and an imported LLM-as-a-judge assessment.
