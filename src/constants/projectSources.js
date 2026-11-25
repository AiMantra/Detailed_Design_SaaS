/**
 * Project type (source) IDs shared across lists, create/update, and aimantra.
 */

export const PROJECT_SOURCE_IDS = {
  DETAIL_DESIGN: "266931d6-0486-4760-b5a5-fd9f823b3383",
  DPR: "994947cd-a0cf-4648-bef3-42704e955ff0",
  PREBID: "c4e54604-9a83-4065-b798-ad0e58673788",
  BD: "c4e54604-9a83-4065-b798-ad0e58673789",
  ACCOUNT: "c4e54604-9a83-4065-b798-ad0e58673790",
  AIMANTRA: "c4e54604-9a83-4065-b798-ad0e58673791",
  HR: "c4e54604-9a83-4065-b798-ad0e58673792",
  INTERNAL: "c4e54604-9a83-4065-b798-ad0e58673793",
  PROJECT_COORDINATION: "c4e54604-9a83-4065-b798-ad0e58673794",
  DESIGN: "c4e54604-9a83-4065-b798-ad0e58673795",
};

/** HRMS division/sub-company that should only see Aimantra projects */
export const AIMANTRA_SUB_COMPANY_ID = "3e640f93-152c-45b4-aee8-b461160d23d4";

/** HRMS division/sub-company whose users should only see Saptagon projects */
export const SAPTAGON_SUB_COMPANY_ID = "beb197dd-9ad1-4136-a1ad-bb469e7127a2";

/** Company UUID on a project that marks it as a Saptagon project */
export const SAPTAGON_COMPANY_ID = "eb10af51-9734-4ff0-a250-133e15e3237e";

/** Extra emp codes that can see Aimantra projects (in addition to other types) */
export const AIMANTRA_VISIBLE_EMP_CODES = ["SAPL0739"];

/** Tech Support menu is limited to these emp codes */
export const TECH_SUPPORT_EMP_CODES = ["CIPL10021"];

/** Filter select keys → source UUID */
export const PROJECT_TYPE_SOURCE_IDS = {
  "detail design": PROJECT_SOURCE_IDS.DETAIL_DESIGN,
  dpr: PROJECT_SOURCE_IDS.DPR,
  prebid: PROJECT_SOURCE_IDS.PREBID,
  bd: PROJECT_SOURCE_IDS.BD,
  account: PROJECT_SOURCE_IDS.ACCOUNT,
  aimantra: PROJECT_SOURCE_IDS.AIMANTRA,
  hr: PROJECT_SOURCE_IDS.HR,
  admincivilmantra: PROJECT_SOURCE_IDS.INTERNAL,
  "project coordination": PROJECT_SOURCE_IDS.PROJECT_COORDINATION,
  design: PROJECT_SOURCE_IDS.DESIGN,
};

/** source UUID → display label */
export const PROJECT_TYPE_LABELS = {
  [PROJECT_SOURCE_IDS.DETAIL_DESIGN]: "Detail Design",
  [PROJECT_SOURCE_IDS.DPR]: "DPR",
  [PROJECT_SOURCE_IDS.PREBID]: "Prebid",
  [PROJECT_SOURCE_IDS.BD]: "BD",
  [PROJECT_SOURCE_IDS.ACCOUNT]: "Account",
  [PROJECT_SOURCE_IDS.AIMANTRA]: "Aimantra",
  [PROJECT_SOURCE_IDS.HR]: "HR",
  [PROJECT_SOURCE_IDS.INTERNAL]: "admincivilmantra",
  [PROJECT_SOURCE_IDS.PROJECT_COORDINATION]: "Project Coordination",
  [PROJECT_SOURCE_IDS.DESIGN]: "Design",
};

export const PROJECT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "detail design", label: "Detail Design" },
  { value: "dpr", label: "DPR" },
  { value: "prebid", label: "Prebid" },
  { value: "bd", label: "BD" },
  { value: "account", label: "Account" },
  { value: "aimantra", label: "Aimantra" },
  { value: "hr", label: "HR" },
  { value: "admincivilmantra", label: "admincivilmantra" },
  { value: "project coordination", label: "Project Coordination" },
  { value: "design", label: "Design" },
];

/** Create / Update Project Type dropdown options */
export const PROJECT_TYPE_FORM_OPTIONS = [
  { value: PROJECT_SOURCE_IDS.DETAIL_DESIGN, label: "Detail Design" },
  { value: PROJECT_SOURCE_IDS.DPR, label: "DPR" },
  { value: PROJECT_SOURCE_IDS.PREBID, label: "Prebid" },
  { value: PROJECT_SOURCE_IDS.BD, label: "BD" },
  { value: PROJECT_SOURCE_IDS.ACCOUNT, label: "Account" },
  { value: PROJECT_SOURCE_IDS.AIMANTRA, label: "Aimantra" },
  { value: PROJECT_SOURCE_IDS.HR, label: "HR" },
  { value: PROJECT_SOURCE_IDS.INTERNAL, label: "admincivilmantra" },
  { value: PROJECT_SOURCE_IDS.PROJECT_COORDINATION, label: "Project Coordination" },
  { value: PROJECT_SOURCE_IDS.DESIGN, label: "Design" },
];

