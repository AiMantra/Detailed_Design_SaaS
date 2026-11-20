import { Fragment } from "react";
import { Download, FileText } from "lucide-react";

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(filename, html) {
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function weeklyProjectRowsHtml(rows, days) {
  return (rows || [])
    .map((r) => {
      const dailyCells = days
        .map(
          (d) =>
            `<td style="padding:5px 4px;border:1px solid #3a4553;text-align:center;">${r.daily?.[d.key] ?? 0}</td>`
        )
        .join("");
      return `<tr>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${r.sno}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;white-space:nowrap;">${escapeHtml(r.code)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;">${escapeHtml(r.name)}</td>
        ${dailyCells}
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;font-weight:700;">${r.totalLogs}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${escapeHtml(r.totalHours)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${r.employees}</td>
      </tr>`;
    })
    .join("");
}

function downloadWeeklyDoc(doc) {
  const days = doc.dayColumns || [];
  const dayHeader = days.map((d) => `<th style="padding:6px 5px;border:1px solid #3a4553;">${escapeHtml(d.label)}</th>`).join("");

  const dayRows = (doc.dayRows || [])
    .map(
      (r) => `<tr>
      <td style="padding:6px 8px;border:1px solid #3a4553;">${escapeHtml(r.dateLabel)}</td>
      <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${r.logs}</td>
      <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${escapeHtml(r.hours)}</td>
      <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${r.employees}</td>
    </tr>`
    )
    .join("");

  const sourceGroups = doc.sourceGroups?.length
    ? doc.sourceGroups
    : [{ label: "All projects", projectRows: doc.projectRows || [], kpis: doc.kpis || {} }];

  const sourceSummary = sourceGroups
    .map(
      (g) => `<tr>
        <td style="padding:6px 8px;border:1px solid #3a4553;">${escapeHtml(g.label)}</td>
        <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${g.kpis?.projects ?? g.projectRows?.length ?? 0}</td>
        <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${g.kpis?.totalLogs ?? 0}</td>
        <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${escapeHtml(g.kpis?.totalHours ?? "0:00")}</td>
        <td style="padding:6px 8px;border:1px solid #3a4553;text-align:center;">${g.kpis?.employees ?? 0}</td>
      </tr>`
    )
    .join("");

  const sourceSections = sourceGroups
    .filter((g) => (g.projectRows || []).length)
    .map((g) => {
      const rows = weeklyProjectRowsHtml(g.projectRows, days);
      return `
  <h2>${escapeHtml(g.label)} — ${g.projectRows?.length || 0} projects · ${escapeHtml(g.kpis?.totalHours || "0:00")} hrs · ${g.kpis?.totalLogs ?? 0} logs</h2>
  <table class="data">
    <tr>
      <th>S.No</th><th>Project Code</th><th>Project Name</th>
      ${dayHeader}
      <th>Total Logs</th><th>Total Hours</th><th>Employees</th>
    </tr>
    ${rows || `<tr><td colspan="${(days.length || 0) + 6}" style="padding:8px;border:1px solid #3a4553;text-align:center;">No projects</td></tr>`}
  </table>`;
    })
    .join("");

  const k = doc.kpis || {};
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; background:#2b3038; color:#e8eef5; margin:0; padding:28px; }
  h1 { color:#8ec5ff; font-size:28pt; margin:0 0 6px; font-family: Georgia, serif; }
  .brand { float:right; color:#9fb0c3; font-size:10pt; margin-top:8px; }
  .period { color:#c5d0dc; font-size:12pt; margin-bottom:18px; clear:both; }
  .kpis { width:100%; border-collapse:separate; border-spacing:10px 0; margin:0 0 22px; }
  .kpis td { background:#353b45; border:1px solid #4a5563; padding:12px 10px; text-align:center; width:25%; }
  .kpis .v { font-size:18pt; font-weight:700; color:#fff; }
  .kpis .l { font-size:9pt; color:#9fb0c3; margin-top:4px; }
  table.data { width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:22px; }
  table.data th { background:#2f6fed; color:#fff; padding:8px 6px; border:1px solid #3a4553; text-align:center; }
  table.data td { background:#323843; }
  h2 { color:#d7e3f0; font-size:13pt; margin:20px 0 8px; }
  .foot { color:#7d8b9a; font-size:9pt; margin-top:16px; }
</style></head>
<body>
  <div class="brand">${escapeHtml(doc.brand || "aimantra agent — Weekly Time Log Report")}</div>
  <h1>${escapeHtml(doc.title || "Weekly Project Time Log Summary")}</h1>
  <p class="period">Reporting Period: ${escapeHtml(doc.periodLabel || "—")}</p>

  <table class="kpis"><tr>
    <td><div class="v">${escapeHtml(k.totalLogs)}</div><div class="l">Total Time Logs</div></td>
    <td><div class="v">${escapeHtml(k.totalHours)}</div><div class="l">Total Hours Logged</div></td>
    <td><div class="v">${escapeHtml(k.projects)}</div><div class="l">Projects Worked On</div></td>
    <td><div class="v">${escapeHtml(k.employees)}</div><div class="l">Employees Logged Time</div></td>
  </tr></table>

  <h2>By project type (source)</h2>
  <table class="data">
    <tr>
      <th>Project Type</th><th>Projects</th><th>Logs</th><th>Hours</th><th>Employees</th>
    </tr>
    ${sourceSummary}
  </table>

  <h2>Day-wise Overview</h2>
  <table class="data">
    <tr>
      <th>Date</th><th>Total Logs</th><th>Total Hours Logged</th><th>Employees Active</th>
    </tr>
    ${dayRows}
  </table>

  ${sourceSections}

  <p class="foot">Generated by aimantra agent</p>
</body></html>`;

  downloadBlob(doc.downloadName || "Weekly_TimeLog_Report", html);
}

function downloadGenericDoc(doc) {
  const sectionsHtml = (doc.sections || [])
    .map((sec) => {
      const bullets = (sec.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
      const blocks = (sec.blocks || [])
        .map(
          (b) => `
          <h3 style="margin:14px 0 6px;font-size:13pt;color:#0f766e;">${escapeHtml(b.title)}</h3>
          <ul>${(b.lines || []).map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
        )
        .join("");
      return `
        <h2 style="margin:22px 0 8px;font-size:14pt;border-bottom:1px solid #cbd5e1;padding-bottom:4px;">
          ${escapeHtml(sec.heading)}
        </h2>
        ${bullets ? `<ul>${bullets}</ul>` : ""}
        ${blocks}`;
    })
    .join("");

  const metaRows = (doc.meta || [])
    .map(
      (m) =>
        `<tr>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:32%;">${escapeHtml(m.label)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;">${escapeHtml(m.value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;color:#0f172a;max-width:800px;margin:24px auto;">
  <p style="color:#0f766e;font-size:11pt;letter-spacing:2px;text-transform:uppercase;margin:0;">Detailed Design · aimantra agent</p>
  <h1 style="margin:6px 0 4px;font-size:22pt;">${escapeHtml(doc.title)}</h1>
  ${doc.subtitle ? `<p style="margin:0 0 16px;color:#475569;font-size:12pt;">${escapeHtml(doc.subtitle)}</p>` : ""}
  <table style="border-collapse:collapse;width:100%;font-size:11pt;margin-bottom:18px;">${metaRows}</table>
  ${sectionsHtml}
</body></html>`;

  downloadBlob(doc.downloadName || "AskAI_Report", html);
}

function downloadEmployeeHistoryDoc(doc) {
  const k = doc.kpis || {};
  const rows = (doc.rows || [])
    .map(
      (r) => `<tr>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${r.sno}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;white-space:nowrap;">${escapeHtml(r.dateLabel || r.date)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;white-space:nowrap;">${escapeHtml(r.empCode)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;">${escapeHtml(r.empName)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;">${escapeHtml(r.projectName)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;white-space:nowrap;">${escapeHtml(r.sourceLabel || "")}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;font-weight:700;">${escapeHtml(r.totalHours)}</td>
      </tr>`
    )
    .join("");

  const empRows = (doc.employeeSummary || [])
    .map(
      (e) => `<tr>
        <td style="padding:5px 6px;border:1px solid #3a4553;white-space:nowrap;">${escapeHtml(e.empCode)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;">${escapeHtml(e.empName)}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${e.days}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;">${e.projects}</td>
        <td style="padding:5px 6px;border:1px solid #3a4553;text-align:center;font-weight:700;">${escapeHtml(e.totalHours)}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(doc.title || "Employee History")}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;color:#1e293b;margin:24px;">
  <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">${escapeHtml(doc.brand || "aimantra agent")}</p>
  <h1 style="margin:6px 0 4px;font-size:22px;">${escapeHtml(doc.title || "Employee Engagement History")}</h1>
  <p style="margin:0 0 16px;">Reporting Period: ${escapeHtml(doc.periodLabel || "")}</p>
  <table style="border-collapse:collapse;margin-bottom:16px;">
    <tr>
      <td style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;">Rows<br><b>${k.totalRows ?? 0}</b></td>
      <td style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;">Total hours<br><b>${escapeHtml(k.totalHours || "0:00")}</b></td>
      <td style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;">Employees<br><b>${k.employees ?? 0}</b></td>
      <td style="padding:8px 12px;border:1px solid #cbd5e1;background:#f8fafc;">Projects<br><b>${k.projects ?? 0}</b></td>
    </tr>
  </table>
  <h2 style="font-size:16px;">Engagement (Date · Emp · Project)</h2>
  <table style="border-collapse:collapse;width:100%;font-size:12px;">
    <thead>
      <tr style="background:#2f6fed;color:#fff;">
        <th style="padding:6px;border:1px solid #3a4553;">S.No</th>
        <th style="padding:6px;border:1px solid #3a4553;">Date</th>
        <th style="padding:6px;border:1px solid #3a4553;">Emp code</th>
        <th style="padding:6px;border:1px solid #3a4553;">Emp name</th>
        <th style="padding:6px;border:1px solid #3a4553;">Project name</th>
        <th style="padding:6px;border:1px solid #3a4553;">Type</th>
        <th style="padding:6px;border:1px solid #3a4553;">Total work hours</th>
      </tr>
    </thead>
    <tbody>${rows || `<tr><td colspan="7" style="padding:8px;border:1px solid #3a4553;">${escapeHtml(doc.emptyMessage || "No rows")}</td></tr>`}</tbody>
  </table>
  <h2 style="font-size:16px;margin-top:20px;">Employee totals</h2>
  <table style="border-collapse:collapse;width:100%;font-size:12px;">
    <thead>
      <tr style="background:#2f6fed;color:#fff;">
        <th style="padding:6px;border:1px solid #3a4553;">Emp code</th>
        <th style="padding:6px;border:1px solid #3a4553;">Emp name</th>
        <th style="padding:6px;border:1px solid #3a4553;">Days</th>
        <th style="padding:6px;border:1px solid #3a4553;">Projects</th>
        <th style="padding:6px;border:1px solid #3a4553;">Total hours</th>
      </tr>
    </thead>
    <tbody>${empRows}</tbody>
  </table>
</body></html>`;

  downloadBlob(doc.downloadName || "Employee_History", html);
}

function rosterCellStyle(kind, hoursCol) {
  if (kind === "holiday") {
    return hoursCol
      ? "padding:6px 8px;border:1px solid #111;background:#c5d9ed;color:#c00000;text-align:center;font-weight:700;"
      : "padding:6px 8px;border:1px solid #111;background:#f8d7da;color:#c00000;text-align:center;font-weight:700;";
  }
  if (kind === "leave") {
    return hoursCol
      ? "padding:6px 8px;border:1px solid #111;background:#c5d9ed;text-align:center;"
      : "padding:6px 8px;border:1px solid #111;background:#c6efce;color:#006100;text-align:center;font-weight:700;";
  }
  if (hoursCol) {
    return "padding:6px 8px;border:1px solid #111;background:#c5d9ed;text-align:center;font-weight:700;";
  }
  return "padding:6px 8px;border:1px solid #111;background:#fff;white-space:pre-wrap;vertical-align:top;";
}

function downloadEmployeeRosterDoc(doc) {
  const employees = doc.employees || [];
  const headEmp = employees
    .map(
      (e) =>
        `<th style="padding:8px;border:1px solid #111;background:#111;color:#fff;text-transform:uppercase;">${escapeHtml(e.displayName || e.empName)}</th><th style="padding:8px;border:1px solid #111;background:#111;color:#fff;">Working Hours</th>`
    )
    .join("");
  const body = (doc.dayRows || [])
    .map((d) => {
      const cells = employees
        .map((e) => {
          const c = d.cells?.[e.key] || { kind: "empty", text: "", hoursLabel: "" };
          return `<td style="${rosterCellStyle(c.kind, false)}">${escapeHtml(c.text).replace(/\n/g, "<br/>")}</td><td style="${rosterCellStyle(c.kind, true)}">${escapeHtml(c.hoursLabel)}</td>`;
        })
        .join("");
      return `<tr><td style="padding:6px 8px;border:1px solid #111;background:#fff;white-space:nowrap;font-weight:700;">${escapeHtml(d.dateLabel)}</td>${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(doc.title || "Daily Sheet")}</title></head>
<body style="font-family:Calibri,Arial,sans-serif;color:#111;margin:16px;">
  <p style="margin:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;">${escapeHtml(doc.brand || "aimantra agent")}</p>
  <h1 style="margin:6px 0 4px;font-size:20px;">${escapeHtml(doc.title || "Daily Employee Engagement Sheet")}</h1>
  <p style="margin:0 0 12px;">Reporting Period: ${escapeHtml(doc.periodLabel || "")}</p>
  <table style="border-collapse:collapse;font-size:11px;">
    <thead>
      <tr>
        <th style="padding:8px;border:1px solid #111;background:#ffff00;">DATE</th>
        ${headEmp}
      </tr>
    </thead>
    <tbody>${body || `<tr><td style="padding:8px;border:1px solid #111;" colspan="${1 + employees.length * 2}">${escapeHtml(doc.emptyMessage || "No rows")}</td></tr>`}</tbody>
  </table>
</body></html>`;

  downloadBlob(doc.downloadName || "Daily_Sheet", html);
}

export function downloadReportDoc(doc) {
  if (!doc) return;
  if (doc.kind === "weekly_timelog") downloadWeeklyDoc(doc);
  else if (doc.kind === "employee_history") downloadEmployeeHistoryDoc(doc);
  else if (doc.kind === "employee_roster") downloadEmployeeRosterDoc(doc);
  else downloadGenericDoc(doc);
}

function WeeklyReportView({ doc, fullPage }) {
  const days = doc.dayColumns || [];
  const k = doc.kpis || {};

  return (
    <div
      className={`overflow-hidden border border-slate-700 bg-[#2b3038] text-slate-100 shadow-lg ${
        fullPage ? "rounded-2xl" : "rounded-xl"
      }`}
    >
      <div className={`border-b border-slate-600/80 ${fullPage ? "px-5 py-4" : "px-3.5 py-3"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {doc.brand || "aimantra agent — Weekly Time Log Report"}
            </p>
            <h4
              className={`mt-1 font-serif font-bold leading-snug text-sky-300 ${
                fullPage ? "text-[22px]" : "text-[15px]"
              }`}
            >
              {doc.title}
            </h4>
            <p className={`mt-1 text-slate-300 ${fullPage ? "text-[13px]" : "text-[11px]"}`}>
              Reporting Period: {doc.periodLabel}
            </p>
          </div>
          <FileText size={fullPage ? 20 : 16} className="mt-1 shrink-0 text-slate-400" />
        </div>

        <div className={`mt-3 grid gap-1.5 ${fullPage ? "grid-cols-4" : "grid-cols-2"}`}>
          {[
            { l: "Total Time Logs", v: k.totalLogs },
            { l: "Total Hours Logged", v: k.totalHours },
            { l: "Projects Worked On", v: k.projects },
            { l: "Employees Logged Time", v: k.employees },
          ].map((x) => (
            <div
              key={x.l}
              className={`rounded-md border border-slate-600 bg-[#353b45] text-center ${
                fullPage ? "px-3 py-3" : "px-2 py-2"
              }`}
            >
              <p
                className={`font-bold text-white leading-none ${
                  fullPage ? "text-[22px]" : "text-[15px]"
                }`}
              >
                {x.v ?? 0}
              </p>
              <p className="mt-1 text-[8.5px] font-medium uppercase tracking-wide text-slate-400">
                {x.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`space-y-3 overflow-auto px-3 py-3 ${
          fullPage ? "max-h-[calc(100vh-280px)] px-5 py-4" : "max-h-[340px]"
        }`}
      >
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-200">Day-wise Overview</p>
          <div className="overflow-x-auto rounded-md border border-slate-600">
            <table className="w-full min-w-[320px] border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#2f6fed] text-white">
                  <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Logs</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Hours</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Employees</th>
                </tr>
              </thead>
              <tbody>
                {(doc.dayRows || []).map((r) => (
                  <tr key={r.date} className="border-t border-slate-600 bg-[#323843]">
                    <td className="px-2 py-1.5 whitespace-nowrap">{r.dateLabel}</td>
                    <td className="px-2 py-1.5 text-center">{r.logs}</td>
                    <td className="px-2 py-1.5 text-center">{r.hours}</td>
                    <td className="px-2 py-1.5 text-center">{r.employees}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(doc.sourceGroups || []).length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-200">By project type</p>
            <div className="overflow-x-auto rounded-md border border-slate-600">
              <table className="w-full min-w-[360px] border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#2f6fed] text-white">
                    <th className="px-2 py-1.5 text-left font-semibold">Type</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Projects</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Logs</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Hours</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Emp</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.sourceGroups.map((g) => (
                    <tr key={g.sourceId || g.label} className="border-t border-slate-600 bg-[#323843]">
                      <td className="px-2 py-1.5 font-semibold text-amber-200">{g.label}</td>
                      <td className="px-2 py-1.5 text-center">{g.kpis?.projects ?? 0}</td>
                      <td className="px-2 py-1.5 text-center">{g.kpis?.totalLogs ?? 0}</td>
                      <td className="px-2 py-1.5 text-center">{g.kpis?.totalHours ?? "0:00"}</td>
                      <td className="px-2 py-1.5 text-center">{g.kpis?.employees ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-200">
            Project-wise Log Summary ({(doc.projectRows || []).length} projects)
          </p>
          {doc.emptyMessage && !doc.projectRows?.length ? (
            <p className="text-[11px] text-slate-400">{doc.emptyMessage}</p>
          ) : (
            (doc.sourceGroups?.length ? doc.sourceGroups : [{ label: "All projects", projectRows: doc.projectRows || [] }])
              .filter((group) => (group.projectRows || []).length)
              .map((group) => (
              <div key={group.sourceId || group.label} className="mb-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  {group.label}
                  <span className="ml-2 font-normal normal-case text-slate-400">
                    {group.projectRows?.length || 0} projects
                    {group.kpis?.totalHours ? ` · ${group.kpis.totalHours} hrs` : ""}
                    {group.kpis?.totalLogs != null ? ` · ${group.kpis.totalLogs} logs` : ""}
                  </span>
                </p>
                <div className="overflow-x-auto rounded-md border border-slate-600">
                  <table className="w-full min-w-[640px] border-collapse text-[9.5px]">
                    <thead>
                      <tr className="bg-[#2f6fed] text-white">
                        <th className="px-1.5 py-1.5 font-semibold">S.No</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">Code</th>
                        <th className="px-1.5 py-1.5 text-left font-semibold">Project Name</th>
                        {days.map((d) => (
                          <th key={d.key} className="px-1 py-1.5 font-semibold whitespace-nowrap">
                            {d.label}
                          </th>
                        ))}
                        <th className="px-1.5 py-1.5 font-semibold">Logs</th>
                        <th className="px-1.5 py-1.5 font-semibold">Hours</th>
                        <th className="px-1.5 py-1.5 font-semibold">Emp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(group.projectRows || []).map((r) => (
                        <tr key={`${group.sourceId || group.label}-${r.code}-${r.sno}`} className="border-t border-slate-600 bg-[#323843]">
                          <td className="px-1.5 py-1 text-center text-slate-300">{r.sno}</td>
                          <td className="px-1.5 py-1 whitespace-nowrap font-semibold text-sky-200">
                            {r.code}
                          </td>
                          <td className="px-1.5 py-1 max-w-[140px] truncate" title={r.name}>
                            {r.name}
                          </td>
                          {days.map((d) => (
                            <td key={d.key} className="px-1 py-1 text-center">
                              {r.daily?.[d.key] ?? 0}
                            </td>
                          ))}
                          <td className="px-1.5 py-1 text-center font-bold">{r.totalLogs}</td>
                          <td className="px-1.5 py-1 text-center whitespace-nowrap">{r.totalHours}</td>
                          <td className="px-1.5 py-1 text-center">{r.employees}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-600 bg-[#252a31] px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => downloadReportDoc(doc)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f6fed] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-600"
        >
          <Download size={12} />
          Download .doc
        </button>
        <p className="text-[9px] text-slate-500">Matches Weekly Time Log Summary format</p>
      </div>
    </div>
  );
}

function EmployeeHistoryView({ doc, fullPage }) {
  const k = doc.kpis || {};
  return (
    <div
      className={`overflow-hidden border border-slate-700 bg-[#2b3038] text-slate-100 shadow-lg ${
        fullPage ? "rounded-2xl" : "rounded-xl"
      }`}
    >
      <div className={`border-b border-slate-600/80 ${fullPage ? "px-5 py-4" : "px-3.5 py-3"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {doc.brand || "aimantra agent — Employee History"}
            </p>
            <h4
              className={`mt-1 font-serif font-bold leading-snug text-sky-300 ${
                fullPage ? "text-[22px]" : "text-[15px]"
              }`}
            >
              {doc.title}
            </h4>
            <p className={`mt-1 text-slate-300 ${fullPage ? "text-[13px]" : "text-[11px]"}`}>
              Reporting Period: {doc.periodLabel}
            </p>
          </div>
          <FileText size={fullPage ? 20 : 16} className="mt-1 shrink-0 text-slate-400" />
        </div>
        <div className={`mt-3 grid gap-1.5 ${fullPage ? "grid-cols-4" : "grid-cols-2"}`}>
          {[
            { l: "Engagement rows", v: k.totalRows },
            { l: "Total work hours", v: k.totalHours },
            { l: "Employees", v: k.employees },
            { l: "Projects", v: k.projects },
          ].map((x) => (
            <div
              key={x.l}
              className={`rounded-md border border-slate-600 bg-[#353b45] text-center ${
                fullPage ? "px-3 py-3" : "px-2 py-2"
              }`}
            >
              <p className={`font-bold text-white leading-none ${fullPage ? "text-[22px]" : "text-[15px]"}`}>
                {x.v ?? 0}
              </p>
              <p className="mt-1 text-[8.5px] font-medium uppercase tracking-wide text-slate-400">{x.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`space-y-3 overflow-auto px-3 py-3 ${
          fullPage ? "max-h-[calc(100vh-280px)] px-5 py-4" : "max-h-[340px]"
        }`}
      >
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-slate-200">
            Where employees were engaged ({(doc.rows || []).length} rows)
          </p>
          {doc.emptyMessage && !doc.rows?.length ? (
            <p className="text-[11px] text-slate-400">{doc.emptyMessage}</p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-600">
              <table className="w-full min-w-[720px] border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#2f6fed] text-white">
                    <th className="px-2 py-1.5 font-semibold">S.No</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Date</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Emp code</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Emp name</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Project name</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Type</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Total work hours</th>
                  </tr>
                </thead>
                <tbody>
                  {(doc.rows || []).map((r) => (
                    <tr key={`${r.date}-${r.empCode}-${r.projectCode}-${r.sno}`} className="border-t border-slate-600 bg-[#323843]">
                      <td className="px-2 py-1.5 text-center text-slate-300">{r.sno}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{r.dateLabel}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap font-semibold text-sky-200">{r.empCode}</td>
                      <td className="px-2 py-1.5">{r.empName}</td>
                      <td className="px-2 py-1.5" title={r.projectCode}>
                        {r.projectName}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-amber-200">{r.sourceLabel}</td>
                      <td className="px-2 py-1.5 text-center font-bold">{r.totalHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {(doc.employeeSummary || []).length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-slate-200">Employee totals</p>
            <div className="overflow-x-auto rounded-md border border-slate-600">
              <table className="w-full min-w-[480px] border-collapse text-[10px]">
                <thead>
                  <tr className="bg-[#2f6fed] text-white">
                    <th className="px-2 py-1.5 text-left font-semibold">Emp code</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Emp name</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Days</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Projects</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Total hours</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.employeeSummary.map((e) => (
                    <tr key={e.empCode} className="border-t border-slate-600 bg-[#323843]">
                      <td className="px-2 py-1.5 whitespace-nowrap font-semibold text-sky-200">{e.empCode}</td>
                      <td className="px-2 py-1.5">{e.empName}</td>
                      <td className="px-2 py-1.5 text-center">{e.days}</td>
                      <td className="px-2 py-1.5 text-center">{e.projects}</td>
                      <td className="px-2 py-1.5 text-center font-bold">{e.totalHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-600 bg-[#252a31] px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => downloadReportDoc(doc)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2f6fed] px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-600"
        >
          <Download size={12} />
          Download .doc
        </button>
        <p className="text-[9px] text-slate-500">Date, emp code, name, project, hours for the selected range</p>
      </div>
    </div>
  );
}

function GenericReportView({ doc, onOpenProject, fullPage = false }) {
  return (
    <div
      className={`overflow-hidden border border-slate-200 bg-[#fbfaf7] shadow-sm ${
        fullPage ? "rounded-2xl" : "rounded-xl"
      }`}
    >
      <div className={`border-b border-slate-200 bg-white ${fullPage ? "px-5 py-4" : "px-3.5 py-3"}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700">
              Document report
            </p>
            <h4
              className={`mt-0.5 font-bold text-slate-900 leading-snug ${
                fullPage ? "text-[18px]" : "text-[13px]"
              }`}
            >
              {doc.title}
            </h4>
            {doc.subtitle && (
              <p className={`mt-0.5 text-slate-500 leading-snug ${fullPage ? "text-[13px]" : "text-[12px]"}`}>
                {doc.subtitle}
              </p>
            )}
          </div>
          <FileText size={fullPage ? 22 : 18} className="mt-0.5 shrink-0 text-slate-400" />
        </div>
      </div>

      <div className={fullPage ? "px-5 py-4" : "px-3.5 py-2.5"}>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {(doc.meta || []).map((m, i) => (
            <div
              key={i}
              className={`grid text-[11.5px] ${
                fullPage ? "grid-cols-[140px_1fr] text-[13px]" : "grid-cols-[110px_1fr]"
              } ${i > 0 ? "border-t border-slate-100" : ""}`}
            >
              <div className="bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-500">{m.label}</div>
              <div className="break-words px-2.5 py-1.5 text-slate-800">{m.value}</div>
            </div>
          ))}
        </div>

        <div className={`mt-3 space-y-3 ${fullPage ? "max-h-[calc(100vh-320px)] overflow-y-auto" : ""}`}>
          {(doc.sections || []).map((sec, i) => (
            <div key={i}>
              <p className="mb-1 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                {sec.heading}
              </p>
              {(sec.bullets || []).length > 0 && (
                <ul className="space-y-1">
                  {sec.bullets.map((b, bi) => (
                    <li key={bi} className="flex gap-1.5 text-[11.5px] leading-snug text-slate-700">
                      <span className="shrink-0 text-teal-600">•</span>
                      <span className="min-w-0 break-words">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {(sec.blocks || []).map((block, bi) => (
                <div key={bi} className="mt-2 rounded-lg border border-slate-100 bg-white/80 px-2.5 py-2">
                  <p className="text-[12px] font-semibold text-teal-800">{block.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {(block.lines || []).map((line, li) => (
                      <li key={li} className="pl-1 text-[11px] text-slate-600">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => downloadReportDoc(doc)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
        >
          <Download size={12} />
          Download .doc
        </button>
        {doc.projectId && onOpenProject && (
          <button
            type="button"
            onClick={() => onOpenProject(doc.projectId)}
            className="text-[11px] font-semibold text-teal-700 hover:underline"
          >
            Open project page →
          </button>
        )}
      </div>
    </div>
  );
}

function rosterKindClass(kind, hoursCol) {
  if (kind === "holiday") {
    return hoursCol
      ? "bg-[#c5d9ed] text-center font-bold text-red-700"
      : "bg-[#f8d7da] text-center font-bold text-red-700";
  }
  if (kind === "leave") {
    return hoursCol
      ? "bg-[#c5d9ed] text-center text-slate-800"
      : "bg-[#c6efce] text-center font-bold text-green-800";
  }
  if (hoursCol) return "bg-[#c5d9ed] text-center font-bold text-slate-900";
  return "bg-white align-top whitespace-pre-wrap text-slate-800";
}

function EmployeeRosterView({ doc, fullPage }) {
  const employees = doc.employees || [];
  const k = doc.kpis || {};
  return (
    <div
      className={`overflow-hidden border border-slate-300 bg-white text-slate-900 shadow-lg ${
        fullPage ? "rounded-2xl" : "rounded-xl"
      }`}
    >
      <div className={`border-b border-slate-200 ${fullPage ? "px-5 py-4" : "px-3.5 py-3"}`}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {doc.brand || "aimantra agent — Daily Sheet"}
        </p>
        <h4 className={`mt-1 font-serif font-bold leading-snug text-slate-900 ${fullPage ? "text-[22px]" : "text-[15px]"}`}>
          {doc.title}
        </h4>
        <p className={`mt-1 text-slate-600 ${fullPage ? "text-[13px]" : "text-[11px]"}`}>
          Reporting Period: {doc.periodLabel}
        </p>
        <div className={`mt-3 grid gap-1.5 ${fullPage ? "grid-cols-3" : "grid-cols-3"}`}>
          {[
            { l: "Days", v: k.days },
            { l: "Employees", v: k.employees },
            { l: "Total hours", v: k.totalHours },
          ].map((x) => (
            <div key={x.l} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center">
              <p className="text-[15px] font-bold leading-none text-slate-900">{x.v ?? 0}</p>
              <p className="mt-1 text-[8.5px] font-medium uppercase tracking-wide text-slate-500">{x.l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`overflow-auto ${fullPage ? "max-h-[calc(100vh-280px)] px-4 py-3" : "max-h-[360px] px-2 py-2"}`}>
        {doc.emptyMessage && !employees.length ? (
          <p className="px-2 py-3 text-[11px] text-slate-500">{doc.emptyMessage}</p>
        ) : (
          <table className="border-collapse text-[10px]" style={{ minWidth: `${140 + employees.length * 220}px` }}>
            <thead>
              <tr>
                <th className="sticky left-0 z-20 border border-slate-800 bg-yellow-300 px-2 py-2 text-left font-bold text-slate-900">
                  DATE
                </th>
                {employees.map((e) => (
                  <Fragment key={e.key}>
                    <th className="border border-slate-800 bg-slate-900 px-2 py-2 text-left font-bold uppercase text-white">
                      {e.displayName || e.empName}
                    </th>
                    <th className="border border-slate-800 bg-slate-900 px-2 py-2 font-bold text-white">
                      Working Hours
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {(doc.dayRows || []).map((d) => (
                <tr key={d.date}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border border-slate-800 bg-white px-2 py-1.5 font-bold">
                    {d.dateLabel}
                  </td>
                  {employees.map((e) => {
                    const c = d.cells?.[e.key] || { kind: "empty", text: "", hoursLabel: "" };
                    return (
                      <Fragment key={`${d.date}-${e.key}`}>
                        <td className={`border border-slate-800 px-2 py-1.5 ${rosterKindClass(c.kind, false)}`}>
                          {c.text}
                        </td>
                        <td className={`border border-slate-800 px-2 py-1.5 ${rosterKindClass(c.kind, true)}`}>
                          {c.hoursLabel}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-200 bg-slate-50 px-3.5 py-2.5">
        <button
          type="button"
          onClick={() => downloadReportDoc(doc)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
        >
          <Download size={12} />
          Download .doc
        </button>
        <p className="text-[9px] text-slate-500">Date × employee sheet — leave green, holiday red</p>
      </div>
    </div>
  );
}

export default function ReportDoc({ doc, onOpenProject, fullPage = false, compact = false }) {
  if (!doc) return null;
  if (doc.kind === "weekly_timelog") {
    return <WeeklyReportView doc={doc} fullPage={fullPage} compact={compact} />;
  }
  if (doc.kind === "employee_history") {
    return <EmployeeHistoryView doc={doc} fullPage={fullPage} />;
  }
  if (doc.kind === "employee_roster") {
    return <EmployeeRosterView doc={doc} fullPage={fullPage} />;
  }
  if (doc.kind === "document") {
    return <GenericReportView doc={doc} onOpenProject={onOpenProject} fullPage={fullPage} />;
  }
  return null;
}
