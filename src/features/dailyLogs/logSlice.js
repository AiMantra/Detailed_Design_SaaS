import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logService } from '../../services/logService';


const REVERSE_EVENT_TYPE_MAP = {
  'PROJECT_CREATED': 'Project Created',
  'PROJECT_UPDATED': 'Project Updated',
  'ACTIVITY_CREATED': 'Activity Created',
  'ACTIVITY_UPDATED': 'Activity Updated',
  'SUBACTIVITY_CREATED': 'SubActivity Created',
  'SUBACTIVITY_UPDATED': 'SubActivity Updated',
  'PROGRESS_CHANGED': 'Progress Changed',
  'EXTENSION_REQUESTED': 'Extension Requested',
  'EXTENSION_APPROVED': 'Extension Approved',
  'EXTENSION_REJECTED': 'Extension Rejected',
  'MANUAL_LOG': 'Manual Log',
  'STATUS_UPDATE': 'Status Update'
};


const EVENT_TYPE_TO_BACKEND = {
  'Project Created': 'PROJECT_CREATED',
  'Project Updated': 'PROJECT_UPDATED',
  'Activity Created': 'ACTIVITY_CREATED',
  'Activity Updated': 'ACTIVITY_UPDATED',
  'SubActivity Created': 'SUBACTIVITY_CREATED',
  'SubActivity Updated': 'SUBACTIVITY_UPDATED',
  'Progress Changed': 'PROGRESS_CHANGED',
  'Extension Requested': 'EXTENSION_REQUESTED',
  'Extension Approved': 'EXTENSION_APPROVED',
  'Extension Rejected': 'EXTENSION_REJECTED',
  'Manual Log': 'MANUAL_LOG',
  'Status Update': 'STATUS_UPDATE'
};


// const transformLog = (log) => {
//   let oldValue = log.old_value;
//   let newValue = log.new_value;
  
//   try {
//     if (typeof oldValue === 'string') oldValue = JSON.parse(oldValue);
//     if (typeof newValue === 'string') newValue = JSON.parse(newValue);
//   } catch (e) {
//     // Ignore parsing errors
//   }

//   const displayEventType = REVERSE_EVENT_TYPE_MAP[log.event_type] || log.event_type;
  
//   let projectId = log.project;
//   let projectDetail = log.project_detail;
//   let projectName = 'Unknown Project';
//   let projectCode = null;

//   if (projectDetail) {
//     projectName = projectDetail.project_name || 'Unknown Project';
//     projectCode = projectDetail.project_code;
//   } else if (log.activity_detail?.project_detail) {
//     projectName = log.activity_detail.project_detail.project_name || 'Unknown Project';
//     projectCode = log.activity_detail.project_detail.project_code;
//     projectId = log.activity_detail.project;
//   }

//   return {
//     id: log.id,
//     event_type: displayEventType,
//     original_event_type: log.event_type,
//     message: log.message,
//     old_value: oldValue,
//     new_value: newValue,
//     created_at: log.created_at,
//     performed_by: log.performed_by,
//     performed_by_detail: log.performed_by_detail,
//     project: projectId,
//     project_detail: projectDetail,
//     activity: log.activity,
//     activity_detail: log.activity_detail,
//     subactivity: log.subactivity,
//     subactivity_detail: log.subactivity_detail,
//     date: log.created_at?.split('T')[0] || '',
//     time: log.created_at?.split('T')[1]?.substring(0, 5) || '',
//     user: log.performed_by_detail?.username || 'System',
//     project_name: projectName,
//     project_code: projectCode
//   };
// };

const transformLog = (log) => {
  let oldValue = log.old_value;
  let newValue = log.new_value;
  
  try {
    if (typeof oldValue === 'string') oldValue = JSON.parse(oldValue);
    if (typeof newValue === 'string') newValue = JSON.parse(newValue);
  } catch (e) {
    // Ignore parsing errors
  }

  const displayEventType = REVERSE_EVENT_TYPE_MAP[log.event_type] || log.event_type;
  
  let projectId = log.project;
  let projectDetail = log.project_detail;
  let projectCode = null;
  
  // FIX IS HERE: Try grabbing it directly from the log first!
  let projectName = log.project_name || 'Unknown Project'; 

  // Keep these just in case the backend uses them for other event types
  if (projectDetail) {
    projectName = projectDetail.project_name || projectName;
    projectCode = projectDetail.project_code;
  } else if (log.activity_detail?.project_detail) {
    projectName = log.activity_detail.project_detail.project_name || projectName;
    projectCode = log.activity_detail.project_detail.project_code;
    projectId = log.activity_detail.project;
  }

  return {
    id: log.id,
    event_type: displayEventType,
    original_event_type: log.event_type,
    message: log.message,
    old_value: oldValue,
    new_value: newValue,
    created_at: log.created_at,
    performed_by: log.performed_by,
    performed_by_detail: log.performed_by_detail,
    project: projectId,
    project_detail: projectDetail,
    activity: log.activity,
    activity_detail: log.activity_detail,
    subactivity: log.subactivity,
    subactivity_detail: log.subactivity_detail,
    date: log.created_at?.split('T')[0] || '',
    time: log.created_at?.split('T')[1]?.substring(0, 5) || '',
    user: log.performed_by_detail?.username || 'System',
    project_name: projectName,
    project_code: projectCode
  };
};