/** DPR, Prebid, BD & Account: client/branch (and some units) optional */
export function isRelaxedProjectType(sourceId) {
  return (
    sourceId === PROJECT_SOURCE_IDS.DPR ||
    sourceId === PROJECT_SOURCE_IDS.PREBID ||
    sourceId === PROJECT_SOURCE_IDS.BD ||
    sourceId === PROJECT_SOURCE_IDS.ACCOUNT ||
    sourceId === PROJECT_SOURCE_IDS.AIMANTRA ||
    sourceId === PROJECT_SOURCE_IDS.HR ||
    sourceId === PROJECT_SOURCE_IDS.INTERNAL ||
    sourceId === PROJECT_SOURCE_IDS.PROJECT_COORDINATION ||
    sourceId === PROJECT_SOURCE_IDS.DESIGN
  );
}

export function isSaptagonOnlyProjectType(projectOrSourceId) {
  const sid = resolveSourceId(projectOrSourceId);
  return (
    sid === PROJECT_SOURCE_IDS.PROJECT_COORDINATION ||
    sid === PROJECT_SOURCE_IDS.DESIGN ||
    projectOrSourceId === "project coordination" ||
    projectOrSourceId === "design"
  );
}

export function isHrProjectSource(projectOrSourceId) {
  if (projectOrSourceId === "hr") return true;
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.HR;
}

/** Internal: slim create/edit (name, code, short name, location, company, owner + LOA/completion) */
export function isInternalProjectSource(projectOrSourceId) {
  if (projectOrSourceId === "admincivilmantra" || projectOrSourceId === "internal") return true;
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.INTERNAL;
}

export function getProjectSourceId(project) {
  return (
    project?.source_id ||
    project?.source ||
    project?.source_detail?.id ||
    project?.source_detail?.source_id ||
    ""
  );
}

function resolveSourceId(projectOrSourceId) {
  return typeof projectOrSourceId === "string"
    ? projectOrSourceId
    : getProjectSourceId(projectOrSourceId);
}

/** BD & Aimantra: hide weightage in UI and skip 100% validation */
export function hidesProjectWeightage(projectOrSourceId) {
  const sid = resolveSourceId(projectOrSourceId);
  return (
    sid === PROJECT_SOURCE_IDS.BD ||
    sid === PROJECT_SOURCE_IDS.AIMANTRA ||
    sid === PROJECT_SOURCE_IDS.HR ||
    sid === PROJECT_SOURCE_IDS.INTERNAL ||
    sid === PROJECT_SOURCE_IDS.PROJECT_COORDINATION ||
    sid === PROJECT_SOURCE_IDS.DESIGN ||
    isSaptagonProject(projectOrSourceId)
  );
}

/** Aimantra / Internal create/edit: hide workorder, length, client, GST extras */
export function hidesExtendedProjectFields(projectOrSourceId) {
  const sid = resolveSourceId(projectOrSourceId);
  return sid === PROJECT_SOURCE_IDS.AIMANTRA || sid === PROJECT_SOURCE_IDS.INTERNAL;
}

/** Aimantra: work type is not used on worklog / planner */
export function hidesProjectWorkType(projectOrSourceId) {
  if (projectOrSourceId === "aimantra" || projectOrSourceId === "hr") return true;
  const sid = resolveSourceId(projectOrSourceId);
  return sid === PROJECT_SOURCE_IDS.AIMANTRA || sid === PROJECT_SOURCE_IDS.HR;
}

/** Work type can still show, but is not required */
export function skipsRequiredWorkType(projectOrSourceId) {
  if (isSaptagonOnlyUser()) return true;
  if (projectOrSourceId === "project coordination") return true;
  if (hidesProjectWorkType(projectOrSourceId)) return true;
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.PROJECT_COORDINATION;
}

export function getUserSubCompanyId() {
  return (
    sessionStorage.getItem("company_id") ||
    sessionStorage.getItem("sub_company_id") ||
    ""
  );
}

export function isAimantraSubCompanyUser() {
  return String(getUserSubCompanyId()) === AIMANTRA_SUB_COMPANY_ID;
}

export function isSaptagonSubCompanyUser() {
  return String(getUserSubCompanyId()) === SAPTAGON_SUB_COMPANY_ID;
}

export function getProjectCompanyIds(project) {
  return [
    project?.company,
    project?.company_id,
    project?.company_detail?.id,
  ]
    .map((id) => String(id || "").trim())
    .filter(Boolean);
}

