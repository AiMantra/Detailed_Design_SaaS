import api from "./api";

const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const raise = (error, fallback) => {
  const data = error?.response?.data;
  let message = fallback;
  if (typeof data === "string" && data.trim()) message = data;
  else if (data?.message) message = data.message;
  else if (typeof data?.detail === "string") message = data.detail;
  else if (data && typeof data === "object") message = JSON.stringify(data);
  else if (error?.message) message = error.message;
  const enhanced = new Error(message);
  enhanced.response = error?.response;
  throw enhanced;
};

/**
 * HR project APIs. Create must hit /hr-project/ and never /new-project/.
 */
export const hrProjectService = {
  listProjects: async () => {
    try {
      const response = await api.get("/hr-project/");
      return unwrapList(response.data);
    } catch (error) {
      raise(error, "Failed to load HR projects");
    }
  },

  createProject: async (fields) => {
    try {
      const formData = new FormData();
      const scalarKeys = [
        "project_code",
        "project_name",
        "short_name",
        "location",
        "company",
        "created_by",
        "source",
        "source_id",
      ];
      scalarKeys.forEach((key) => {
        const value = fields[key];
        if (value === undefined || value === null || value === "") return;
        formData.append(key, value);
      });
      const assignees = Array.isArray(fields.assigned_to) ? fields.assigned_to : [];
      assignees.forEach((code) => {
        if (code) formData.append("assigned_to", code);
      });

      const response = await api.post("/hr-project/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to create HR project");
    }
  },

  listRequirements: async (projectId) => {
    try {
      const response = await api.get("/hr-requirement/", {
        params: { project_id: projectId },
      });
      return unwrapList(response.data);
    } catch (error) {
      raise(error, "Failed to load requirements");
    }
  },

  createRequirement: async (payload) => {
    try {
      const response = await api.post("/hr-requirement/", payload);
      return response.data;
    } catch (error) {
      raise(error, "Failed to create requirement");
    }
  },

  updateRequirement: async (id, payload) => {
    try {
      const response = await api.put(`/hr-requirement/${id}/`, payload);
      return response.data;
    } catch (error) {
      raise(error, "Failed to update requirement");
    }
  },

  deleteRequirement: async (id, deletedBy) => {
    try {
      const response = await api.delete(`/hr-requirement/${id}/`, {
        data: { deleted_by: deletedBy },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to delete requirement");
    }
  },

  listCandidates: async ({ projectId, requirementId } = {}) => {
    try {
      const params = {};
      if (requirementId) params.requirement_id = requirementId;
      else if (projectId) params.project_id = projectId;
      const response = await api.get("/hr-candidate/", { params });
      return unwrapList(response.data);
    } catch (error) {
      raise(error, "Failed to load candidates");
    }
  },

  createCandidate: async (fields) => {
    try {
      const response = await api.post("/hr-candidate/", buildCandidateForm(fields), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to create candidate");
    }
  },

  updateCandidate: async (id, fields) => {
    try {
      const response = await api.put(`/hr-candidate/${id}/`, buildCandidateForm(fields), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to update candidate");
    }
  },

  deleteCandidate: async (id, deletedBy) => {
    try {
      const response = await api.delete(`/hr-candidate/${id}/`, {
        data: { deleted_by: deletedBy },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to delete candidate");
    }
  },

  listStageProofs: async ({ projectId, stageId, subactivityId } = {}) => {
    try {
      const params = {};
      if (stageId) params.stage_id = stageId;
      if (subactivityId) params.subactivity_id = subactivityId;
      if (projectId) params.project_id = projectId;
      const response = await api.get("/hr-stage-proof/", { params });
      return unwrapList(response.data);
    } catch (error) {
      raise(error, "Failed to load stage proofs");
    }
  },

  createStageProof: async (fields) => {
    try {
      const response = await api.post("/hr-stage-proof/", buildStageProofForm(fields), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to submit stage proof");
    }
  },

  deleteStageProof: async (id, deletedBy) => {
    try {
      const response = await api.delete(`/hr-stage-proof/${id}/`, {
        data: { deleted_by: deletedBy },
      });
      return response.data;
    } catch (error) {
      raise(error, "Failed to delete stage proof");
    }
  },
};

function buildCandidateForm(fields) {
  const formData = new FormData();
  [
    "requirement",
    "candidate_name",
    "position",
    "source",
    "contact",
    "cv_status",
    "stage",
    "remarks",
    "created_by",
    "updated_by",
    "project",
  ].forEach((key) => {
    const value = fields[key];
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });
  if (fields.cv instanceof File) {
    formData.append("cv", fields.cv);
  }
  return formData;
}

function buildStageProofForm(fields) {
  const formData = new FormData();
  ["stage", "document_name", "remarks", "created_by", "project"].forEach((key) => {
    const value = fields[key];
    if (value === undefined || value === null || value === "") return;
    formData.append(key, value);
  });
  if (fields.document instanceof File) {
    formData.append("document", fields.document);
  }
  return formData;
}