const filterLogs = (logs, filters) => {
  return logs.filter(log => {
    
    if (filters.date && log.date !== filters.date) {
      return false;
    }
    
    
    if (filters.eventType && filters.eventType !== 'all') {
      const backendType = EVENT_TYPE_TO_BACKEND[filters.eventType];
      if (log.original_event_type !== backendType) {
        return false;
      }
    }
    
    
    if (filters.projectId && filters.projectId !== 'all') {
      if (log.project !== filters.projectId && log.project_detail?.id !== filters.projectId) {
        return false;
      }
    }
    
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.message?.toLowerCase().includes(searchLower) ||
        log.project_name?.toLowerCase().includes(searchLower) ||
        log.event_type?.toLowerCase().includes(searchLower) ||
        log.user?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
};

const initialState = {
  allLogs: [], 
  filteredLogs: [], 
  projectLogs: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  },
  loading: false,
  loadingMore: false,
  error: null,
  filters: {
    date: new Date().toISOString().split('T')[0],
    eventType: 'all',
    projectId: 'all',
    search: ''
  },
  stats: {
    total: 0,
    byType: {},
    byProject: {},
    byDate: {}
  }
};


export const fetchAllLogs = createAsyncThunk(
  'logs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await logService.getAllLogs();
      const transformedLogs = response.results.map(transformLog);
      return transformedLogs;
    } catch (error) {
      console.error('Error in fetchAllLogs:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchProjectLogs = createAsyncThunk(
  'logs/fetchProjectLogs',
  async ({ projectId, date, eventType, search }, { rejectWithValue }) => {
    try {
      const response = await logService.getProjectLogs(projectId, {
        date,
        eventType,
        search
      });
      const transformedLogs = response.results.map(transformLog);
      return { logs: transformedLogs, projectId };
    } catch (error) {
      console.error('Error in fetchProjectLogs:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createLog = createAsyncThunk(
  'logs/create',
  async (logData, { rejectWithValue }) => {
    try {
      const response = await logService.createLog(logData);
      return transformLog(response);
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteLog = createAsyncThunk(
  'logs/delete',
  async (logId, { rejectWithValue }) => {
    try {
      await logService.deleteLog(logId);
      return logId;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const logSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setLogFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      
      state.filteredLogs = filterLogs(state.allLogs, state.filters);
      
      state.pagination.currentPage = 1;
      state.pagination.totalItems = state.filteredLogs.length;
      state.pagination.totalPages = Math.ceil(state.filteredLogs.length / state.pagination.itemsPerPage);
      state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
      state.pagination.hasPrev = state.pagination.currentPage > 1;
    },
    resetFilters: (state) => {
      state.filters = {
        date: new Date().toISOString().split('T')[0],
        eventType: 'all',
        projectId: 'all',
        search: ''
      };
      state.filteredLogs = filterLogs(state.allLogs, state.filters);
      state.pagination.currentPage = 1;
      state.pagination.totalItems = state.filteredLogs.length;
      state.pagination.totalPages = Math.ceil(state.filteredLogs.length / state.pagination.itemsPerPage);
    },
    setPage: (state, action) => {
      state.pagination.currentPage = action.payload;
      state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
      state.pagination.hasPrev = state.pagination.currentPage > 1;
    },
    nextPage: (state) => {
      if (state.pagination.currentPage < state.pagination.totalPages) {
        state.pagination.currentPage++;
        state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
        state.pagination.hasPrev = true;
      }
    },
    prevPage: (state) => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        state.pagination.hasNext = state.pagination.currentPage < state.pagination.totalPages;
        state.pagination.hasPrev = state.pagination.currentPage > 1;
      }
    },
    clearLogs: (state) => {
      state.allLogs = [];
      state.filteredLogs = [];
      state.projectLogs = [];
      state.pagination = initialState.pagination;
      state.error = null;
    },
    calculateStats: (state) => {
      const logs = state.filteredLogs.length > 0 ? state.filteredLogs : state.allLogs;
      
      state.stats.total = logs.length;
      
      const byType = {};
      const byProject = {};
      const byDate = {};
      
      logs.forEach(log => {
        const type = log.event_type || 'UNKNOWN';
        byType[type] = (byType[type] || 0) + 1;
        
        const projectName = log.project_name || 'Unknown';
        byProject[projectName] = (byProject[projectName] || 0) + 1;
        
        const date = log.date || 'unknown';
        byDate[date] = (byDate[date] || 0) + 1;
      });
      
      state.stats.byType = byType;
      state.stats.byProject = byProject;
      state.stats.byDate = byDate;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.allLogs = action.payload;
        
        state.filteredLogs = filterLogs(state.allLogs, state.filters);
        state.pagination.totalItems = state.filteredLogs.length;
        state.pagination.totalPages = Math.ceil(state.filteredLogs.length / state.pagination.itemsPerPage);
        state.pagination.currentPage = 1;
      })
      .addCase(fetchAllLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProjectLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.projectLogs = action.payload.logs;
        state.pagination.totalItems = action.payload.logs.length;
        state.pagination.totalPages = Math.ceil(action.payload.logs.length / state.pagination.itemsPerPage);
        state.pagination.currentPage = 1;
      })
      .addCase(fetchProjectLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createLog.fulfilled, (state, action) => {
        state.allLogs.unshift(action.payload);
        state.filteredLogs = filterLogs(state.allLogs, state.filters);
        state.pagination.totalItems = state.filteredLogs.length;
        state.pagination.totalPages = Math.ceil(state.filteredLogs.length / state.pagination.itemsPerPage);
      })
      .addCase(deleteLog.fulfilled, (state, action) => {
        state.allLogs = state.allLogs.filter(l => l.id !== action.payload);
        state.filteredLogs = filterLogs(state.allLogs, state.filters);
        state.pagination.totalItems = state.filteredLogs.length;
        state.pagination.totalPages = Math.ceil(state.filteredLogs.length / state.pagination.itemsPerPage);
      });
  }
});

export const { 
  setLogFilters, 
  resetFilters, 
  setPage, 
  nextPage, 
  prevPage, 
  clearLogs, 
  calculateStats 
} = logSlice.actions;

export default logSlice.reducer;