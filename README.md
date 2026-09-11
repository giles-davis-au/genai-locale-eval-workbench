# GenAI Locale Evaluation Workbench

> An inspectable case study of evaluating and improving locale-conditioned AI-generated text.

By [Giles Davis](https://www.linkedin.com/in/gilesbdavis/).

## Project status

**All 5 phases complete.** All 10 V1 and all 10 V2 tasks have a frozen output, an approved human evaluator assessment, and an imported LLM-as-a-judge assessment; `scripts/validate_data.py` reports 0 errors, 0 warnings. Full build history, including a 2026-09-11 amendment that reworked `data/terminology.csv` and regenerated two V2 records, is in [docs/provenance.md](docs/provenance.md). See [Implementation phases](#implementation-phases) below for what each phase added, and section 4 below for what this repository explicitly does not claim.

## Suggested walkthrough order

For a reviewer with roughly 15-20 minutes, in order:

1. **This "Project status" section, then [docs/limitations.md](docs/limitations.md) (2-3 min).** Sets honest expectations before looking at any specific number.
2. **[docs/methodology.md](docs/methodology.md)'s rubric section and Finding 1 and Finding 2 in full (3 min).** This is where the actual reasoning quality lives; skim Finding 3. If you want the engineering-level map of the repository as well, [CLAUDE.md](CLAUDE.md) does that in a few minutes more.
3. **Run the app** (see "How can it be run safely?" below), then go straight to **View 3** (V1 dashboard) rather than View 1 or 2: fastest way to see the tool compute something real, and it surfaces the human-vs-judge disagreements that motivate everything downstream.
4. **View 4** (the findings, with evidence links; click one or two), then **View 5** (V1 vs V2 comparison, starting with its Summary section). Look specifically for the T06/T08/T09 word-count regression in the comparison table: concrete proof that "new issues surfaced, not just fixes" is a real claim, not a hedge.
5. **View 1 and View 2 last, briefly.** Skim one V1 record in View 2 to confirm the data matches [docs/data-schema.md](docs/data-schema.md); no need to read all ten.
6. **Skip or skim rather than read in full:** the generated `docs/judge-run-*.md` files (glance at one, don't read the whole batched prompt), `docs/data-schema.md` itself (reference only, consult on demand), and the middle of `docs/provenance.md`'s audit trail (read the first entry and the most recent amendment, skip the rest).

This is deliberately not the same order as the five views' own numbering, or the project's five build phases: it's ordered for fastest signal under time pressure, not for narrative completeness.

## 1. What does this demonstrate?

One bounded evaluation lifecycle for **locale-conditioned English marketing-copy generation**, worked through Australian English (`en-AU`):

1. A baseline (V1) generation system configuration and ten synthetic marketing-copy tasks.
2. A structured evaluation of the V1 outputs against a compact, MQM-informed rubric: both a human evaluator assessment and an independent, provisional LLM-as-a-judge assessment.
3. A short, evidence-linked investigation of one recurring pattern in the V1 results, including a check of alternative explanations.
4. A targeted V2 configuration bundling two evidence-linked fixes (lightweight, deterministic retrieval of a locale profile and glossary entries, plus an explicit no-fabrication instruction) and a paired comparison of the same ten tasks under V1 and V2.

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

## 4. What does it explicitly not prove?

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
5. **Hardening and handoff** *(done)*: completed documentation, full validation, offline/no-network confirmation.

Each phase is one Git commit; history is not squashed, so the project's own construction is part of what an interviewer can inspect.

## Data validation

```bash
python3 scripts/validate_data.py
```

Checks structural integrity: exactly ten unique task IDs, one V1 and one V2 result per task, valid rubric references, recomputed points/status matching stored values, findings referencing real records, required provenance fields present, and no duplicate IDs. At this phase it correctly reports zero errors and zero warnings: every V1 and V2 record has an approved human evaluator assessment and an imported LLM-as-a-judge assessment.
