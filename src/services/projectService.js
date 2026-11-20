
import api from './api';
import { PROJECT_TYPE_SOURCE_IDS, PROJECT_SOURCE_IDS, canSeeAimantraProjects, canSeeAllCompanies, isAimantraOnlyUser, isAimantraAllowedEmp, applyUserProjectVisibility, getProjectSourceId } from '../constants/projectSources';

function mergeProjectLists(...lists) {
  const map = new Map();
  lists.flat().forEach((project) => {
    if (!project) return;
    const key = String(project.id || project.project_id || project.project_code || "");
    if (!key) return;
    map.set(key, project);
  });
  return [...map.values()];
}

async function appendAimantraForAllowlist(list, source_id) {
  if (!isAimantraAllowedEmp() || isAimantraOnlyUser()) return list;
  if (source_id && source_id !== PROJECT_SOURCE_IDS.AIMANTRA) return list;
  const already = (list || []).some(
    (p) => String(getProjectSourceId(p)) === PROJECT_SOURCE_IDS.AIMANTRA
  );
  if (already) return list;
  try {
    const response = await api.get("/get-projects-lists/", {
      params: { source_id: PROJECT_SOURCE_IDS.AIMANTRA, all_companies: true },
    });
    const extra = Array.isArray(response.data) ? response.data : response.data?.results || [];
    return mergeProjectLists(list, extra);
  } catch {
    return list;
  }
}



