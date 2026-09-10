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

  const dashboardState = {
    source: "reference", // "reference" | "judge" | "both"
    category: "",
    status: "",
    dimension: "",
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

  // ---------- View 1: setup ----------

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

  // ---------- View 2: V1 evaluation (inspect one complete record) ----------

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
  }

  function renderView2() {
    renderRecordInspector();
  }

  // ---------- View 3: V1 dashboard (calculated summaries, filters, drilldown) ----------

  const STATUSES = ["Pass", "Needs revision", "Fail"];

  function assessmentFor(record, source) {
    return source === "judge" ? record.judge_assessment : record.reference_assessment;
  }

  function judgeIsUsable(record) {
    return record.judge_assessment.import_status === "imported";
  }

  function activeSources() {
    return dashboardState.source === "both" ? ["reference", "judge"] : [dashboardState.source];
  }

  function recordMatchesFilters(r) {
    const task = findTask(r.task_id);
    if (dashboardState.category && (!task || task.content_category !== dashboardState.category)) return false;
    const sources = activeSources().filter((s) => s !== "judge" || judgeIsUsable(r));
    if (sources.length === 0) return false;
    const assessments = sources.map((s) => assessmentFor(r, s));
    if (dashboardState.status && !assessments.some((a) => a.status === dashboardState.status)) return false;
    if (dashboardState.dimension) {
      const hasDim = assessments.some((a) => (a.annotations || []).some((ann) => ann.dimension === dashboardState.dimension));
      if (!hasDim) return false;
    }
    return true;
  }

  function filteredV1Records() {
    return state.v1Results.filter(recordMatchesFilters);
  }

  function computeStatusCounts(records, source) {
    const counts = { Pass: [], "Needs revision": [], Fail: [] };
    for (const r of records) {
      if (source === "judge" && !judgeIsUsable(r)) continue;
      const a = assessmentFor(r, source);
      counts[a.status].push(r.task_id);
    }
    return counts;
  }

  function computeDimensionStats(records, source) {
    const stats = {};
    for (const d of state.rubric.dimensions) {
      stats[d.id] = { name: d.name, affected: new Set(), points: 0, entries: [] };
    }
    for (const r of records) {
      if (source === "judge" && !judgeIsUsable(r)) continue;
      const a = assessmentFor(r, source);
      for (const ann of a.annotations || []) {
        const s = stats[ann.dimension];
        if (!s) continue;
        s.affected.add(r.task_id);
        s.points += state.rubric.severities[ann.severity].points;
        s.entries.push({ task_id: r.task_id, subtype: ann.subtype, severity: ann.severity, rationale: ann.rationale });
      }
    }
    return stats;
  }

  function computeDisagreements() {
    const out = [];
    for (const r of state.v1Results) {
      const task = findTask(r.task_id);
      if (dashboardState.category && (!task || task.content_category !== dashboardState.category)) continue;
      if (!judgeIsUsable(r)) continue;
      const ref = r.reference_assessment.status;
      const judge = r.judge_assessment.status;
      if (ref !== judge) out.push({ task_id: r.task_id, ref, judge });
    }
    return out;
  }

  function jumpToRecord(taskId) {
    document.querySelectorAll(".nav-tab")[1].click();
    const select = document.getElementById("record-task-select");
    if (select) {
      select.value = taskId;
      select.dispatchEvent(new Event("change"));
    }
  }

  function taskDrilldownList(taskIds) {
    return el("ul", { class: "drilldown-list" }, taskIds.map((tid) => {
      const task = findTask(tid);
      const btn = el("button", { type: "button", class: "link-button", text: `${tid} — ${task ? task.business_name : ""}` });
      btn.addEventListener("click", () => jumpToRecord(tid));
      return el("li", {}, [btn]);
    }));
  }

  function annotationDrilldownList(entries) {
    return el("ul", { class: "drilldown-list" }, entries.map((e) => {
      const task = findTask(e.task_id);
      const btn = el("button", {
        type: "button",
        class: "link-button",
        text: `${e.task_id} — ${task ? task.business_name : ""}: ${e.subtype} (${e.severity})`,
      });
      btn.addEventListener("click", () => jumpToRecord(e.task_id));
      return el("li", {}, [btn, el("div", { class: "meta", text: e.rationale })]);
    }));
  }

  function makeClickableStat(node, getDrilldownContent) {
    node.classList.add("stat-clickable");
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    const isRow = node.tagName === "TR";
    const activate = () => {
      const existing = node.nextElementSibling;
      if (existing && existing.classList.contains("drilldown-row")) {
        existing.remove();
        return;
      }
      const content = getDrilldownContent();
      if (isRow) {
        // A <ul> can't legally sit directly inside <tbody> as a <tr> sibling --
        // wrap it in its own row so the table stays valid HTML.
        const colCount = node.children.length;
        node.insertAdjacentElement("afterend", el("tr", { class: "drilldown-row" }, [
          el("td", { colspan: String(colCount) }, [content]),
        ]));
      } else {
        content.classList.add("drilldown-row");
        node.insertAdjacentElement("afterend", content);
      }
    };
    node.addEventListener("click", activate);
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
    });
  }

  function sourceLabel(source) {
    return source === "reference" ? "Reference assessment" : "Provisional judge assessment";
  }

  function renderStatusCounts(records) {
    const container = document.getElementById("v3-status-counts");
    container.innerHTML = "";
    for (const source of activeSources()) {
      if (activeSources().length > 1) {
        container.appendChild(el("h4", { class: "source-group-heading", text: sourceLabel(source) }));
      }
      const counts = computeStatusCounts(records, source);
      const grid = el("div", { class: "card-grid" });
      for (const status of STATUSES) {
        const ids = counts[status];
        const card = el("div", { class: "metric-card" }, [
          el("div", { class: "metric-value", text: String(ids.length) }),
          el("div", { class: "metric-label" }, [statusPill(status)]),
        ]);
        makeClickableStat(card, () => taskDrilldownList(ids));
        grid.appendChild(card);
      }
      container.appendChild(grid);
    }
  }

  function renderDimensionBreakdown(records) {
    const container = document.getElementById("v3-dimension-breakdown");
    container.innerHTML = "";
    for (const source of activeSources()) {
      if (activeSources().length > 1) {
        container.appendChild(el("h4", { class: "source-group-heading", text: sourceLabel(source) }));
      }
      const stats = computeDimensionStats(records, source);
      const maxPoints = Math.max(1, ...state.rubric.dimensions.map((d) => stats[d.id].points));
      const table = el("table", { class: "data-table" }, [
        el("thead", {}, [el("tr", {}, [
          el("th", { text: "Dimension" }),
          el("th", { text: "Affected outputs" }),
          el("th", { text: "Error points" }),
        ])]),
      ]);
      const tbody = el("tbody");
      for (const d of state.rubric.dimensions) {
        const s = stats[d.id];
        const pointsCell = el("td", {}, [
          el("div", { class: "bar-row bar-row-compact" }, [
            el("div", { class: "bar-track" }, [
              el("div", { class: "bar-fill", style: `width:${(s.points / maxPoints) * 100}%` }),
            ]),
            el("span", { text: String(s.points) }),
          ]),
        ]);
        const row = el("tr", {}, [
          el("td", { text: d.name }),
          el("td", { text: String(s.affected.size) }),
          pointsCell,
        ]);
        makeClickableStat(row, () => annotationDrilldownList(s.entries));
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      container.appendChild(table);
    }
  }

  function renderDisagreements() {
    const container = document.getElementById("v3-disagreement");
    container.innerHTML = "";
    const disagreements = computeDisagreements();
    if (disagreements.length === 0) {
      container.appendChild(el("p", { class: "empty-state", text: "No reference-vs-judge status disagreements match the current category filter." }));
      return;
    }
    for (const d of disagreements) {
      const task = findTask(d.task_id);
      const btn = el("button", { type: "button", class: "link-button", text: `${d.task_id} — ${task ? task.business_name : ""}` });
      btn.addEventListener("click", () => jumpToRecord(d.task_id));
      container.appendChild(el("div", { class: "disagreement-row" }, [
        btn,
        statusPill(d.ref),
        el("span", { class: "disagreement-arrow", text: "→ judge:" }),
        statusPill(d.judge),
      ]));
    }
  }

  function populateDashboardFilters() {
    const categorySelect = document.getElementById("v3-category-select");
    const seen = new Set();
    for (const task of state.tasks) {
      if (seen.has(task.content_category)) continue;
      seen.add(task.content_category);
      categorySelect.appendChild(el("option", { value: task.content_category, text: task.category_label }));
    }
    const dimensionSelect = document.getElementById("v3-dimension-select");
    for (const d of state.rubric.dimensions) {
      dimensionSelect.appendChild(el("option", { value: d.id, text: d.name }));
    }

    const sourceSelect = document.getElementById("v3-source-select");
    const statusSelect = document.getElementById("v3-status-select");
    const resetBtn = document.getElementById("v3-reset-filters");

    sourceSelect.addEventListener("change", () => { dashboardState.source = sourceSelect.value; renderDashboardContent(); });
    categorySelect.addEventListener("change", () => { dashboardState.category = categorySelect.value; renderDashboardContent(); });
    statusSelect.addEventListener("change", () => { dashboardState.status = statusSelect.value; renderDashboardContent(); });
    dimensionSelect.addEventListener("change", () => { dashboardState.dimension = dimensionSelect.value; renderDashboardContent(); });
    resetBtn.addEventListener("click", () => {
      dashboardState.source = "reference";
      dashboardState.category = "";
      dashboardState.status = "";
      dashboardState.dimension = "";
      sourceSelect.value = "reference";
      categorySelect.value = "";
      statusSelect.value = "";
      dimensionSelect.value = "";
      renderDashboardContent();
    });
  }

  function renderDashboardContent() {
    const records = filteredV1Records();
    const summary = document.getElementById("v3-filter-summary");
    summary.textContent = `Showing ${records.length} of ${state.v1Results.length} V1 tasks matching the current filters.`;
    renderStatusCounts(records);
    renderDimensionBreakdown(records);
    renderDisagreements();
  }

  function renderView3() {
    const empty = document.getElementById("v3-empty-state");
    const content = document.getElementById("v3-content");
    if (state.v1Results.length === 0) {
      empty.textContent = "V1 result data has not been added yet.";
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;
    populateDashboardFilters();
    renderDashboardContent();
  }

  function renderView4() {
    const empty = document.getElementById("v4-empty-state");
    const content = document.getElementById("v4-content");
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

  function renderView5() {
    const empty = document.getElementById("v5-empty-state");
    const content = document.getElementById("v5-content");
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
        window.scrollTo(0, 0);
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
    renderView5();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
