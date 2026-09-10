# GenAI Locale Evaluation Workbench

> An inspectable case study of evaluating and improving locale-conditioned AI-generated text.

## Project status

**Phase 2 of 5 complete (traceable V1 evaluation records).** All 10 V1 tasks have a frozen raw output and a reviewed, approved reference assessment (`data/v1-results.json`). The provisional LLM-judge assessments are still pending an external run (see [docs/judge-prompt.md](docs/judge-prompt.md)) — `data/v2-results.json` and `data/findings.json` are still empty pending Phases 3 and 4. The app has five views: **View 1** (setup) and **View 2** (V1 evaluation — inspect any one of the 10 records) are implemented; **View 3** (V1 dashboard), **View 4** (investigate the pattern) and **View 5** (compare V1 vs V2) are not yet. Do not treat anything in this repository as a finished evaluation until this section says otherwise. See [Implementation phases](#implementation-phases) below for what each subsequent phase adds.

## 1. What does this demonstrate?

One bounded evaluation lifecycle for **locale-conditioned English marketing-copy generation**, worked through Australian English (`en-AU`):

1. A baseline (V1) generation configuration and ten synthetic marketing-copy tasks.
2. A structured evaluation of the V1 outputs against a compact, MQM-informed rubric — both a reference assessment and an independent, provisional LLM-judge assessment.
3. A short, evidence-linked investigation of one recurring pattern in the V1 results, including a check of alternative explanations.
4. A targeted V2 intervention — lightweight, deterministic retrieval of a locale profile and glossary entries — and a paired comparison of the same ten tasks under V1 and V2.

It is a **preloaded, reproducible case study** built to help its author understand how an evaluation specification, structured annotations, aggregation, pattern investigation, a context intervention and paired re-evaluation fit together — and to give an interviewer inspectable evidence of that learning. It is not a live AI product and does not claim professional evaluator, localisation-specialist, ML-engineer or production-platform experience.

## 2. What can an interviewer inspect?

- The ten task briefs and the exact free-text prompt each synthetic user typed (`data/tasks.json`), identical across V1 and V2.
- The exact V1 and V2 system instructions, and the exact retrieved context supplied to the model for every V2 task (`data/v1-results.json`, `data/v2-results.json`).
- The raw, frozen model outputs for every task and version.
- A **reference assessment** for every output — labelled *"Reference assessment — created by the MVP author for demonstration"* — and a separately produced **provisional LLM-judge assessment**, kept visibly distinct throughout the UI.
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

The only dependency is Python's standard library (`http.server`) to serve static files — no package manager, bundler, or third-party runtime dependency is involved anywhere in this repository.

## 4. What does it explicitly not prove?

- **Not a statistically representative measurement.** Ten synthetic tasks produce diagnostic signal, not a production-quality rate. The app deliberately uses language like *concentration*, *recurring observation* and *diagnostic signal* rather than *statistically significant*.
- **Not a validated automated evaluator.** The LLM judge is a provisional comparison signal, run independently and kept blind to the reference assessment. Ten examples do not calibrate or validate it (Zheng et al. document real LLM-judge biases — see references below).
- **Not gold-standard human evaluation.** The reference assessment is a demonstration record in the shape of one, created by this project's author — not expert judgement, not validated ground truth, and not any company's real evaluator output.
- **Not sophisticated RAG.** V2's context construction is transparent, deterministic keyword/alias matching over a CSV glossary — no embeddings, vector database or retrieval service.
- **Not production regression testing.** The V1/V2 paired comparison is a rudimentary regression check on ten fixed tasks, not an independent validation set or longitudinal monitoring.
- **Not translation evaluation, not multilingual expertise, not any specific company's product.** This repository is independent and self-contained — not affiliated with, endorsed by, or built using data or tooling from any real organisation.

## Why these design choices

- **Locale-conditioned generation, not translation** — the goal was to practise evaluating same-language, locale-conditioned output (a common real generative-AI task), not translation quality, which MQM was originally built for.
- **`en-AU`** — chosen because its divergences from the more common training-data defaults (spelling, date order, terminology) are well-documented and easy for any reviewer to check without specialist knowledge, keeping the whole case study inspectable.
- **Synthetic data throughout** — no real user, customer or production data is used anywhere, by design, so the repository is safe to share and inspect.
- **Frozen raw outputs** — outputs were generated once by the model under test and never edited afterwards. See [docs/provenance.md](docs/provenance.md) for exactly when, how, and by what model.
- **Reference assessment created by the MVP author** — see [docs/provenance.md](docs/provenance.md) for how these were drafted and reviewed before being committed.
- **LLM judge kept separate and provisional** — the judge is a different model, run independently by the author outside this build session, and never shown the reference assessment or (where practical) told which generation version it is judging. See [docs/judge-prompt.md](docs/judge-prompt.md) for the exact process.
- **V1 → V2** — the V2 intervention follows from a specific V1 observation, not a predetermined "V2 is better" narrative. See [docs/methodology.md](docs/methodology.md) and the in-app pattern-investigation view once populated.
- **Lightweight glossary lookup** — deliberately basic (deterministic keyword/alias matching over CSV), described honestly as lightweight retrieval-augmented context, not semantic RAG.
- **Scoring thresholds** — a simple, disclosed points-based policy (minor=1, major=5, critical=10; 0–1 Pass, 2–4 Needs revision, 5+ or any critical Fail), stored in `data/rubric.json` rather than scattered through code, and explicitly labelled as a project-specific choice rather than a universal standard.

## References

- MQM Council — error typology, selectable subsets, severity and scoring concepts: <https://www.themqm.org/mqm-pillars/>. This project's rubric specifically maps to the **MQM Core** typology (verified live, not from memory — see `docs/methodology.md`): <https://www.themqm.org/mqm-pillars/the-mqm-core-typology/>
- Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* — known LLM-judge biases and the need for human comparison: <https://arxiv.org/abs/2306.05685>

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
│   └── judge-intake/        # staging area for externally-run judge output, see docs/judge-prompt.md
├── docs/
│   ├── methodology.md
│   ├── limitations.md
│   ├── provenance.md
│   ├── judge-prompt.md
│   └── data-schema.md
└── scripts/
    ├── validate_data.py
    └── import_judge_results.py
```

## Implementation phases

1. **Repository skeleton and contracts** *(done)* — app shell, data schemas, rubric, empty result files.
2. **V1 evidence and inspection** *(done)* — ten V1 outputs, reference assessments reviewed and approved by Giles, setup and record-detail views.
3. **V1 exploration and pattern investigation** — calculated summaries, filters, drilldown, evidence-linked findings.
4. **V2 context and paired comparison** — transparent glossary retrieval, V2 outputs and assessments, paired comparison view.
5. **Hardening and handoff** — completed documentation, full validation, offline/no-network confirmation.

Each phase is one Git commit; history is not squashed, so the project's own construction is part of what an interviewer can inspect.

## Data validation

```bash
python3 scripts/validate_data.py
```

Checks structural integrity: exactly ten unique task IDs, one V1 and one V2 result per task, valid rubric references, recomputed points/status matching stored values, findings referencing real records, required provenance fields present, and no duplicate IDs. At this phase it correctly reports 10 missing V2 records (Phase 4 not yet started) and 10 judge assessments awaiting their external run (see status note above) — both expected, not errors in the V1 data itself.
