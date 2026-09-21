/**
 * Project type (source) IDs shared across lists, create/update, and aimantra.
 */

export const PROJECT_SOURCE_IDS = {
  DETAIL_DESIGN: "266931d6-0486-4760-b5a5-fd9f823b3383",
  DPR: "994947cd-a0cf-4648-bef3-42704e955ff0",
  PREBID: "c4e54604-9a83-4065-b798-ad0e58673788",
  BD: "c4e54604-9a83-4065-b798-ad0e58673789",
};

/** Filter select keys → source UUID */
export const PROJECT_TYPE_SOURCE_IDS = {
  "detail design": PROJECT_SOURCE_IDS.DETAIL_DESIGN,
  dpr: PROJECT_SOURCE_IDS.DPR,
  prebid: PROJECT_SOURCE_IDS.PREBID,
  bd: PROJECT_SOURCE_IDS.BD,
};

/** source UUID → display label */
export const PROJECT_TYPE_LABELS = {
  [PROJECT_SOURCE_IDS.DETAIL_DESIGN]: "Detail Design",
  [PROJECT_SOURCE_IDS.DPR]: "DPR",
  [PROJECT_SOURCE_IDS.PREBID]: "Prebid",
  [PROJECT_SOURCE_IDS.BD]: "BD",
};

export const PROJECT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "detail design", label: "Detail Design" },
  { value: "dpr", label: "DPR" },
  { value: "prebid", label: "Prebid" },
  { value: "bd", label: "BD" },
];

/** Create / Update Project Type dropdown options */
export const PROJECT_TYPE_FORM_OPTIONS = [
  { value: PROJECT_SOURCE_IDS.DETAIL_DESIGN, label: "Detail Design" },
  { value: PROJECT_SOURCE_IDS.DPR, label: "DPR" },
  { value: PROJECT_SOURCE_IDS.PREBID, label: "Prebid" },
  { value: PROJECT_SOURCE_IDS.BD, label: "BD" },
];

/** DPR, Prebid & BD: client/branch (and some units) optional */
export function isRelaxedProjectType(sourceId) {
  return (
    sourceId === PROJECT_SOURCE_IDS.DPR ||
    sourceId === PROJECT_SOURCE_IDS.PREBID ||
    sourceId === PROJECT_SOURCE_IDS.BD
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

/** Filter a project list by type key (`all` | `detail design` | `dpr` | `prebid` | `bd`). */
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
  return list;
}
