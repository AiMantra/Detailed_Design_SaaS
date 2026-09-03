




import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrackWorkLog, fetchProjectsListSimple } from "../api/apiSlice";
import {
  AlertCircle, FolderOpen, Briefcase, Layers, Loader2,
  Clock, CalendarDays, User, ChevronDown, ChevronUp,
  FileText
} from "lucide-react";
import { motion } from "framer-motion";

// --- Helper: Group flat worklogs by User and Date ---
const processUserLogs = (employees = [], worklogs = []) => {
  return employees.map(emp => {
    // Find logs for this specific employee
    const empLogs = worklogs.filter(w => w.user === emp.employee_code);

    // Group their logs by date
    const logsByDate = {};
    empLogs.forEach(log => {
      const dateStr = log.start_time ? log.start_time.split('T')[0] : 'N/A';
      if (!logsByDate[dateStr]) {
        logsByDate[dateStr] = { date: dateStr, logs: [], total_time: log.duration_display };
      }
      logsByDate[dateStr].logs.push({
        work_type: log.work_type,
        description: log.note,
        time_spent: log.duration_display,
        start_time: log.start_time,
        end_time: log.end_time
      });
    });

    return {
      name: emp.name,
      emp_code: emp.employee_code,
      designation: emp.designation,
      total_logs: emp.total_logs,
      date_wise: Object.values(logsByDate)
    };
  });
};

