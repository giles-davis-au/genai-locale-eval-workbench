## Your role

You are an independent quality reviewer for locale-conditioned marketing copy. Below are separate tasks, each with the customer's own request, the target locale, and one piece of generated marketing copy to assess against the rubric below. Assess each task independently -- do not let one task's assessment influence another's. You have not seen and must not assume any other assessment of these outputs exists.

## Rubric

Use exactly these dimension and subtype **id** values (not the display names) in your response.

- **terminology** (Terminology): `inconsistent_with_terminology_resource`, `wrong_term`
  - Errors arising when a term does not conform to the supplied brand/terminology glossary, or when an everyday word choice is not the correct regional equivalent.
- **accuracy** (Accuracy): `addition`, `omission`, `altered_fact`
  - Errors occurring when the output does not accurately correspond to the facts and claims supplied in the task brief, through distortion, omission, or addition.
- **linguistic_conventions** (Linguistic conventions): `grammar`, `punctuation`, `spelling`
  - Errors related to the linguistic well-formedness of the text, including problems with grammaticality, spelling, and mechanical correctness.
- **style** (Style): `organization_style`, `language_register`, `awkward_style`, `unidiomatic_style`
  - Errors occurring in text that is grammatically acceptable but inappropriate because it deviates from supplied brand-voice guidance, or exhibits inappropriate register or awkward, non-idiomatic phrasing.
- **locale_conventions** (Locale conventions): `currency_format`, `date_format`, `measurement_format`, `number_format`, `time_format`, `address_format`, `telephone_format`, `shortcut_key`
  - Errors occurring when the output violates locale-specific content or formatting requirements for data elements.
- **audience_appropriateness** (Audience appropriateness): `culture_specific_reference`
  - Errors where content uses a culture-specific reference that would not be understood by, or would land oddly for, the target-locale audience.
- **constraint_compliance** (Instruction & constraint compliance): `length_violation`, `missing_required_element`, `format_violation`
  - The output satisfies the task's explicit constraints, such as required mentions, length limits or format. This dimension is not part of MQM's typology: MQM assumes a translation task with no concept of an arbitrary user-supplied constraint like a word count, so it is this project's own addition.

Severities and points:
- `minor` = 1 point(s): A small deviation that a reviewer would likely note but that would not, on its own, move an assessment out of Pass.
- `major` = 5 point(s): A deviation a locale-aware reviewer would flag as needing correction. One major-severity annotation on its own already reaches this project's Fail threshold (5+ points).
- `critical` = 10 point(s): A deviation serious enough to fail this assessment outright, such as a factual error or a violated hard constraint. This describes how the assessment is scored, not a real-time publishing gate; this project's review happens after generation, not while a live user is being served the output.

Status bands (sum your annotations' points for a task, using the bands below): Pass: 0-1; Needs revision: 2-4; Fail: 5+.

## Required output format

Respond with **only** a single JSON object, no other text before or after it, keyed by task ID, in exactly this shape:

```json
{
  "T09": {
    "annotations": [
      {
        "dimension": "...",
        "subtype": "...",
        "severity": "minor|major|critical",
        "span": "..." or null,
        "rationale": "...",
        "suggested_correction": "..." or null
      }
    ],
    "total_points": 0,
    "status": "Pass|Needs revision|Fail"
  },
  "T10": { "...": "same shape" }
}
```

An empty `annotations` array (with `total_points: 0`, `status: "Pass"`) is a valid response for a task with no issues. Only use dimension/subtype ids from the rubric above: do not invent new ones.

---

## The 2 tasks to assess

### T09

**USER REQUEST (what the customer typed):**
Marketing copy for Native Bloom, our skincare brand. We want to promote our fragrance-free moisturiser range -- it's dermatologist-tested (please use that exact wording, nothing stronger like 'clinically proven'). New customers get 20% off with the code NEW20 -- include the code exactly as written. 40-60 words please.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Introducing Native Bloom's fragrance-free moisturiser range — dermatologist-tested. New customers get 20% off with code NEW20. Nourish your skin, naturally.
"""

### T10

**USER REQUEST (what the customer typed):**
Need promo copy for Brightpath Learning's new 6-week digital marketing course. It has live weekly Zoom sessions, and there's an early-bird price of $249 if you sign up before 20 March -- please get that date right. Also mention that people get a certificate when they finish. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Master digital marketing in just 6 weeks with Brightpath Learning. Join live weekly Zoom sessions, earn a certificate on completion, and lock in the early-bird price of $249 before 20 March. Enrol now and take the next step in your career.
"""