export function isSaptagonProject(project) {
  if (!project) return false;
  return getProjectCompanyIds(project).includes(SAPTAGON_COMPANY_ID);
}

/** CSMS letter-record filter; last path UUID is always this company/filter id */
export const CSMS_BASE_URL = "https://csms.aimantra.info";
export const CSMS_LETTER_FILTER_ID = "a2b6154c-5c4a-4bcb-a4ec-b151c5c652b5";

/** Letter number on worklog / planner for Project Coordination */
export function showsWorklogLetterNumber(projectOrSourceId) {
  if (!projectOrSourceId) return false;
  if (projectOrSourceId === "project coordination") return true;
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.PROJECT_COORDINATION;
}

/** Hide Chainage / Qty / Area in listing tables for admincivilmantra and Saptagon projects */
export function hidesChainageQtyArea(project) {
  return isInternalProjectSource(project) || isSaptagonProject(project);
}

export function getUserEmpCode() {
  return String(sessionStorage.getItem("emp_code") || "").trim().toUpperCase();
}

export function getAppUserRole() {
  return String(sessionStorage.getItem("userRole") || "").toUpperCase();
}

/** ACCOUNT role sees Civilmantra + Saptagon (all companies), not one sub-company */
export function canSeeAllCompanies() {
  return getAppUserRole() === "ACCOUNT";
}

export function isAimantraAllowedEmp() {
  return AIMANTRA_VISIBLE_EMP_CODES.includes(getUserEmpCode());
}

/** Can view Aimantra projects: Account role, Aimantra sub-company, or allowlisted emp */
export function canSeeAimantraProjects() {
  return canSeeAllCompanies() || isAimantraSubCompanyUser() || isAimantraAllowedEmp();
}

/** Locked to Aimantra only — allowlisted emps still see their own company plus Aimantra */
export function isAimantraOnlyUser() {
  return !canSeeAllCompanies() && isAimantraSubCompanyUser();
}

/** Locked to Saptagon projects only — Account and Aimantra allowlist are excluded */
export function isSaptagonOnlyUser() {
  return !canSeeAllCompanies() && isSaptagonSubCompanyUser() && !isAimantraAllowedEmp();
}

export function canSeeTechSupport() {
  return TECH_SUPPORT_EMP_CODES.includes(getUserEmpCode());
}

export function isAimantraSubcompanyEmployee(emp) {
  return (
    String(emp?.subcompany_id || emp?.sub_company_id || "") === AIMANTRA_SUB_COMPANY_ID
  );
}

export function isSaptagonSubcompanyEmployee(emp) {
  return (
    String(emp?.subcompany_id || emp?.sub_company_id || "") === SAPTAGON_SUB_COMPANY_ID
  );
}

function employeeHasSubcompany(emp) {
  return Boolean(emp?.subcompany_id || emp?.sub_company_id);
}

/** Task planner: Aimantra/Saptagon users only see employees in their sub-company */
export function filterTaskPlannerEmployees(employees = []) {
  if (!Array.isArray(employees)) return [];
  const hasSubcompany = employees.some(employeeHasSubcompany);
  if (!hasSubcompany) return employees;
  if (isAimantraOnlyUser()) return employees.filter(isAimantraSubcompanyEmployee);
  if (isSaptagonOnlyUser()) return employees.filter(isSaptagonSubcompanyEmployee);
  return employees;
}

export function getDefaultProjectTypeFilter() {
  if (canSeeAllCompanies()) return "all";
  return isAimantraOnlyUser() ? "aimantra" : "all";
}

export function canSeeSaptagonProjectTypes() {
  return isSaptagonSubCompanyUser();
}

const SAPTAGON_FILTER_KEYS = new Set(["project coordination", "design"]);
const SAPTAGON_FORM_SOURCE_IDS = new Set([
  PROJECT_SOURCE_IDS.PROJECT_COORDINATION,
  PROJECT_SOURCE_IDS.DESIGN,
]);

export function getVisibleProjectTypeFilterOptions() {
  if (isAimantraOnlyUser()) {
    return PROJECT_TYPE_FILTER_OPTIONS.filter((o) => o.value === "aimantra");
  }

  let options = PROJECT_TYPE_FILTER_OPTIONS.filter((o) => !SAPTAGON_FILTER_KEYS.has(o.value));
  if (!canSeeAllCompanies() && !isAimantraAllowedEmp()) {
    options = options.filter((o) => o.value !== "aimantra");
  }
  if (canSeeSaptagonProjectTypes()) {
    options = options.concat(PROJECT_TYPE_FILTER_OPTIONS.filter((o) => SAPTAGON_FILTER_KEYS.has(o.value)));
  }
  if (isSaptagonOnlyUser()) {
    options = options.filter((o) => o.value !== "hr");
  }
  return options;
}

