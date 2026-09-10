# Raw LLM-as-a-judge responses

Save the LLM-as-a-judge model's raw combined response here as `judge-response-<version>.json` (e.g. `judge-response-v1.json`) — the single JSON object, keyed by task ID, that came back after uploading `docs/judge-run-<version>.md`.

This folder is nested one level below `data/judge-intake/` specifically so `scripts/import_judge_results.py`'s non-recursive scan of that directory (`*.json`, direct children only) never touches these files. Nothing here is consumed directly by the importer — run `scripts/split_judge_response.py <version> data/judge-intake/responses/judge-response-<version>.json` first, which explodes it into the per-task files one level up that the importer does expect.

Kept in the repo (not just on disk somewhere) so the sent/received pair — `docs/judge-run-<version>.md` and this file — stays inspectable together as part of the project's provenance trail.
