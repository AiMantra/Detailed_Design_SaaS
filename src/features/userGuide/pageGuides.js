/**
 * Page-aware coaching content.
 * Auto-switches when the user navigates.
 * Removable with the rest of `src/features/userGuide/`.
 */

export const GUIDE_INTERVAL_MS = 5 * 60 * 1000;
export const GUIDE_FIRST_DELAY_MS = 25 * 1000;
export const GUIDE_STORAGE_DISABLED = "ai_user_guide_disabled";

/** @typedef {{ title: string, intro: string, steps: string[], tips?: string[], quickAsks: { label: string, query: string }[], path: string, roles?: string[] }} PageGuide */

/** @type {Record<string, PageGuide>} */
export const PAGE_GUIDES = {
  dashboard: {
    title: "Dashboard",
    intro: "Home base for project health. Scan delays first, then drill into projects that need action.",
    steps: [
      "Review delayed / at-risk project cards.",
      "Click a project to open All Projects or TL Projects.",
      "Use Ask AI for employee hours or project summaries without leaving the page.",
    ],
    tips: ["Ask: “employee EMP001 last 7 days”", "Ask: “project details <id>”"],
    quickasks: [
      { label: "My planner today", query: "planner day" },
      { label: "Employee history", query: "employee " },
    ],
    path: "/dashboard",
    roles: ["ACCOUNT", "ADMIN", "USER", "TL"],
  },
  "all-projects": {
    title: "Project List",
    intro: "Browse projects → expand Activities → Sub-activities → Stages. Submit proofs, approve, and add work logs here.",
    steps: [
      "Search / filter by project code or name.",
      "Expand a card → Activities → Sub-activity rows.",
      "Use View (eye) for stage & proof details.",
      "Click Work Log on a stage to record time.",
      "PO Status shows Inprogress / Submitted / Approved — use Approve when ready.",
    ],
    tips: [
      "Ask: “project ABC-123” to jump to details",
      "Ask: “project worklog <id>” for hours by activity",
    ],
    quickasks: [
      { label: "Project by code", query: "project " },
      { label: "Project worklog", query: "project worklog " },
      { label: "Rework history", query: "rework " },
    ],
    path: "/all-projects",
    roles: ["ACCOUNT", "ADMIN", "USER", "TL"],
  },
  "tl-projects": {
    title: "TL Projects",
    intro: "Your assigned projects. Submit / Approve stage proofs and keep work logs current.",
    steps: [
      "Expand project → activity → stage rows.",
      "Submit with proof documents when work is done.",
      "Approve Submitted stages (or Reject with reason).",
      "Open the red file icon to review proofs.",
      "Add Work Log per stage after daily work.",
    ],
    tips: ["Ask: “rework <projectId>”", "Ask: “subactivity <id>” for cycle history"],
    quickasks: [
      { label: "Rework by project", query: "rework " },
      { label: "Subactivity history", query: "subactivity " },
      { label: "Employee hours", query: "employee " },
    ],
    path: "/tl-projects",
    roles: ["TL"],
  },
  "projects-bulk": {
    title: "Bulk Project Upload",
    intro: "Create many projects at once from Excel instead of one-by-one.",
    steps: [
      "Use sheets: Projects, Activities, SubActivities, Stages.",
      "Match column headers exactly to the template.",
      "Upload the file and read validation / error rows.",
      "Fix errors and re-upload, or open Project List to verify created projects.",
    ],
    tips: ["After upload ask: “project <new-code>” to confirm creation"],
    quickasks: [
      { label: "Find project by code", query: "project " },
      { label: "Go to Project List", query: "open project list" },
    ],
    path: "/projects-bulk",
    roles: ["ACCOUNT"],
  },
  "task-planner": {
    title: "Task Planner",
    intro: "Plan work for a date, then log actual hours. Ask AI for day / week / month planner history.",
    steps: [
      "Pick the date at the top.",
      "Add planners (project + sub-activity + time window).",
      "Mark done / update as the day progresses.",
      "Log actual time so Employee / Project reports stay accurate.",
      "Ask AI: “planner week” or “planner month EMP001” for history.",
    ],
    tips: [
      "Day = single date API",
      "Week / month = AI aggregates dates for you",
    ],
    quickasks: [
      { label: "Planner today", query: "planner day" },
      { label: "Planner this week", query: "planner week" },
      { label: "Planner this month", query: "planner month" },
    ],
    path: "/task-planner",
    roles: ["USER", "TL", "ADMIN", "ACCOUNT"],
  },
  "employee-worklog-history": {
    title: "Employee Worklog History",
    intro: "Timeline of who logged what. Ask AI with an employee code for an instant summary.",
    steps: [
      "Filter by employee and date range on this page.",
      "Expand a user to see day-wise logs.",
      "Or type in Ask AI: “employee EMP001” or “history EMP001 from 2026-09-01”.",
    ],
    tips: ["USER role is locked to own emp_code automatically"],
    quickasks: [
      { label: "My history (7 days)", query: "employee me week" },
      { label: "By emp code", query: "employee " },
    ],
    path: "/employee-worklog-history",
    roles: ["USER", "TL", "ADMIN", "ACCOUNT"],
  },
  "daily-logs": {
    title: "Daily Logs",
    intro: "Audit trail of project events (not time sheets). Filter by date, event type, and project.",
    steps: [
      "Pick date / event type / search.",
      "Open a log card for old → new values and who performed it.",
      "Cross-check with Project Report when numbers look wrong.",
    ],
    tips: ["For hours use Employee Worklog History or Ask AI employee query"],
    quickasks: [
      { label: "Employee hours", query: "employee " },
      { label: "Project summary", query: "project worklog " },
    ],
    path: "/daily-logs",
    roles: ["ACCOUNT", "ADMIN"],
  },
  settings: {
    title: "Settings",
    intro: "Masters that drive Create Project: companies, sectors, clients, stage templates.",
    steps: [
      "Open the tab you need (Companies / Sectors / Clients / Templates).",
      "Add or edit carefully — projects depend on these.",
      "Return to Create Project or Bulk Upload after saving.",
    ],
    tips: ["Client bulk upload may also live under Settings components"],
    quickasks: [
      { label: "Open Bulk Upload", query: "open bulk upload" },
      { label: "Open Create Project", query: "open create project" },
    ],
    path: "/settings",
    roles: ["ACCOUNT", "ADMIN"],
  },
  "track-work-log": {
    title: "Project Rework History",
    intro: "Rework / rejection cycles by project → activity → sub-activity, with employee worklogs per cycle.",
    steps: [
      "Select a project (then activity / sub-activity if needed).",
      "Review cycle number, reason, and worklogs.",
      "Ask AI: “rework <projectId>” for a quick summary.",
    ],
    tips: ["Also works with activity_id / subactivity_id"],
    quickasks: [
      { label: "Rework by project id", query: "rework " },
      { label: "Subactivity cycles", query: "subactivity " },
    ],
    path: "/track-work-log",
    roles: ["TL", "ACCOUNT"],
  },
  "employee-report": {
    title: "Employee Report",
    intro: "TL view of hours per employee across projects. Ask AI with emp code for a fast cut.",
    steps: [
      "Select / filter the employee.",
      "Review nested project → activity hours.",
      "Ask: “report EMP001” for the same data in the guide.",
    ],
    quickasks: [
      { label: "Employee report", query: "report " },
      { label: "Worklog history", query: "employee " },
    ],
    path: "/employee-report",
    roles: ["TL"],
  },
  "project-report": {
    title: "Project Report",
    intro: "Progress and hours rolled up by project structure for client / billing reviews.",
    steps: [
      "Pick the TL / filter context.",
      "Expand activities and sub-activities.",
      "Ask: “project worklog <id>” for live hour breakdown.",
    ],
    quickasks: [
      { label: "Project worklog", query: "project worklog " },
      { label: "Rework", query: "rework " },
    ],
    path: "/project-report",
    roles: ["TL"],
  },
  "project-create": {
    title: "Create Project",
    intro: "Build one project with activities, sub-activities, stages, and assigned people.",
    steps: [
      "Fill basics (name, code, client, workorder cost).",
      "Add activities → sub-activities → payment stages.",
      "Assign personnel, then submit.",
    ],
    quickasks: [{ label: "Open Bulk Upload", query: "open bulk upload" }],
    path: "/project/create",
    roles: ["ACCOUNT", "ADMIN"],
  },
  default: {
    title: "AI Portal Guide",
    intro: "I coach you on each page and can fetch live history — employee, project, planner, and rework.",
    steps: [
      "Navigate using the left sidebar.",
      "Open Ask AI and type an employee code, project id/code, or “planner week”.",
      "Use quick chips on each page for one-click queries.",
    ],
    tips: [
      "employee EMP001",
      "project ABC-12",
      "project worklog 101",
      "activity worklog 101 Excavation",
      "subactivity 55",
      "planner day|week|month",
      "rework 101",
    ],
    quickasks: [
      { label: "Employee history", query: "employee " },
      { label: "Planner week", query: "planner week" },
      { label: "Project list", query: "open project list" },
    ],
    path: "/dashboard",
  },
};

