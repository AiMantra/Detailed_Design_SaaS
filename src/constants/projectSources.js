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
};

/** HRMS division/sub-company that should only see Aimantra projects */
export const AIMANTRA_SUB_COMPANY_ID = "3e640f93-152c-45b4-aee8-b461160d23d4";

/** Filter select keys → source UUID */
export const PROJECT_TYPE_SOURCE_IDS = {
  "detail design": PROJECT_SOURCE_IDS.DETAIL_DESIGN,
  dpr: PROJECT_SOURCE_IDS.DPR,
  prebid: PROJECT_SOURCE_IDS.PREBID,
  bd: PROJECT_SOURCE_IDS.BD,
  account: PROJECT_SOURCE_IDS.ACCOUNT,
  aimantra: PROJECT_SOURCE_IDS.AIMANTRA,
};

/** source UUID → display label */
export const PROJECT_TYPE_LABELS = {
  [PROJECT_SOURCE_IDS.DETAIL_DESIGN]: "Detail Design",
  [PROJECT_SOURCE_IDS.DPR]: "DPR",
  [PROJECT_SOURCE_IDS.PREBID]: "Prebid",
  [PROJECT_SOURCE_IDS.BD]: "BD",
  [PROJECT_SOURCE_IDS.ACCOUNT]: "Account",
  [PROJECT_SOURCE_IDS.AIMANTRA]: "Aimantra",
};

export const PROJECT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "detail design", label: "Detail Design" },
  { value: "dpr", label: "DPR" },
  { value: "prebid", label: "Prebid" },
  { value: "bd", label: "BD" },
  { value: "account", label: "Account" },
  { value: "aimantra", label: "Aimantra" },
];

/** Create / Update Project Type dropdown options */
export const PROJECT_TYPE_FORM_OPTIONS = [
  { value: PROJECT_SOURCE_IDS.DETAIL_DESIGN, label: "Detail Design" },
  { value: PROJECT_SOURCE_IDS.DPR, label: "DPR" },
  { value: PROJECT_SOURCE_IDS.PREBID, label: "Prebid" },
  { value: PROJECT_SOURCE_IDS.BD, label: "BD" },
  { value: PROJECT_SOURCE_IDS.ACCOUNT, label: "Account" },
  { value: PROJECT_SOURCE_IDS.AIMANTRA, label: "Aimantra" },
];

/** DPR, Prebid, BD & Account: client/branch (and some units) optional */
export function isRelaxedProjectType(sourceId) {
  return (
    sourceId === PROJECT_SOURCE_IDS.DPR ||
    sourceId === PROJECT_SOURCE_IDS.PREBID ||
    sourceId === PROJECT_SOURCE_IDS.BD ||
    sourceId === PROJECT_SOURCE_IDS.ACCOUNT ||
    sourceId === PROJECT_SOURCE_IDS.AIMANTRA
  );
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
  return sid === PROJECT_SOURCE_IDS.BD || sid === PROJECT_SOURCE_IDS.AIMANTRA;
}

/** Aimantra create/edit: only core identity, company, sector, owners, and dates */
export function hidesExtendedProjectFields(projectOrSourceId) {
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.AIMANTRA;
}

/** Aimantra: work type is not used on worklog / planner */
export function hidesProjectWorkType(projectOrSourceId) {
  if (projectOrSourceId === "aimantra") return true;
  return resolveSourceId(projectOrSourceId) === PROJECT_SOURCE_IDS.AIMANTRA;
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

export function getDefaultProjectTypeFilter() {
  return isAimantraSubCompanyUser() ? "aimantra" : "all";
}

export function getVisibleProjectTypeFilterOptions() {
  if (isAimantraSubCompanyUser()) {
    return PROJECT_TYPE_FILTER_OPTIONS.filter((o) => o.value === "aimantra");
  }
  return PROJECT_TYPE_FILTER_OPTIONS.filter((o) => o.value !== "aimantra");
}

/** API source_id for list fetches: Aimantra sub-company is locked to Aimantra type */
export function resolveListSourceId(filterProjectType) {
  if (isAimantraSubCompanyUser()) return PROJECT_SOURCE_IDS.AIMANTRA;
  return PROJECT_TYPE_SOURCE_IDS[filterProjectType] || "";
}

export function applyUserProjectVisibility(projects = []) {
  const aimantraUser = isAimantraSubCompanyUser();
  const hasSourceMeta = projects.some((p) => getProjectSourceId(p));
  if (!hasSourceMeta) return projects;
  return projects.filter((p) => {
    const sid = String(getProjectSourceId(p));
    if (aimantraUser) return sid === PROJECT_SOURCE_IDS.AIMANTRA;
    return sid !== PROJECT_SOURCE_IDS.AIMANTRA;
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
