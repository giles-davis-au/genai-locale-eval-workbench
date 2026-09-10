#!/usr/bin/env python3
"""Merge externally-run LLM-judge JSON files from data/judge-intake/ into
data/v1-results.json and data/v2-results.json.

Standard library only. See docs/judge-prompt.md for the process this
supports: the judge is run by Giles against a separate model, outside this
repository, and its raw JSON output is dropped into data/judge-intake/ named
<task_id>-<version>.json (e.g. T01-v1.json).

Usage:
    python3 scripts/import_judge_results.py
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
INTAKE_DIR = DATA_DIR / "judge-intake"
RESULTS_FILES = {"v1": DATA_DIR / "v1-results.json", "v2": DATA_DIR / "v2-results.json"}
FILENAME_RE = re.compile(r"^(T\d{2})-(v[12])\.json$")

REQUIRED_JUDGE_KEYS = {"annotations", "total_points", "status"}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def main():
    if not INTAKE_DIR.exists():
        print(f"No intake directory at {INTAKE_DIR}", file=sys.stderr)
        return 1

    intake_files = sorted(p for p in INTAKE_DIR.glob("*.json"))
    results = {v: load_json(p) for v, p in RESULTS_FILES.items()}
    by_task = {v: {r["task_id"]: r for r in recs} for v, recs in results.items()}

    all_task_ids = sorted(by_task["v1"].keys())
    expected = {f"{tid}-{v}" for tid in all_task_ids for v in ("v1", "v2")}
    found = set()
    imported, skipped = [], []

    for path in intake_files:
        m = FILENAME_RE.match(path.name)
        if not m:
            skipped.append((path.name, "filename does not match <task_id>-<version>.json"))
            continue
        task_id, version = m.group(1), m.group(2)
        found.add(f"{task_id}-{version}")

        record = by_task.get(version, {}).get(task_id)
        if record is None:
            skipped.append((path.name, f"no matching {version} record for {task_id}"))
            continue

        try:
            payload = load_json(path)
        except json.JSONDecodeError as e:
            skipped.append((path.name, f"invalid JSON: {e}"))
            continue

        missing_keys = REQUIRED_JUDGE_KEYS - payload.keys()
        if missing_keys:
            skipped.append((path.name, f"missing required keys: {sorted(missing_keys)}"))
            continue

        judge = record["judge_assessment"]
        judge["annotations"] = payload["annotations"]
        judge["total_points"] = payload["total_points"]
        judge["status"] = payload["status"]
        judge["run_date"] = str(date.today())
        judge["import_status"] = "imported"
        imported.append(path.name)

    for version, path in RESULTS_FILES.items():
        save_json(path, results[version])

    print(f"Imported: {len(imported)}")
    for name in imported:
        print(f"  ok   {name}")
    if skipped:
        print(f"Skipped: {len(skipped)}")
        for name, reason in skipped:
            print(f"  skip {name} -- {reason}")

    missing = sorted(expected - found)
    if missing:
        print(f"\nStill awaiting {len(missing)} of {len(expected)} judge files:")
        for m in missing:
            print(f"  {m}.json")
    else:
        print("\nAll 20 judge files present and imported.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