/**
 * Resolve page guide from pathname + role.
 * @param {string} pathname
 * @param {string} role
 */
export function resolvePageGuide(pathname, role) {
  const path = pathname || "/";
  /** @type {[RegExp, string][]} */
  const rules = [
    [/^\/dashboard/, "dashboard"],
    [/^\/all-projects/, "all-projects"],
    [/^\/projects-bulk/, "projects-bulk"],
    [/^\/tl-projects/, "tl-projects"],
    [/^\/projects\/[^/]+/, "all-projects"],
    [/^\/projects\/?$/, "all-projects"],
    [/^\/task-planner/, "task-planner"],
    [/^\/employee-worklog-history/, "employee-worklog-history"],
    [/^\/daily-logs/, "daily-logs"],
    [/^\/settings/, "settings"],
    [/^\/track-work-log/, "track-work-log"],
    [/^\/employee-report/, "employee-report"],
    [/^\/project-report/, "project-report"],
    [/^\/project\/create/, "project-create"],
    [/^\/project\/update/, "all-projects"],
  ];

  let key = "default";
  for (const [re, k] of rules) {
    if (re.test(path)) {
      key = k;
      break;
    }
  }

  const guide = PAGE_GUIDES[key] || PAGE_GUIDES.default;
  if (guide.roles && role && !guide.roles.includes(role) && key !== "default") {
    return PAGE_GUIDES.default;
  }
  return { ...guide, key };
}
