/**
 * Chatbot-only API helpers.
 * IMPORTANT: call services directly — never dispatch list thunks that
 * mutate Project List / website filters in Redux.
 */

import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { projectWorkSummaryService } from "../../services/projectWorkSummaryService";
import { employeeWorklogHistoryService } from "../../services/employeeWorkLogHistory";
import { trackWorkLogService } from "../../services/trackworklogService";
import { taskPlannerService } from "../../services/taskPlannerService";
import { subActivityService } from "../../services/subActivityService";
import { hrProjectService } from "../../services/hrProjectService";
import {
  PROJECT_SOURCE_IDS,
  canSeeAllCompanies,
  isAimantraOnlyUser,
  isSaptagonOnlyUser,
  applyUserProjectVisibility,
} from "../../constants/projectSources";
import { mergeHrIntoProjects } from "../hr/hrUtils";

function matchProject(list, idOrCode) {
  const needle = String(idOrCode || "").trim().toLowerCase();
  if (!needle || !Array.isArray(list)) return null;

  const exact = list.find((p) => {
    const code = String(p.project_code || p.code || "").toLowerCase();
    const id = String(p.id || p.project_id || "");
    const name = String(p.project_name || p.short_name || p.name || "").toLowerCase();
    return code === needle || id === needle || name === needle;
  });
  if (exact) return exact;

  return (
    list.find((p) => {
      const code = String(p.project_code || p.code || "").toLowerCase();
      const name = String(p.project_name || p.short_name || p.name || "").toLowerCase();
      return (code && code.includes(needle)) || (name && name.includes(needle));
    }) || null
  );
}

export async function guideResolveProject(idOrCode, user) {
  if (!idOrCode) return null;
  const token = String(idOrCode).trim();

  // Filtered page (does not go through Redux)
  try {
    const page = await projectService.getProjectsLessDetails(user, {
      page: 1,
      page_size: 50,
      project_code: token,
    });
    const results = Array.isArray(page) ? page : page?.results || [];
    const hit = matchProject(results, token);
    if (hit) return { id: hit.id || hit.project_id, meta: hit };
  } catch {
    /* continue */
  }

  // Simple list
  try {
    const simple = await projectService.getProjectsListSimple();
    const list = Array.isArray(simple) ? simple : simple?.results || [];
    const hit = matchProject(list, token);
    if (hit) return { id: hit.id || hit.project_id, meta: hit };
  } catch {
    /* continue */
  }

  if (/^\d+$/.test(token)) return { id: token, meta: null };
  return null;
}

export async function guideGetProjectDetails(projectId) {
  return projectService.getProjectDetails(projectId);
}

export async function guideGetProjectWorkSummary(projectId, startDate, endDate) {
  if (startDate && endDate) {
    return projectWorkSummaryService.getProjectWorkSummaryByDateRange(
      projectId,
      startDate,
      endDate
    );
  }
  return projectWorkSummaryService.getProjectWorkSummary(projectId);
}

export async function guideGetEmployeeWorklogs(filters) {
  return employeeWorklogHistoryService.getEmployeeWorklogs(filters);
}

export async function guideGetRework(filters) {
  return trackWorkLogService.getTrackWorkLog(filters);
}

export async function guideGetSubactivity(id) {
  return subActivityService.getSubActivityDetailsworklog(id);
}

export async function guideGetTaskPlanners(user, date) {
  const response = await taskPlannerService.getTaskPlanners(user, "My Tasks", date);
  let employees = [];
  if (response?.results?.employees) employees = response.results.employees;
  else if (response?.employees) employees = response.employees;

  const planners = employees.flatMap((emp) =>
    (emp.planners || []).map((planner) => ({
      ...planner,
      employee_name: emp.emp_name,
      employee_code: emp.emp_code,
    }))
  );

  return {
    planners,
    employees,
    summary: response?.results?.summary || response?.summary || null,
  };
}

