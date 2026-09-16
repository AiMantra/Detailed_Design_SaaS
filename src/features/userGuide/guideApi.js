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
