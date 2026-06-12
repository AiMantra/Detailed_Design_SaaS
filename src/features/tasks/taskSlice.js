import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { showSuccess, showError } from "../../utils/toast";

// const getUserUUID = () => {
//   return sessionStorage.getItem('user_uuid') ||
//     sessionStorage.getItem('user_uuid') ||
//     null;
// };

const getEmpCode = () => {
  return sessionStorage.getItem('emp_code') ||
    sessionStorage.getItem('emp_code') ||
    null;
};

// Fetch user work logs from ActivityTimeLog API
export const fetchUserWorkLogs = createAsyncThunk(
  'tasks/fetchUserWorkLogs',
  async (_, { rejectWithValue }) => {
    try {
      const userUUID = getEmpCode();
      if (!userUUID) {
        return [];
      }

      const response = await api.get(`/employee-timelog/?user=${userUUID}`);
      const logs = response.data.results || response.data;

      const transformedLogs = logs.map(log => ({
        id: log.id,
        project_id: log.project,
        project_name: log.project_detail?.project_name || 'Unknown Project',
        project_code: log.project_detail?.project_code || 'N/A',
        activity_id: log.activity,
        activity_name: log.activity_detail?.activity_name || 'Unknown Activity',
        subactivity_id: log.subactivity,
        subactivity_name: log.subactivity_detail?.subactivity_name || 'Unknown Task',
        entry_type: log.entry_type,
        status: log.status,
        start_time: log.start_time,
        end_time: log.end_time,
        duration: log.duration,
        note: log.note,
        created_at: log.created_at,
        date: log.start_time?.split('T')[0] || new Date().toISOString().split('T')[0]
      }));

      return transformedLogs;
    } catch (error) {
      console.error('Error fetching user work logs:', error);
      showError(error.message || 'Failed to save record');
      return rejectWithValue(error.message);
    }
  }
);


