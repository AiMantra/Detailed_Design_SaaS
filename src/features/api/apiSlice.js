import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { companyService } from '../../services/companyService';
import { subCompanyService } from '../../services/subCompanyService';
import { sectorService } from '../../services/sectorService';
import { clientService } from '../../services/clientService';
import { reportingHeadService } from '../../services/reportingHeadService';
import { activityService } from '../../services/activityService';
import { subActivityService } from '../../services/subActivityService';
import { projectService } from '../../services/projectService';
import { projectWorkSummaryService } from '../../services/projectWorkSummaryService';
import { stagesTemplateService } from '../../services/stagesTemplateService';
import { showError, showSuccess } from '../../utils/toast.js'; // <-- ADD THIS

import { trackWorkLogService } from '../../services/trackworklogService.js';
import { taskPlannerService } from '../../services/taskPlannerService'; // <-- ADD THIS
import { employeeWorklogHistoryService } from '../../services/employeeWorkLogHistory';


const initialState = {
  companies: [],
  subCompanies: [],
  sectors: [],
  clients: [],
  reportingHeads: [],
  stageTemplates: [],
  activities: [],
  subActivities: [], 
  subActivityDetails: null,
  projectWorkSummary: null,
  projects: [],
  projectsOnly: [],
  projectsListAll: [],
  projectsOnlyPagination: {
    total_projects: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
  },
  projectDetails: null,
  loading: false,
  error: null,

  taskPlannersData: null, // Store the full response
  taskPlanners: [], // Keep for backward compatibility

  trackWorkLogData: null, // <-- ADDED THIS
  employeeWorklogHistory: null,
};







