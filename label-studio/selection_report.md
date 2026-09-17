# Selection report — `tasks_selected.json`

Selected task IDs (6 of 10): **T01, T02, T04, T06, T09, T10**

All rationale below is drawn directly from `data/v1-results.json`'s `judge_assessment` blocks (the Sol LLM-as-judge assessment of each V1 output) and `data/tasks.json`. Nothing here is invented; where a form of variation does not occur anywhere in the 10 V1 records, that is stated as a limitation rather than worked around.

## Per-task rationale

| Task | Sol status / points | Annotations | Why selected |
|---|---|---|---|
| **T04** | Pass / 0 | 0 | The only V1 output with zero Sol annotations. Needed as a baseline "clean" case — a task whose prediction has no `result` items at all, distinct from every other selected task. |
| **T02** | Pass / 1 | 1 (`linguistic_conventions`/`spelling`, minor) | A `Pass`-status output that still carries one minor, span-anchored issue. Shows the lightest non-empty case, and is the only `Pass` task (besides T04) with any annotation at all. |
| **T01** | Fail / 15 | 2 (both `accuracy`/`addition`, severities `major` and `critical`) | Two annotations from the *same* dimension/subtype but different severities on one output — demonstrates that severity varies independently of dimension/subtype, and that a single output can carry multiple distinct highlighted regions. |
| **T06** | Fail / 6 | 2 (`linguistic_conventions`/`spelling` minor; `accuracy`/`addition` major) | Two annotations spanning *two different* dimensions on one output, unlike T01's same-dimension pair — adds dimension variety within a single task. |
| **T10** | Fail / 6 | 2 (`locale_conventions`/`date_format` major; `linguistic_conventions`/`spelling` minor) | The only occurrence anywhere in the 10 V1 records of the `locale_conventions` dimension (a date-format issue, "March 20"). Without T10, that dimension would be entirely unrepresented in the selected set. |
| **T09** | Fail / 16 | 3 (`linguistic_conventions`/`spelling` minor; `accuracy`/`addition` major; `constraint_compliance`/`length_violation` **critical, `span: null`**) | The only V1 record whose Sol assessment includes an annotation with no specific text span (a whole-output length-constraint violation). This is the one case that exercises the document-level (non-region) controls in `label_config.xml` rather than the span-highlighting controls — essential to include, since no other task can substitute for it. Also the highest point total (16) and the only 3-annotation record. |

## Coverage this selection gives you

- **Status spread:** both `Pass` (T02, T04) and `Fail` (T01, T06, T09, T10) are represented — `Needs revision` does not occur in any V1 Sol assessment, so it cannot be represented (see Limitations).
- **Annotation-count spread:** 0 (T04), 1 (T02), 2 (T01, T06, T10), 3 (T09).
- **Severity spread:** `minor` (T02, T06, T10), `major` (T01, T06, T09, T10), `critical` (T01, T09).
- **Region type:** of the 10 annotations across the 6 selected tasks, 9 are span-anchored; T09 alone contributes the one null-span, whole-output annotation.
- **Dimensions actually exercised across the selection:** `accuracy` (addition), `linguistic_conventions` (spelling), `locale_conventions` (date_format), `constraint_compliance` (length_violation) — 4 of the rubric's 7 dimensions.
- **Content-category spread:** clothing (T01), food_delivery (T02), community_event (T04), travel_accessories (T06), personal_care (T09), online_course (T10) — six different categories, incidentally, since each task in the repo has a distinct category.

## Limitations / ambiguities

- **Three rubric dimensions never occur in any of the 10 V1 Sol assessments:** `terminology`, `style`, and `audience_appropriateness` have zero annotations across the entire V1 dataset (not just the selected six). No task selection can demonstrate variation in these dimensions without inventing an annotation that doesn't exist in the source data, which the brief explicitly prohibits. `label_config.xml` still exposes controls for all rubric dimensions/subtypes (so a live reviewer *could* use them), but no imported Sol prediction will ever populate them for these six tasks, or indeed for any of the 10.
- **`Needs revision` status never occurs in the V1 Sol assessments** (only `Pass` and `Fail` appear), so that status cannot be represented by task selection either — it exists only in the rubric's status-band definition, not in this data.
- **Selection size:** exactly 6 tasks were chosen (within the brief's "approximately six"), on the basis that every additional axis of variation identified above (status, annotation count, severity, region type, dimension) is already covered by these six; a 7th or 8th task would add duplicate coverage of an axis already represented rather than new coverage.
