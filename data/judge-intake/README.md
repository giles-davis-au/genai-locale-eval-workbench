# Judge intake staging folder

Files here are named `<task_id>-<version>.json` (e.g. `T01-v1.json`, `T01-v2.json`) and contain one task's judge output — see [../../docs/judge-prompt.md](../../docs/judge-prompt.md) for the full process.

They're not hand-written: upload `docs/judge-run-<version>.md` to the external judge, save its single combined response as `responses/judge-response-<version>.json` (see that folder's own README for why it's nested here), then run `python3 scripts/split_judge_response.py <version> data/judge-intake/responses/judge-response-<version>.json` to explode it into the individual files here.

Run `python3 scripts/import_judge_results.py` to merge these into `data/v1-results.json` and `data/v2-results.json`. Files are left in place after import for provenance; re-running the import is safe and idempotent.
