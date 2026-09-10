#!/usr/bin/env python3
"""Generate docs/judge-run-<version>.md: the exact, complete artefact to
upload to an external model for an independent LLM-judge pass over one
version's 10 outputs. Standard library only.

The generated file contains no version-identifying text (no "V1"/"V2"
anywhere in its content) so that uploading the whole file -- not just an
excerpt -- still keeps the judge blind to which generation version it is
assessing. See docs/judge-prompt.md for the full process this supports.

Usage:
    python3 scripts/build_judge_run.py v1
    python3 scripts/build_judge_run.py v2
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ("v1", "v2"):
        print("Usage: python3 scripts/build_judge_run.py <v1|v2>", file=sys.stderr)
        return 1
    version = sys.argv[1]

    rubric = json.loads((DATA_DIR / "rubric.json").read_text())
    tasks = json.loads((DATA_DIR / "tasks.json").read_text())
    results = json.loads((DATA_DIR / f"{version}-results.json").read_text())

    tasks_by_id = {t["task_id"]: t for t in tasks}
    results_by_id = {r["task_id"]: r for r in results}
    if not results_by_id:
        print(f"{version}-results.json has no records yet -- nothing to generate.", file=sys.stderr)
        return 1

    lines = []
    lines.append("## Your role")
    lines.append("")
    lines.append(
        "You are an independent quality reviewer for locale-conditioned marketing copy. Below are "
        "separate tasks, each with the customer's own request, the target locale, and one piece of "
        "generated marketing copy to assess against the rubric below. Assess each task independently "
        "-- do not let one task's assessment influence another's. You have not seen and must not "
        "assume any other assessment of these outputs exists."
    )
    lines.append("")
    lines.append("## Rubric")
    lines.append("")
    lines.append("Use exactly these dimension and subtype **id** values (not the display names) in your response.")
    lines.append("")
    for d in rubric["dimensions"]:
        subtype_ids = ", ".join(f"`{s['id']}`" for s in d["subtypes"])
        lines.append(f"- **{d['id']}** ({d['name']}): {subtype_ids}")
        lines.append(f"  - {d['description']}")
    lines.append("")
    lines.append("Severities and points:")
    for name, v in rubric["severities"].items():
        lines.append(f"- `{name}` = {v['points']} point(s) -- {v['description']}")
    lines.append("")
    bands = rubric["status_policy"]["bands"]
    band_desc = "; ".join(
        f"{b['status']}: {b['min_points']}" + (f"-{b['max_points']}" if b["max_points"] is not None else "+")
        for b in bands
    )
    lines.append(f"Status bands (sum your annotations' points for a task, using the bands below): {band_desc}.")
    lines.append("Any critical-severity annotation fails that task's assessment outright, regardless of point total.")
    lines.append("")
    lines.append("## Required output format")
    lines.append("")
    lines.append(
        "Respond with **only** a single JSON object, no other text before or after it, keyed by task "
        "ID, in exactly this shape:"
    )
    lines.append("")
    task_ids = sorted(results_by_id.keys())
    lines.append("```json")
    lines.append("{")
    lines.append(f'  "{task_ids[0]}": {{')
    lines.append('    "annotations": [')
    lines.append("      {")
    lines.append('        "dimension": "...",')
    lines.append('        "subtype": "...",')
    lines.append('        "severity": "minor|major|critical",')
    lines.append('        "span": "..." or null,')
    lines.append('        "rationale": "...",')
    lines.append('        "suggested_correction": "..." or null')
    lines.append("      }")
    lines.append("    ],")
    lines.append('    "total_points": 0,')
    lines.append('    "status": "Pass|Needs revision|Fail"')
    lines.append("  },")
    for tid in task_ids[1:-1]:
        lines.append(f'  "{tid}": {{ "...": "same shape" }},')
    lines.append(f'  "{task_ids[-1]}": {{ "...": "same shape" }}')
    lines.append("}")
    lines.append("```")
    lines.append("")
    lines.append(
        'An empty `annotations` array (with `total_points: 0`, `status: "Pass"`) is a valid response '
        "for a task with no issues. Only use dimension/subtype ids from the rubric above -- do not "
        "invent new ones."
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append(f"## The {len(task_ids)} tasks to assess")
    lines.append("")
    for tid in task_ids:
        task = tasks_by_id[tid]
        record = results_by_id[tid]
        lines.append(f"### {tid}")
        lines.append("")
        lines.append("**USER REQUEST (what the customer typed):**")
        lines.append(record["context_packet"]["user_prompt"])
        lines.append("")
        lines.append(f"**TARGET LOCALE:** {task['target_locale']}")
        lines.append("")
        lines.append("**GENERATED COPY TO ASSESS:**")
        lines.append('"""')
        lines.append(record["output"]["text"])
        lines.append('"""')
        lines.append("")

    out_path = ROOT / "docs" / f"judge-run-{version}.md"
    out_path.write_text("\n".join(lines) + "\n")
    print(f"Wrote {out_path.relative_to(ROOT)} ({len(task_ids)} tasks)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
