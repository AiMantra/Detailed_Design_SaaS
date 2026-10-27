import { PROJECT_SOURCE_IDS, isHrProjectSource } from "../../constants/projectSources";

export function isHrProject(project) {
  if (String(project?.project_kind || "").toLowerCase() === "hr") return true;
  return isHrProjectSource(project);
}

/** HR when kind or the HR source id is set. Civil only when project_kind is present and not hr. */
export function projectKindBadge(project) {
  if (!project) return null;
  if (isHrProject(project)) return "HR";
  if (Object.prototype.hasOwnProperty.call(project, "project_kind")) return "Civil";
  return null;
}

export function currentEmpCode() {
  return sessionStorage.getItem("emp_code") || "";
}

export function recordId(record) {
  return record?.id || record?.project_id || record?.uuid || "";
}

export function unwrapProjectRecord(data) {
  if (!data || typeof data !== "object") return data;
  if (data.project && typeof data.project === "object") return data.project;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) return data.data;
  return data;
}

export function formatAssignedTo(value) {
  if (value == null || value === "") return "—";
  const list = Array.isArray(value) ? value : [value];
  const labels = list
    .map((item) => {
      if (item == null) return "";
      if (typeof item === "string" || typeof item === "number") return String(item);
      return item.emp_code || item.name || item.employee_name || "";
    })
    .filter(Boolean);
  return labels.length ? labels.join(", ") : "—";
}

export function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** 1.1 / 1.2 as their own token, so 11.1 and 1.10 do not match. */
export function kraShortcutKind(name) {
  const text = String(name || "");
  if (/(^|[^0-9])1\.1([^0-9]|$)/.test(text)) return "requirement";
  if (/(^|[^0-9])1\.2([^0-9]|$)/.test(text)) return "candidate";
  return null;
}

export function mergeHrIntoProjects(projects = [], hrProjects = []) {
  const map = new Map();
  (projects || []).forEach((project) => {
    const id = String(project?.id || project?.project_id || "");
    if (id) map.set(id, project);
  });
  (hrProjects || []).forEach((project) => {
    const id = String(project?.id || project?.project_id || "");
    if (!id) return;
    const existing = map.get(id);
    map.set(id, {
      ...(existing || {}),
      ...project,
      project_kind: project.project_kind || "hr",
      source_id: project.source_id || project.source || PROJECT_SOURCE_IDS.HR,
      source: project.source || project.source_id || PROJECT_SOURCE_IDS.HR,
    });
  });
  return [...map.values()];
}

export function activitiesOf(project) {
  const list = project?.activities_detail || project?.activities || [];
  return [...list].sort(
    (a, b) => (Number(a?.sorting_var) || 0) - (Number(b?.sorting_var) || 0)
  );
}

export function subactivitiesOf(activity) {
  const list = activity?.subactivities || activity?.subActivities || [];
  return [...list].sort(
    (a, b) => (Number(a?.sorting_var) || 0) - (Number(b?.sorting_var) || 0)
  );
}

export function stagesOf(subactivity) {
  const list = subactivity?.stages || subactivity?.work_stages || [];
  return [...list].sort(
    (a, b) => (Number(a?.sorting_var) || 0) - (Number(b?.sorting_var) || 0)
  );
}

export const REQUIREMENT_STATUS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "on_hold", label: "On hold" },
];

export const REQUIREMENT_APPROVAL = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export const CANDIDATE_STAGES = [
  { value: "cv_shortlist", label: "CV shortlist" },
  { value: "lined_up", label: "Lined up" },
  { value: "interview", label: "Interview" },
  { value: "selected", label: "Selected" },
  { value: "offered", label: "Offered" },
  { value: "joined", label: "Joined" },
  { value: "rejected", label: "Rejected" },
];

export const CV_STATUS = [
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hold", label: "Hold" },
];

export const CANDIDATE_SOURCES = [
  { value: "naukri", label: "Naukri" },
  { value: "referral", label: "Referral" },
  { value: "walk-in", label: "Walk-in" },
  { value: "campus", label: "Campus" },
];

export const emptyRequirement = () => ({
  department: "",
  designation: "",
  vacancies: 1,
  qualification: "",
  experience: "",
  location: "",
  approval: "pending",
  status: "open",
  remarks: "",
});

export const emptyCandidate = () => ({
  requirement: "",
  candidate_name: "",
  position: "",
  source: "",
  contact: "",
  cv: null,
  cv_status: "shortlisted",
  stage: "cv_shortlist",
  remarks: "",
});
