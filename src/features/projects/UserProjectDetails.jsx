import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Building2,
  IndianRupee,
  Ruler,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileText,
  Briefcase,
  User,
  Layers,
  Target,
  Info,
  Loader2,
  X,
  StopCircle,
  Play,
  Save,
  Users
} from "lucide-react";
import { showSnackbar } from "../notifications/notificationSlice";
import { fetchProjects, fetchCompanies, fetchSubCompanies, fetchSectors, fetchClients } from "../api/apiSlice";
import { saveDailyWorkLog } from "../tasks/taskSlice";
import LoadingModal from "../../components/modals/LoadingModal";

// Helper functions
const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const mapStatusToFrontend = (backendStatus) => {
  const map = {
    "Pending": "PENDING",
    "Inprogress": "ONGOING",
    "Complete": "COMPLETED",
    "OnHold": "HOLD"
  };
  return map[backendStatus] || "PENDING";
};

const mapUnitToFrontend = (backendUnit) => {
  const map = {
    'Kilometer': 'Km',
    'Numbers': 'Nos.',
    'Percentage': 'Percentage'
  };
  return map[backendUnit] || backendUnit;
};

const UserProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const {
    projects = [],
    loading: apiLoading,
    companies = [],
    subCompanies = [],
    sectors = [],
    clients = []
  } = useSelector((state) => state.api);
  const localProjects = useSelector((state) => state.projects?.projects || []);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLogData, setTimeLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    description: ''
  });

  // Create lookup maps
  const companyMap = useMemo(() => {
    const map = {};
    companies.forEach(company => { map[company.id] = company.name; });
    return map;
  }, [companies]);

  const subCompanyMap = useMemo(() => {
    const map = {};
    subCompanies.forEach(sub => { map[sub.id] = sub.name; });
    return map;
  }, [subCompanies]);

  const sectorMap = useMemo(() => {
    const map = {};
    sectors.forEach(sector => { map[sector.id] = sector.name; });
    return map;
  }, [sectors]);

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach(client => { map[client.id] = client.name; });
    return map;
  }, [clients]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (projects.length === 0) {
        await Promise.all([
          dispatch(fetchProjects()),
          dispatch(fetchCompanies()),
          dispatch(fetchSubCompanies()),
          dispatch(fetchSectors()),
          dispatch(fetchClients())
        ]);
      }
    };
    loadData();
  }, [dispatch, projects.length]);

  // Find project
  useEffect(() => {
    setLoading(true);
    let foundProject = projects.find(p => p.id === id || p.project_id === id);
    if (!foundProject) {
      foundProject = localProjects.find(p => p.id === id || p.project_id === id);
    }
    if (foundProject) {
      setProject(foundProject);
    }
    setLoading(false);
  }, [id, projects, localProjects]);

  // Helper functions for project details
  const getCompanyName = useCallback(() => {
    const companyId = project?.company || project?.company_id;
    if (companyMap[companyId]) return companyMap[companyId];
    if (project?.company_detail?.name) return project.company_detail.name;
    return companyId || "—";
  }, [project, companyMap]);

  const getSectorName = useCallback(() => {
    const sectorId = project?.sector || project?.sector_id;
    if (sectorMap[sectorId]) return sectorMap[sectorId];
    if (project?.sector_detail?.name) return project.sector_detail.name;
    return sectorId || "—";
  }, [project, sectorMap]);

  const getClientName = useCallback(() => {
    const clientId = project?.client || project?.client_id;
    if (clientMap[clientId]) return clientMap[clientId];
    if (project?.client_detail?.name) return project.client_detail.name;
    return clientId || project?.department || "—";
  }, [project, clientMap]);

  const getProjectName = useCallback(() => project?.name || project?.project_name || "Unnamed Project", [project]);
  const getProjectCode = useCallback(() => project?.code || project?.project_code || "N/A", [project]);
  const getProjectStatus = useCallback(() => mapStatusToFrontend(project?.status), [project]);
  const getProjectProgress = useCallback(() => project?.progress || 0, [project]);
  const getProjectLocation = useCallback(() => project?.location || "—", [project]);
  const getProjectTotalLength = useCallback(() => `${project?.total_length || project?.totalLength || 0} km`, [project]);
  const getProjectCost = useCallback(() => `₹ ${project?.cost || project?.workorder_cost || 0} Lakhs`, [project]);
  const getProjectLoaDate = useCallback(() => {
    const date = project?.loa_date || project?.loaDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);
  const getProjectDirectorProposalDate = useCallback(() => {
    const date = project?.director_proposal_date || project?.directorProposalDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);
  const getProjectConfirmationDate = useCallback(() => {
    const date = project?.project_confirmation_date || project?.projectConfirmationDate;
    return date ? formatDate(date) : "Not set";
  }, [project]);
  const getProjectCompletionDate = useCallback(() => project?.completion_date || project?.completionDate, [project]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Invalid date";
    }
  }, []);

  const toggleActivity = (activityId) => {
    setExpandedActivities(prev => ({ ...prev, [activityId]: !prev[activityId] }));
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  };

  const calculateHours = (start, end) => {
    if (!start || !end) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let hours = endH - startH;
    let minutes = endM - startM;
    if (minutes < 0) {
      hours--;
      minutes += 60;
    }
    return hours + minutes / 60;
  };

  const getDeadlineBadge = (endDate, isCompleted = false) => {
    if (isCompleted) return null;
    const days = calculateDaysLeft(endDate);
    if (days === null) return null;
    if (days < 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Overdue</span>;
    if (days === 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Due Today</span>;
    if (days <= 2) return <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{days} days left</span>;
    if (days <= 7) return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">{days} days left</span>;
    return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">{days} days left</span>;
  };

  const getStatusColor = (status) => {
    const frontendStatus = mapStatusToFrontend(status);
    switch (frontendStatus) {
      case "COMPLETED": return "bg-green-100 text-green-600 border-green-200";
      case "ONGOING": return "bg-blue-100 text-blue-600 border-blue-200";
      case "DELAYED": return "bg-red-100 text-red-600 border-red-200";
      case "HOLD": return "bg-yellow-100 text-yellow-600 border-yellow-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleSaveTimeLog = async () => {
    if (!selectedTask) return;

    // Validate
    if (!timeLogData.startTime || !timeLogData.endTime) {
      dispatch(showSnackbar({
        message: 'Please enter both start and end time',
        type: 'error'
      }));
      return;
    }

    if (timeLogData.startTime >= timeLogData.endTime) {
      dispatch(showSnackbar({
        message: 'End time must be after start time',
        type: 'error'
      }));
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(saveDailyWorkLog({
        projectId: project.id || project.project_id,
        subActivityId: selectedTask.id,
        date: timeLogData.date,
        startTime: timeLogData.startTime,
        endTime: timeLogData.endTime,
        note: timeLogData.description,
        status: 'WORKED'
      })).unwrap();

      dispatch(showSnackbar({
        message: 'Work hours saved successfully!',
        type: 'success'
      }));

      setShowTimeLogModal(false);
      setSelectedTask(null);
      setTimeLogData({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: ''
      });
    } catch (error) {
      dispatch(showSnackbar({
        message: 'Your total work log exceeds 24 hours.',
        type: 'error'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = loading || apiLoading;

  if (isLoading) {
    return <LoadingModal isVisible={true} />;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center px-4">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-6">Project ID: {id}</p>
          <button
            onClick={() => navigate("/all-projects")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const activities = project.activities_detail || project.activities || [];
  const totalSubActivities = activities.reduce((acc, act) =>
    acc + (act.subactivities?.length || act.subActivities?.length || 0), 0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* Time Log Modal */}
      <AnimatePresence>
        {showTimeLogModal && selectedTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTimeLogModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={20} className="text-blue-500" />
                  Log Work Hours
                </h3>
                <button
                  onClick={() => setShowTimeLogModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Task Info */}
              <div className="mb-5 p-3 bg-gray-50 rounded-xl border">
                <p className="font-medium text-gray-800">{selectedTask.subactivity_name}</p>
                <p className="text-sm text-gray-500">{selectedTask.project_name}</p>
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                <input
                  type="date"
                  value={timeLogData.date}
                  onChange={(e) =>
                    setTimeLogData({ ...timeLogData, date: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Start Time */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Start Time
                  </label>
                  <select
                    value={timeLogData.startTime}
                    onChange={(e) =>
                      setTimeLogData({ ...timeLogData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 24 }).map((_, hour) =>
                      ["00", "30"].map((min) => {
                        const time = `${String(hour).padStart(2, "0")}:${min}`;
                        return (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>

                {/* End Time */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    End Time
                  </label>
                  <select
                    value={timeLogData.endTime}
                    onChange={(e) =>
                      setTimeLogData({ ...timeLogData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    {Array.from({ length: 24 }).map((_, hour) =>
                      ["00", "30"].map((min) => {
                        const time = `${String(hour).padStart(2, "0")}:${min}`;
                        return (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: "Full Day", start: "09:00", end: "18:00" },
                  { label: "Half Day", start: "09:00", end: "13:00" },
                  { label: "Evening", start: "14:00", end: "18:00" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      setTimeLogData({
                        ...timeLogData,
                        startTime: preset.start,
                        endTime: preset.end,
                      })
                    }
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Validation + Total */}
              {timeLogData.startTime && timeLogData.endTime && (
                <div className="mb-4 p-3 rounded-lg border bg-blue-50">
                  {timeLogData.endTime <= timeLogData.startTime ? (
                    <p className="text-red-500 text-sm font-medium">
                      End time must be after start time
                    </p>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">Total Hours:</span>
                      <span className="text-lg font-semibold text-blue-700">
                        {calculateHours(
                          timeLogData.startTime,
                          timeLogData.endTime
                        ).toFixed(2)}{" "}
                        hrs
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="mb-5">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Description
                </label>
                <textarea
                  value={timeLogData.description}
                  onChange={(e) =>
                    setTimeLogData({
                      ...timeLogData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what you worked on..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTimeLogModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveTimeLog}
                  disabled={
                    isSaving ||
                    !timeLogData.startTime ||
                    !timeLogData.endTime ||
                    timeLogData.endTime <= timeLogData.startTime
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/all-projects")}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{getProjectName()}</h1>
              <p className="text-sm text-gray-500">
                Code: {getProjectCode()} | {project.short_name && `Short Name: ${project.short_name}`}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/projects/${id}/logs`)}
            className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-all flex items-center gap-2"
          >
            <FileText size={18} />
            View Logs
          </button>
        </div>

        {/* Status Banner */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${getProjectStatus() === "DELAYED" ? "bg-red-50 border border-red-200" :
            getProjectStatus() === "COMPLETED" ? "bg-green-50 border border-green-200" :
              "bg-blue-50 border border-blue-200"
            }`}
        >
          <div className="flex items-center gap-3">
            {getProjectStatus() === "DELAYED" ? (
              <AlertCircle className="text-red-600" size={24} />
            ) : getProjectStatus() === "COMPLETED" ? (
              <CheckCircle2 className="text-green-600" size={24} />
            ) : (
              <Clock className="text-blue-600" size={24} />
            )}
            <div>
              <p className="font-semibold">
                Project Status: <span className={
                  getProjectStatus() === "DELAYED" ? "text-red-600" :
                    getProjectStatus() === "COMPLETED" ? "text-green-600" :
                      "text-blue-600"
                }>{getProjectStatus()}</span>
              </p>
              <p className="text-sm text-gray-600">
                {getProjectProgress() === 100 ? `Completed on ${formatDate(getProjectCompletionDate())}` :
                  getDaysUntilDeadline(getProjectCompletionDate()) < 0 ? "Project is overdue" :
                    getDaysUntilDeadline(getProjectCompletionDate()) === 0 ? "Project due today!" :
                      getDaysUntilDeadline(getProjectCompletionDate()) <= 2 ? "Project deadline critical" :
                        "Project is on track"}
              </p>
            </div>
          </div>
          <div className="text-right w-full md:w-auto">
            <p className="text-sm text-gray-600">
              {getProjectProgress() === 100 ? "Completion Date" : "Deadline"}
            </p>
            <p className="font-semibold">{formatDate(getProjectCompletionDate())}</p>
            {getProjectProgress() !== 100 && getDeadlineBadge(getProjectCompletionDate())}
          </div>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-blue-600" />
                Project Details
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Company" value={getCompanyName()} />
                <DetailItem label="Location" value={getProjectLocation()} icon={<MapPin size={12} />} />
                <DetailItem label="Sector" value={getSectorName()} />
                <DetailItem label="Total Length" value={getProjectTotalLength()} icon={<Ruler size={12} />} />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="border-l border-gray-100 pl-8">
              <h4 className="text-xl font-semibold text-gray-800 mb-6">Progress Overview</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-blue-600 font-bold">{getProjectProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProjectProgress()}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-4 rounded-full ${getProgressColor(getProjectProgress())}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Activities" value={activities.length} />
                  <StatCard label="Total Tasks" value={totalSubActivities} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(getProjectStatus())}`}>
                    {getProjectStatus()}
                  </span>

                  {project.extensionRequested && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-600">
                      Extension Requested
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activities Section - Direct Time Logging */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList size={24} className="text-blue-600" />
              Tasks & Activities
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User size={16} />
              <span>{user?.name}</span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
              <Layers size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Activities Yet</h3>
              <p className="text-gray-500">This project doesn't have any activities defined.</p>
            </div>
          ) : (
            activities.map((activity) => {
              const isExpanded = expandedActivities[activity.id];
              const activityName = activity.activity_name || activity.name;
              const activityProgress = activity.progress || 0;
              const isActivityCompleted = activityProgress === 100;
              const subList = activity.subactivities || activity.subActivities || [];

              return (
                <motion.div
                  key={activity.id}
                  layout
                  className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100"
                >
                  {/* Activity Header */}
                  <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">{activityName}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${isActivityCompleted ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                            {isActivityCompleted ? "Completed" : "Ongoing"}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>Start: {formatDate(activity.start_date || activity.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>End: {formatDate(activity.end_date || activity.endDate)}</span>
                          </div>
                          {!isActivityCompleted && getDeadlineBadge(activity.end_date || activity.endDate)}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleActivity(activity.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors self-start"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                    {/* Removed Activity Progress Bar */}
                  </div>

                  {/* Expanded Sub Activities */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100 bg-gray-50"
                      >
                        <div className="p-6">
                          {subList.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No tasks in this activity</p>
                          ) : (
                            <div className="space-y-4">
                              {subList.map((sub) => {
                                const subName = sub.subactivity_name || sub.name;
                                const subProgress = sub.progress || 0;
                                const isSubCompleted = subProgress === 100;
                                const subStatus = sub.status_display || mapStatusToFrontend(sub.status);
                                const subUnit = sub.unit_display || mapUnitToFrontend(sub.unit);
                                const subPlannedQty = sub.total_quantity || sub.plannedQty || 0;
                                const subCompletedQty = sub.completed_quantity || sub.completedQty || 0;
                                const subDaysLeft = calculateDaysLeft(sub.end_date || sub.endDate);

                                return (
                                  <div
                                    key={sub.id}
                                    className={`bg-white p-4 rounded-xl shadow-sm border ${isSubCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
                                  >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                          <h5 className="font-medium text-gray-800">{subName}</h5>
                                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {subUnit === "status" ? "Status Based" : subUnit}
                                          </span>
                                          {isSubCompleted ? (
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                                              <CheckCircle2 size={12} />
                                              Completed
                                            </span>
                                          ) : (
                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(subStatus)}`}>
                                              {subStatus}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                          <span>Start: {formatDate(sub.start_date || sub.startDate)}</span>
                                          <span>End: {formatDate(sub.end_date || sub.endDate)}</span>
                                          {!isSubCompleted && subDaysLeft !== null && subDaysLeft > 0 && (
                                            <span className={`${subDaysLeft <= 2 ? "text-red-600 font-semibold" :
                                              subDaysLeft <= 7 ? "text-yellow-600" : "text-blue-600"
                                              }`}>
                                              {subDaysLeft} days left
                                            </span>
                                          )}
                                        </div>

                                        {subUnit !== "status" && (
                                          <div className="mt-2 text-sm">
                                            <span className="text-gray-600">Planned: {subPlannedQty} {subUnit === "Percentage" ? "%" : subUnit}</span>
                                            {subCompletedQty > 0 && (
                                              <>
                                                <span className="mx-2">|</span>
                                                <span className="text-green-600">Completed: {subCompletedQty} {subUnit === "Percentage" ? "%" : subUnit}</span>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>


                                      {!isSubCompleted && (
                                        <button
                                          onClick={() => {
                                            setSelectedTask({
                                              id: sub.id,
                                              subactivity_name: subName,
                                              project_name: getProjectName()
                                            });
                                            setTimeLogData({
                                              date: new Date().toISOString().split('T')[0],
                                              startTime: '',
                                              endTime: '',
                                              description: ''
                                            });
                                            setShowTimeLogModal(true);
                                          }}
                                          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2 self-start"
                                          title="Log work hours"
                                        >
                                          <Clock size={18} />
                                          <span className="text-sm font-medium">Log Time</span>
                                        </button>
                                      )}
                                    </div>


                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
          <Clock size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Log Your Work Hours</h4>
            <p className="text-sm text-blue-700">
              Click the <span className="font-bold">"Log Time"</span> button on any task to record your daily work hours.
              All entries will appear in your <span className="font-bold">"My Work Logs"</span> section.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Helper Components
const DetailItem = ({ label, value, icon }) => (
  <div className="space-y-1">
    <p className="text-xs text-gray-500 flex items-center gap-1">
      {icon && icon}
      {label}
    </p>
    <p className="font-medium text-sm text-gray-800 break-words">{value}</p>
  </div>
);

const StatCard = ({ label, value }) => (
  <div className="bg-gray-50 p-4 rounded-xl">
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

export default UserProjectDetails;