# CLAUDE.md

Orientation for a coding agent reviewing this repository. This describes the *implemented* project, not the original build brief (which is intentionally excluded from the repository — see Trust boundaries below).

## Purpose

A static, offline, read-only web app that walks an interviewer through one evaluation lifecycle: baseline (V1) locale-conditioned marketing-copy generation → structured evaluation → pattern investigation → a retrieval-augmented V2 intervention → paired V1/V2 comparison. See [README.md](README.md) for the full framing and [docs/methodology.md](docs/methodology.md) for the evaluation design rationale.

## Architecture

- **No backend, no build, no database.** `index.html` + `assets/app.js` + `assets/styles.css`, served by any static file server (`python3 -m http.server 8080`).
- **Data lives in `data/`** as JSON (nested records) and one CSV (flat glossary, deliberately kept flat because it's materially easier to inspect that way). `assets/app.js` fetches all of it at page load and renders everything client-side — there is no server-side computation.
- **Every calculated number is derived at runtime in `assets/app.js`** from the stored records — status totals, error-point totals, affected-output counts, dimension groupings, V1/V2 deltas, reference-vs-judge agreement. Nothing aggregate is hardcoded in HTML. `scripts/validate_data.py` independently recomputes the same values from the same source files and fails if they diverge.

## Data flow

1. `data/tasks.json` — the ten fixed tasks (a short brief plus the actual free-text `user_prompt`), identical in V1 and V2. Deliberately has no separate structured facts/constraints breakdown — see [docs/data-schema.md](docs/data-schema.md) for why that was tried and removed.
2. `data/rubric.json` — dimensions, subtypes, severities, and the status-threshold policy. This is the single source of truth for scoring logic; both `assets/app.js` and `scripts/validate_data.py` read it rather than hardcoding thresholds.
3. `data/locale-profiles.json` + `data/terminology.csv` — the material V2's retrieval draws from. Retrieval is deterministic: for a task, select every glossary row scoped to its `content_category` or `task_id` (see [docs/data-schema.md](docs/data-schema.md) for the exact rule). No embeddings or external retrieval service.
4. `data/v1-results.json` / `data/v2-results.json` — one record per task per version: the exact context packet supplied to the model, the raw frozen output, a reference assessment, and a provisional LLM-judge assessment. This is the core data contract; see [docs/data-schema.md](docs/data-schema.md) before changing its shape.
5. `data/findings.json` — the pattern-investigation narrative (observation → examples → alternative explanations → hypothesis → intervention), with evidence links that must resolve to real task/annotation IDs.

## Key files

| File | Role |
|---|---|
| `assets/app.js` | All rendering and derived-metric logic. View 1 (setup and record inspection) is fully implemented. Views 2–4 currently render an explicit "not implemented yet" empty state pending Phase 3/4 — View 2's is gated on that status directly, not on data presence, since `data/v1-results.json` is already populated; Views 3/4 are still correctly gated on `data/findings.json`/`data/v2-results.json` being empty. |
| `data/rubric.json` | Scoring source of truth. |
| `scripts/validate_data.py` | Independent structural + arithmetic check over everything in `data/`. Run after any data edit. |
| `scripts/import_judge_results.py` | Merges externally-run judge JSON from `data/judge-intake/` into the results files. |
| `docs/data-schema.md` | Exact JSON shape for every file in `data/` — read this before touching any data file. |
| `docs/judge-prompt.md` | The exact prompt used for the external LLM judge, and the intake process. |

## Commands

```bash
python3 -m http.server 8080          # run the app at http://localhost:8080
python3 scripts/validate_data.py     # validate all data files
python3 scripts/import_judge_results.py   # merge staged judge results
```

No other tooling is required or present. Do not add npm, pip dependencies, a bundler, or a database — these are explicit non-goals of this project.

## Trust boundaries

- The app fetches only files inside this repository. It makes no other network requests.
- All generated model outputs are **frozen**: produced once during the build, never regenerated or edited afterwards to manufacture a convenient result.
- The **reference assessment** and the **provisional LLM-judge assessment** are produced by two different, procedurally separated processes (see [docs/provenance.md](docs/provenance.md)): the reference assessment is drafted by an assistant and then explicitly reviewed/approved by the project's author before being committed; the judge assessment comes from a separate model, run independently outside this build session, blind to the reference assessment and (where practical) to which version it is judging.
- `data/judge-intake/` is a staging area for that externally-run judge output — files dropped there are inert until `scripts/import_judge_results.py` merges them; nothing in the shipped app writes to this directory or anywhere else on disk.
- The original implementation brief that specified this project is deliberately **not** part of this repository (see `.gitignore`) — it was working material for the build, not part of the interviewer-facing artefact. Do not attempt to recover or reference it; this file and the `docs/` directory are the authoritative description of what was built and why.

## Known limitations

See [docs/limitations.md](docs/limitations.md) for the full, current list. In brief: ten synthetic tasks are a diagnostic sample, not a statistically representative one; the reference assessment is a demonstration record, not validated ground truth; the LLM judge is a provisional signal, not a calibrated evaluator; V2's retrieval is basic deterministic matching, not semantic RAG; and the paired V1/V2 comparison is a rudimentary regression check on a fixed, reused set of ten tasks, not independent validation or monitoring.

## Current build status

Phase 2 (traceable V1 evaluation records) complete — see the "Project status" section at the top of [README.md](README.md) for what is and isn't populated yet. Update that section, this file, and `docs/` together as later phases land; do not let them drift out of sync with the actual data files.
