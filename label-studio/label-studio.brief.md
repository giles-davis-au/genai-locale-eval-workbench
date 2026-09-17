# Prepare Label Studio import package

Inspect the current repository and prepare a small Label Studio import package from the latest MVP data and implementation.

The files will subsequently be imported by the user into Label Studio for a fresh human review of the V1 outputs. Your responsibility is to prepare and validate the files only.

## Source of truth

Use the current repository as the sole source of truth for:

- task structure and IDs;
- task inputs and prompts;
- V1 outputs;
- the current MVP rubric and assessment schema;
- the existing Sol LLM-as-judge assessment data.

Do not reconstruct or hardcode these details from this brief.

Do not invent, rename, simplify or add rubric categories, labels, severity levels, statuses, scores or fields.

## Required output alignment

V1 is the output that will be displayed and assessed in Label Studio.

For every prepared task:

- display the V1 output;
- import the Sol assessment that corresponds to that exact V1 output;
- represent the Sol assessment as a genuine Label Studio `prediction`;
- ensure the prediction is associated with the correct task and model;
- do not represent the Sol prediction as a human annotation.

Exclude V2 data and the existing human reference assessment entirely from the Label Studio import package.

## Files to create

Use the `label-studio/` directory and create:

### `tasks_all10.json`

All usable source tasks in Label Studio-compatible task format, containing only the task inputs, V1 outputs and matching Sol predictions required for this exercise.

### `tasks_selected.json`

Approximately six tasks selected from the source data to provide useful variation in the V1 outputs and existing Sol assessments.

Do not invent variation that is not present in the repository.

### `label_config.xml`

A minimal Label Studio configuration derived from the canonical MVP rubric and assessment schema.

It should:

- display the task information required to assess V1;
- provide controls corresponding to the existing MVP assessment fields;
- preserve the existing labels, values and field meanings;
- support the imported Sol predictions.

This is a technical translation of the MVP’s existing rubric, not a new rubric.

### `selection_report.md`

Record the selected task IDs and the repository-based rationale for selecting them.

### `validation_report.md`

Record:

- task and prediction counts;
- duplicate-ID checks;
- required-field checks;
- confirmation that every displayed output is V1;
- confirmation that every Sol prediction corresponds to the exact V1 output displayed;
- any schema mappings or limitations;
- confirmation that V2 and the human reference assessment were excluded.

## Boundaries

Do not:

- perform the Label Studio import or review workflow;
- create human annotations;
- compare annotations with predictions;
- export Label Studio results;
- make live model calls;
- add evaluators or evaluation results;
- modify unrelated repository files;
- include secrets.
- commit or push any changes until explicitly requested by Giles

Use Label Studio’s supported task and prediction structures. Preserve the source Sol assessment faithfully within the prediction structure wherever the schema permits.

If a material ambiguity prevents faithful mapping of the MVP assessment or Sol prediction into Label Studio, ask one focused question before creating the affected files rather than guessing.