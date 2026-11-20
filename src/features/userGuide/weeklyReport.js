/**
 * Weekly / period time-log report builders (ConsaiAI style).
 */

import {
  PROJECT_SOURCE_IDS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_SOURCE_IDS,
  getProjectSourceId,
} from "../../constants/projectSources";

const REPORT_SOURCE_ORDER = [
  PROJECT_SOURCE_IDS.DETAIL_DESIGN,
  PROJECT_SOURCE_IDS.DPR,
  PROJECT_SOURCE_IDS.HR,
  PROJECT_SOURCE_IDS.AIMANTRA,
  PROJECT_SOURCE_IDS.PREBID,
  PROJECT_SOURCE_IDS.BD,
  PROJECT_SOURCE_IDS.ACCOUNT,
  PROJECT_SOURCE_IDS.INTERNAL,
  PROJECT_SOURCE_IDS.PROJECT_COORDINATION,
  PROJECT_SOURCE_IDS.DESIGN,
];

const REPORT_SOURCE_LABELS = {
  ...PROJECT_TYPE_LABELS,
  [PROJECT_SOURCE_IDS.HR]: "HR (hrcivilmantra)",
};

export function reportSourceLabel(sourceId) {
  if (!sourceId) return "Other / Unclassified";
  return REPORT_SOURCE_LABELS[sourceId] || PROJECT_TYPE_LABELS[sourceId] || "Other / Unclassified";
}

function groupProjectRowsBySource(projectRows) {
  const map = new Map();
  (projectRows || []).forEach((row) => {
    const sourceId = row.sourceId || "";
    if (!map.has(sourceId)) {
      map.set(sourceId, {
        sourceId,
        label: reportSourceLabel(sourceId),
        rows: [],
        totalLogs: 0,
        totalHoursNum: 0,
        employeeKeys: new Set(),
      });
    }
    const group = map.get(sourceId);
    group.rows.push({ ...row, sno: group.rows.length + 1 });
    group.totalLogs += row.totalLogs || 0;
    group.totalHoursNum += row.totalHoursNum || 0;
    (row.employeeKeys || []).forEach((key) => group.employeeKeys.add(key));
  });

  const emptyGroup = (id) => ({
    sourceId: id,
    label: reportSourceLabel(id),
    rows: [],
    totalLogs: 0,
    totalHoursNum: 0,
    employeeKeys: new Set(),
  });

  const ordered = [];
  REPORT_SOURCE_ORDER.forEach((id) => {
    ordered.push(map.get(id) || emptyGroup(id));
  });
  map.forEach((group, id) => {
    if (!REPORT_SOURCE_ORDER.includes(id)) ordered.push(group);
  });

  return ordered.map((group) => ({
    sourceId: group.sourceId,
    label: group.label,
    projectRows: group.rows,
    kpis: {
      totalLogs: group.totalLogs,
      totalHours: formatHoursHM(group.totalHoursNum),
      projects: group.rows.length,
      employees: group.employeeKeys.size,
    },
  }));
}

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

export function hoursToNumber(h) {
  if (h == null || h === "") return 0;
  if (typeof h === "number" && !Number.isNaN(h)) return h;
  const s = String(h).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const m = s.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (m) return Number(m[1]) + Number(m[2]) / 60 + Number(m[3] || 0) / 3600;
  return 0;
}

/** Format decimal hours as H:MM (e.g. 3367:30) */
export function formatHoursHM(n) {
  const total = Math.max(0, Number(n) || 0);
  const h = Math.floor(total);
  const m = Math.round((total - h) * 60);
  if (m === 60) return `${h + 1}:00`;
  return `${h}:${pad(m)}`;
}

