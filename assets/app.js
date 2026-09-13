// GenAI Locale Evaluation Workbench: static, offline, read-only app.
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
    monitoringNotes: [],
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
    ["monitoringNotes", "data/monitoring-notes.json", "json"],
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
      text: "This workbench walks through one bounded evaluation lifecycle for locale-conditioned English marketing-copy generation, worked through Australian English (en-AU): inspect a V1 baseline, explore its results, investigate one recurring pattern, then compare V1 against a V2 generation system configuration that bundles two evidence-linked fixes: lightweight retrieval-augmented context (a locale profile and terminology glossary), and an explicit no-fabrication instruction.",
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
        el("h4", { text: `${task.task_id}: ${task.business_name}` }),
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
      text: "V1 provides only the platform-level system instruction plus the user's own prompt (which names the target locale). It receives no locale profile and no terminology glossary.",
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
    container.appendChild(el("p", { class: "meta", text: "* this one subtype's source differs from the rest of its dimension: hover it, or the Source cell, for why." }));

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
      html: "<strong>These dimensions and thresholds are project-specific evaluation choices, not a universal MQM scoring standard.</strong> The design is MQM-informed, not MQM-compliant; see the README references.",
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
      block.appendChild(el("p", { class: "meta", text: "Awaiting external LLM-as-a-judge run: not yet imported." }));
      return block;
    }

    block.appendChild(statusPill(assessment.status));
    block.appendChild(el("span", { text: `: ${assessment.total_points} error point(s)` }));
    if (draft) {
      block.appendChild(el("p", { class: "meta", text: "Draft: pending Giles's explicit review before this counts as the human evaluator's assessment." }));
    }

    if (!assessment.annotations || assessment.annotations.length === 0) {
      block.appendChild(el("p", { class: "meta", text: "No annotations." }));
    } else {
      for (const a of assessment.annotations) {
        block.appendChild(el("div", { class: "annotation" }, [
          el("div", { class: "meta", text: `${a.dimension} / ${a.subtype} (${a.severity})` }),
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
        rcBody.appendChild(el("p", { html: `<strong>Terminology glossary supplied (${rc.glossary_entries.length} entries; universal, not filtered to this task):</strong>` }));
        rcBody.appendChild(el("ul", {}, rc.glossary_entries.map((g) =>
          el("li", { text: `${g.trigger_terms} → ${g.preferred_term} (${g.note})` }))));
      } else {
        rcBody.appendChild(el("p", { text: "No glossary entries supplied." }));
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
      select.appendChild(el("option", { value: task.task_id, text: `${task.task_id}: ${task.business_name}` }));
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
      const subtypes = {};
      for (const s of d.subtypes) {
        subtypes[s.id] = { name: s.name, affected: new Set(), points: 0, entries: [] };
      }
      stats[d.id] = { name: d.name, affected: new Set(), points: 0, subtypes };
    }
    for (const r of records) {
      if (source === "judge" && !judgeIsUsable(r)) continue;
      const a = assessmentFor(r, source);
      for (const ann of a.annotations || []) {
        const s = stats[ann.dimension];
        if (!s) continue;
        const points = state.rubric.severities[ann.severity].points;
        s.affected.add(r.task_id);
        s.points += points;
        const sub = s.subtypes[ann.subtype];
        if (sub) {
          sub.affected.add(r.task_id);
          sub.points += points;
          sub.entries.push({ task_id: r.task_id, severity: ann.severity, rationale: ann.rationale });
        }
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
      const btn = el("button", { type: "button", class: "link-button", text: `${tid}: ${task ? task.business_name : ""}` });
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
        text: `${e.task_id}: ${task ? task.business_name : ""} (${e.severity})`,
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
    // A <td>/<th> (e.g. one status cell in a row that has other, non-clickable
    // cells) can't have a <ul> inserted as its next sibling either: that
    // sibling would sit directly inside <tr>, which is just as invalid as a
    // <ul> sitting inside <tbody>. Anchor on the containing <tr> instead so
    // the drilldown row goes after the *row*, not after one cell of it.
    // Resolved lazily inside activate() (not here) because callers commonly
    // build the cell before appending it to its row, so .closest("tr") would
    // find nothing yet if evaluated at makeClickableStat() call time.
    const isCell = node.tagName === "TD" || node.tagName === "TH";
    const activate = () => {
      const anchorRow = isCell ? node.closest("tr") : node;
      const existing = anchorRow.nextElementSibling;
      if (existing && existing.classList.contains("drilldown-row")) {
        existing.remove();
        return;
      }
      const content = getDrilldownContent();
      if (isRow || isCell) {
        // A <ul> can't legally sit directly inside <tbody> as a <tr> sibling --
        // wrap it in its own row so the table stays valid HTML.
        const colCount = anchorRow.children.length;
        anchorRow.insertAdjacentElement("afterend", el("tr", { class: "drilldown-row" }, [
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
    return source === "reference" ? "Human evaluator" : "LLM-as-a-judge";
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

  function subtypeDrilldownTable(dimStat) {
    const rows = Object.values(dimStat.subtypes).filter((sub) => sub.affected.size > 0);
    if (rows.length === 0) {
      return el("p", { class: "meta", text: "No subtype detail (this dimension currently has no annotations)." });
    }
    const table = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Subtype" }),
        el("th", { text: "Affected outputs" }),
        el("th", { text: "Error points" }),
      ])]),
    ]);
    const tbody = el("tbody");
    for (const sub of rows) {
      const row = el("tr", {}, [
        el("td", { text: sub.name }),
        el("td", { text: String(sub.affected.size) }),
        el("td", { text: String(sub.points) }),
      ]);
      makeClickableStat(row, () => annotationDrilldownList(sub.entries));
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    return table;
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
        makeClickableStat(row, () => subtypeDrilldownTable(s));
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
      container.appendChild(table);
    }
  }

  function renderTaskSummary(records) {
    const container = document.getElementById("v3-task-summary");
    container.innerHTML = "";
    const sorted = [...records].sort((a, b) => a.task_id.localeCompare(b.task_id));
    const table = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Task" }),
        el("th", { text: "Category" }),
        el("th", { text: "Human evaluator" }),
        el("th", { text: "LLM-as-a-judge" }),
        el("th", { text: "Agree?" }),
      ])]),
    ]);
    const tbody = el("tbody");
    for (const r of sorted) {
      const task = findTask(r.task_id);
      const ref = r.reference_assessment;
      const judgeUsable = judgeIsUsable(r);
      const judge = r.judge_assessment;
      const taskBtn = el("button", { type: "button", class: "link-button", text: `${r.task_id}: ${task ? task.business_name : ""}` });
      taskBtn.addEventListener("click", () => jumpToRecord(r.task_id));
      const refCell = el("td", {}, [statusPill(ref.status), el("span", { text: ` (${ref.total_points})` })]);
      const judgeCell = judgeUsable
        ? el("td", {}, [statusPill(judge.status), el("span", { text: ` (${judge.total_points})` })])
        : el("td", { class: "meta", text: "Pending" });
      const agreeCell = judgeUsable
        ? el("td", { text: ref.status === judge.status ? "Yes" : "No" })
        : el("td", { text: "—" });
      tbody.appendChild(el("tr", {}, [
        el("td", {}, [taskBtn]),
        el("td", { text: task ? task.category_label : "" }),
        refCell,
        judgeCell,
        agreeCell,
      ]));
    }
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderDisagreements() {
    const container = document.getElementById("v3-disagreement");
    container.innerHTML = "";
    const disagreements = computeDisagreements();
    if (disagreements.length === 0) {
      container.appendChild(el("p", { class: "empty-state", text: "No human evaluator vs. LLM-as-a-judge status disagreements match the current category filter." }));
      return;
    }
    for (const d of disagreements) {
      const task = findTask(d.task_id);
      const btn = el("button", { type: "button", class: "link-button", text: `${d.task_id}: ${task ? task.business_name : ""}` });
      btn.addEventListener("click", () => jumpToRecord(d.task_id));
      container.appendChild(el("div", { class: "disagreement-row" }, [
        btn,
        statusPill(d.ref),
        el("span", { class: "disagreement-arrow", text: "→ LLM-as-a-judge:" }),
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
    renderTaskSummary(records);
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

  // ---------- View 4: investigate the pattern and recommendation ----------

  function findAnnotationById(taskId, annotationId) {
    if (!annotationId) return null;
    const r = state.v1Results.find((rec) => rec.task_id === taskId);
    if (!r) return null;
    const all = [...(r.reference_assessment.annotations || []), ...(r.judge_assessment.annotations || [])];
    return all.find((a) => a.annotation_id === annotationId) || null;
  }

  function evidenceLinkList(links) {
    return el("ul", { class: "drilldown-list" }, links.map((link) => {
      const task = findTask(link.task_id);
      const ann = findAnnotationById(link.task_id, link.annotation_id);
      const btn = el("button", {
        type: "button",
        class: "link-button",
        text: `${link.task_id}: ${task ? task.business_name : ""}`,
      });
      btn.addEventListener("click", () => jumpToRecord(link.task_id));
      const metaText = ann
        ? `${ann.dimension} / ${ann.subtype} (${ann.severity}); reference annotation ${link.annotation_id}`
        : "LLM-as-a-judge annotation on this task";
      return el("li", {}, [btn, el("div", { class: "meta", text: metaText })]);
    }));
  }

  function labeledParagraph(label, text) {
    return el("p", {}, [el("strong", { text: `${label} ` }), document.createTextNode(text)]);
  }

  function findingLabel(findingId) {
    return findingId.replace(/^F/, "Finding ");
  }

  function noteLabel(noteId) {
    return noteId.replace(/^M/, "Monitoring note ");
  }

  const RECOMMENDATION_TYPE_LABELS = { system_change: "system change", evaluator_training: "evaluator training", monitor: "monitor" };

  function findingCard(finding) {
    const obs = finding.observation;
    const badge = el("span", {
      class: "finding-badge",
      text: `Recommendation: ${RECOMMENDATION_TYPE_LABELS[finding.recommendation_type] || finding.recommendation_type}`,
    });
    const card = el("article", { class: "finding-card" }, [
      el("h3", { text: `${findingLabel(finding.finding_id)}: ${finding.title}` }),
      badge,
    ]);

    const obsSection = el("section", { class: "reasoning-step" }, [
      el("h4", { text: "1. Observation" }),
      el("p", { text: obs.summary }),
    ]);
    const statCard = el("div", { class: "metric-card" }, [
      el("div", { class: "metric-value", text: `${obs.count} / ${obs.denominator}` }),
      el("div", { class: "metric-label", text: "affected tasks" }),
    ]);
    obsSection.appendChild(statCard);
    card.appendChild(obsSection);

    card.appendChild(el("section", { class: "reasoning-step" }, [
      el("h4", { text: "2. Examples" }),
      el("p", { class: "prose", text: "Every task and annotation this finding is grounded in. Click through to see the full record." }),
      evidenceLinkList(finding.evidence_links),
    ]));

    card.appendChild(el("section", { class: "reasoning-step" }, [
      el("h4", { text: "3. Alternative explanations considered" }),
      el("ul", {}, finding.alternative_explanations.map((a) => el("li", { text: a }))),
    ]));

    card.appendChild(el("section", { class: "reasoning-step" }, [
      el("h4", { text: "4. Hypothesis" }),
      el("p", { text: finding.hypothesis }),
    ]));

    card.appendChild(el("section", { class: "reasoning-step" }, [
      el("h4", { text: "5. Recommendation and expected effect" }),
      labeledParagraph("Recommendation:", finding.proposed_recommendation),
      labeledParagraph("Expected effect:", finding.expected_effect),
    ]));

    return card;
  }

  function monitoringNoteCard(note) {
    const obs = note.observation;
    const badge = el("span", {
      class: "finding-badge",
      text: `Recommendation: ${RECOMMENDATION_TYPE_LABELS[note.recommendation_type] || note.recommendation_type}`,
    });
    const card = el("article", { class: "finding-card monitoring-note-card" }, [
      el("h3", { text: `${noteLabel(note.note_id)}: ${note.title}` }),
      badge,
      el("p", { text: obs.summary }),
    ]);
    const statCard = el("div", { class: "metric-card" }, [
      el("div", { class: "metric-value", text: `${obs.count} / ${obs.denominator}` }),
      el("div", { class: "metric-label", text: "affected tasks" }),
    ]);
    card.appendChild(statCard);
    card.appendChild(el("p", { class: "prose", text: "Evidence:" }));
    card.appendChild(evidenceLinkList(note.evidence_links));
    card.appendChild(labeledParagraph("Why not actioned:", note.why_not_actioned));
    return card;
  }

  function renderMonitoringNotes() {
    const container = document.getElementById("v4-monitoring");
    if (state.monitoringNotes.length === 0) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
    container.innerHTML = "";
    container.appendChild(el("h3", { class: "monitoring-heading", text: "Noted, not currently actioned" }));
    container.appendChild(el("p", {
      class: "prose",
      text: "Real signal that doesn't clear the bar for a finding, usually because it's a single instance rather than an established pattern. These aren't findings, so they don't get a full observation-to-recommendation chain. They're disclosed anyway, rather than silently dropped, so a reader can judge for themselves whether the evidence should have been enough to act on.",
    }));
    for (const note of state.monitoringNotes) {
      container.appendChild(monitoringNoteCard(note));
    }
  }

  function renderView4() {
    const empty = document.getElementById("v4-empty-state");
    const content = document.getElementById("v4-content");
    if (state.findings.length === 0) {
      empty.textContent = "No findings recorded yet. This view will show the observation, examples, alternative explanations, hypothesis and proposed recommendation derived from the V1 evidence.";
      empty.hidden = false;
      content.hidden = true;
      return;
    }
    empty.hidden = true;
    content.hidden = false;
    content.innerHTML = "";
    content.appendChild(el("p", {
      class: "prose",
      text: "Each finding below follows the same chain: what was observed and how often, the specific examples it's grounded in, the alternative explanations considered before accepting it as signal, the bounded hypothesis about the V1 generation system configuration, and the recommendation it motivates.",
    }));
    content.appendChild(el("p", {
      class: "prose",
      text: "Every finding drives a recommendation; they differ in type (shown on each card), and are ordered accordingly: Finding 1 and Finding 2's system-change recommendations come first, both now built into V2 in a single bundled revision (Finding 1 is the one that actually shaped this artifact's V2 design); Finding 3's evaluator-training recommendation comes last and isn't implemented anywhere in this build.",
    }));
    content.appendChild(el("p", {
      class: "prose",
      text: "A separate \"Noted, not currently actioned\" section at the bottom covers signals that don't clear the bar for a finding, usually because they're a single instance rather than an established pattern.",
    }));
    for (const finding of state.findings) {
      content.appendChild(findingCard(finding));
    }
    renderMonitoringNotes();
  }

  // ---------- View 5: compare V1 vs V2 ----------

  const STATUS_RANK = { "Pass": 0, "Needs revision": 1, "Fail": 2 };

  function dimensionName(dimId) {
    const d = state.rubric.dimensions.find((x) => x.id === dimId);
    return d ? d.name : dimId;
  }

  function subtypeName(dimId, subId) {
    const d = state.rubric.dimensions.find((x) => x.id === dimId);
    const s = d && d.subtypes.find((x) => x.id === subId);
    return s ? s.name : subId;
  }

  function deltaPill(delta) {
    const label = delta === "improved" ? "Improved" : delta === "worsened" ? "Worsened" : "Same";
    return el("span", { class: `delta-pill delta-${delta}`, text: label });
  }

  function annotationKey(a) {
    return `${a.dimension}::${a.subtype}`;
  }

  function computeAssessorDelta(a1, a2) {
    const set1 = new Set((a1.annotations || []).map(annotationKey));
    const set2 = new Set((a2.annotations || []).map(annotationKey));
    const fixed = [...set1].filter((k) => !set2.has(k));
    const introduced = [...set2].filter((k) => !set1.has(k));
    const persisting = [...set1].filter((k) => set2.has(k));
    let statusDelta = "same";
    if (STATUS_RANK[a2.status] < STATUS_RANK[a1.status]) statusDelta = "improved";
    else if (STATUS_RANK[a2.status] > STATUS_RANK[a1.status]) statusDelta = "worsened";
    return {
      v1Status: a1.status, v2Status: a2.status,
      v1Points: a1.total_points, v2Points: a2.total_points,
      statusDelta, pointsDelta: a2.total_points - a1.total_points,
      fixed, introduced, persisting,
      v1Annotations: a1.annotations || [], v2Annotations: a2.annotations || [],
    };
  }

  function computeComparisonRow(taskId) {
    const v1 = state.v1Results.find((r) => r.task_id === taskId);
    const v2 = state.v2Results.find((r) => r.task_id === taskId);
    const judgeUsable = judgeIsUsable(v1) && judgeIsUsable(v2);
    return {
      taskId,
      v1,
      v2,
      reference: computeAssessorDelta(v1.reference_assessment, v2.reference_assessment),
      judge: judgeUsable ? computeAssessorDelta(v1.judge_assessment, v2.judge_assessment) : null,
    };
  }

  function renderComparisonSummary(rows) {
    const container = el("div");
    for (const key of ["reference", "judge"]) {
      const usableRows = rows.filter((r) => r[key]);
      if (usableRows.length === 0) continue;
      const counts = { improved: 0, same: 0, worsened: 0 };
      let pointsBefore = 0, pointsAfter = 0;
      for (const r of usableRows) {
        counts[r[key].statusDelta]++;
        pointsBefore += r[key].v1Points;
        pointsAfter += r[key].v2Points;
      }
      container.appendChild(el("h4", { class: "source-group-heading", text: sourceLabel(key) }));
      container.appendChild(el("div", { class: "card-grid" }, [
        el("div", { class: "metric-card" }, [
          el("div", { class: "metric-value", text: String(counts.improved) }),
          el("div", { class: "metric-label", text: "of 10 tasks improved" }),
        ]),
        el("div", { class: "metric-card" }, [
          el("div", { class: "metric-value", text: String(counts.same) }),
          el("div", { class: "metric-label", text: "of 10 tasks unchanged" }),
        ]),
        el("div", { class: "metric-card" }, [
          el("div", { class: "metric-value", text: String(counts.worsened) }),
          el("div", { class: "metric-label", text: "of 10 tasks worsened" }),
        ]),
        el("div", { class: "metric-card" }, [
          el("div", { class: "metric-value", text: `${pointsBefore} → ${pointsAfter}` }),
          el("div", { class: "metric-label", text: "total error points, V1 to V2" }),
        ]),
      ]));
    }
    return container;
  }

  function annotationsMatchingKeys(annotations, keys) {
    const keySet = new Set(keys);
    return annotations.filter((a) => keySet.has(annotationKey(a)));
  }

  function annotationDetailList(annotations) {
    return el("ul", {}, annotations.map((a) => el("li", {}, [
      el("span", { text: `${dimensionName(a.dimension)} / ${subtypeName(a.dimension, a.subtype)} (${a.severity})` }),
      a.rationale ? el("div", { class: "meta", text: a.rationale }) : null,
    ])));
  }

  function comparisonAssessorSection(key, delta) {
    const section = el("div", { class: "reasoning-step" }, [
      el("h4", { text: `${sourceLabel(key)}: ${delta.v1Status} (${delta.v1Points}) → ${delta.v2Status} (${delta.v2Points})` }),
    ]);
    if (delta.introduced.length) {
      section.appendChild(el("p", { class: "meta", text: "New in V2:" }));
      section.appendChild(annotationDetailList(annotationsMatchingKeys(delta.v2Annotations, delta.introduced)));
    }
    if (delta.persisting.length) {
      section.appendChild(el("p", { class: "meta", text: "Persisting in both V1 and V2 (not fixed by either recommendation):" }));
      section.appendChild(annotationDetailList(annotationsMatchingKeys(delta.v2Annotations, delta.persisting)));
    }
    if (delta.fixed.length) {
      section.appendChild(el("p", { class: "meta", text: "Fixed in V2 (present in V1, gone in V2):" }));
      section.appendChild(annotationDetailList(annotationsMatchingKeys(delta.v1Annotations, delta.fixed)));
    }
    if (!delta.introduced.length && !delta.fixed.length && !delta.persisting.length) {
      section.appendChild(el("p", { class: "meta", text: "No issues found in either version." }));
    }
    return section;
  }

  function comparisonDrilldown(row) {
    const container = el("div", {}, [
      el("h4", { text: "V1 output" }),
      el("p", { class: "output-text", text: row.v1.output.text }),
      el("h4", { text: "V2 output" }),
      el("p", { class: "output-text", text: row.v2.output.text }),
      comparisonAssessorSection("reference", row.reference),
    ]);
    if (row.judge) {
      container.appendChild(comparisonAssessorSection("judge", row.judge));
    } else {
      container.appendChild(el("p", { class: "meta", text: "LLM-as-a-judge assessment not available for both versions." }));
    }
    const btn = el("button", { type: "button", class: "link-button", text: "View full V1 record in View 2" });
    btn.addEventListener("click", () => jumpToRecord(row.taskId));
    container.appendChild(btn);
    return container;
  }

  function renderComparisonTable(rows) {
    const table = el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Task" }),
        el("th", { text: "Human evaluator: V1 → V2" }),
        el("th", { text: "LLM-as-a-judge: V1 → V2" }),
      ])]),
    ]);
    const tbody = el("tbody");
    for (const row of rows) {
      const task = findTask(row.taskId);
      const refCell = el("td", {}, [
        statusPill(row.reference.v1Status),
        el("span", { text: ` (${row.reference.v1Points}) → ` }),
        statusPill(row.reference.v2Status),
        el("span", { text: ` (${row.reference.v2Points}) ` }),
        deltaPill(row.reference.statusDelta),
      ]);
      const judgeCell = row.judge
        ? el("td", {}, [
          statusPill(row.judge.v1Status),
          el("span", { text: ` (${row.judge.v1Points}) → ` }),
          statusPill(row.judge.v2Status),
          el("span", { text: ` (${row.judge.v2Points}) ` }),
          deltaPill(row.judge.statusDelta),
        ])
        : el("td", { class: "meta", text: "N/A" });
      const tr = el("tr", {}, [
        el("td", { text: `${row.taskId}: ${task ? task.business_name : ""}` }),
        refCell,
        judgeCell,
      ]);
      makeClickableStat(tr, () => comparisonDrilldown(row));
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  function renderLocaleProfile(profile) {
    const rows = [
      ["Label", profile.label],
      ["Spelling", profile.spelling],
      ["Date format", profile.date_format],
      ["Currency", `${profile.currency.symbol} (${profile.currency.code}): ${profile.currency.guidance}`],
      ["Measurement", profile.measurement],
      ["Tone notes", profile.tone_notes],
      ["Source note", profile.source_note],
    ];
    return el("table", { class: "data-table" }, [
      el("tbody", {}, rows.map(([field, value]) => el("tr", {}, [
        el("th", { text: field }),
        el("td", { text: value }),
      ]))),
    ]);
  }

  function renderTerminologyGlossary(entries) {
    return el("table", { class: "data-table" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Term ID" }),
        el("th", { text: "Trigger terms" }),
        el("th", { text: "Preferred term" }),
        el("th", { text: "Note" }),
      ])]),
      el("tbody", {}, entries.map((g) => el("tr", {}, [
        el("td", { text: g.term_id }),
        el("td", { text: g.trigger_terms.split("|").join(" / ") }),
        el("td", { text: g.preferred_term }),
        el("td", { text: g.note }),
      ]))),
    ]);
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
    content.innerHTML = "";
    content.appendChild(el("p", {
      class: "prose",
      text: "Every task re-evaluated on the same rubric, under both assessors, before and after the changes recommended in View 4. This is a rudimentary regression check on ten reused tasks, not an independent validation set: it reports whatever the stored evidence shows, including any new issues V2 introduced, not just what it fixed. Click a row for the full before/after detail, including any issue new to V2.",
    }));
    content.appendChild(el("h3", { text: "System instructions" }));
    content.appendChild(el("h4", { text: "V1" }));
    content.appendChild(el("p", {
      class: "output-text",
      text: state.v1Results.length ? state.v1Results[0].context_packet.system_instruction : "",
    }));
    content.appendChild(el("h4", { text: "V2" }));
    content.appendChild(el("p", {
      class: "output-text",
      text: state.v2Results.length ? state.v2Results[0].context_packet.system_instruction : "",
    }));
    if (state.v2Results.length) {
      const sampleContext = state.v2Results[0].context_packet.retrieved_context;
      content.appendChild(el("h3", { text: "Retrieved context (V2 only)" }));
      content.appendChild(el("p", {
        class: "prose",
        text: "Identical for every task: V1 never receives any of this. See data/locale-profiles.json and data/terminology.csv.",
      }));
      content.appendChild(el("h4", { text: "Locale profile" }));
      content.appendChild(renderLocaleProfile(sampleContext.locale_profile));
      content.appendChild(el("h4", { text: "Terminology glossary" }));
      content.appendChild(renderTerminologyGlossary(sampleContext.glossary_entries));
    }
    content.appendChild(el("h3", { text: "Summary" }));
    content.appendChild(el("p", {
      class: "prose",
      text: "The human evaluator's V2 assessment shows both system changes fully resolving the specific defect they were built to fix: none of the 5 tasks originally flagged for a non-AU spelling, date-format or terminology convention shows that issue in V2, and none of the 6 tasks originally flagged for an unsupported added claim shows one in V2 either. Total error points fell from 16 to 8 under the human evaluator and from 64 to 27 under the LLM-as-a-judge, and no task was rated worse under either assessor.",
    }));
    content.appendChild(el("p", {
      class: "prose",
      text: "This comparison reveals a pattern Monitoring note 1 had flagged as too thin to act on: a recurring tendency to miss the requested word count, not a one-off. What was a single V1 instance (T09) is now three in V2 (T06, T08, T09), the kind of recurrence Monitoring note 1 said would clear the bar for a full finding, and subsequent recommendation.",
    }));
    content.appendChild(el("h3", { text: "Detail" }));
    content.appendChild(renderComparisonSummary(state.tasks.map((t) => computeComparisonRow(t.task_id))));
    content.appendChild(el("h3", { text: "Every task, before and after" }));
    content.appendChild(renderComparisonTable(state.tasks.map((t) => computeComparisonRow(t.task_id))));
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
      box.textContent = `Could not load bundled data: ${e.message}. If you opened index.html directly from disk, browsers block local file fetches; run "python3 -m http.server 8080" from the repository root and open http://localhost:8080 instead.`;
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
