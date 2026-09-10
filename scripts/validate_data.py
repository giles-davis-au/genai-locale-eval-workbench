#!/usr/bin/env python3
"""Validate the data files in data/ against docs/data-schema.md.

Standard library only, no network access, no writes. Exits 0 if the dataset
is structurally valid (some records may still be legitimately pending --
see the WARN lines), and 1 if anything is actually wrong.

Usage:
    python3 scripts/validate_data.py
"""
import csv
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

errors = []
warnings = []


def err(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        err(f"Missing required file: {path.relative_to(ROOT)}")
        return None
    except json.JSONDecodeError as e:
        err(f"Invalid JSON in {path.relative_to(ROOT)}: {e}")
        return None


def load_csv(path):
    try:
        with open(path, "r", encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))
    except FileNotFoundError:
        err(f"Missing required file: {path.relative_to(ROOT)}")
        return []


def compute_status(annotations, severities, bands, critical_forces_fail):
    total = sum(severities[a["severity"]]["points"] for a in annotations)
    has_critical = any(a["severity"] == "critical" for a in annotations)
    if critical_forces_fail and has_critical:
        return total, "Fail"
    for band in bands:
        lo = band["min_points"]
        hi = band["max_points"]
        if total >= lo and (hi is None or total <= hi):
            return total, band["status"]
    return total, None