export function getVisibleProjectTypeFormOptions() {
  if (isAimantraOnlyUser()) {
    return PROJECT_TYPE_FORM_OPTIONS.filter((o) => o.value === PROJECT_SOURCE_IDS.AIMANTRA);
  }

  let options = PROJECT_TYPE_FORM_OPTIONS.filter((o) => !SAPTAGON_FORM_SOURCE_IDS.has(o.value));
  if (!canSeeAllCompanies() && !isAimantraAllowedEmp()) {
    options = options.filter((o) => o.value !== PROJECT_SOURCE_IDS.AIMANTRA);
  }
  if (canSeeSaptagonProjectTypes()) {
    options = options.concat(PROJECT_TYPE_FORM_OPTIONS.filter((o) => SAPTAGON_FORM_SOURCE_IDS.has(o.value)));
  }
  return options;
}

/** API source_id for list fetches: Aimantra-only users are locked to Aimantra type */
export function resolveListSourceId(filterProjectType) {
  if (isAimantraOnlyUser()) return PROJECT_SOURCE_IDS.AIMANTRA;
  return PROJECT_TYPE_SOURCE_IDS[filterProjectType] || "";
}

function mergeProjectsByKey(lists) {
  const map = new Map();
  lists.flat().forEach((project) => {
    if (!project) return;
    const key = String(project.id || project.project_id || project.project_code || "");
    if (!key) return;
    map.set(key, project);
  });
  return [...map.values()];
}

export function applyUserProjectVisibility(projects = []) {
  if (canSeeAllCompanies()) return projects;

  if (!isSaptagonSubCompanyUser()) {
    projects = projects.filter((p) => !isSaptagonOnlyProjectType(p));
  }

  const allowAimantra = isAimantraAllowedEmp();
  const aimantraProjects = projects.filter(
    (p) => String(getProjectSourceId(p)) === PROJECT_SOURCE_IDS.AIMANTRA
  );

  if (isSaptagonSubCompanyUser()) {
    const hasCompanyMeta = projects.some((p) => getProjectCompanyIds(p).length > 0);
    const saptagon = hasCompanyMeta ? projects.filter(isSaptagonProject) : projects;
    return allowAimantra ? mergeProjectsByKey([saptagon, aimantraProjects]) : saptagon;
  }

  const hasSourceMeta = projects.some((p) => getProjectSourceId(p));
  if (!hasSourceMeta) return projects;
  return projects.filter((p) => {
    const sid = String(getProjectSourceId(p));
    if (sid === PROJECT_SOURCE_IDS.AIMANTRA) {
      return isAimantraOnlyUser() || allowAimantra;
    }
    return !isAimantraOnlyUser();
  });
}

export function getProjectTypeLabel(projectOrSourceId) {
  if (!projectOrSourceId) return "";
  if (typeof projectOrSourceId === "string") {
    return PROJECT_TYPE_LABELS[projectOrSourceId] || "";
  }
  return PROJECT_TYPE_LABELS[getProjectSourceId(projectOrSourceId)] || "";
}

/** source UUID or project → filter key used by PROJECT_TYPE_FILTER_OPTIONS */
export function getProjectTypeFilterValue(projectOrSourceId) {
  const sid =
    typeof projectOrSourceId === "string"
      ? projectOrSourceId
      : getProjectSourceId(projectOrSourceId);
  if (!sid) return "all";
  const match = Object.entries(PROJECT_TYPE_SOURCE_IDS).find(([, id]) => id === sid);
  return match ? match[0] : "all";
}

/** Filter a project list by type key (`all` | `detail design` | `dpr` | `prebid` | `bd` | `account`). */
export function filterProjectsByType(projects = [], typeKey, includeProjectId) {
  const sourceId = PROJECT_TYPE_SOURCE_IDS[typeKey];
  if (!sourceId) return projects;

  const hasSourceMeta = projects.some((p) => getProjectSourceId(p));
  if (!hasSourceMeta) return projects;

  return projects.filter((p) => {
    const pid = p.id || p.project_id;
    if (includeProjectId && String(pid) === String(includeProjectId)) return true;
    return String(getProjectSourceId(p)) === String(sourceId);
  });
}

export function resolveProjectsForType({
  projects = [],
  typeKey = "all",
  includeProjectId,
  hasSourceMeta,
  remoteList,
}) {
  let list = hasSourceMeta
    ? filterProjectsByType(projects, typeKey, includeProjectId)
    : (typeKey && typeKey !== "all" ? (remoteList || []) : projects);

  if (includeProjectId && !list.some((p) => String(p.id || p.project_id) === String(includeProjectId))) {
    const keep = projects.find((p) => String(p.id || p.project_id) === String(includeProjectId));
    if (keep) list = [keep, ...list];
  }
  return applyUserProjectVisibility(list);
}