async function fetchProjectPagesRaw({ source_id } = {}) {
  const page_size = 100;
  const params = { page: 1, page_size };
  if (source_id) params.source_id = source_id;
  if (canSeeAllCompanies()) params.all_companies = true;
  const first = await api.get("/get-projects-list/", { params });
  const data = first.data;
  if (Array.isArray(data)) return data;
  let results = [...(data?.results || [])];
  const totalPages = Number(data?.total_pages) || 1;
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await api.get("/get-projects-list/", { params: { ...params, page } });
    results = results.concat(next.data?.results || []);
  }
  try {
    const simpleParams = {};
    if (source_id) simpleParams.source_id = source_id;
    if (canSeeAllCompanies()) simpleParams.all_companies = true;
    const simple = await api.get("/get-projects-lists/", { params: simpleParams });
    const extra = Array.isArray(simple.data) ? simple.data : simple.data?.results || [];
    if (extra.length) results = mergeProjectsById(results, extra);
  } catch {
    /* keep paged list */
  }
  return results;
}

function mergeProjectsById(...lists) {
  const map = new Map();
  lists.flat().forEach((project) => {
    if (!project) return;
    const id = String(project.id || project.project_id || "");
    const code = String(project.project_code || project.code || "").toLowerCase();
    const name = String(project.project_name || project.short_name || project.name || "").toLowerCase();
    const key = id || (code ? `code:${code}` : name ? `name:${name}` : "");
    if (!key) return;
    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...project } : project);
  });
  return [...map.values()];
}

export async function guideListAllProjects(user, { source_id } = {}) {
  try {
    const all = await projectService.getAllProjectsLessDetails(user, {
      ...(source_id ? { source_id } : {}),
    });
    if (Array.isArray(all) && all.length) return all;
  } catch {
    /* continue */
  }
  try {
    const page = await projectService.getProjectsLessDetails(user, {
      page: 1,
      page_size: 200,
      ...(source_id ? { source_id } : {}),
    });
    const list = Array.isArray(page) ? page : page?.results || [];
    if (list.length) return list;
  } catch {
    /* continue */
  }
  try {
    const simple = await projectService.getProjectsListSimple();
    const list = Array.isArray(simple) ? simple : simple?.results || [];
    if (!source_id) return list;
    return list.filter(
      (p) => String(p.source_id || p.source || "") === String(source_id)
    );
  } catch {
    return [];
  }
}

/** Weekly all-types report: every source, including Aimantra/HR/admin, no company visibility strip. */
export async function guideListProjectsForWeeklyReport({ source_id } = {}) {
  if (isAimantraOnlyUser() && !source_id) {
    source_id = PROJECT_SOURCE_IDS.AIMANTRA;
  }

  const loadHr = async () => {
    try {
      return await hrProjectService.listProjects();
    } catch {
      return [];
    }
  };

  if (source_id) {
    const [typed, hr] = await Promise.all([
      fetchProjectPagesRaw({ source_id }).catch(() => []),
      source_id === PROJECT_SOURCE_IDS.HR ? loadHr() : Promise.resolve([]),
    ]);
    const typedList = source_id === PROJECT_SOURCE_IDS.HR ? mergeHrIntoProjects(typed, hr) : typed;
    return isSaptagonOnlyUser() ? applyUserProjectVisibility(typedList) : typedList;
  }

  const sourceIds = Object.values(PROJECT_SOURCE_IDS);
  const [untyped, hr, ...typed] = await Promise.all([
    fetchProjectPagesRaw({}).catch(() => []),
    loadHr(),
    ...sourceIds.map((id) => fetchProjectPagesRaw({ source_id: id }).catch(() => [])),
  ]);
  const all = mergeHrIntoProjects(mergeProjectsById(untyped, ...typed), hr);
  return isSaptagonOnlyUser() ? applyUserProjectVisibility(all) : all;
}

export async function guideGetAllProjectsWorkSummary(startDate, endDate) {
  try {
    if (startDate && endDate) {
      const response = await api.get("/project-work-summary/", {
        params: { start_date: startDate, end_date: endDate },
      });
      return response.data;
    }
    return projectWorkSummaryService.getAllProjectsWorkSummary();
  } catch {
    return null;
  }
}

export async function guideGetEmployeeReport(empCode) {
  const response = await api.get(`/tl-project-work-report/?emp_code=${empCode}`);
  return response.data;
}

export function clientDisplayName(details, meta) {
  return (
    details?.client_detail?.client_name ||
    details?.client_detail?.name ||
    details?.client_name ||
    meta?.client_detail?.client_name ||
    meta?.client_name ||
    (typeof details?.client === "object" ? details?.client?.name : null) ||
    (typeof details?.client === "string" && !details.client.includes("-")
      ? details.client
      : null) ||
    "—"
  );
}
