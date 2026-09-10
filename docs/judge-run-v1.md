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
  - The output satisfies the task's explicit constraints, such as required mentions, length limits or format. This dimension is not part of MQM's typology -- MQM assumes a translation task with no concept of an arbitrary user-supplied constraint like a word count, so it is this project's own addition.

Severities and points:
- `minor` = 1 point(s) -- A small deviation that a reviewer would likely note but that would not, on its own, move an assessment out of Pass.
- `major` = 5 point(s) -- A deviation a locale-aware reviewer would flag as needing correction. One major-severity annotation on its own already reaches this project's Fail threshold (5+ points).
- `critical` = 10 point(s) -- A deviation serious enough to fail this assessment outright, such as a factual error or a violated hard constraint. This describes how the assessment is scored, not a real-time publishing gate -- this project's review happens after generation, not while a live user is being served the output.

Status bands (sum your annotations' points for a task, using the bands below): Pass: 0-1; Needs revision: 2-4; Fail: 5+.
Any critical-severity annotation fails that task's assessment outright, regardless of point total.

## Required output format

Respond with **only** a single JSON object, no other text before or after it, keyed by task ID, in exactly this shape:

```json
{
  "T01": {
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
  "T02": { "...": "same shape" },
  "T03": { "...": "same shape" },
  "T04": { "...": "same shape" },
  "T05": { "...": "same shape" },
  "T06": { "...": "same shape" },
  "T07": { "...": "same shape" },
  "T08": { "...": "same shape" },
  "T09": { "...": "same shape" },
  "T10": { "...": "same shape" }
}
```

An empty `annotations` array (with `total_points: 0`, `status: "Pass"`) is a valid response for a task with no issues. Only use dimension/subtype ids from the rubric above -- do not invent new ones.

---

## The 10 tasks to assess

### T01

**USER REQUEST (what the customer typed):**
Hi, I run Rowan & Ash, a sustainable clothing label based in Sydney. Can you write some short marketing copy for this week's promotion? We've got 20% off our puffer jackets, and free shipping on any order over $75 -- plus we just launched a new merino wool range if you want to mention that too. Keep it to one short paragraph, around 40-60 words, no headings. Please don't say anything about organic cotton or fabric claims we haven't given you -- the jackets aren't organic cotton.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Layer up for less this week at Rowan & Ash — get 20% off our puffer jackets, our best-selling outerwear for the cooler months. Plus, enjoy free shipping on all orders over $75. Don't miss our new merino wool range, made to keep you warm without compromising on style. Shop now before the sale ends.
"""

### T02

**USER REQUEST (what the customer typed):**
Need promo copy for Cartly -- we're a same-day grocery and meal delivery service. We currently only deliver in Melbourne and Brisbane, so please mention both cities. Minimum order is $30, and new customers get $10 credit on their first order only (not every order, just to be clear). Around 40-60 words please.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Cartly now delivers same-day in Melbourne and Brisbane, bringing your groceries and favorite meals straight to your door. Place an order of $30 or more and get $10 credit on your first order. Fast, fresh, and hassle-free — download the app and start shopping today!
"""

### T03

**USER REQUEST (what the customer typed):**
Writing copy for Pulse Studio, a boutique gym. We're opening a new location in Perth and want to promote memberships. Key points: no lock-in contract, and a 7-day free trial (please say exactly 7 days). Make sure the Perth opening gets a mention. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Pulse Studio is opening a brand-new location in Perth, and we want you to be part of it. Enjoy a 7-day free trial with no lock-in contract — just walk in, work out, and see the difference. Flexible memberships, expert trainers, and a community that keeps you motivated. Your first class is on us.
"""

### T04

**USER REQUEST (what the customer typed):**
Can you draft a short flyer-style promo for Riverside Markets? It's a community market run by the local council, on every first Sunday of the month -- not weekly. Entry is free, and there's local produce plus live music, with parking on site for stallholders and visitors. Keep it under 50 words and make it feel like a flyer, not a full paragraph.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Join us at Riverside Markets — free entry, first Sunday of every month! Browse local produce, enjoy live music, and support your community. Parking available on site. See you there!
"""

### T05

**USER REQUEST (what the customer typed):**
Marketing copy needed for Feld & Co, a homewares brand. This weekend only we've got 15% off doona covers from our linen bedding range, and we ship Australia-wide. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
This weekend only, save 15% on doona covers from our linen bedding range at Feld & Co. Soft, breathable, and made to last — refresh your bedroom with timeless style. Ships Australia-wide, so everyone can enjoy the comfort of quality linen, no matter where you live.
"""

### T06

**USER REQUEST (what the customer typed):**
Copy for Wanderlow, we make travel accessories. Want to promote our cabin bags -- they're carry-on compliant, come with a lifetime warranty, and right now people get 10% off if they sign up to our newsletter. Please mention all three of those. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Travel smarter with Wanderlow's carry-on compliant cabin bags, built for the modern traveler. Backed by a lifetime warranty, they're designed to go the distance — trip after trip. Sign up for our newsletter today and get 10% off your first purchase.
"""

### T07

**USER REQUEST (what the customer typed):**
Need a short promo for ReelHouse, our streaming service. We want to highlight the 30-day free trial, our ad-free tier which is $12.99 a month (please use that exact price), and a new Australian-made drama series that's launching. Keep it under 45 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Stream more, pay less. Get 30 days free on ReelHouse, then enjoy our ad-free tier for just $12.99/month. Don't miss our brand-new Australian drama series, launching exclusively on ReelHouse this month.
"""

### T08

**USER REQUEST (what the customer typed):**
Promo copy for Milk & Bean -- we're a café chain. We've got a coffee loyalty stamp card in our app: buy 5 coffees, get the 6th free. It's only valid at our Melbourne CBD stores, and the offer ends at the end of the month, so please mention both of those restrictions. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Buy 5 coffees, get your 6th free — only at Milk & Bean! Just tap your order in the app to start collecting stamps. Valid at Melbourne CBD stores only, offer ends this month. Grab your coffee to go and start earning today.
"""

### T09

**USER REQUEST (what the customer typed):**
Marketing copy for Native Bloom, our skincare brand. We want to promote our fragrance-free moisturiser range -- it's dermatologist-tested (please use that exact wording, nothing stronger like 'clinically proven'). New customers get 20% off with the code NEW20 -- include the code exactly as written. 40-60 words please.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Introducing Native Bloom's fragrance-free moisturizer range — gentle, effective, and dermatologist-tested for even the most sensitive skin. New customers get 20% off with code NEW20. Nourish your skin, naturally.
"""

### T10

**USER REQUEST (what the customer typed):**
Need promo copy for Brightpath Learning's new 6-week digital marketing course. It has live weekly Zoom sessions, and there's an early-bird price of $249 if you sign up before 20 March -- please get that date right. Also mention that people get a certificate when they finish. 40-60 words.

**TARGET LOCALE:** en-AU

**GENERATED COPY TO ASSESS:**
"""
Master digital marketing in just 6 weeks with Brightpath Learning. Join live weekly Zoom sessions, earn a certificate on completion, and lock in the early-bird price of $249 before March 20. Enroll now and take the next step in your career.
"""