// In taskSlice.js
export const fetchProjectReport = createAsyncThunk(
  'tasks/fetchProjectReport',
  async ({ emp_code }, { rejectWithValue }) => {
    const response = await api.get(`/tl-project-user-work-report/?emp_code=${emp_code}`);
    return response.data;
  }
);
// Fetch user work summary from API
export const fetchUserWorkSummary = createAsyncThunk(
  'tasks/fetchUserWorkSummary',
  async (empCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/userworksummary/${empCode}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user work summary:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Save daily work log directly (no picking required)
export const saveDailyWorkLog = createAsyncThunk(
  'tasks/saveDailyWorkLog',
  async ({ projectId, subActivityId, date, startTime, endTime, work_type, note, status, phase = "R0", submission_po_status = "", submission_invoice_status = "", approval_po_status = "", approval_invoice_status = "", stage }, { getState, rejectWithValue }) => {
    try {
      const userUUID = getEmpCode();

      if (!userUUID) throw new Error('User not authenticated');

      let durationSeconds = 0;
      let startDateTime = null;
      let endDateTime = null;

      if (status === 'WORKED') {
        if (!startTime || !endTime) {
          throw new Error('Please enter both start and end time');
        }

        startDateTime = `${date}T${startTime}:00`;
        endDateTime = `${date}T${endTime}:00`;

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        if (start >= end) {
          throw new Error('End time must be after start time');
        }

        durationSeconds = Math.round((end - start) / 1000);
      } else {
        startDateTime = `${date}T00:00:00`;
        endDateTime = `${date}T23:59:59`;
        durationSeconds = 86400; // 24 hours
      }

      const timeLogData = {
        project: projectId,
        user: userUUID,
        subactivity: subActivityId,
        stage: stage,
        entry_type: status === 'WORKED' ? 'WORK_LOG' : 'LEAVE',
        status: status === 'WORKED' ? 'COMPLETED' : 'ABSENT',
        start_time: startDateTime,
        end_time: endDateTime,
        duration: durationSeconds,
        work_type: work_type,
        note: note || (status === 'WORKED' ? `Worked on task` : `No work done`),
        // phase: phase,
        // submission_po_status: submission_po_status,
        // submission_invoice_status: submission_invoice_status,
        // approval_po_status: approval_po_status,
        // approval_invoice_status: approval_invoice_status
      };
      console.log("Saving time log with data:", timeLogData);
      const response = await api.post('/employee-timelog/', timeLogData);

      showSuccess(status === 'WORKED' ?
        `Work logged! ${(durationSeconds / 3600).toFixed(2)} hours recorded` :
        'Leave record saved successfully'
      );

      return {
        ...response.data,
        project_id: projectId,
        subactivity_id: subActivityId,
        date: date,
        stage: stage,
        duration: durationSeconds,
        hours: durationSeconds / 3600
      };
      // } catch (error) {
      //   console.error('Error saving work log:', error);
      //   showError(error.message || 'Failed to save record');
      //   return rejectWithValue(error.message);
      // }
    } catch (error) {
      console.error('Error saving work log:', error);

      // Safely extract the backend error response
      const backendData = error.response?.data;

      // 1. Try to get the specific inner error ("Your total work log exceeds 24 hours.")
      const specificError = backendData?.errors?.non_field_errors?.[0];

      // 2. Try to get the general backend message ("Failed to add time log.")
      const generalMessage = backendData?.message;

      // Prioritize the specific error, fallback to the general message, then fallback to a default string.
      const errorMessage = specificError || generalMessage || 'Failed to save record';

      showError(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }

);

export const updateDailyWorkplan = createAsyncThunk(
  'tasks/updateDailyWorkLog',
  async (logs, { getState, rejectWithValue }) => {
    // "logs" is an array of objects to update from the UpdateGroupModal
    try {
      const userUUID = getEmpCode();

      if (!userUUID) throw new Error('User not authenticated');

      console.log("Updating logs:", logs);

      // 1. Map over the incoming array and process each log
      const timeLogDataArray = logs.map((log) => {
        const {
          id, // IMPORTANT: The ID of the task being updated
          project, subactivity, date, start_time, end_time,
          work_type, note, status, phase = "R0",
          submission_po_status = "", submission_invoice_status = "",
          approval_po_status = "", approval_invoice_status = ""
        } = log;

        // if (!id) {
        //   throw new Error('Task ID is missing for the update operation');
        // }

        let durationSeconds = 0;
        let startDateTime = start_time ? `${date}T${start_time}:00` : null;
        let endDateTime = end_time ? `${date}T${end_time}:00` : null;

        if (status === 'WORKED') {
          if (!start_time || !end_time) {
            throw new Error('Please enter both start and end time');
          }

          startDateTime = `${date}T${start_time}:00`;
          endDateTime = `${date}T${end_time}:00`;

          const start = new Date(startDateTime);
          const end = new Date(endDateTime);

          if (start >= end) {
            throw new Error('End time must be after start time');
          }

          durationSeconds = Math.round((end - start) / 1000);
        } else {
          startDateTime = `${date}T00:00:00`;
          endDateTime = `${date}T23:59:59`;
          durationSeconds = 86400; // 24 hours
        }

        // Return the formatted object including the ID
        return {
          id: id,
          project: project,
          user: userUUID,
          subactivity: subactivity,
          entry_type: status === 'WORKED' ? 'WORK_LOG' : 'LEAVE',
          status: status === 'WORKED' ? 'COMPLETED' : 'ABSENT',
          start_time: startDateTime,
          end_time: endDateTime,
          duration: durationSeconds,
          work_type: work_type,
          date: date,
          note: note || (status === 'WORKED' ? `Worked on task` : `No work done`),
          phase: phase,
          submission_po_status: submission_po_status,
          submission_invoice_status: submission_invoice_status,
          approval_po_status: approval_po_status,
          approval_invoice_status: approval_invoice_status
        };
      });

      // 2. Send the array to your bulk update API endpoint
      // Note: Adjust the method (.put vs .patch) and URL if your backend uses a specific route for updates 
      const response = await api.put('/time-planer/bulk-update/', { "planners": timeLogDataArray });

      // 3. Show a bulk success message
      // showSuccess();

      // 4. Return the response data
      return response;

    }
    // catch (error) {
    //   console.error('Error updating work log:', error);
    //   // dispatch(
    //   //   showSnackbar({
    //   //     message: error?.message || "Failed to Saved Plan",
    //   //     type: "error",
    //   //   })
    //   // );
    //   // showError(error.message || 'Failed to update records');
    //   return rejectWithValue(error.message);
    // }
    catch (error) {
      console.error('Error saving work log:', error);

      const errorMessage =
        error?.response?.status === 400
          ? "Duplicate Sub Activity is not allowed."
          : error?.message || "Failed to save records";

      showError(errorMessage);

      return rejectWithValue(errorMessage);
    }
  }
);

export const saveDailyWorkLogBulk = createAsyncThunk(
  'tasks/time-logs/bulk/',
  async (logs, { getState, rejectWithValue }) => {
    // "logs" is an array of objects to update from the UpdateGroupModal
    try {
      const userUUID = getEmpCode();

      if (!userUUID) throw new Error('User not authenticated');

      console.log("Updating logs:", logs);

      // 1. Map over the incoming array and process each log
      const timeLogDataArray = logs.map((log) => {
        const {
          id, // IMPORTANT: The ID of the task being updated
          project, subactivity, date, start_time, end_time,
          work_type, note, status, phase = "R0",
          submission_po_status = "", submission_invoice_status = "",
          approval_po_status = "", approval_invoice_status = ""
        } = log;

        // if (!id) {
        //   throw new Error('Task ID is missing for the update operation');
        // }

        let durationSeconds = 0;
        let startDateTime = start_time ? `${date}T${start_time}:00` : null;
        let endDateTime = end_time ? `${date}T${end_time}:00` : null;

        if (status === 'WORKED') {
          if (!start_time || !end_time) {
            throw new Error('Please enter both start and end time');
          }

          startDateTime = `${date}T${start_time}:00`;
          endDateTime = `${date}T${end_time}:00`;

          const start = new Date(startDateTime);
          const end = new Date(endDateTime);

          if (start >= end) {
            throw new Error('End time must be after start time');
          }

          durationSeconds = Math.round((end - start) / 1000);
        } else {
          startDateTime = `${date}T00:00:00`;
          endDateTime = `${date}T23:59:59`;
          durationSeconds = 86400; // 24 hours
        }

        // Return the formatted object including the ID
        return {
          id: id,
          project: project,
          user: userUUID,
          subactivity: subactivity,
          entry_type: status === 'WORKED' ? 'WORK_LOG' : 'LEAVE',
          status: status === 'WORKED' ? 'COMPLETED' : 'ABSENT',
          start_time: startDateTime,
          end_time: endDateTime,
          duration: durationSeconds,
          work_type: work_type,
          date: date,
          note: note || (status === 'WORKED' ? `Worked on task` : `No work done`),
          phase: phase,
          submission_po_status: submission_po_status,
          submission_invoice_status: submission_invoice_status,
          approval_po_status: approval_po_status,
          approval_invoice_status: approval_invoice_status
        };
      });

      // 2. Send the array to your bulk update API endpoint
      // Note: Adjust the method (.put vs .patch) and URL if your backend uses a specific route for updates 
      const response = await api.post('/time-logs/bulk/', timeLogDataArray);

      // 3. Show a bulk success message
      // showSuccess();

      // 4. Return the response data
      return response;

    }
    // catch (error) {
    //   console.error('Error updating work log:', error);
    //   // dispatch(
    //   //   showSnackbar({
    //   //     message: error?.message || "Failed to Saved Plan",
    //   //     type: "error",
    //   //   })
    //   // );
    //   // showError(error.message || 'Failed to update records');
    //   return rejectWithValue(error.message);
    // }
    catch (error) {
      console.error('Error saving work log:', error);

      const errorMessage =
        error?.response?.status === 400
          ? "Duplicate Sub Activity is not allowed."
          : error?.message || "Failed to save records";

      showError(errorMessage);

      return rejectWithValue(errorMessage);
    }
  }
);

export const saveDailyWorkplan = createAsyncThunk(
  'tasks/saveDailyWorkLog',
  async (logs, { getState, rejectWithValue }) => {
    // "logs" is now an array of objects
    try {
      const userUUID = getEmpCode();

      if (!userUUID) throw new Error('User not authenticated');
      console.log("Saving logs:", logs);
      // 1. Map over the incoming array and process each log
      const timeLogDataArray = logs.map((log) => {
        const {
          projectId, subActivityId, date, startTime, endTime,
          workType, note, status, phase = "R0",
          submission_po_status = "", submission_invoice_status = "",
          approval_po_status = "", approval_invoice_status = ""
        } = log;

        let durationSeconds = 0;
        let startDateTime = null;
        let endDateTime = null;

        if (status === 'WORKED') {
          if (!startTime || !endTime) {
            throw new Error('Please enter both start and end time');
          }

          startDateTime = `${date}T${startTime}:00`;
          endDateTime = `${date}T${endTime}:00`;

          const start = new Date(startDateTime);
          const end = new Date(endDateTime);

          if (start >= end) {
            throw new Error('End time must be after start time');
          }

          durationSeconds = Math.round((end - start) / 1000);
        } else {
          startDateTime = `${date}T00:00:00`;
          endDateTime = `${date}T23:59:59`;
          durationSeconds = 86400; // 24 hours
        }

        // Return the formatted object for this specific row
        return {
          project: projectId,
          user: userUUID,
          subactivity: subActivityId,
          entry_type: status === 'WORKED' ? 'WORK_LOG' : 'LEAVE',
          status: "not_done",
          start_time: startDateTime,
          end_time: endDateTime,
          duration: durationSeconds,
          work_type: workType,
          date: date,
          note: note,
          phase: phase,
          submission_po_status: submission_po_status,
          submission_invoice_status: submission_invoice_status,
          approval_po_status: approval_po_status,
          approval_invoice_status: approval_invoice_status
        };
      });
      console.log("Formatted time log data array:", timeLogDataArray);
      // 2. Send the entire array in a SINGLE API request
      const response = await api.post('/time-planer/', timeLogDataArray);

      // 3. Show a bulk success message
      showSuccess(`Successfully saved ${timeLogDataArray.length} work log(s)`);

      // 4. Return the response data
      return response.data;

    } catch (error) {
      console.error('Error saving work log:', error);

      const errorMessage =
        error?.response?.status === 400
          ? "Duplicate Sub Activity is not allowed."
          : error?.message || "Failed to save records";

      showError(errorMessage);

      return rejectWithValue(errorMessage);
    }
  }
);



// DEPRECATED: Kept for backward compatibility with TaskPicker components
// This functionality is no longer used as users can directly log time
export const pickTask = createAsyncThunk(
  'tasks/pickTask',
  async (taskData, { rejectWithValue }) => {
    // This function is deprecated and will not actually pick tasks
    // It's only here to prevent import errors in existing components
    console.warn('pickTask is deprecated. Users can now log time directly without picking tasks.');

    // Return a mock response for backward compatibility
    return {
      id: taskData.subActivityId,
      subactivity_id: taskData.subActivityId,
      subactivity_name: taskData.subActivityName,
      activity_name: taskData.activityName,
      activity_id: taskData.activityId,
      project_id: taskData.projectId,
      project_name: taskData.projectName,
      project_code: taskData.projectCode,
      unit: taskData.unit,
      total_quantity: taskData.totalQuantity,
      completed_quantity: 0,
      progress: 0,
      status: 'PENDING',
      picked_at: new Date().toISOString(),
      total_time_spent: 0,
      work_logs: []
    };
  }
);

// DEPRECATED: Kept for backward compatibility
export const fetchUserTasks = createAsyncThunk(
  'tasks/fetchUserTasks',
  async (_, { rejectWithValue }) => {
    console.warn('fetchUserTasks is deprecated. Use fetchUserWorkSummary instead.');
    return [];
  }
);

// DEPRECATED: Kept for backward compatibility
export const updateTaskProgress = createAsyncThunk(
  'tasks/updateTaskProgress',
  async (_, { rejectWithValue }) => {
    console.warn('updateTaskProgress is deprecated. Progress updates are handled automatically.');
    return {};
  }
);

// fecth user submitted task
export const fetchUserSubmittedTask = createAsyncThunk(
  'tasks/fetchUserSubmittedTask',
  async (empCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/stages/work-logs/?emp_code=${empCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user work summary:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// fecth user submitted task
export const fetchAllEmployeesReport = createAsyncThunk(
  'tasks/fetchAllEmployeesReport',
  async (empCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tl-project-work-report/?emp_code=${empCode}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user work summary:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add these to your taskSlice.js

export const updateSubmissionStatus = createAsyncThunk(
  'tasks/updateSubmissionStatus',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/submissions/update-status/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Add to extraReducers
extraReducers: (builder) => {
  builder
    .addCase(updateSubmissionStatus.pending, (state) => {
      state.loading = true;
    })
    .addCase(updateSubmissionStatus.fulfilled, (state, action) => {
      state.loading = false;
      // Update the submission in your state if needed
    })
    .addCase(updateSubmissionStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
}

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    userTasks: [],
    userWorkLogs: [],
    userWorkSummary: null,
    projectsReport: null,
    userSubmittedTask: [],
    userReportData: null,
    allEmployeesReport: null,
    loading: false,
    updating: false,
    error: null,
    stats: {
      total: 0,
      totalHours: 0,
      totalEntries: 0,
      byDate: {},
      byProject: {}
    }
  },
  reducers: {
    clearTaskError: (state) => {
      state.error = null;
    },
    calculateWorkLogStats: (state) => {
      const totalHours = state.userWorkLogs.reduce((sum, log) => {
        if (log.duration) {
          const hours = typeof log.duration === 'number' ? log.duration / 3600 : 0;
          return sum + hours;
        }
        return sum;
      }, 0);

      const byDate = {};
      const byProject = {};

      state.userWorkLogs.forEach(log => {
        const date = log.date;
        if (date) {
          byDate[date] = (byDate[date] || 0) + (log.duration ? (typeof log.duration === 'number' ? log.duration / 3600 : 0) : 0);
        }

        const projectName = log.project_name;
        if (projectName) {
          byProject[projectName] = (byProject[projectName] || 0) + 1;
        }
      });

      state.stats = {
        total: state.userWorkLogs.length,
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalEntries: state.userWorkLogs.length,
        byDate,
        byProject
      };
    }
  },
  extraReducers: (builder) => {
    builder


      // Fetch User Work Logs
      .addCase(fetchUserWorkLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWorkLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.userWorkLogs = action.payload || [];
      })
      .addCase(fetchUserWorkLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User Work Summary
      .addCase(fetchProjectReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectReport.fulfilled, (state, action) => {
        state.loading = false;
        state.projectsReport = action.payload;
      })
      .addCase(fetchProjectReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch User Work Summary
      .addCase(fetchUserWorkSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWorkSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.userWorkSummary = action.payload;
      })
      .addCase(fetchUserWorkSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Fetch  user submitted summary
      .addCase(fetchUserSubmittedTask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserSubmittedTask.fulfilled, (state, action) => {
        state.loading = false;
        state.userSubmittedTask = action.payload;
      })
      .addCase(fetchUserSubmittedTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      //Fetch  user report summary
      .addCase(fetchAllEmployeesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllEmployeesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.allEmployeesReport = action.payload;
      })
      .addCase(fetchAllEmployeesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Daily Work Log
      .addCase(updateDailyWorkplan.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateDailyWorkplan.fulfilled, (state, action) => {
        state.updating = false;
        // Optionally update the specific logs in state.userWorkLogs here if needed,
        // though typically fetching the list again from the component is safer.
      })
      .addCase(updateDailyWorkplan.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      // Save Daily Work Plan
      .addCase(saveDailyWorkplan.pending, (state) => {
        state.updating = true;
      })
      .addCase(saveDailyWorkplan.fulfilled, (state, action) => {
        state.updating = false;
        state.userWorkLogs.unshift(action.payload);
      })
      .addCase(saveDailyWorkplan.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      });
  }
});

export const { clearTaskError, calculateWorkLogStats } = taskSlice.actions;
export default taskSlice.reducer;