export function enumerateDates(startYmd, endYmd) {
  if (!startYmd || !endYmd) return [];
  const out = [];
  let cur = new Date(`${startYmd}T00:00:00`);
  const end = new Date(`${endYmd}T00:00:00`);
  while (cur <= end) {
    out.push(toYmd(cur));
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatDayLabel(ymd, withWeekday = true) {
  const d = new Date(`${ymd}T00:00:00`);
  const day = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  if (!withWeekday) return day;
  const wd = d.toLocaleDateString("en-GB", { weekday: "short" });
  return `${day} (${wd})`;
}

export function formatPeriodLong(startYmd, endYmd) {
  if (!startYmd || !endYmd) return "—";
  const a = new Date(`${startYmd}T00:00:00`);
  const b = new Date(`${endYmd}T00:00:00`);
  const opts = { day: "numeric", month: "long", year: "numeric" };
  return `${a.toLocaleDateString("en-GB", opts)} – ${b.toLocaleDateString("en-GB", opts)}`;
}

export function normalizeDateToYmd(value) {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toYmd(value);
  const s = String(value).trim();
  const isoDate = s.match(/^(\d{4})-(\d{2})-(\d{2})(?!T)/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const isoDateTime = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDateTime) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return toYmd(d);
    return `${isoDateTime[1]}-${isoDateTime[2]}-${isoDateTime[3]}`;
  }
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (dmy) return `${dmy[3]}-${pad(dmy[2])}-${pad(dmy[1])}`;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return toYmd(d);
  return "";
}

export function worklogDateYmd(w) {
  return (
    normalizeDateToYmd(w?.date) ||
    normalizeDateToYmd(w?.work_date) ||
    normalizeDateToYmd(w?.log_date) ||
    normalizeDateToYmd(w?.start_time) ||
    normalizeDateToYmd(w?.start) ||
    ""
  );
}

function normalizeLookupKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\[\](){}_./\\,+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function worklogHours(w) {
  return hoursToNumber(
    w?.hours ?? w?.total_hours ?? w?.hours_worked ?? w?.duration ?? w?.duration_hours
  );
}

const SOURCE_UUIDS = new Set(Object.values(PROJECT_SOURCE_IDS).map(String));
const GENERIC_TYPE_KEYS = new Set(
  [
    ...Object.keys(PROJECT_TYPE_SOURCE_IDS),
    ...Object.values(PROJECT_TYPE_LABELS),
    "prebid",
    "pre bid",
    "pre-bid",
    "detail design",
    "detaildesign",
    "dpr",
    "bd",
    "account",
    "accounts",
    "aimantra",
    "hr",
    "hrcivilmantra",
    "admincivilmantra",
    "internal",
    "project coordination",
    "projectcoordination",
    "design",
    "other",
    "unknown",
  ].map((s) => normalizeLookupKey(s))
);

function isGenericTypeKey(key) {
  const raw = String(key || "").trim();
  if (!raw) return true;
  if (SOURCE_UUIDS.has(raw)) return true;
  const n = normalizeLookupKey(raw);
  return GENERIC_TYPE_KEYS.has(n) || GENERIC_TYPE_KEYS.has(raw.toLowerCase());
}

function isCountableWorklog(w) {
  if (!w) return false;
  if (isLeaveOrHolidayLog(w)) return false;
  if (w.is_planner === true || w.is_plan === true) return false;
  const type = String(w.entry_type || w.type || "").toUpperCase();
  if (["LEAVE", "HOLIDAY", "PLANNER", "TIME_PLANER", "TIME_PLANNER"].includes(type)) return false;
  return true;
}

function inferSourceFromLabel(text) {
  const lower = String(text || "").toLowerCase();
  if (!lower.trim()) return "";
  if (PROJECT_TYPE_LABELS[String(text).trim()]) return String(text).trim();
  const mapped = PROJECT_TYPE_SOURCE_IDS[lower.trim()];
  if (mapped) return mapped;
  if (lower.includes("detail design") || lower.includes("detaildesign")) return PROJECT_SOURCE_IDS.DETAIL_DESIGN;
  if (lower.includes("project coordination") || lower.includes("projectcoordination")) {
    return PROJECT_SOURCE_IDS.PROJECT_COORDINATION;
  }
  if (/\bdesign\b/.test(lower)) return PROJECT_SOURCE_IDS.DESIGN;
  if (/\bpre[\s-]?bid\b/.test(lower)) return PROJECT_SOURCE_IDS.PREBID;
  if (lower.includes("aimantra")) return PROJECT_SOURCE_IDS.AIMANTRA;
  if (lower.includes("hrcivil") || /\bhr\b/.test(lower)) return PROJECT_SOURCE_IDS.HR;
  if (lower.includes("admincivil") || lower.includes("internal")) return PROJECT_SOURCE_IDS.INTERNAL;
  if (/\baccounts?\b/.test(lower)) return PROJECT_SOURCE_IDS.ACCOUNT;
  if (/\bdpr\b/.test(lower)) return PROJECT_SOURCE_IDS.DPR;
  if (/\bbd\b/.test(lower)) return PROJECT_SOURCE_IDS.BD;
  return "";
}

function inferSourceId(worklog, meta) {
  const fromMeta = getProjectSourceId(meta);
  if (fromMeta) return String(fromMeta);
  const nested = worklog?.project_detail || worklog?.project_obj || worklog?.source_detail;
  const nestedId = getProjectSourceId(nested);
  if (nestedId) return String(nestedId);

  const candidates = [
    worklog?.source_id,
    worklog?.source,
    worklog?.project_source_id,
    worklog?.project_type,
    worklog?.source_name,
    typeof worklog?.project === "object" ? worklog.project : "",
  ];
  for (const raw of candidates) {
    if (raw == null || raw === "") continue;
    if (typeof raw === "object") {
      const id = getProjectSourceId(raw);
      if (id) return String(id);
      const labeled = inferSourceFromLabel(
        [raw.project_name, raw.short_name, raw.name, raw.project_code, raw.code].filter(Boolean).join(" ")
      );
      if (labeled) return labeled;
      continue;
    }
    const fromValue = inferSourceFromLabel(raw);
    if (fromValue) return fromValue;
  }

  return inferSourceFromLabel(
    [
      worklog?.project_name,
      worklog?.project_code,
      typeof worklog?.project === "string" ? worklog.project : "",
      meta?.project_name,
      meta?.short_name,
      meta?.name,
      meta?.project_code,
      meta?.code,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function indexLookup(map, key, project) {
  const raw = String(key || "").trim();
  if (!raw || !project) return;
  map.set(raw.toLowerCase(), project);
  const normalized = normalizeLookupKey(raw);
  if (normalized) map.set(normalized, project);
}

function indexProject(lookups, project) {
  if (!project) return;
  indexLookup(lookups.metaByCode, project.project_code || project.code, project);
  indexLookup(lookups.metaByName, project.project_name || project.name, project);
  indexLookup(lookups.metaByName, project.short_name, project);
  indexLookup(lookups.metaById, project.id || project.project_id, project);
}

function buildProjectLookups(projectMetaList = []) {
  const lookups = {
    metaByCode: new Map(),
    metaByName: new Map(),
    metaById: new Map(),
  };
  (projectMetaList || []).forEach((p) => indexProject(lookups, p));
  return lookups;
}

function enrichLookupsFromWorklogs(lookups, results = []) {
  (results || []).forEach((emp) => {
    (emp.worklogs || []).forEach((w) => {
      if (typeof w.project === "object" && w.project) indexProject(lookups, w.project);
      if (w.project_detail) indexProject(lookups, w.project_detail);
    });
  });
  return lookups;
}

function lookupsForReport(projectMetaList, results) {
  return enrichLookupsFromWorklogs(buildProjectLookups(projectMetaList), results);
}

function resolveWorklogProject(w, lookups) {
  const projectObj = typeof w.project === "object" && w.project ? w.project : null;
  const rawProject =
    w.project_code ||
    w.project_name ||
    w.project_id ||
    projectObj?.project_code ||
    projectObj?.code ||
    projectObj?.id ||
    projectObj?.project_id ||
    projectObj?.project_name ||
    (typeof w.project === "string" ? w.project : "") ||
    "Unknown";
  const meta =
    resolveProjectMeta(rawProject, lookups) ||
    resolveProjectMeta(w.project_id || projectObj?.id, lookups) ||
    resolveProjectMeta(projectObj?.project_name || w.project_name, lookups);
  const code = String(meta?.project_code || meta?.code || rawProject).trim();
  const name = String(
    meta?.project_name || meta?.short_name || meta?.name || (code !== String(rawProject) ? rawProject : "")
  ).trim();
  const sourceId = String(inferSourceId(w, meta) || getProjectSourceId(meta) || "");
  return {
    code,
    name: name || code,
    sourceId,
    sourceLabel: reportSourceLabel(sourceId),
  };
}

function resolveProjectMeta(rawKey, lookups) {
  const key = String(rawKey || "").trim();
  if (!key || !lookups || isGenericTypeKey(key)) return null;
  const lower = key.toLowerCase();
  const normalized = normalizeLookupKey(key);
  const { metaByCode, metaByName, metaById } = lookups;
  if (metaById?.has(lower)) return metaById.get(lower);
  if (metaByCode.has(lower)) return metaByCode.get(lower);
  if (metaByName.has(lower)) return metaByName.get(lower);
  if (normalized && metaByName.has(normalized)) return metaByName.get(normalized);
  if (normalized && metaByCode.has(normalized)) return metaByCode.get(normalized);
  const codeGuess = key.match(/^([A-Za-z]{0,4}\s?-?\s?\d{2,6}|[A-Za-z]\d[\w-]*)\b/);
  if (codeGuess) {
    const c = codeGuess[1].replace(/\s+/g, " ").trim().toLowerCase();
    if (metaByCode.has(c)) return metaByCode.get(c);
    const c2 = c.replace(/\s+/g, "");
    for (const [k, v] of metaByCode) {
      if (k.replace(/\s+/g, "") === c2) return v;
    }
  }
  return null;
}

function isLeaveOrHolidayLog(w) {
  const type = String(w.entry_type || w.type || "").toUpperCase();
  const status = String(w.status || "").toUpperCase();
  return (
    type === "LEAVE" ||
    type === "HOLIDAY" ||
    status === "LEAVE" ||
    status === "HOLIDAY" ||
    status === "ABSENT"
  );
}

/** Keep logs that belong to a project type even when the name/code does not exactly match the list. */
export function filterWorklogsForSource(data, projects, sourceId) {
  if (!sourceId) return data;
  const resultsIn = data?.results || [];
  const lookups = lookupsForReport(projects, resultsIn);
  const results = resultsIn
    .map((emp) => {
      const worklogs = (emp.worklogs || []).filter((w) => {
        if (!isCountableWorklog(w)) return false;
        return resolveWorklogProject(w, lookups).sourceId === String(sourceId);
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

/**
 * Build ConsaiAI-style weekly project time log summary from employee worklogs.
 */
export function buildWeeklyTimeLogReport(data, dateRange, projectMetaList = []) {
  const results = data?.results || (Array.isArray(data) ? data : []);
  const start = dateRange?.start_date;
  const end = dateRange?.end_date;
  const dates = enumerateDates(start, end);
  // If API returns logs outside range labels, still use requested dates for columns
  const dayColumns = dates.length
    ? dates
    : [...new Set(results.flatMap((e) => (e.worklogs || []).map((w) => worklogDateYmd(w)).filter(Boolean)))].sort();

  const lookups = lookupsForReport(projectMetaList, results);

  const byProject = new Map();
  const byDay = new Map(); // date -> { logs, hours, employees: Set }
  const allEmployees = new Set();
  let totalLogs = 0;
  let totalHours = 0;

  dayColumns.forEach((d) => {
    byDay.set(d, { logs: 0, hours: 0, employees: new Set() });
  });

  results.forEach((emp) => {
    const empKey = String(emp.user_id || emp.emp_code || emp.user_name || "user");
    const empName = emp.user_name || empKey;

    (emp.worklogs || []).forEach((w) => {
      if (!isCountableWorklog(w)) return;
      const date = worklogDateYmd(w);
      if (dayColumns.length && date && !dayColumns.includes(date)) return;

      const hrs = worklogHours(w);
      const { code, name, sourceId } = resolveWorklogProject(w, lookups);

      const mapKey = `${sourceId.toLowerCase()}::${code.toLowerCase()}`;
      if (!byProject.has(mapKey)) {
        byProject.set(mapKey, {
          code,
          name: name || code,
          sourceId,
          sourceLabel: reportSourceLabel(sourceId),
          dailyLogs: Object.fromEntries(dayColumns.map((d) => [d, 0])),
          dailyHours: Object.fromEntries(dayColumns.map((d) => [d, 0])),
          totalLogs: 0,
          totalHours: 0,
          employees: new Set(),
        });
      }
      const row = byProject.get(mapKey);
      row.totalLogs += 1;
      row.totalHours += hrs;
      row.employees.add(empKey);
      if (date && row.dailyLogs[date] != null) {
        row.dailyLogs[date] += 1;
        row.dailyHours[date] += hrs;
      }

      totalLogs += 1;
      totalHours += hrs;
      allEmployees.add(empKey);

      if (date && byDay.has(date)) {
        const day = byDay.get(date);
        day.logs += 1;
        day.hours += hrs;
        day.employees.add(empKey);
      } else if (date) {
        // date outside columns — still count day overview
        if (!byDay.has(date)) byDay.set(date, { logs: 0, hours: 0, employees: new Set() });
        const day = byDay.get(date);
        day.logs += 1;
        day.hours += hrs;
        day.employees.add(empName);
      }
    });
  });

  const projectRows = [...byProject.values()]
    .sort((a, b) => b.totalLogs - a.totalLogs || b.totalHours - a.totalHours)
    .map((p, i) => ({
      sno: i + 1,
      code: p.code,
      name: p.name,
      sourceId: p.sourceId || "",
      sourceLabel: p.sourceLabel || reportSourceLabel(p.sourceId),
      daily: { ...p.dailyLogs },
      totalLogs: p.totalLogs,
      totalHours: formatHoursHM(p.totalHours),
      totalHoursNum: p.totalHours,
      employees: p.employees.size,
      employeeKeys: [...p.employees],
    }));

  const sourceGroups = groupProjectRowsBySource(projectRows);

  const overviewDates = dayColumns.length ? dayColumns : [...byDay.keys()].sort();
  const dayRows = overviewDates.map((d) => {
    const day = byDay.get(d) || { logs: 0, hours: 0, employees: new Set() };
    return {
      date: d,
      dateLabel: formatDayLabel(d, true),
      shortLabel: formatDayLabel(d, false),
      logs: day.logs,
      hours: formatHoursHM(day.hours),
      employees: day.employees.size,
    };
  });

  const periodLabel =
    start && end && start === end
      ? dateRange?.label || formatDayLabel(start, true)
      : start && end
        ? formatPeriodLong(start, end)
        : dateRange?.label || "Selected period";

  return {
    kind: "weekly_timelog",
    title: start && end && start === end
      ? "Daily Project Time Log Summary"
      : "Weekly Project Time Log Summary",
    brand: start && end && start === end
      ? "aimantra agent — Daily Time Log Report"
      : "aimantra agent — Weekly Time Log Report",
    periodLabel,
    dateRange,
    dayColumns: overviewDates.map((d) => ({
      key: d,
      label: formatDayLabel(d, false),
    })),
    kpis: {
      totalLogs: data?.total_worklogs ?? totalLogs,
      totalHours: formatHoursHM(
        typeof data?.total_hours === "number" ? data.total_hours : totalHours
      ),
      projects: projectRows.length,
      employees: data?.total_users ?? allEmployees.size,
    },
    dayRows,
    projectRows,
    sourceGroups,
    downloadName: `Weekly_TimeLog_${start || "all"}_${end || "all"}`,
  };
}

function periodLabelForRange(dateRange) {
  const start = dateRange?.start_date;
  const end = dateRange?.end_date;
  if (start && end && start === end) return dateRange?.label || formatDayLabel(start, true);
  if (start && end) return formatPeriodLong(start, end);
  return dateRange?.label || "Selected period";
}

/**
 * Flat engagement history: Date | Emp code | Emp name | Project | Hours
 * for every employee across Detail Design, Aimantra, DPR, HR, etc.
 */
export function buildEmployeeHistoryReport(data, dateRange, projectMetaList = []) {
  const results = data?.results || (Array.isArray(data) ? data : []);
  const start = dateRange?.start_date;
  const end = dateRange?.end_date;
  const dates = enumerateDates(start, end);
  const lookups = lookupsForReport(projectMetaList, results);

  const agg = new Map();
  const employees = new Set();
  const projects = new Set();

  results.forEach((emp) => {
    const empCode = String(emp.user_id || emp.emp_code || emp.employee_code || "").trim();
    const empName = String(emp.user_name || emp.name || emp.employee_name || empCode).trim();

    (emp.worklogs || []).forEach((w) => {
      if (!isCountableWorklog(w)) return;
      const date = worklogDateYmd(w);
      if (dates.length && date && !dates.includes(date)) return;

      const hrs = worklogHours(w);
      const proj = resolveWorklogProject(w, lookups);
      const key = `${date}|${empCode.toLowerCase()}|${proj.sourceId}|${proj.code.toLowerCase()}`;
      if (!agg.has(key)) {
        agg.set(key, {
          date,
          empCode,
          empName,
          projectCode: proj.code,
          projectName: proj.name,
          sourceId: proj.sourceId,
          sourceLabel: proj.sourceLabel,
          hours: 0,
        });
      }
      const row = agg.get(key);
      row.hours += hrs;
      employees.add(empCode || empName);
      projects.add(`${proj.sourceId}::${proj.code}`);
    });
  });

  const rows = [...agg.values()]
    .sort((a, b) => {
      if (a.date !== b.date) return String(a.date).localeCompare(String(b.date));
      const byName = String(a.empName).localeCompare(String(b.empName));
      if (byName) return byName;
      return String(a.projectName).localeCompare(String(b.projectName));
    })
    .map((r, i) => ({
      sno: i + 1,
      date: r.date,
      dateLabel: r.date ? formatDayLabel(r.date, true) : "—",
      empCode: r.empCode || "—",
      empName: r.empName || "—",
      projectCode: r.projectCode,
      projectName: r.projectName,
      sourceId: r.sourceId,
      sourceLabel: r.sourceLabel,
      totalHoursNum: r.hours,
      totalHours: formatHoursHM(r.hours),
    }));

  const byEmp = new Map();
  rows.forEach((r) => {
    const k = String(r.empCode || r.empName).toLowerCase();
    if (!byEmp.has(k)) {
      byEmp.set(k, {
        empCode: r.empCode,
        empName: r.empName,
        hours: 0,
        days: new Set(),
        projects: new Set(),
      });
    }
    const e = byEmp.get(k);
    e.hours += r.totalHoursNum;
    if (r.date) e.days.add(r.date);
    e.projects.add(r.projectCode);
  });

  const employeeSummary = [...byEmp.values()]
    .sort((a, b) => b.hours - a.hours || String(a.empName).localeCompare(String(b.empName)))
    .map((e) => ({
      empCode: e.empCode,
      empName: e.empName,
      days: e.days.size,
      projects: e.projects.size,
      totalHours: formatHoursHM(e.hours),
      totalHoursNum: e.hours,
    }));

  const totalHours = rows.reduce((sum, r) => sum + r.totalHoursNum, 0);

  return {
    kind: "employee_history",
    title: start && end && start === end
      ? "Employee Engagement History (Day)"
      : "Employee Engagement History",
    brand: "aimantra agent — Employee History",
    periodLabel: periodLabelForRange(dateRange),
    dateRange,
    kpis: {
      totalRows: rows.length,
      totalHours: formatHoursHM(totalHours),
      employees: employees.size,
      projects: projects.size,
    },
    rows,
    employeeSummary,
    downloadName: `Employee_History_${start || "all"}_${end || "all"}`,
  };
}

function formatDateDmy(ymd) {
  const s = String(ymd || "");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return s || "—";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function logBlob(w) {
  return `${w.entry_type || ""} ${w.status || ""} ${w.note || ""} ${w.description || ""} ${w.project || ""} ${w.project_name || ""}`.toLowerCase();
}

function isHolidayLog(w) {
  const t = logBlob(w);
  return w.entry_type === "HOLIDAY" || w.status === "HOLIDAY" || /\bholiday\b/.test(t);
}

function isLeaveLog(w) {
  const t = logBlob(w);
  return w.entry_type === "LEAVE" || w.status === "ABSENT" || /\bleave\b/.test(t);
}

function formatSheetHours(n) {
  const v = Number(n) || 0;
  if (v <= 0) return "-";
  if (Math.abs(v - Math.round(v)) < 0.05) return String(Math.round(v));
  return String(Math.round(v * 10) / 10);
}

function workCellText(logs, lookups) {
  const seen = new Set();
  const lines = [];
  (logs || []).forEach((w) => {
    const proj = resolveWorklogProject(w, lookups);
    const name = proj.name || proj.code || "";
    const desc = String(w.description || w.note || "").trim();
    const act = [w.activity, w.subactivity].filter(Boolean).join(" › ");
    [name, desc, act].forEach((part) => {
      const p = String(part || "").trim();
      if (!p) return;
      const key = p.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      lines.push(p);
    });
  });
  return lines.join("\n");
}

/**
 * Excel-style daily sheet: DATE | Emp | Working Hours | Emp | Working Hours …
 * Leave = green LEAVE, holiday = red HOLIDAY across the row.
 */
export function buildEmployeeRosterReport(data, dateRange, projectMetaList = []) {
  const results = data?.results || (Array.isArray(data) ? data : []);
  const start = dateRange?.start_date;
  const end = dateRange?.end_date;
  const dates = enumerateDates(start, end);
  const lookups = lookupsForReport(projectMetaList, results);

  const employees = [];
  const empSeen = new Set();
  const byEmpDate = new Map();

  results.forEach((emp) => {
    const empCode = String(emp.user_id || emp.emp_code || emp.employee_code || "").trim();
    const empName = String(emp.user_name || emp.name || emp.employee_name || empCode).trim();
    const key = (empCode || empName).toLowerCase();
    if (!key) return;
    if (!empSeen.has(key)) {
      empSeen.add(key);
      employees.push({
        key,
        empCode,
        empName,
        displayName: empName.toUpperCase(),
      });
    }

    (emp.worklogs || []).forEach((w) => {
      if (!isCountableWorklog(w)) return;
      const date = worklogDateYmd(w);
      if (dates.length && date && !dates.includes(date)) return;
      const mapKey = `${key}|${date}`;
      if (!byEmpDate.has(mapKey)) byEmpDate.set(mapKey, []);
      byEmpDate.get(mapKey).push(w);
    });
  });

  employees.sort((a, b) => String(a.empName).localeCompare(String(b.empName)));

  const dayList =
    dates.length > 0
      ? dates
      : [...new Set([...byEmpDate.keys()].map((k) => k.split("|").pop()).filter(Boolean))].sort();

  const dayRows = dayList.map((date) => {
    const holidayDay = employees.some((emp) =>
      (byEmpDate.get(`${emp.key}|${date}`) || []).some(isHolidayLog)
    );

    const cells = {};
    employees.forEach((emp) => {
      const logs = byEmpDate.get(`${emp.key}|${date}`) || [];
      if (holidayDay) {
        cells[emp.key] = { kind: "holiday", text: "HOLIDAY", hoursLabel: "", hoursNum: 0 };
        return;
      }
      const leaveLogs = logs.filter(isLeaveLog);
      const workLogs = logs.filter((w) => !isLeaveLog(w) && !isHolidayLog(w));
      const hours = workLogs.reduce(
        (sum, w) => sum + hoursToNumber(w.hours ?? w.duration ?? w.total_hours),
        0
      );
      if (workLogs.length) {
        cells[emp.key] = {
          kind: "work",
          text: workCellText(workLogs, lookups),
          hoursLabel: formatSheetHours(hours),
          hoursNum: hours,
        };
        return;
      }
      if (leaveLogs.length) {
        cells[emp.key] = { kind: "leave", text: "LEAVE", hoursLabel: "-", hoursNum: 0 };
        return;
      }
      cells[emp.key] = { kind: "empty", text: "", hoursLabel: "", hoursNum: 0 };
    });

    return {
      date,
      dateLabel: formatDateDmy(date),
      isHoliday: holidayDay,
      cells,
    };
  });

  const totalHours = dayRows.reduce(
    (sum, d) =>
      sum + employees.reduce((s, emp) => s + (d.cells[emp.key]?.hoursNum || 0), 0),
    0
  );

  return {
    kind: "employee_roster",
    title: "Daily Employee Engagement Sheet",
    brand: "aimantra agent — Daily Sheet",
    periodLabel: periodLabelForRange(dateRange),
    dateRange,
    employees,
    dayRows,
    kpis: {
      days: dayRows.length,
      employees: employees.length,
      totalHours: formatHoursHM(totalHours),
    },
    emptyMessage: employees.length ? "" : "No employee engagement found in this period.",
    downloadName: `Daily_Sheet_${start || "all"}_${end || "all"}`,
  };
}