def main():
    rubric = load_json(DATA_DIR / "rubric.json")
    locale_profiles = load_json(DATA_DIR / "locale-profiles.json")
    terminology_rows = load_csv(DATA_DIR / "terminology.csv")
    tasks = load_json(DATA_DIR / "tasks.json")
    v1_results = load_json(DATA_DIR / "v1-results.json")
    v2_results = load_json(DATA_DIR / "v2-results.json")
    findings = load_json(DATA_DIR / "findings.json")

    if None in (rubric, locale_profiles, tasks, v1_results, v2_results, findings):
        report()
        return 1

    valid_dims = {d["id"]: {s["id"] for s in d["subtypes"]} for d in rubric["dimensions"]}
    severities = rubric["severities"]
    valid_severities = set(severities.keys())
    bands = rubric["status_policy"]["bands"]
    critical_forces_fail = rubric["status_policy"]["critical_forces_fail"]

    # --- exactly ten unique task IDs ---
    task_ids = [t["task_id"] for t in tasks]
    if len(tasks) != 10:
        err(f"Expected exactly 10 tasks, found {len(tasks)}")
    dupes = [t for t, c in Counter(task_ids).items() if c > 1]
    if dupes:
        err(f"Duplicate task_id(s) in tasks.json: {dupes}")
    task_ids_set = set(task_ids)

    for t in tasks:
        if t["target_locale"] not in locale_profiles:
            err(f"{t['task_id']}: target_locale '{t['target_locale']}' has no locale profile")

    # --- every task has one V1 and one V2 output ---
    v1_by_task = {r["task_id"]: r for r in v1_results}
    v2_by_task = {r["task_id"]: r for r in v2_results}

    for tid in task_ids_set:
        if tid not in v1_by_task:
            err(f"{tid}: missing V1 result record")
        if tid not in v2_by_task:
            err(f"{tid}: missing V2 result record")
    for tid in v1_by_task:
        if tid not in task_ids_set:
            err(f"v1-results.json references unknown task_id {tid}")
    for tid in v2_by_task:
        if tid not in task_ids_set:
            err(f"v2-results.json references unknown task_id {tid}")

    v1_dupes = [t for t, c in Counter(r["task_id"] for r in v1_results).items() if c > 1]
    v2_dupes = [t for t, c in Counter(r["task_id"] for r in v2_results).items() if c > 1]
    if v1_dupes:
        err(f"Duplicate task_id(s) in v1-results.json: {v1_dupes}")
    if v2_dupes:
        err(f"Duplicate task_id(s) in v2-results.json: {v2_dupes}")

    all_annotation_ids = []

    def check_result_record(record, version):
        tid = record.get("task_id", "?")
        label = f"{tid}-{version}"

        output = record.get("output", {})
        for field in ("text", "model_name", "run_date", "generation_notes"):
            if not output.get(field):
                err(f"{label}: output.{field} is missing or empty")

        ctx = record.get("context_packet", {})
        for field in ("system_instruction", "user_prompt"):
            if not ctx.get(field):
                err(f"{label}: context_packet.{field} is missing or empty")
        if version == "v1":
            if ctx.get("retrieved_context") is not None:
                err(f"{label}: V1 context_packet.retrieved_context should be null")
        else:
            rc = ctx.get("retrieved_context") or {}
            if not rc.get("locale_profile"):
                err(f"{label}: V2 context_packet.retrieved_context.locale_profile is missing")
            expected_ids = expected_glossary_ids(tid)
            actual_ids = {g.get("term_id") for g in rc.get("glossary_entries", [])}
            if expected_ids != actual_ids:
                err(
                    f"{label}: V2 retrieved_context.glossary_entries {sorted(actual_ids)} do not match "
                    f"deterministic retrieval {sorted(expected_ids)}"
                )

        # reference assessment
        ref = record.get("reference_assessment")
        if ref is None:
            err(f"{label}: missing reference_assessment")
        else:
            check_assessment(label, "reference", ref, all_annotation_ids, require_complete=False)
            if ref.get("review_status") not in ("pending_review", "approved"):
                err(f"{label}: reference_assessment.review_status invalid: {ref.get('review_status')!r}")
            if ref.get("review_status") == "pending_review":
                warn(f"{label}: reference assessment still pending_review (not yet approved by Giles)")
            if not ref.get("reviewed_by"):
                err(f"{label}: reference_assessment.reviewed_by is missing")

        # judge assessment
        judge = record.get("judge_assessment")
        if judge is None:
            err(f"{label}: missing judge_assessment")
        else:
            for field in ("judge_model_name", "judge_prompt_ref"):
                if not judge.get(field):
                    err(f"{label}: judge_assessment.{field} is missing")
            if judge.get("import_status") == "awaiting_external_run":
                warn(f"{label}: judge assessment awaiting external run (not yet imported)")
            elif judge.get("import_status") == "imported":
                check_assessment(label, "judge", judge, all_annotation_ids, require_complete=True)
            else:
                err(f"{label}: judge_assessment.import_status invalid: {judge.get('import_status')!r}")

    def check_assessment(label, kind, assessment, annotation_id_sink, require_complete):
        annotations = assessment.get("annotations", [])
        for a in annotations:
            aid = a.get("annotation_id")
            if kind == "reference":
                if not aid:
                    err(f"{label} {kind}: annotation missing annotation_id")
                else:
                    annotation_id_sink.append(aid)
            dim = a.get("dimension")
            sub = a.get("subtype")
            sev = a.get("severity")
            if dim not in valid_dims:
                err(f"{label} {kind}: invalid dimension '{dim}'")
            elif sub not in valid_dims[dim]:
                err(f"{label} {kind}: invalid subtype '{sub}' for dimension '{dim}'")
            if sev not in valid_severities:
                err(f"{label} {kind}: invalid severity '{sev}'")
            if not a.get("rationale"):
                err(f"{label} {kind}: annotation {aid or '?'} missing rationale")

        if not all(a.get("severity") in valid_severities for a in annotations):
            return  # can't safely recompute

        computed_points, computed_status = compute_status(annotations, severities, bands, critical_forces_fail)
        stored_points = assessment.get("total_points")
        stored_status = assessment.get("status")
        if stored_points != computed_points:
            err(
                f"{label} {kind}: stored total_points={stored_points} does not match "
                f"computed {computed_points} from annotations"
            )
        if stored_status != computed_status:
            err(
                f"{label} {kind}: stored status={stored_status!r} does not match "
                f"computed {computed_status!r} from rubric status_policy"
            )

    def expected_glossary_ids(task_id):
        task = next((t for t in tasks if t["task_id"] == task_id), None)
        if task is None:
            return set()
        ids = set()
        for row in terminology_rows:
            if row["scope"] == "category" and row["match_key"] == task["content_category"]:
                ids.add(row["term_id"])
            elif row["scope"] == "task" and row["match_key"] == task_id:
                ids.add(row["term_id"])
        return ids

    for r in v1_results:
        check_result_record(r, "v1")
    for r in v2_results:
        check_result_record(r, "v2")

    ann_dupes = [a for a, c in Counter(all_annotation_ids).items() if c > 1]
    if ann_dupes:
        err(f"Duplicate annotation_id(s): {ann_dupes}")

    # --- findings reference valid task/annotation IDs ---
    known_annotation_ids = set(all_annotation_ids)
    for f in findings:
        fid = f.get("finding_id", "?")
        for atid in f.get("observation", {}).get("affected_task_ids", []):
            if atid not in task_ids_set:
                err(f"finding {fid}: affected_task_ids references unknown task {atid}")
        for link in f.get("evidence_links", []):
            if link.get("task_id") not in task_ids_set:
                err(f"finding {fid}: evidence_links references unknown task {link.get('task_id')}")
            aid = link.get("annotation_id")
            if aid and aid not in known_annotation_ids:
                err(f"finding {fid}: evidence_links references unknown annotation_id {aid}")

    return report()


def report():
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print()
    if errors:
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"OK: 0 errors, {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
