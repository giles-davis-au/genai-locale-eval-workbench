#!/usr/bin/env python3
"""Compute each task's deterministic V2 retrieved_context (locale profile +
the full terminology glossary) from data/tasks.json, data/terminology.csv
and data/locale-profiles.json, and print it as JSON keyed by task ID.

This is the retrieval step documented in docs/data-schema.md: the platform
does not know in advance which business categories it will ever be asked to
generate copy for, so retrieval is not conditioned on task/category at all.
Every task receives the same two universal inputs: the locale profile for
its target_locale, and the entire terminology.csv glossary. Standard
library only.

The output of this script is what gets hand-assembled into each V2 record's
context_packet.retrieved_context in data/v2-results.json: this script
only computes retrieval, it does not generate marketing copy (that's the
model under test's job, not a deterministic pipeline step). Which glossary
rows actually influence a given output is a generation-time decision (only
substitutions the retrieved context genuinely motivates are applied), not
something this script filters for.

Usage:
    python3 scripts/build_v2_context.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

def load_terminology():
    with open(DATA / "terminology.csv", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def main():
    tasks = json.loads((DATA / "tasks.json").read_text())
    locale_profiles = json.loads((DATA / "locale-profiles.json").read_text())
    terminology = load_terminology()

    out = {}
    for task in tasks:
        tid = task["task_id"]
        locale = task["target_locale"]
        out[tid] = {
            "locale_profile": locale_profiles[locale],
            "glossary_entries": terminology,
        }

    print(json.dumps(out, indent=2))

if __name__ == "__main__":
    main()
