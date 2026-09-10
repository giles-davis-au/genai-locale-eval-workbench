# Judge intake staging folder

Drop the raw JSON response for each judge call here, named `<task_id>-<version>.json` (e.g. `T01-v1.json`, `T01-v2.json`), per the process in [../../docs/judge-prompt.md](../../docs/judge-prompt.md).

Run `python3 scripts/import_judge_results.py` to merge these into `data/v1-results.json` and `data/v2-results.json`. Files are left in place after import for provenance; re-running the import is safe and idempotent.
