/**
 * Chat agent — intents + runners.
 * UI can call runAgent(user, intent) with a structured intent (reliable),
 * or parseUserMessage(text) for natural language.
 */

import {
  guideResolveProject,
  guideGetProjectDetails,
  guideGetProjectWorkSummary,
  guideGetEmployeeWorklogs,
  guideGetRework,
  guideGetSubactivity,
  guideGetTaskPlanners,
  guideGetEmployeeReport,
  guideListAllProjects,
  clientDisplayName,
} from "./guideApi";
import { buildWeeklyTimeLogReport } from "./weeklyReport";
import {
  PROJECT_SOURCE_IDS,
  PROJECT_TYPE_LABELS,
} from "../../constants/projectSources";

function pad(n) {
  return String(n).padStart(2, "0");
}

export function toYmd(d) {
  const x = d instanceof Date ? d : new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

export function startOfMonth(d = new Date()) {
  const x = new Date(d);
  return new Date(x.getFullYear(), x.getMonth(), 1);
}

export function rangeLastWeek() {
  const thisMonday = startOfWeek(new Date());
  const lastMonday = addDays(thisMonday, -7);
  const lastFriday = addDays(lastMonday, 4);
  return {
    start_date: toYmd(lastMonday),
    end_date: toYmd(lastFriday),
    label: "Last week",
  };
}

export function rangeThisWeek() {
  return {
    start_date: toYmd(startOfWeek(new Date())),
    end_date: toYmd(new Date()),
    label: "This week",
  };
}

export function rangeThisMonth() {
  return {
    start_date: toYmd(startOfMonth(new Date())),
    end_date: toYmd(new Date()),
    label: "This month",
  };
}

export function rangeLastMonth() {
  const firstThis = startOfMonth(new Date());
  const end = addDays(firstThis, -1);
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return {
    start_date: toYmd(start),
    end_date: toYmd(end),
    label: "Last month",
  };
}

export function rangeLast7Days() {
  return {
    start_date: toYmd(addDays(new Date(), -6)),
    end_date: toYmd(new Date()),
    label: "Last 7 days",
  };
}

export function parseDateRangeFromText(text) {
  const lower = (text || "").toLowerCase();
  const fromM = text.match(/from\s+(\d{4}-\d{2}-\d{2})/i);
  const toM = text.match(/to\s+(\d{4}-\d{2}-\d{2})/i);
  const between = text.match(
    /(\d{4}-\d{2}-\d{2})\s*(?:to|–|-|until)\s*(\d{4}-\d{2}-\d{2})/i
  );

  const normalize = (start, end, label) => {
    if (start && end && start > end) {
      return {
        start_date: end,
        end_date: start,
        label: label || `${end} → ${start}`,
        swapped: true,
      };
    }
    return {
      start_date: start,
      end_date: end,
      label: label || `${start} → ${end}`,
    };
  };

  if (between) {
    return normalize(between[1], between[2], `${between[1]} → ${between[2]}`);
  }
  if (fromM || toM) {
    const start = fromM?.[1] || rangeLast7Days().start_date;
    const end = toM?.[1] || toYmd(new Date());
    return normalize(start, end, `${fromM?.[1] || "…"} → ${toM?.[1] || "today"}`);
  }
  if (/yesterday/i.test(lower)) {
    const y = addDays(new Date(), -1);
    return { start_date: toYmd(y), end_date: toYmd(y), label: "Yesterday" };
  }
  if (/\btoday\b/i.test(lower)) {
    const t = toYmd(new Date());
    return { start_date: t, end_date: t, label: "Today" };
  }
  if (/last\s*week|past\s*week|previous\s*week|\bweekly\b/i.test(lower)) return rangeLastWeek();
  if (/this\s*week/i.test(lower)) return rangeThisWeek();
  if (/last\s*month|past\s*month/i.test(lower)) return rangeLastMonth();
  if (/this\s*month/i.test(lower)) return rangeThisMonth();
  if (/last\s*7\s*days|7\s*days/i.test(lower)) return rangeLast7Days();
  return null;
}

function stripDates(text) {
  return String(text || "")
    .replace(/\bfrom\s+\d{4}-\d{2}-\d{2}\b/gi, " ")
    .replace(/\bto\s+\d{4}-\d{2}-\d{2}\b/gi, " ")
    .replace(/\d{4}-\d{2}-\d{2}\s*(?:to|–|-|until)\s*\d{4}-\d{2}-\d{2}/gi, " ")
    .replace(/\b(last|this|past|previous)\s+(week|month)\b/gi, " ")
    .replace(/\b(weekly|yesterday|today|last\s*7\s*days|7\s*days)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSourceFromText(text) {
  const lower = (text || "").toLowerCase();
  if (/\bpre[\s-]?bid\b|\bprebid\b/i.test(lower)) return PROJECT_SOURCE_IDS.PREBID;
  if (/\bdpr\b/i.test(lower)) return PROJECT_SOURCE_IDS.DPR;
  if (/\bdetail\s*design\b|\bdetaildesign\b/i.test(lower)) {
    return PROJECT_SOURCE_IDS.DETAIL_DESIGN;
  }
  return null;
}

function filterWorklogsByProjects(data, projects) {
  if (!projects?.length) return data;
  const allowed = new Set();
  projects.forEach((p) => {
    [p.project_code, p.code, p.project_name, p.short_name, p.name, p.id, p.project_id].forEach(
      (x) => {
        if (x != null && String(x).trim()) allowed.add(String(x).trim().toLowerCase());
      }
    );
  });

  const results = (data?.results || [])
    .map((emp) => {
      const worklogs = (emp.worklogs || []).filter((w) => {
        const raw = String(w.project || w.project_code || w.project_name || "")
          .trim()
          .toLowerCase();
        if (!raw) return false;
        if (allowed.has(raw)) return true;
        for (const token of allowed) {
          if (token.length >= 3 && (raw.includes(token) || token.includes(raw))) return true;
        }
        return false;
      });
      return { ...emp, worklogs };
    })
    .filter((emp) => (emp.worklogs || []).length);

  let total_worklogs = 0;
  let total_hours = 0;
  results.forEach((emp) => {
    (emp.worklogs || []).forEach((w) => {
      total_worklogs += 1;
      const h = w.hours ?? w.duration ?? w.total_hours;
      if (typeof h === "number") total_hours += h;
      else if (h != null && /^\d+(\.\d+)?$/.test(String(h))) total_hours += Number(h);
    });
  });

  return {
    ...data,
    results,
    total_worklogs,
    total_hours,
    total_users: results.length,
  };
}

const STOP = new Set([
  "report", "reports", "summary", "project", "projects", "all", "employee",
  "employees", "give", "me", "a", "the", "of", "for", "please", "show",
  "get", "generate", "create", "worklog", "worklogs", "history", "hours",
  "details", "open", "go", "to", "help", "hi", "hello", "planner", "rework",
  "last", "this", "past", "previous", "week", "month", "days", "day",
  "timelog", "time", "log", "logs", "weekly", "monthly", "today", "yesterday",
]);

function isCode(token) {
  if (!token) return false;
  const t = String(token).trim();
  const low = t.toLowerCase();
  if (STOP.has(low)) return false;
  if (low.split(/[\s_-]+/).every((w) => STOP.has(w))) return false;
  // Never treat multi-word English phrases as codes
  if (/\s/.test(t) && !/^[A-Za-z]{1,6}\s+\d{2,6}$/.test(t)) return false;
  return (
    /^\d{1,8}$/.test(t) ||
    /^[A-Za-z]{1,6}\s*\d{2,6}$/.test(t) ||
    /^[A-Za-z]\d[\w-]*$/.test(t) ||
    /^[A-Za-z]{2,6}\d{2,}[\w-]*$/.test(t) ||
    /^[A-Za-z]{1,6}-\d{2,6}$/.test(t)
  );
}

function findCode(text) {
  const cleaned = stripDates(text);
  const patterns = [
    // Explicit labels only — avoid "project report …" capturing "report"
    /\b(?:project\s*code|emp(?:loyee)?\s*code|code|emp(?:loyee)?)[:\s#-]+([A-Za-z0-9][A-Za-z0-9 _-]{0,16})/i,
    /\b([A-Za-z]{1,6}\s+\d{2,6})\b/,
    /\b([A-Za-z]{1,6}-\d{2,6})\b/,
    /\b([A-Za-z]\d{2,}[A-Za-z0-9_-]*)\b/,
    /\b([A-Za-z]{2,6}\d{2,}[A-Za-z0-9_-]*)\b/,
  ];
  for (const re of patterns) {
    const m = cleaned.match(re);
    if (m?.[1] && isCode(m[1].trim())) return m[1].trim().replace(/\s+/g, " ");
  }
  return null;
}

/**
 * Parse free text → intent.
 * Also supports pending follow-ups from the UI state machine.
 */
export function parseUserMessage(text, user = {}, pending = null) {
  const q = (text || "").trim();
  const lower = q.toLowerCase().replace(/\s+/g, " ");
  if (!q) return { type: "help" };
  if (/^(help|\?|hi|hello|hey)$/i.test(lower)) return { type: "help" };

  const dateRange = parseDateRangeFromText(q) || (pending?.dateRange ?? null);
  const code = findCode(q);
  const source_id = parseSourceFromText(q) || pending?.source_id || null;

  // Continue pending action with user's reply as the missing value
  if (pending?.type === "await_project_code") {
    const idOrCode = code || (isCode(q) ? q.trim() : null);
    if (!idOrCode) {
      return {
        type: "ask",
        field: "project_code",
        message: "Please type a project code (example: D1342).",
        resume: pending.resume,
        dateRange: pending.dateRange,
      };
    }
    return {
      type: pending.resume || "project_report",
      idOrCode,
      dateRange: pending.dateRange || dateRange || rangeLastWeek(),
    };
  }

  if (pending?.type === "await_employee_code") {
    const emp =
      code ||
      (isCode(q) ? q.trim() : null) ||
      (/\bme\b/i.test(q) ? user.emp_code : null);
    if (!emp) {
      return {
        type: "ask",
        field: "employee_code",
        message: "Please type an employee code (example: EMP001), or say me.",
        resume: "employee",
        dateRange: pending.dateRange,
      };
    }
    return {
      type: "employee",
      emp_code: emp,
      dateRange: pending.dateRange || dateRange || rangeLastWeek(),
    };
  }

  // Navigation
  if (/^(open|go to)\b/i.test(lower)) {
    const routes = [
      [/all\s*projects|project\s*list/i, "/all-projects", "Project List"],
      [/bulk/i, "/projects-bulk", "Bulk Upload"],
      [/task\s*planner/i, "/task-planner", "Task Planner"],
      [/settings/i, "/settings", "Settings"],
      [/daily\s*logs/i, "/daily-logs", "Daily Logs"],
      [/worklog\s*history/i, "/employee-worklog-history", "Worklog History"],
      [/rework/i, "/track-work-log", "Track Rework"],
      [/tl\s*projects|my\s*projects/i, "/tl-projects", "TL Projects"],
    ];
    for (const [re, path, label] of routes) {
      if (re.test(lower)) return { type: "navigate", path, label };
    }
  }

  // All-projects weekly report (no project code)
  if (
    /\b(project\s+report|all\s+projects?\s+report|weekly\s+report|time\s*log\s+summary|weekly\s+time\s*log)\b/i.test(
      lower
    ) &&
    !code
  ) {
    return {
      type: "all_projects_report",
      dateRange: dateRange || rangeLastWeek(),
      source_id,
    };
  }

  // Type-only: "prebid last week", "dpr report", "detail design this month"
  if (source_id && !code && /\b(report|summary|week|month|days|project)\b/i.test(lower)) {
    return {
      type: "all_projects_report",
      dateRange: dateRange || rangeLastWeek(),
      source_id,
    };
  }

  // Single project
  if (code && /\b(project|report|summary|details|worklog)\b/i.test(lower)) {
    return {
      type: /\b(report|summary|worklog|hours)\b/i.test(lower) ? "project_report" : "project",
      idOrCode: code,
      dateRange: dateRange || rangeLastWeek(),
    };
  }

  // Employee
  if (/\bemployee\b|\bwork\s*log\b|\btimelog\b|^emp\b/i.test(lower)) {
    const emp = code || (/\bme\b/i.test(lower) ? user.emp_code : null) || (user.role === "USER" ? user.emp_code : null);
    if (!emp) {
      return {
        type: "ask",
        field: "employee_code",
        message: "Which employee code? Example: EMP001",
        resume: "employee",
        dateRange: dateRange || rangeLastWeek(),
      };
    }
    return {
      type: /\breport\b/i.test(lower) ? "employee_report" : "employee",
      emp_code: emp,
      dateRange: dateRange || rangeLastWeek(),
    };
  }

  // Rework
  if (/\brework\b/i.test(lower)) {
    if (!code) {
      return {
        type: "ask",
        field: "project_code",
        message: "Which project for rework history? Example: D1342",
        resume: "rework",
        dateRange,
      };
    }
    return { type: "rework", project_id: code };
  }

  // Planner
  if (/\bplanner\b/i.test(lower)) {
    let rangeKey = "day";
    if (/week/i.test(lower)) rangeKey = "week";
    if (/month/i.test(lower)) rangeKey = "month";
    return { type: "planner", range: rangeKey, emp_code: user.emp_code, dateRange };
  }

  // Bare code after "project report" context words already handled; bare code alone
  if (code) {
    return { type: "project_report", idOrCode: code, dateRange: dateRange || rangeLastWeek() };
  }

  // "report last week" without project word
  if (/\breport\b/i.test(lower)) {
    return {
      type: "all_projects_report",
      dateRange: dateRange || rangeLastWeek(),
      source_id,
    };
  }

  return {
    type: "help",
    message: `I didn’t catch that. Pick an action below or try: project report last week`,
  };
}

function textResult(title, lines, extra = {}) {
  return { kind: "text", title, lines, ...extra };
}

/** Run a structured intent (from buttons or parser). */
export async function runAgent(user, intent) {
  if (!intent || intent.type === "help") {
    return textResult("How can I help?", [
      "I can generate reports **inside this chat only** (website filters stay untouched).",
      "",
      "**All projects weekly report**",
      "→ Click the button, or type: project report last week",
      "",
      "**One project**",
      "→ Type: project report D1342 last week",
      "",
      "**Employee worklog**",
      "→ Type: employee EMP001 last week",
      "",
      "Dates: last week · this week · this month · from 2026-09-01 to 2026-09-08",
    ]);
  }

  if (intent.type === "ask") {
    return {
      kind: "text",
      title: "Need one more detail",
      lines: [intent.message],
      pending: {
        type: intent.field === "employee_code" ? "await_employee_code" : "await_project_code",
        resume: intent.resume,
        dateRange: intent.dateRange,
      },
    };
  }

  if (intent.type === "navigate") {
    return textResult("Opening page", [`Taking you to ${intent.label}…`], {
      navigateTo: intent.path,
    });
  }

  if (intent.type === "all_projects_report") {
    let dateRange = intent.dateRange || rangeLastWeek();
    if (
      dateRange?.start_date &&
      dateRange?.end_date &&
      dateRange.start_date > dateRange.end_date
    ) {
      dateRange = {
        ...dateRange,
        start_date: dateRange.end_date,
        end_date: dateRange.start_date,
        label: `${dateRange.end_date} → ${dateRange.start_date}`,
      };
    }
    const source_id = intent.source_id || null;
    const typeLabel = source_id ? PROJECT_TYPE_LABELS[source_id] : null;
    const filters = {
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    };
    if (user?.role === "USER" && user?.emp_code) filters.user_id = user.emp_code;

    const [rawLogs, projects] = await Promise.all([
      guideGetEmployeeWorklogs(filters),
      guideListAllProjects(user, { source_id }).catch(() => []),
    ]);

    const logs = source_id ? filterWorklogsByProjects(rawLogs, projects) : rawLogs;
    const report = buildWeeklyTimeLogReport(logs, dateRange, projects);
    if (typeLabel) {
      report.title = `Weekly Project Time Log Summary (${typeLabel})`;
      report.brand = `aimantra agent — ${typeLabel}`;
    }
    if (!report.projectRows?.length) {
      report.emptyMessage = typeLabel
        ? `No ${typeLabel} worklogs found in this period.`
        : "No worklogs found in this period.";
    }
    return report;
  }

  if (intent.type === "project" || intent.type === "project_report") {
    const resolved = await guideResolveProject(intent.idOrCode, user);
    if (!resolved?.id) {
      return textResult("Project not found", [
        `No project matched “${intent.idOrCode}”.`,
        "Use the exact code from Project List (e.g. D1342).",
      ]);
    }
    const details = await guideGetProjectDetails(resolved.id);
    const dateRange = intent.dateRange || rangeLastWeek();

    if (intent.type === "project") {
      const acts = details?.activities_detail || details?.activities || [];
      return {
        kind: "document",
        title: `Project — ${details?.project_code || intent.idOrCode}`,
        subtitle: details?.project_name || details?.short_name,
        meta: [
          { label: "Code", value: details?.project_code || intent.idOrCode },
          { label: "Client", value: clientDisplayName(details, resolved.meta) },
          { label: "Workorder cost", value: String(details?.workorder_cost ?? "—") },
          { label: "Activities", value: String(acts.length) },
          { label: "Scope", value: "aimantra agent" },
        ],
        sections: [
          {
            heading: "Activities",
            bullets: acts.map((a) => {
              const subs = a.subactivities || a.sub_activities || [];
              return `${a.activity_name || a.name} — ${subs.length} sub-activities`;
            }),
          },
        ],
        projectId: resolved.id,
        downloadName: `Project_${details?.project_code || intent.idOrCode}`,
      };
    }

    let work = {};
    try {
      work = await guideGetProjectWorkSummary(
        resolved.id,
        dateRange.start_date,
        dateRange.end_date
      );
    } catch {
      work = await guideGetProjectWorkSummary(resolved.id);
    }

    const acts = work?.activities || [];
    return {
      kind: "document",
      title: `Project Report — ${details?.project_code || intent.idOrCode}`,
      subtitle: details?.project_name || details?.short_name,
      meta: [
        { label: "Project code", value: details?.project_code || intent.idOrCode },
        {
          label: "Period",
          value: `${dateRange.label} (${dateRange.start_date} → ${dateRange.end_date})`,
        },
        { label: "Client", value: clientDisplayName(details, resolved.meta) },
        { label: "Workorder cost", value: String(details?.workorder_cost ?? "—") },
        { label: "Scope", value: "aimantra agent" },
      ],
      sections: [
        {
          heading: "Hours by activity",
          blocks: acts.map((a) => ({
            title: a.activity_name,
            lines: [
              ...(a.users || []).map((u) => `${u.name || u.emp_code}: ${u.total_time_spent || "—"}`),
              ...(a.subactivities || []).map((s) => {
                const users = (s.users || [])
                  .map((u) => `${u.name || u.emp_code}:${u.total_time_spent || "—"}`)
                  .join(", ");
                return `— ${s.subactivity_name}${users ? ` · ${users}` : ""}`;
              }),
            ],
          })),
        },
      ],
      projectId: resolved.id,
      downloadName: `Project_Report_${details?.project_code || intent.idOrCode}_${dateRange.start_date}`,
    };
  }

  if (intent.type === "employee" || intent.type === "employee_report") {
    const dateRange = intent.dateRange || rangeLastWeek();
    if (intent.type === "employee_report") {
      const data = await guideGetEmployeeReport(intent.emp_code);
      const projects = data?.projects || data?.results || [];
      return {
        kind: "document",
        title: `Employee Report — ${intent.emp_code}`,
        subtitle: dateRange.label,
        meta: [
          { label: "Employee", value: intent.emp_code },
          { label: "Projects", value: String(projects.length) },
          { label: "Scope", value: "aimantra agent" },
        ],
        sections: projects.slice(0, 15).map((p) => ({
          heading: p.project_name || p.project_code || "Project",
          bullets: (p.users || [])
            .slice(0, 8)
            .map((u) => `${u.name || u.emp_code}: ${u.total_time_spent || u.total_hours || "—"}`),
        })),
        downloadName: `Employee_Report_${intent.emp_code}`,
      };
    }

    const data = await guideGetEmployeeWorklogs({
      user_id: intent.emp_code,
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
    });
    const results = data?.results || [];
    const lines = [];
    results.forEach((u) => {
      lines.push(
        `${u.user_name || u.user_id}: ${u.total_worklogs ?? u.worklogs?.length ?? 0} logs · ${u.total_hours ?? "—"} hrs`
      );
      (u.worklogs || []).slice(0, 12).forEach((w) => {
        lines.push(
          `  ${w.date || "—"} · ${w.project || "—"} / ${w.activity || "—"} / ${w.subactivity || "—"} · ${w.hours ?? "—"}h`
        );
      });
    });
    if (!lines.length) lines.push("No worklogs for this employee in the selected period.");

    return {
      kind: "document",
      title: `Employee Worklog — ${intent.emp_code}`,
      subtitle: `${dateRange.label} (${dateRange.start_date} → ${dateRange.end_date})`,
      meta: [
        { label: "Employee", value: intent.emp_code },
        { label: "Period", value: `${dateRange.label} (${dateRange.start_date} → ${dateRange.end_date})` },
        { label: "Total hours", value: String(data?.total_hours ?? "—") },
        { label: "Total worklogs", value: String(data?.total_worklogs ?? "—") },
        { label: "Scope", value: "aimantra agent" },
      ],
      sections: [{ heading: "Entries", bullets: lines }],
      downloadName: `Employee_Worklog_${intent.emp_code}_${dateRange.start_date}`,
    };
  }

  if (intent.type === "rework") {
    let project_id = intent.project_id;
    if (project_id && !/^\d+$/.test(String(project_id))) {
      const resolved = await guideResolveProject(project_id, user);
      project_id = resolved?.id;
    }
    if (!project_id) {
      return textResult("Rework", ["Could not resolve that project code."]);
    }
    const data = await guideGetRework({ project_id });
    const payload = data?.data || data;
    const bullets = [];
    (payload.activities || []).forEach((a) => {
      bullets.push(`${a.activity_name} — ${a.total_reworks ?? a.rework_count ?? "—"}`);
      (a.subactivities || []).forEach((s) => {
        bullets.push(`  ${s.subactivity_name} · ${s.rework_count ?? "—"} cycles`);
      });
    });
    return {
      kind: "document",
      title: "Rework history",
      subtitle: payload.project_name || String(project_id),
      meta: [
        { label: "Total reworks", value: String(payload.total_reworks ?? "—") },
        { label: "Scope", value: "aimantra agent" },
      ],
      sections: [{ heading: "Cycles", bullets: bullets.length ? bullets : ["No rework cycles."] }],
      downloadName: `Rework_${project_id}`,
    };
  }

  if (intent.type === "planner") {
    const today = toYmd(new Date());
    const pack = await guideGetTaskPlanners(user, today);
    const planners = pack?.planners || [];
    return {
      kind: "document",
      title: `Task Planner — ${intent.range || "day"}`,
      subtitle: today,
      meta: [
        { label: "Date", value: today },
        { label: "Plans", value: String(planners.length) },
        { label: "Scope", value: "aimantra agent" },
      ],
      sections: [
        {
          heading: "Today's plans",
          bullets: planners.slice(0, 30).map(
            (p) =>
              `${p.employee_name || p.employee_code || "—"} · ${p.project_name || p.project_code || "—"} · ${p.subactivity_name || "—"}`
          ),
        },
      ],
      downloadName: `Planner_${today}`,
    };
  }

  if (intent.type === "subactivity") {
    const data = await guideGetSubactivity(intent.id);
    return {
      kind: "document",
      title: `Sub-activity — ${data?.subactivity_name || intent.id}`,
      subtitle: `Status: ${data?.status || "—"}`,
      meta: [
        { label: "Total hours", value: String(data?.work_summary?.total_hours || "—") },
        { label: "Scope", value: "aimantra agent" },
      ],
      sections: [
        {
          heading: "Contributors",
          bullets: (data?.work_summary?.users || []).map(
            (u) => `${u.name}: ${u.total_time_spent || "—"}`
          ),
        },
      ],
      downloadName: `Subactivity_${intent.id}`,
    };
  }

  return textResult("Unknown", ["I couldn’t run that action."]);
}

// Back-compat aliases used by older imports
export const parseGuideQuery = (text, user) => parseUserMessage(text, user, null);
export const runGuideQuery = (user, intent) => runAgent(user, intent);
export const extractDateRange = parseDateRangeFromText;
