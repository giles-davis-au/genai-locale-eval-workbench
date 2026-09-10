#!/usr/bin/env python3
"""Split a single combined LLM-as-a-judge response (one JSON object keyed by
task ID, the shape produced by pasting docs/judge-run-<version>.md into an
LLM-as-a-judge model) into the individual
data/judge-intake/<task_id>-<version>.json files that
scripts/import_judge_results.py expects. Standard library only.

Usage:
    python3 scripts/split_judge_response.py v1 path/to/combined-response.json
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTAKE_DIR = ROOT / "data" / "judge-intake"

REQUIRED_KEYS = {"annotations", "total_points", "status"}


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ("v1", "v2"):
        print("Usage: python3 scripts/split_judge_response.py <v1|v2> <path-to-combined-response.json>", file=sys.stderr)
        return 1
    version = sys.argv[1]
    src_path = Path(sys.argv[2])

    try:
        combined = json.loads(src_path.read_text())
    except FileNotFoundError:
        print(f"No such file: {src_path}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in {src_path}: {e}", file=sys.stderr)
        return 1

    if not isinstance(combined, dict):
        print("Expected a top-level JSON object keyed by task ID.", file=sys.stderr)
        return 1

    INTAKE_DIR.mkdir(parents=True, exist_ok=True)
    written, skipped = [], []
    for task_id, payload in combined.items():
        if not isinstance(payload, dict) or not REQUIRED_KEYS.issubset(payload.keys()):
            skipped.append((task_id, f"missing required keys: {sorted(REQUIRED_KEYS - set(payload if isinstance(payload, dict) else {}))}"))
            continue
        out_path = INTAKE_DIR / f"{task_id}-{version}.json"
        out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
        written.append(out_path.name)

    print(f"Wrote {len(written)} file(s) to {INTAKE_DIR.relative_to(ROOT)}:")
    for name in written:
        print(f"  {name}")
    if skipped:
        print(f"Skipped {len(skipped)}:")
        for tid, reason in skipped:
            print(f"  {tid}: {reason}")
    print("\nNext: python3 scripts/import_judge_results.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