export const projectService = {

  // getProjects: async () => {
  //   try {
  //     const response = await api.get('/project/');
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error fetching projects:', error);
  //     throw error;
  //   }
  // },

  getProjects: async (user) => {
    try {
      let url;
      let emp_code = sessionStorage.getItem('emp_code')
      // 🔥 Role-based API logic
      if (user?.role === 'TL') {
        url = `user-assigned-projects/${emp_code}/`;
      } else {
        // url = '/get-project/';
        url = '/project/';
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProjectsListSimple: async ({ source_id } = {}) => {
    try {
      const params = {};
      const lockedSource = isAimantraOnlyUser() ? PROJECT_SOURCE_IDS.AIMANTRA : source_id;
      if (lockedSource) params.source_id = lockedSource;
      if (canSeeAllCompanies()) params.all_companies = true;
      const response = await api.get('/get-projects-lists/', { params });
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.results || []);
      const merged = await appendAimantraForAllowlist(list, lockedSource);
      return applyUserProjectVisibility(merged);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProjectsByTypeKey: async (typeKey) => {
    if (isAimantraOnlyUser() && typeKey && typeKey !== "all" && typeKey !== "aimantra") {
      return [];
    }
    if (!canSeeAimantraProjects() && typeKey === "aimantra") {
      return [];
    }
    const source_id = isAimantraOnlyUser()
      ? PROJECT_SOURCE_IDS.AIMANTRA
      : PROJECT_TYPE_SOURCE_IDS[typeKey];
    if (!source_id) return projectService.getProjectsListSimple();
    try {
      const all = await projectService.getAllProjectsLessDetails(null, { source_id });
      if (Array.isArray(all) && all.length) return all;
    } catch {
      /* fall through */
    }
    return projectService.getProjectsListSimple({ source_id });
  },

  getProjectsLessDetails: async (user, { page = 1, page_size = 10, source_id, project_code } = {}) => {
    try {
      const params = { page, page_size };
      const lockedSource = isAimantraOnlyUser() ? PROJECT_SOURCE_IDS.AIMANTRA : source_id;
      if (lockedSource) params.source_id = lockedSource;
      if (project_code) params.project_code = project_code;
      if (canSeeAllCompanies()) params.all_companies = true;
      const response = await api.get('/get-projects-list/', { params });
      const data = response.data;
      if (Array.isArray(data)) {
        const merged = await appendAimantraForAllowlist(data, lockedSource);
        return applyUserProjectVisibility(merged);
      }
      const merged = await appendAimantraForAllowlist(data?.results || [], lockedSource);
      return {
        ...data,
        results: applyUserProjectVisibility(merged),
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getAllProjectsLessDetails: async (user, { source_id, project_code } = {}) => {
    try {
      const page_size = 100;
      const params = { page: 1, page_size };
      const lockedSource = isAimantraOnlyUser() ? PROJECT_SOURCE_IDS.AIMANTRA : source_id;
      if (lockedSource) params.source_id = lockedSource;
      if (project_code) params.project_code = project_code;
      if (canSeeAllCompanies()) params.all_companies = true;

      const firstResponse = await api.get('/get-projects-list/', { params });
      const firstData = firstResponse.data;

      if (Array.isArray(firstData)) {
        const merged = await appendAimantraForAllowlist(firstData, lockedSource);
        return applyUserProjectVisibility(merged);
      }

      let results = [...(firstData?.results || [])];
      const totalPages = firstData?.total_pages || 1;

      for (let page = 2; page <= totalPages; page++) {
        const nextResponse = await api.get('/get-projects-list/', {
          params: { ...params, page },
        });
        results = results.concat(nextResponse.data?.results || []);
      }

      const merged = await appendAimantraForAllowlist(results, lockedSource);
      return applyUserProjectVisibility(merged);
    } catch (error) {
      console.error('Error fetching all projects:', error);
      throw error;
    }
  },

  getProjectsWithDetails: async (user) => {
    try {
      let url;
      let emp_code = sessionStorage.getItem('emp_code')
      // 🔥 Role-based API logic
      if (user?.role === 'TL') {
        url = `user-assigned-projects/${emp_code}/`;
      } else {
        url = '/project/';
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProjectDetails: async (projectId) => {
    try {
      const response = await api.get(`/get-projectdetails-byid/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProject: async (projectId) => {
    try {
      const response = await api.get(`/project/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },


  // createProject: async (projectData) => {
  //   try {
  //     const response = await api.post('/project/', projectData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error creating project:', error);
  //     if (error.response) {
  //       console.error('Error response data:', error.response.data);
  //       console.error('Error response status:', error.response.status);

  //       const enhancedError = new Error(
  //         error.response.data?.message ||
  //         JSON.stringify(error.response.data) ||
  //         'Failed to create project'
  //       );
  //       enhancedError.response = error.response;
  //       enhancedError.request = error.request;
  //       throw enhancedError;
  //     } else if (error.request) {
  //       console.error('No response received:', error.request);
  //       throw new Error('No response from server. Please check your connection.');
  //     } else {
  //       console.error('Error setting up request:', error.message);
  //       throw error;
  //     }
  //   }
  // },

  createProject: async (projectData) => {
    try {
      const formData = new FormData();

      // 🔹 Append all fields
      Object.keys(projectData).forEach((key) => {
        const value = projectData[key];
        if (value === null || value === undefined) return;
        // ✅ Handle file
        if (key === "workorder_document") {
          formData.append(key, value?.[0]);
        }
        // ✅ Handle array / object (activities)
        else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        }
        else if (key == "sector" || key == "client") {
          formData.append(key, '"' + value + '"');
        }
        // ✅ Normal fields
        else {
          formData.append(key, value);
        }
      });

      const response = await api.post('/new-project/', formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        const enhancedError = new Error(
          error.response.data?.message ||
          JSON.stringify(error.response.data) ||
          'Failed to create project'
        );
        enhancedError.response = error.response;
        enhancedError.request = error.request;
        throw enhancedError;

      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        throw error;
      }
    }
  },



  updateProjectProgress: async (projectId, progressData) => {
    try {
      const response = await api.put(`/project/${projectId}/`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating project progress:', error);
      throw error;
    }
  },


  updateProject: async (projectId, projectData) => {
    try {
      const formData = new FormData();

      // 🔹 Append all fields
      Object.keys(projectData).forEach((key) => {
        const value = projectData[key];
        if (value === null || value === undefined) return;

        // ✅ Handle file
        if (key === "workorder_document" && value instanceof File) {
          formData.append(key, value);
        }
        // ✅ Handle activities array (needs to be JSON stringified)
        else if (key === "activities" && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        }
        // ✅ Handle sector and client - send them as regular strings (not quoted)
        else if (key === "sector" || key === "client") {
          // If it's already an ID (UUID), send as is
          // If it's a string ID, send directly without extra quotes
          formData.append(key, JSON.stringify(value));
        }
        // ✅ Handle other objects that need stringification
        else if (typeof value === "object" && !(value instanceof File)) {
          formData.append(key, JSON.stringify(value));
        }
        // ✅ Normal fields
        else {
          formData.append(key, value);
        }
      });

      // Make sure to use formData, not projectData object for the request body
      const response = await api.put(`/project-update/${projectId}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },


  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/project/${projectId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  tlSubactivitySubmitwithProof: async (proofData, url) => {
    try {
      const formData = new FormData();

      if (proofData.documents) {
        proofData.documents.forEach((file) => {
          formData.append("documents", file);
        });
      }

      if (proofData.rejection_proof) {
        proofData.rejection_proof.forEach((file) => {
          formData.append("rejection_proof", file);
        });
      }


      for (const key in proofData) {
        if (key !== "documents" && key !== "rejection_proof" && proofData[key] !== "") {
          formData.append(key, proofData[key]);
        }
      }
      console.log("FormData entries:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": ", pair[1]);
      }
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting subactivity with proof:', error);
      throw error;
    }
  }
};