export const fetchEmployeeWorklogHistory = createAsyncThunk(
  "api/fetchEmployeeWorklogHistory",
  async (filters = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const user = auth.user;

      const requestFilters = { ...filters };

      // If it's a standard user and you want to lock them to their own ID
      if (user?.role === "USER" && !requestFilters.user_id) {
         requestFilters.user_id = user.emp_code; // Adjust property name to match your user object
      }

      const response = await employeeWorklogHistoryService.getEmployeeWorklogs(requestFilters);
      return response;
      
    } catch (error) {
      console.error('Error fetching employee worklog history:', error);
      showError(error.message || 'Failed to fetch employee worklogs');
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// ============ TRACK WORK LOG THUNKS ============ // <-- ADDED THIS SECTION
export const fetchTrackWorkLog = createAsyncThunk(
  "api/fetchTrackWorkLog",
  async (filters, { rejectWithValue }) => {
    try {
      const response = await trackWorkLogService.getTrackWorkLog(filters);
      return response;
    } catch (error) {
      console.error('Error fetching track work log:', error);
      // Assuming showError is accessible in your scope
      showError(error.message || 'Failed to fetch track work log');
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// ============ TASK PLANNER THUNKS ============
export const fetchTaskPlanners = createAsyncThunk(
  "api/fetchTaskPlanners",
  async ({ user, activeTab, date }, { rejectWithValue }) => {
    try {
      const response = await taskPlannerService.getTaskPlanners(user, activeTab, date);

      let employees = [];
      if (response?.results?.employees) employees = response.results.employees;
      else if (response?.employees) employees = response.employees;

      const planners = employees.flatMap(emp =>
        (emp.planners || []).map(planner => ({
          ...planner,
          employee_name: emp.emp_name,
          employee_code: emp.emp_code,
        }))
      );

      // Return BOTH — flat list for My Tasks, full employees for comparison
      return {
        planners,
        employees,
        summary: response?.results?.summary || response?.summary || null,
      };
    }
    // catch (error) {
    //   return rejectWithValue(error?.response?.data || error.message);
    // }
    catch (error) {
      // EXACT ERROR HANDLING PATTERN APPLIED HERE
      console.error('Error fetching task planners:', error);
      showError(error.message || 'Failed to fetch task planners');
      return rejectWithValue(error.message);
    }
  }
);


export const fetchProjectWorkSummary = createAsyncThunk(
  'api/fetchProjectWorkSummary',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectWorkSummaryService.getProjectWorkSummary(projectId);

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// export const fetchuserbyactivityWorkSummary = createAsyncThunk(
//   'api/employee-work-summary',
//   async (projectId, { rejectWithValue }) => {
//     try {
//       const response = await projectWorkSummaryService.getProjectWorkSummary(projectId);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// ============ COMPANY THUNKS ============
export const fetchCompanies = createAsyncThunk(
  'api/fetchCompanies',
  async (is_deleted = false, { rejectWithValue }) => {
    try {
      const response = await companyService.getCompanies(is_deleted);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createCompany = createAsyncThunk(
  'api/createCompany',
  async (companyData, { rejectWithValue }) => {
    try {
      const response = await companyService.createCompany(companyData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCompany = createAsyncThunk(
  'api/updateCompany',
  async ({ companyId, companyData }, { rejectWithValue }) => {
    try {
      const response = await companyService.updateCompany(companyId, companyData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'api/deleteCompany',
  async ({ companyId, DeleteBY }, { rejectWithValue }) => {
    try {
      await companyService.deleteCompany(companyId, DeleteBY);
      return companyId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ SUB COMPANY THUNKS ============
export const fetchSubCompanies = createAsyncThunk(
  'api/fetchSubCompanies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subCompanyService.getSubCompanies();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSubCompany = createAsyncThunk(
  'api/createSubCompany',
  async (subCompanyData, { rejectWithValue }) => {
    try {
      const response = await subCompanyService.createSubCompany(subCompanyData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ SECTOR THUNKS ============
export const fetchSectors = createAsyncThunk(
  'api/fetchSectors',
  async (is_deleted = false, { rejectWithValue }) => {
    try {
      const response = await sectorService.getSectors(is_deleted);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSector = createAsyncThunk(
  'api/createSector',
  async (sectorData, { rejectWithValue }) => {
    try {
      const response = await sectorService.createSector(sectorData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSector = createAsyncThunk(
  'api/updateSector',
  async ({ sectorId, sectorData }, { rejectWithValue }) => {
    try {
      const response = await sectorService.updateSector(sectorId, sectorData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteSector = createAsyncThunk(
  'api/deleteSector',
  async ({ sectorId, DeleteBY }, { rejectWithValue }) => {
    try {
      await sectorService.deleteSector(sectorId, DeleteBY);
      return sectorId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ CLIENT THUNKS ============
export const fetchClients = createAsyncThunk(
  'api/fetchClients',
  async (is_deleted = false, { rejectWithValue }) => {
    try {
      const response = await clientService.getClients(is_deleted);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createClient = createAsyncThunk(
  'api/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientService.createClient(clientData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateClient = createAsyncThunk(
  'api/updateClient',
  async ({ clientId, clientData }, { rejectWithValue }) => {
    try {
      const response = await clientService.updateClient(clientId, clientData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'api/deleteClient',
  async ({ clientId, DeleteBY }, { rejectWithValue }) => {
    console.log(clientId, DeleteBY, 'client')
    try {
      await clientService.deleteClient(clientId, DeleteBY);
      return clientId, DeleteBY;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ Reporting Head (From HRMS) THUNKS ============
export const fetchReportingHeads = createAsyncThunk(
  // 'wfm/ourcompanyuserlessdetail/null/null/',
  'wfm/rhlistactive/null/active/',
  async (_, { rejectWithValue }) => {
    try {
      const response = await reportingHeadService.getReportingHeads();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ Stage Template THUNKS ============
export const fetchStageTemplate = createAsyncThunk(
  'api/fetchStageTemplate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stagesTemplateService.getStageTemplates();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createStageTemplate = createAsyncThunk(
  'api/createStageTemplate',
  async (stageTemplateData, { rejectWithValue }) => {
    try {
      const response = await stagesTemplateService.createStageTemplate(stageTemplateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createStageTemplateBulk = createAsyncThunk(
  'api/createStageTemplateBulk',
  async (stageTemplateData, { rejectWithValue }) => {
    try {
      const response = await stagesTemplateService.createStageTemplateBulk(stageTemplateData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// ============ ACTIVITY THUNKS ============
export const fetchActivities = createAsyncThunk(
  'api/fetchActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await activityService.getActivities();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createActivity = createAsyncThunk(
  'api/createActivity',
  async (activityData, { rejectWithValue }) => {
    try {
      const response = await activityService.createActivity(activityData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createActivitiesBulk = createAsyncThunk(
  'api/createActivitiesBulk',
  async (activitiesData, { rejectWithValue }) => {
    try {
      const response = await activityService.createActivitiesBulk(activitiesData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateActivityProgress = createAsyncThunk(
  'api/updateActivityProgress',
  async ({ activityId, progressData }, { rejectWithValue }) => {
    try {
      const response = await activityService.updateActivityProgress(activityId, progressData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============ SUB-ACTIVITY THUNKS ============
export const fetchSubActivities = createAsyncThunk(
  'api/fetchSubActivities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await subActivityService.getSubActivities();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// ============ SUB-ACTIVITY THUNKS ============

export const fetchSubActivityDetails = createAsyncThunk(
  'api/fetchSubActivityDetails',
  async (subActivityId, { rejectWithValue }) => {
    try {
      // Assuming you add this to your subActivityService:
      // getSubActivityDetails: (id) => api.get(`subactivity/${id}/`).then(res => res.data)
      const response = await subActivityService.getSubActivityDetails(subActivityId);

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchSubActivityDetailsworklog = createAsyncThunk(
  'api/fetchSubActivityDetails',
  async (subActivityId, { rejectWithValue }) => {
    try {
      // Assuming you add this to your subActivityService:
      // getSubActivityDetails: (id) => api.get(`subactivity/${id}/`).then(res => res.data)
      const response = await subActivityService.getSubActivityDetailsworklog(subActivityId);

      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



export const createSubActivity = createAsyncThunk(
  'api/createSubActivity',
  async (subActivityData, { rejectWithValue }) => {
    try {
      const response = await subActivityService.createSubActivity(subActivityData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createSubActivitiesBulk = createAsyncThunk(
  'api/createSubActivitiesBulk',
  async (subActivitiesData, { rejectWithValue }) => {
    try {
      const response = await subActivityService.createSubActivitiesBulk(subActivitiesData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSubActivityProgress = createAsyncThunk(
  'api/updateSubActivityProgress',
  async ({ subActivityId, progressData }, { rejectWithValue }) => {
    try {
      const response = await subActivityService.updateSubActivityProgress(subActivityId, progressData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateSubActivityStatus = createAsyncThunk(
  'api/updateSubActivityStatus',
  async ({ subActivityId, statusData }, { rejectWithValue }) => {
    try {
      const response = await subActivityService.updateSubActivityStatus(subActivityId, statusData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// export const updateSubActivity = createAsyncThunk(
//   "api/updateSubActivity",
//   async ({ id, data }, { rejectWithValue }) => {
//     try {
//       const response = await subActivityService.updateSubActivity(id, data);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

// ============ PROJECT THUNKS ============
export const fetchProjects = createAsyncThunk(
  'api/fetchProjects',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const user = auth.user;

      const response = await projectService.getProjects(user);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchOnlyProjectsList = createAsyncThunk(
  'api/fetchOnlyProjectsList',
  async (arg, { rejectWithValue, getState }) => {
    try {
      const { page = 1, page_size = 10, source_id, project_code } = arg || {};
      const { auth } = getState();
      const user = auth.user;

      const response = await projectService.getProjectsLessDetails(user, {
        page,
        page_size,
        source_id,
        project_code,
      });

      if (Array.isArray(response)) {
        return {
          results: response,
          total_projects: response.length,
          page: 1,
          page_size: response.length,
          total_pages: 1,
        };
      }

      const results = response?.results || [];
      const totalProjects = response?.total_projects ?? response?.count ?? results.length;
      const currentPage = response?.page ?? page;
      const currentPageSize = response?.page_size ?? page_size;
      const totalPages =
        response?.total_pages ??
        Math.max(1, Math.ceil(totalProjects / (currentPageSize || 10)));

      return {
        results,
        total_projects: totalProjects,
        page: currentPage,
        page_size: currentPageSize,
        total_pages: totalPages,
      };
    } catch (error) {
      console.error('Error fetching projects list:', error);
      showError(error.message || 'Failed to fetch projects list');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProjectsListSimple = createAsyncThunk(
  'api/fetchProjectsListSimple',
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectsListSimple();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching projects list:', error);
      showError(error.message || 'Failed to fetch projects list');
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProjectsWithDetails = createAsyncThunk(
  'api/fetchProjectWithDetails',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const user = auth.user;

      const response = await projectService.getProjects(user);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchProjectDetails = createAsyncThunk(
  'api/fetchProjectDetails',
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectService.getProjectDetails(projectId);
      return response;
      // return Array.isArray(response) ? response : [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// export const createProject = createAsyncThunk(
//   'api/createProjectx',
//   async (projectData, { rejectWithValue }) => {
//     try {
//       const response = await projectService.createProject(projectData);
//       return response;
//     } catch (error) {
//       return rejectWithValue(error.response?.data || error.message);
//     }
//   }
// );

export const createProject = createAsyncThunk(
  'api/createProjectx',
  async (projectData, { rejectWithValue }) => {
    try {
      const response = await projectService.createProject(projectData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'api/updateProject',
  async ({ projectId, projectData }, { rejectWithValue }) => {
    try {
      const response = await projectService.updateProject(projectId, projectData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProjectProgress = createAsyncThunk(
  'api/updateProjectProgress',
  async ({ projectId, progressData }, { rejectWithValue }) => {
    try {
      const response = await projectService.updateProjectProgress(projectId, progressData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteProject = createAsyncThunk(
  'api/deleteProject',
  async (projectId, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(projectId);
      return projectId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const tlSubactivitySubmitwithProof = createAsyncThunk(
  'api/stages/work-logs',
  async (proofData, { rejectWithValue }) => {
    try {
      console.log('Submitting proof data:', proofData);
      const url = (proofData.url == "payment") ? '/stages/payment-logs/' : "stages/work-logs/";
      // const url = ''
      // const url = "/subactivity-submission/";
      await projectService.tlSubactivitySubmitwithProof(proofData, url);
      showSuccess('Proof submitted successfully');
      return proofData; // Return the submitted data for potential state updates
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Helper function to add unique items to array
const addUniqueItems = (state, newItems, key = 'id') => {
  if (!newItems) return;

  const itemsToAdd = Array.isArray(newItems) ? newItems : [newItems];

  itemsToAdd.forEach(newItem => {
    if (!newItem || !newItem[key]) return;

    const exists = state.some(existingItem => existingItem[key] === newItem[key]);
    if (!exists) {
      state.push(newItem);
    }
  });
};

// Helper function to update item in array
const updateItemInArray = (array, updatedItem, key = 'id') => {
  const index = array.findIndex(item => item[key] === updatedItem[key]);
  if (index !== -1) {
    array[index] = updatedItem;
  }
};


// >>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//
// ==================== ACTIVITY TEMPLATES API ====================

// Fetch all activity templates
export const fetchStageTemplates = createAsyncThunk(
  "api/fetchStageTemplates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await stageTemplateService.getStageTemplates();
      return response;
      // const response = await axios.get(
      //   `${API_BASE_URL}/detaildesign/activity-template/`,
      //   getAxiosConfig()
      // );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);


// Update activity template with subactivities
export const updateStageTemplate = createAsyncThunk(
  "api/updateStageTemplate",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Format the data according to the API structure
      const formattedData = {
        activity_name: data.activity_name,
        sorting_var: data.sorting_var,
        template_description: data.template_description,
        // start_date: data.start_date,
        // end_date: data.end_date,
        // weightage: data.weightage,
        // company: data.company,
        // sector: data.sector,
        // subactivities: data.subactivities || []
      };

      const response = await axios.put(
        `${API_BASE_URL}/detaildesign/activity-template/${id}/`,
        formattedData,
        getAxiosConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete activity template
export const deleteStageTemplate = createAsyncThunk(
  "api/deleteStageTemplate",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/detaildesign/activity-template/${id}/`,
        getAxiosConfig()
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==================== SUB-ACTIVITIES API ====================

// Update sub-activity
export const updateSubActivity = createAsyncThunk(
  "api/updateSubActivity",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/detaildesign/sub-activity/${id}/`,
        data,
        getAxiosConfig()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete sub-activity
export const deleteSubActivity = createAsyncThunk(
  "api/deleteSubActivity",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/detaildesign/sub-activity/${id}/`,
        getAxiosConfig()
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ==================== COMPANIES API ====================



// ==================== SECTORS API ====================



// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

// Create the slice
const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearProjects: (state) => {
      state.projects = [];
    },
    clearProjectDetails: (state) => {
      state.projectDetails = null;
    },
    clearStageTemplates: (state) => {
      state.stageTemplates = [];
    },
    clearActivities: (state) => {
      state.activities = [];
    },
    clearSubActivities: (state) => {
      state.subActivities = [];
    },
  },
  extraReducers: (builder) => {
    builder


   // ============ EMPLOYEE WORKLOG HISTORY ============
      .addCase(fetchEmployeeWorklogHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.employeeWorklogHistory = null;
      })
      .addCase(fetchEmployeeWorklogHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeWorklogHistory = action.payload;
      })
      .addCase(fetchEmployeeWorklogHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    


    .addCase(fetchTrackWorkLog.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.trackWorkLogData = null;
      })
      .addCase(fetchTrackWorkLog.fulfilled, (state, action) => {
        console.log('Track Work Log fetched successfully:', action.payload);
        state.loading = false;
        state.trackWorkLogData = action.payload;
      })
      .addCase(fetchTrackWorkLog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============ TASK PLANNERS ============
      .addCase(fetchTaskPlanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // .addCase(fetchTaskPlanners.fulfilled, (state, action) => {
      //   state.loading = false;
      //   // Based on your JSON payload structure ({ message, count, data: [...] })
      //   // If your service returns the whole JSON, extract action.payload.data
      //   // If your service already extracts it, just use action.payload
      //   state.taskPlanners = action.payload.data || action.payload || [];
      // })
      .addCase(fetchTaskPlanners.fulfilled, (state, action) => {
        state.loading = false;
        state.taskPlanners = action.payload.planners || [];       // flat → My Tasks
        state.taskPlannersData = {                               // full → comparison view
          employees: action.payload.employees || [],
          summary: action.payload.summary || null,
        };
      })
      .addCase(fetchTaskPlanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProjectWorkSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectWorkSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.projectWorkSummary = action.payload; // Add this to initialState
      })
      .addCase(fetchProjectWorkSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ============ COMPANIES ============
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        addUniqueItems(state.companies, action.payload);
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        updateItemInArray(state.companies, action.payload);
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c.id !== action.payload);
      })

      // ============ SUB COMPANIES ============
      .addCase(fetchSubCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.subCompanies = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSubCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubCompany.fulfilled, (state, action) => {
        addUniqueItems(state.subCompanies, action.payload);
      })

      // ============ SECTORS ============
      .addCase(fetchSectors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectors.fulfilled, (state, action) => {
        state.loading = false;
        state.sectors = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSectors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSector.fulfilled, (state, action) => {
        addUniqueItems(state.sectors, action.payload);
      })

      // ============ CLIENTS ============
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        addUniqueItems(state.clients, action.payload);
      })

      // ============ ReportingHeads (HRMS) ============
      .addCase(fetchReportingHeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReportingHeads.fulfilled, (state, action) => {
        state.loading = false;
        state.reportingHeads = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchReportingHeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ============ ACTIVITY TEMPLATE ============
      .addCase(fetchStageTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStageTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.stageTemplates = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchStageTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createStageTemplate.fulfilled, (state, action) => {
        addUniqueItems(state.stageTemplates, action.payload);
      })
      .addCase(createStageTemplateBulk.fulfilled, (state, action) => {
        addUniqueItems(state.stageTemplates, action.payload);
      })

      // ============ ACTIVITIES ============
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        addUniqueItems(state.activities, action.payload);
      })
      .addCase(createActivitiesBulk.fulfilled, (state, action) => {
        addUniqueItems(state.activities, action.payload);
      })
      .addCase(updateActivityProgress.fulfilled, (state, action) => {
        updateItemInArray(state.activities, action.payload);
      })

      // ============ SUB ACTIVITIES ============
      .addCase(fetchSubActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.subActivities = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSubActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubActivity.fulfilled, (state, action) => {
        addUniqueItems(state.subActivities, action.payload);
      })
      .addCase(createSubActivitiesBulk.fulfilled, (state, action) => {
        addUniqueItems(state.subActivities, action.payload);
      })
      // ============ SUB ACTIVITIES ============
      // ... existing cases

      .addCase(fetchSubActivityDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.subActivityDetails = null; // Clear old data while fetching
      })
      .addCase(fetchSubActivityDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.subActivityDetails = action.payload;
      })
      .addCase(fetchSubActivityDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // .addCase(updateSubActivityProgress.fulfilled, (state, action) => {
      //   updateItemInArray(state.subActivities, action.payload);
      // })
      // .addCase(updateSubActivityStatus.fulfilled, (state, action) => {
      //   updateItemInArray(state.subActivities, action.payload);
      // })

      // ============ PROJECTS ============
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProjectsWithDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectsWithDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjectsWithDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOnlyProjectsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOnlyProjectsList.fulfilled, (state, action) => {
        state.loading = false;
        state.projectsOnly = Array.isArray(action.payload?.results)
          ? action.payload.results
          : [];
        state.projectsOnlyPagination = {
          total_projects: action.payload?.total_projects || 0,
          page: action.payload?.page || 1,
          page_size: action.payload?.page_size || 10,
          total_pages: action.payload?.total_pages || 1,
        };
      })
      .addCase(fetchOnlyProjectsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProjectsListSimple.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectsListSimple.fulfilled, (state, action) => {
        state.loading = false;
        state.projectsListAll = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjectsListSimple.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProjectDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.projectDetails = action.payload;
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createProject.fulfilled, (state, action) => {
        addUniqueItems(state.projects, action.payload);
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        updateItemInArray(state.projects, action.payload);
      })
      .addCase(updateProjectProgress.fulfilled, (state, action) => {
        updateItemInArray(state.projects, action.payload);
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
      })



      // >>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<< //
      // Fetch Activity Templates
      .addCase(fetchStageTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStageTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.stageTemplates = action.payload;
      })
      .addCase(fetchStageTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Activity Template
      .addCase(updateStageTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStageTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.stageTemplates.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) {
          state.stageTemplates[index] = action.payload;
        }
      })
      .addCase(updateStageTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Activity Template
      .addCase(deleteStageTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteStageTemplate.fulfilled, (state, action) => {
        state.loading = false;
        state.stageTemplates = state.stageTemplates.filter(
          (item) => item.id !== action.payload
        );
      })
      .addCase(deleteStageTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })



      // Update Sub-activity
      .addCase(updateSubActivity.fulfilled, (state, action) => {
        // Find and update the sub-activity
        state.stageTemplates.forEach((activity) => {
          if (activity.subactivities) {
            const index = activity.subactivities.findIndex(
              (sub) => sub.id === action.payload.id
            );
            if (index !== -1) {
              activity.subactivities[index] = action.payload;
            }
          }
        });
      })
      // Delete Sub-activity
      .addCase(deleteSubActivity.fulfilled, (state, action) => {
        // Remove the sub-activity from its parent activity
        state.stageTemplates.forEach((activity) => {
          if (activity.subactivities) {
            activity.subactivities = activity.subactivities.filter(
              (sub) => sub.id !== action.payload
            );
          }
        });
      });
  },
});



export const { clearError, clearProjects, clearActivities, clearSubActivities } = apiSlice.actions;
export default apiSlice.reducer;