// --- 1. User Work Log Card ---
const UserLogCard = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* User Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.emp_code} • {user.designation}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {user.total_logs} logs
            </span>
          </div>
          {expanded ? <ChevronUp className="text-gray-400" size={18} /> : <ChevronDown className="text-gray-400" size={18} />}
        </div>
      </div>

      {/* Expanded Daily Logs */}
      {expanded && (
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
          {user.date_wise?.map((dayRecord, idx) => (
            <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <CalendarDays size={16} className="text-blue-500" />
                  {dayRecord.date !== 'N/A' ? new Date(dayRecord.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                </span>
              </div>

              <div className="space-y-3">
                {dayRecord.logs?.map((log, logIdx) => (
                  <div key={logIdx} className="pl-4 border-l-2 border-blue-200 relative">
                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          Log Entry
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <FileText size={12} /> {log.description || "No description"}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <span className="block text-gray-600 font-mono font-medium">
                          {log.time_spent}
                        </span>
                        <span className="text-gray-400">
                          {log.start_time ? new Date(log.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""} -
                          {log.end_time ? new Date(log.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- 2. Cycle Section (Represents 1 item from eventlogs array) ---
const CycleSection = ({ cycle }) => {
  // Process the raw data into user-grouped blocks
  const users = processUserLogs(cycle.employees || [], cycle.worklogs || []);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

      {/* Header containing the Rework Event details */}
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-gray-800 text-lg">Cycle: {cycle.cycle_number || "Initial"}</span>
            {cycle.event_type && (
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {cycle.event_type.replace('_', ' ')}
              </span>
            )}
            {cycle.created_by && (
              <span className="text-xs text-gray-600 bg-gray-200/50 px-2 py-1 rounded-md border border-gray-200">
                Created by: <span className="font-medium">{cycle.created_by.name}</span> ({cycle.created_by.employee_code})
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <CalendarDays size={14} /> {cycle.intimation_date || new Date(cycle.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-6 text-sm">
          {cycle.extra_payment_percent && (
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase">Extra Payment</p>
              <p className="font-mono text-orange-600 font-bold">{cycle.extra_payment_percent}%</p>
            </div>
          )}
          {cycle.reason && (
            <div className="text-right max-w-xs">
              <p className="text-xs text-gray-500 font-semibold uppercase">Reason</p>
              <p className="text-gray-700 truncate" title={cycle.reason}>{cycle.reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Work Logs Body */}
      <div className="p-5">
        <h5 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
          <User size={16} className="text-blue-500" /> Work Logs ({cycle.worklog_count || 0})
        </h5>
        {users.length > 0 ? (
          <div className="space-y-4">
            {users.map((u, i) => <UserLogCard key={i} user={u} />)}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center border border-dashed border-gray-200">
            No work logs recorded by employees in this cycle.
          </p>
        )}
      </div>
    </div>
  )
}

// --- 3. Subactivity Section ---
const SubactivitySection = ({ subactivity }) => (
  <div className="mt-4 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">

    {/* Subactivity Header */}
    <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
      <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
        <Layers size={20} className="text-purple-600" />
        {subactivity.subactivity_name}
      </h4>
      <div className="flex gap-3">
        <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1">
          <AlertCircle size={14} /> Total Reworks: {subactivity.rework_count || 0}
        </span>
      </div>
    </div>

    {/* Render every cycle (eventlog) inside this subactivity */}
    <div className="space-y-6">
      {subactivity.eventlogs?.map((cycle) => (
        <CycleSection key={cycle.id} cycle={cycle} />
      ))}
      {(!subactivity.eventlogs || subactivity.eventlogs.length === 0) && (
        <p className="text-center text-gray-500 py-4 italic">No work cycles or reworks found.</p>
      )}
    </div>

  </div>
);

// --- 4. Activity Section ---
const ActivitySection = ({ activity }) => (
  <div className="ml-2 pl-4 border-l-4 border-blue-400 mt-6 pb-2">
    <div className="flex items-center gap-3 mb-3">
      <Briefcase size={20} className="text-blue-600" />
      <h3 className="text-xl font-bold text-gray-800">
        {activity.activity_name}
      </h3>
      <span className="text-sm font-semibold bg-red-50 text-red-700 px-3 py-1 rounded-md border border-red-100">
        Total Reworks: {activity.total_reworks}
      </span>
    </div>
    <div className="pl-2">
      {activity.subactivities?.map(sub => (
        <SubactivitySection key={sub.subactivity_id} subactivity={sub} />
      ))}
    </div>
  </div>
);

// --- 5. Main Standalone Component ---
const TrackWorkLog = () => {
  const dispatch = useDispatch();

  // Pull projects list AND rework data from Redux
  const {
    projectsListAll = [],
    trackWorkLogData: data,
    loading,
    error
  } = useSelector((state) => state.api || {});

  // Fetch projects on initial mount if not already loaded
  useEffect(() => {
    if (projectsListAll.length === 0) {
      dispatch(fetchProjectsListSimple());
    }
  }, [dispatch, projectsListAll.length]);

  // Local State for dropdown selections
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedSubactivity, setSelectedSubactivity] = useState("");

  // Cache the project tree so filtering doesn't destroy options
  const [cachedProjectTree, setCachedProjectTree] = useState(null);

  useEffect(() => {
    if (data && data.level === 'project') {
      setCachedProjectTree(data);
    }
  }, [data]);

  // --- Dropdown Event Handlers ---
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);

    // Reset lower dropdowns
    setSelectedActivity("");
    setSelectedSubactivity("");
    setCachedProjectTree(null);

    if (projectId) {
      dispatch(fetchTrackWorkLog({ project_id: projectId }));
    }
  };

  const handleActivityChange = (e) => {
    const activityId = e.target.value;
    setSelectedActivity(activityId);
    setSelectedSubactivity("");

    if (activityId) {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: activityId }));
    } else {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
    }
  };

  const handleSubactivityChange = (e) => {
    const subactivityId = e.target.value;
    setSelectedSubactivity(subactivityId);

    if (subactivityId) {
      dispatch(fetchTrackWorkLog({
        project_id: selectedProject,
        activity_id: selectedActivity,
        subactivity_id: subactivityId
      }));
    } else if (selectedActivity) {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject, activity_id: selectedActivity }));
    } else {
      dispatch(fetchTrackWorkLog({ project_id: selectedProject }));
    }
  };

  // --- Derive dropdown options from the cached project tree ---
  const availableActivities = cachedProjectTree?.activities || [];
  const selectedActivityObj = availableActivities.find(a => a.activity_id === selectedActivity);
  const availableSubactivities = selectedActivityObj?.subactivities || [];

  return (
    <div className="p-6 font-sans max-w-7xl mx-auto space-y-6">

      {/* --- Filter Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <AlertCircle className="text-red-500" /> Project Reworks Logs
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">

          {/* Project Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Project</label>
            <select
              value={selectedProject}
              onChange={handleProjectChange}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
            >
              <option value="">-- Choose a Project --</option>
              {projectsListAll.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.project_name || p.name || p.short_name}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Activity</label>
            <select
              value={selectedActivity}
              onChange={handleActivityChange}
              disabled={!selectedProject || availableActivities.length === 0}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100 cursor-pointer"
            >
              <option value="">All Activities</option>
              {availableActivities.map(act => (
                <option key={act.activity_id} value={act.activity_id}>
                  {act.activity_name}
                </option>
              ))}
            </select>
          </div>

          {/* Subactivity Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Select Subactivity</label>
            <select
              value={selectedSubactivity}
              onChange={handleSubactivityChange}
              disabled={!selectedActivity || availableSubactivities.length === 0}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50 disabled:bg-gray-100 cursor-pointer"
            >
              <option value="">All Subactivities</option>
              {availableSubactivities.map(sub => (
                <option key={sub.subactivity_id} value={sub.subactivity_id}>
                  {sub.subactivity_name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* --- Data Display Section --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 h-full">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Fetching Logs...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-10 bg-red-50 text-red-600 rounded-lg border border-red-200">
            <AlertCircle className="mx-auto mb-2" size={32} />
            {typeof error === 'string' ? error : "Error loading data"}
          </div>
        )}

        {!loading && !error && !selectedProject && (
          <div className="text-center py-24 text-gray-400 flex flex-col items-center">
            <FolderOpen size={64} className="mb-4 opacity-50" />
            <p className="text-lg">Please select a project from the filters above to view logs.</p>
          </div>
        )}

        {!loading && !error && data && selectedProject && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Level 1: Project View */}
            {data.level === 'project' && (
              <div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">{data.project_name}</h2>
                  <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold">
                    Project Total Reworks: {data.total_reworks}
                  </span>
                </div>
                <div>
                  {data.activities?.map(act => <ActivitySection key={act.activity_id} activity={act} />)}
                  {(!data.activities || data.activities.length === 0) && (
                    <p className="text-gray-500 text-center py-10">No data recorded for this project.</p>
                  )}
                </div>
              </div>
            )}

            {/* Level 2: Activity View */}
            {data.level === 'activity' && (
              <div className="bg-blue-50/30 p-2 rounded-xl">
                <h2 className="text-sm font-bold text-blue-500 uppercase tracking-wider mb-2 pl-4">Filtered to Activity Scope</h2>
                <ActivitySection activity={data} />
              </div>
            )}

            {/* Level 3: Subactivity View */}
            {data.level === 'subactivity' && (
              <div className="bg-purple-50/30 p-2 rounded-xl">
                <h2 className="text-sm font-bold text-purple-500 uppercase tracking-wider mb-2 pl-4">Filtered to Subactivity Scope</h2>
                <SubactivitySection subactivity={data} />
              </div>
            )}

          </motion.div>
        )}
      </div>

    </div>
  );
};

export default TrackWorkLog;