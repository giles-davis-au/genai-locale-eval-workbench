# CLAUDE.md

Orientation for a coding agent reviewing this repository. This describes the *implemented* project, not the original build brief (which is intentionally excluded from the repository; see Trust boundaries below).

## Purpose

A static, offline, read-only web app that walks an interviewer through one evaluation lifecycle: baseline (V1) locale-conditioned marketing-copy generation → structured evaluation → pattern investigation → a retrieval-augmented V2 recommendation → paired V1/V2 comparison. See [README.md](README.md) for the full framing and [docs/methodology.md](docs/methodology.md) for the evaluation design rationale.

## Architecture

- **No backend, no build, no database.** `index.html` + `assets/app.js` + `assets/styles.css`, served by any static file server (`python3 -m http.server 8080`).
- **Data lives in `data/`** as JSON (nested records) and one CSV (flat glossary, deliberately kept flat because it's materially easier to inspect that way). `assets/app.js` fetches all of it at page load and renders everything client-side; there is no server-side computation.
- **Every calculated number is derived at runtime in `assets/app.js`** from the stored records: status totals, error-point totals, affected-output counts, dimension groupings, V1/V2 deltas, human-evaluator-vs-LLM-as-a-judge agreement. Nothing aggregate is hardcoded in HTML. `scripts/validate_data.py` independently recomputes the same values from the same source files and fails if they diverge.

## Data flow

1. `data/tasks.json`: the ten fixed tasks (a short brief plus the actual free-text `user_prompt`), identical in V1 and V2. Deliberately has no separate structured facts/constraints breakdown; see [docs/data-schema.md](docs/data-schema.md) for why that was tried and removed.
2. `data/rubric.json`: dimensions, subtypes, severities, and the status-threshold policy. This is the single source of truth for scoring logic; both `assets/app.js` and `scripts/validate_data.py` read it rather than hardcoding thresholds.
3. `data/locale-profiles.json` + `data/terminology.csv`: the material V2's retrieval draws from. Retrieval is deterministic: for a task, select every glossary row scoped to its `content_category` or `task_id` (see [docs/data-schema.md](docs/data-schema.md) for the exact rule). No embeddings or external retrieval service.
4. `data/v1-results.json` / `data/v2-results.json` (one record per task per version): the exact context packet supplied to the model, the raw frozen output, a human evaluator assessment, and a provisional LLM-as-a-judge assessment. This is the core data contract; see [docs/data-schema.md](docs/data-schema.md) before changing its shape.
5. `data/findings.json`: the pattern-investigation narrative (observation → examples → alternative explanations → hypothesis → recommendation), with evidence links that must resolve to real task/annotation IDs.
6. `data/monitoring-notes.json`: real, disclosed signal that stops short of a finding (usually a single instance, not yet a pattern), rendered separately in View 4 rather than folded into a finding it doesn't yet support. Same evidence-link resolution rule as findings.

## Key files

| File | Role |
|---|---|
| `assets/app.js` | All rendering and derived-metric logic. All five views implemented: **View 1** (setup), **View 2** (V1 evaluation: inspect one complete record), **View 3** (V1 dashboard: status counts, dimension breakdown, human-evaluator-vs-LLM-as-a-judge disagreements, filters, drilldown), **View 4** (investigate the pattern: evidence-linked findings from `data/findings.json`, each with observation → examples → alternative explanations → hypothesis → recommendation, plus a separate "noted, not currently actioned" section from `data/monitoring-notes.json`), and **View 5** (compare V1 vs V2: every task re-evaluated by both assessors before and after, with status/point deltas and any new-in-V2 issues surfaced explicitly, not just what was fixed). |
| `data/rubric.json` | Scoring source of truth. |
| `scripts/validate_data.py` | Independent structural + arithmetic check over everything in `data/`. Run after any data edit. |
| `scripts/build_v2_context.py` | Computes each task's deterministic V2 `retrieved_context` (locale profile + matched glossary rows) from `data/tasks.json`, `data/terminology.csv` and `data/locale-profiles.json`. Does not generate marketing copy; that's the model under test's own work, hand-assembled into `data/v2-results.json` alongside this script's output. |
| `scripts/import_judge_results.py` | Merges externally-run LLM-as-a-judge JSON from `data/judge-intake/` into the results files. |
| `docs/data-schema.md` | Exact JSON shape for every file in `data/`; read this before touching any data file. |
| `docs/judge-prompt.md` | The LLM-as-a-judge process and the source template `scripts/build_judge_run.py` renders. |
| `docs/judge-run-v1.md` | Generated: the actual content uploaded to the external LLM-as-a-judge for V1. Regenerate with `scripts/build_judge_run.py`, never hand-edit. |

## Commands

```bash
python3 -m http.server 8080          # run the app at http://localhost:8080
python3 scripts/validate_data.py     # validate all data files
python3 scripts/build_v2_context.py  # print each task's deterministic V2 retrieved_context
python3 scripts/build_judge_run.py v1        # (re)generate docs/judge-run-v1.md
python3 scripts/split_judge_response.py v1 <path>   # split a combined judge response into data/judge-intake/
python3 scripts/import_judge_results.py   # merge staged judge results
```

No other tooling is required or present. Do not add npm, pip dependencies, a bundler, or a database; these are explicit non-goals of this project.

## Trust boundaries

- The app fetches only files inside this repository. It makes no other network requests.
- All generated model outputs are **frozen**: produced once during the build, never regenerated or edited afterwards to manufacture a convenient result.
- The **human evaluator assessment** and the **provisional LLM-as-a-judge assessment** are produced by two different, procedurally separated processes (see [docs/provenance.md](docs/provenance.md)): the human evaluator assessment is drafted by an assistant and then explicitly reviewed/approved by the project's author before being committed; the LLM-as-a-judge assessment comes from a separate model, run independently outside this build session, blind to the human evaluator's assessment and (where practical) to which version it is judging.
- `data/judge-intake/` is a staging area for that externally-run LLM-as-a-judge output: files dropped there are inert until `scripts/import_judge_results.py` merges them; nothing in the shipped app writes to this directory or anywhere else on disk.
- The original implementation brief that specified this project is deliberately **not** part of this repository (see `.gitignore`); it was working material for the build, not part of the interviewer-facing artefact. Do not attempt to recover or reference it; this file and the `docs/` directory are the authoritative description of what was built and why.

## Known limitations

See [docs/limitations.md](docs/limitations.md) for the full, current list. In brief: ten synthetic tasks are a diagnostic sample, not a statistically representative one; the human evaluator assessment is a demonstration record, not validated ground truth; the LLM-as-a-judge is a provisional signal, not a calibrated evaluator; V2's retrieval is basic deterministic matching, not semantic RAG; and the paired V1/V2 comparison is a rudimentary regression check on a fixed, reused set of ten tasks, not independent validation or monitoring.

## Current build status

Phase 4 (V2 retrieval, generation, both assessments, and View 5's paired comparison) complete. Phase 5 (hardening and handoff: completed documentation, full validation, offline/no-network confirmation) is what remains. See the "Project status" section at the top of [README.md](README.md) for what is and isn't populated yet. Update that section, this file, and `docs/` together as later phases land; do not let them drift out of sync with the actual data files.
