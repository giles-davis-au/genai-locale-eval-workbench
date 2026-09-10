// GenAI Locale Evaluation Workbench — static, offline, read-only app.
// No network calls other than fetching bundled files in data/. No persistence.

(function () {
  "use strict";

  const state = {
    rubric: null,
    localeProfiles: null,
    terminology: [],
    tasks: [],
    v1Results: [],
    v2Results: [],
    findings: [],
    loadError: null,
  };

  const DATA_FILES = [
    ["rubric", "data/rubric.json", "json"],
    ["localeProfiles", "data/locale-profiles.json", "json"],
    ["terminology", "data/terminology.csv", "csv"],
    ["tasks", "data/tasks.json", "json"],
    ["v1Results", "data/v1-results.json", "json"],
    ["v2Results", "data/v2-results.json", "json"],
    ["findings", "data/findings.json", "json"],
  ];

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuotes = false; }
        else { field += c; }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        row.push(field); field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    const header = rows.shift();
    return rows.map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
  }

  async function loadAll() {
    for (const [key, path, kind] of DATA_FILES) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load ${path}: HTTP ${res.status}`);
      state[key] = kind === "json" ? await res.json() : parseCsv(await res.text());
    }
  }

  // ---------- small render helpers ----------

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "text") node.textContent = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    for (const child of children || []) {
      if (child) node.appendChild(child);
    }
    return node;
  }

  function statusPillClass(status) {
    if (status === "Pass") return "status-pass";
    if (status === "Needs revision") return "status-needs-revision";
    if (status === "Fail") return "status-fail";
    return "status-pending";
  }

  function statusPill(status) {
    return el("span", { class: `status-pill ${statusPillClass(status)}`, text: status || "Pending" });
  }

  function findTask(taskId) {
    return state.tasks.find((t) => t.task_id === taskId);
  }

  // ---------- View 1: setup and record inspection ----------

  function renderPurpose() {
    const container = document.getElementById("purpose-content");
    container.appendChild(el("p", {
      text: "This workbench walks through one bounded evaluation lifecycle for locale-conditioned English marketing-copy generation, worked through Australian English (en-AU): inspect a V1 baseline, explore its results, investigate one recurring pattern, then compare V1 against a V2 generation configuration that adds lightweight retrieval-augmented context.",
    }));
    container.appendChild(el("p", {
      text: "It is a preloaded, reproducible case study, not a live AI product. It contains no database, build step, package installation or external runtime dependency, and it makes no network requests.",
    }));
    container.appendChild(el("p", {
      text: "It does not demonstrate professional evaluator, localisation-specialist, ML-engineer or production-platform experience, and its conclusions do not extend beyond what ten synthetic tasks can support. See docs/limitations.md for the full list of limits.",
    }));
  }

  function renderTasks() {
    const container = document.getElementById("tasks-list");
    for (const task of state.tasks) {
      const card = el("div", { class: "task-card" }, [
        el("span", { class: "category-tag", text: task.category_label }),
        el("h4", { text: `${task.task_id} — ${task.business_name}` }),
        el("p", { text: task.brief }),
        el("p", { html: "<strong>User prompt (what was actually sent):</strong>" }),
        el("p", { class: "output-text", text: task.user_prompt }),
      ]);
      container.appendChild(card);
    }
  }

  function renderV1Config() {
    const container = document.getElementById("v1-config-content");
    const sample = state.v1Results[0];
    const instruction = sample
      ? sample.context_packet.system_instruction
      : "Write concise marketing copy appropriate for the specified target locale. Preserve all supplied facts and satisfy the stated constraints.";
    container.appendChild(el("p", {
      text: "V1 provides only the platform-level system instruction plus the user's own prompt (which names the target locale). It receives no locale profile and no terminology or brand glossary.",
    }));
    container.appendChild(el("p", { html: `<strong>V1 system instruction (verbatim):</strong>` }));
    container.appendChild(el("p", { class: "output-text", text: instruction }));
  }

  const SOURCE_LABELS = { mqm_core: "MQM Core", project_addition: "Project addition" };

  function linkifyParagraph(text) {
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
  }

  function renderRubric() {
    const container = document.getElementById("rubric-content");
    const rubric = state.rubric;
    const framingParagraphs = Array.isArray(rubric.framing) ? rubric.framing : [rubric.framing];
    for (const para of framingParagraphs) {
      container.appendChild(el("p", { html: linkifyParagraph(para) }));
    }

    const dimTable = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Dimension" }),
        el("th", { text: "Source" }),
        el("th", { text: "Subtypes" }),
        el("th", { text: "Description" }),
      ])]),
      el("tbody", {}, rubric.dimensions.map((d) => {
        const subtypeNodes = [];
        d.subtypes.forEach((s, i) => {
          if (i > 0) subtypeNodes.push(document.createTextNode(", "));
          if (s.source !== d.source) {
            subtypeNodes.push(el("span", {
              title: s.source_note || `${SOURCE_LABELS[s.source] || s.source}, unlike the rest of this dimension.`,
              text: `${s.name}*`,
            }));
          } else {
            subtypeNodes.push(document.createTextNode(s.name));
          }
        });
        return el("tr", {}, [
          el("td", { text: d.name }),
          el("td", d.source_note ? { title: d.source_note, text: SOURCE_LABELS[d.source] || d.source } : { text: SOURCE_LABELS[d.source] || d.source }),
          el("td", {}, subtypeNodes),
          el("td", { text: d.description }),
        ]);
      })),
    ]);
    container.appendChild(dimTable);
    container.appendChild(el("p", { class: "meta", text: "* this one subtype's source differs from the rest of its dimension -- hover it, or the Source cell, for why." }));

    const sevTable = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [el("th", { text: "Severity" }), el("th", { text: "Points" }), el("th", { text: "Description" })])]),
      el("tbody", {}, Object.entries(rubric.severities).map(([name, v]) => el("tr", {}, [
        el("td", { text: name }),
        el("td", { text: String(v.points) }),
        el("td", { text: v.description }),
      ]))),
    ]);
    container.appendChild(sevTable);

    container.appendChild(el("p", { text: rubric.status_policy.description }));
    const bandTable = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [el("th", { text: "Status" }), el("th", { text: "Point range" })])]),
      el("tbody", {}, rubric.status_policy.bands.map((b) => el("tr", {}, [
        el("td", {}, [statusPill(b.status)]),
        el("td", { text: b.max_points == null ? `${b.min_points}+` : `${b.min_points}–${b.max_points}` }),
      ]))),
    ]);
    container.appendChild(bandTable);
    container.appendChild(el("p", {
      html: "<strong>These dimensions and thresholds are project-specific evaluation choices, not a universal MQM scoring standard.</strong> The design is MQM-informed, not MQM-compliant — see the README references.",
    }));
  }

  function renderAssessment(kind, assessment) {
    const label = kind === "reference" ? "reference" : "judge";
    const block = el("div", { class: `assessment-block ${label}` }, [
      el("span", { class: "assessment-label", text: assessment.label }),
    ]);
    const pending = kind === "judge" && assessment.import_status === "awaiting_external_run";
    const draft = kind === "reference" && assessment.review_status === "pending_review";

    if (pending) {
      block.appendChild(el("p", { class: "meta", text: "Awaiting external judge run — not yet imported." }));
      return block;
    }

    block.appendChild(statusPill(assessment.status));
    block.appendChild(el("span", { text: ` — ${assessment.total_points} error point(s)` }));
    if (draft) {
      block.appendChild(el("p", { class: "meta", text: "Draft — pending Giles's explicit review before this counts as the reference assessment." }));
    }

    if (!assessment.annotations || assessment.annotations.length === 0) {
      block.appendChild(el("p", { class: "meta", text: "No annotations." }));
    } else {
      for (const a of assessment.annotations) {
        block.appendChild(el("div", { class: "annotation" }, [
          el("div", { class: "meta", text: `${a.dimension} / ${a.subtype} — ${a.severity}` }),
          a.span ? el("p", { html: `<em>“${a.span}”</em>` }) : null,
          el("p", { text: a.rationale }),
          a.suggested_correction ? el("p", { text: `Suggested correction: ${a.suggested_correction}` }) : null,
        ]));
      }
    }
    return block;
  }

  function renderContextPacket(ctx) {
    const rc = ctx.retrieved_context;
    const dl = el("dl", { class: "context-packet" }, [
      el("dt", { text: "System instruction (platform-level, hidden from the user)" }),
      el("dd", { class: "output-text", text: ctx.system_instruction }),
      el("dt", { text: "User prompt (what the synthetic user actually typed)" }),
      el("dd", { class: "output-text", text: ctx.user_prompt }),
    ]);
    if (rc) {
      const rcBody = el("div", {}, [
        el("p", { html: "<strong>Locale profile:</strong>" }),
        el("pre", { class: "output-text", text: JSON.stringify(rc.locale_profile, null, 2) }),
      ]);
      if (rc.glossary_entries && rc.glossary_entries.length) {
        rcBody.appendChild(el("p", { html: `<strong>Glossary entries retrieved (${rc.glossary_entries.length}):</strong>` }));
        rcBody.appendChild(el("ul", {}, rc.glossary_entries.map((g) =>
          el("li", { text: `${g.trigger_terms} → ${g.preferred_term} (${g.note})` }))));
      } else {
        rcBody.appendChild(el("p", { text: "No glossary entries matched this task." }));
      }
      dl.appendChild(el("dt", { text: "Retrieved context (platform-injected, hidden from the user)" }));
      dl.appendChild(el("dd", {}, [rcBody]));
    }
    return dl;
  }

  function renderRecordDetail(taskId) {
    const container = document.getElementById("record-detail");
    container.innerHTML = "";
    const task = findTask(taskId);
    const v1 = state.v1Results.find((r) => r.task_id === taskId);
    if (!task || !v1) {
      container.appendChild(el("p", { class: "empty-state", text: "V1 result data for this task is not yet available." }));
      return;
    }
    container.appendChild(el("h4", { text: "V1 context packet" }));
    container.appendChild(renderContextPacket(v1.context_packet));
    container.appendChild(el("h4", { text: "V1 raw output" }));
    container.appendChild(el("p", { class: "output-text", text: v1.output.text }));
    container.appendChild(el("p", { class: "meta", text: `Model: ${v1.output.model_name} · Run date: ${v1.output.run_date}` }));
    container.appendChild(el("h4", { text: "Assessments" }));
    container.appendChild(renderAssessment("reference", v1.reference_assessment));
    container.appendChild(renderAssessment("judge", v1.judge_assessment));
  }

  function renderRecordInspector() {
    const select = document.getElementById("record-task-select");
    for (const task of state.tasks) {
      select.appendChild(el("option", { value: task.task_id, text: `${task.task_id} — ${task.business_name}` }));
    }
    select.addEventListener("change", () => renderRecordDetail(select.value));
    if (state.tasks.length) renderRecordDetail(state.tasks[0].task_id);
  }

  function renderView1() {
    renderPurpose();
    renderTasks();
    renderV1Config();
    renderRubric();
    renderRecordInspector();
  }

  // ---------- Views 2-4: populated once results/findings data exists ----------

  function renderView2() {
    const empty = document.getElementById("v2-empty-state");
    const content = document.getElementById("v2-content");
    // V1 result data exists (see View 1), but this view's summaries, filters and
    // drilldowns are not implemented yet -- that lands in Phase 3. Gate on that,
    // not on data presence, so this doesn't silently render an empty panel once
    // data/v1-results.json is populated.
    empty.textContent = "V1 result data is loaded (see View 1 for the 10 records), but this view's Pass/Needs revision/Fail summary, error-point breakdown by dimension, and reference-vs-judge comparison have not been implemented yet.";
    empty.hidden = false;
    content.hidden = true;
  }

  function renderView3() {
    const empty = document.getElementById("v3-empty-state");
    const content = document.getElementById("v3-content");
    if (state.findings.length === 0) {
      empty.textContent = "No findings recorded yet. This view will show the observation, examples, alternative explanations, hypothesis and proposed V2 intervention derived from the V1 evidence.";
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;
    // Full implementation lands in Phase 3 (evidence-linked V1 pattern analysis).
  }

  function renderView4() {
    const empty = document.getElementById("v4-empty-state");
    const content = document.getElementById("v4-content");
    if (state.v2Results.length === 0) {
      empty.textContent = "V2 result data has not been added yet. This view will pair each task's V1 and V2 context, output, assessments, and surface any new errors introduced in V2.";
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;
    // Full implementation lands in Phase 4 (retrieval-augmented V2 comparison).
  }

  // ---------- navigation ----------

  function setupNav() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.removeAttribute("aria-current"));
        tab.setAttribute("aria-current", "page");
        document.querySelectorAll("[data-view-panel]").forEach((panel) => {
          panel.hidden = panel.id !== tab.dataset.view;
        });
      });
    });
  }

  // ---------- boot ----------

  async function boot() {
    setupNav();
    try {
      await loadAll();
    } catch (e) {
      const box = document.getElementById("v1-load-error");
      box.hidden = false;
      box.textContent = `Could not load bundled data: ${e.message}. If you opened index.html directly from disk, browsers block local file fetches — run "python3 -m http.server 8080" from the repository root and open http://localhost:8080 instead.`;
      return;
    }
    renderView1();
    renderView2();
    renderView3();
    renderView4();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
