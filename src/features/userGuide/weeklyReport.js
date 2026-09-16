/**
 * Weekly / period time-log report builders (ConsaiAI style).
 */

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

function resolveProjectMeta(rawKey, metaByCode, metaByName) {
  const key = String(rawKey || "").trim();
  const lower = key.toLowerCase();
  if (metaByCode.has(lower)) return metaByCode.get(lower);
  if (metaByName.has(lower)) return metaByName.get(lower);
  // "D1378 - Name" or "D1378 Name"
  const codeGuess = key.match(/^([A-Za-z]{0,4}\s?-?\s?\d{2,6}|[A-Za-z]\d[\w-]*)\b/);
  if (codeGuess) {
    const c = codeGuess[1].replace(/\s+/g, " ").trim().toLowerCase();
    if (metaByCode.has(c)) return metaByCode.get(c);
    // try without spaces
    const c2 = c.replace(/\s+/g, "");
    for (const [k, v] of metaByCode) {
      if (k.replace(/\s+/g, "") === c2) return v;
    }
  }
  return null;
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
    : [...new Set(results.flatMap((e) => (e.worklogs || []).map((w) => w.date).filter(Boolean)))].sort();

  const metaByCode = new Map();
  const metaByName = new Map();
  (projectMetaList || []).forEach((p) => {
    const code = String(p.project_code || p.code || "").trim();
    const name = String(p.project_name || p.short_name || p.name || "").trim();
    if (code) metaByCode.set(code.toLowerCase(), p);
    if (name) metaByName.set(name.toLowerCase(), p);
  });

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
      const date = w.date || "";
      if (dayColumns.length && date && !dayColumns.includes(date)) return;

      const hrs = hoursToNumber(w.hours ?? w.duration ?? w.total_hours);
      const rawProject = w.project || w.project_code || w.project_name || "Unknown";
      const meta = resolveProjectMeta(rawProject, metaByCode, metaByName);
      const code = String(meta?.project_code || meta?.code || rawProject).trim();
      const name = String(
        meta?.project_name || meta?.short_name || meta?.name || (code !== rawProject ? rawProject : "")
      ).trim();

      const mapKey = code.toLowerCase();
      if (!byProject.has(mapKey)) {
        byProject.set(mapKey, {
          code,
          name: name || code,
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
      daily: { ...p.dailyLogs },
      totalLogs: p.totalLogs,
      totalHours: formatHoursHM(p.totalHours),
      totalHoursNum: p.totalHours,
      employees: p.employees.size,
    }));

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

  const periodLabel = start && end ? formatPeriodLong(start, end) : dateRange?.label || "Selected period";

  return {
    kind: "weekly_timelog",
    title: "Weekly Project Time Log Summary",
    brand: "aimantra agent — Weekly Time Log Report",
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
    downloadName: `Weekly_TimeLog_${start || "all"}_${end || "all"}`,
  };
}
