// export default ProjectDetails;
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  updateSubActivityProgressLocally,
  updateSubActivityStatusLocally,
  addSubActivity,
  deleteActivity,
  deleteSubActivity,
  extendActivityDeadline,
  extendSubActivityDeadline,
  // updateSubActivity,
} from "./projectSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import ActivityExtensionModal from "./ActivityExtensionModal";
import {
  fetchProjects,
  fetchCompanies,
  fetchSubCompanies,
  fetchSectors,
  fetchClients,
  fetchActivities,
  fetchSubActivities,
  fetchProjectWorkSummary, // Add this import
  updateSubActivityProgress as updateSubActivityProgressApi,
  updateSubActivityStatus as updateSubActivityStatusApi,
  updateActivityProgress,
  updateProjectProgress,
  updateSubActivity,
} from "../api/apiSlice";
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
  PenLine,
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  FileText,
  Info,
  Users,
  UserCheck,
  Eye,
  Percent,
  TrendingUp,
  Briefcase,
  PlusCircle,
  Timer,
  User,
  Banknote,
  Handshake,
  Factory
} from "lucide-react";
import LoadingModal from "../../components/modals/LoadingModal";

// Helper functions
const mapStatusToBackend = (status, unit) => {
  const statusMap = {
    "PENDING": "Pending",
    "ONGOING": "Inprogress",
    "COMPLETED": "Complete",
    "DELAYED": "Inprogress",
    "HOLD": "OnHold"
  };
  return statusMap[status] || "Pending";
};

const mapStatusToFrontend = (backendStatus) => {
  const reverseMap = {
    "Pending": "PENDING",
    "Inprogress": "ONGOING",
    "Complete": "COMPLETED",
    "OnHold": "HOLD"
  };
  return reverseMap[backendStatus] || "PENDING";
};

const mapUnitToBackend = (unit) => {
  const unitMap = {
    'Km': 'Kilometer',
    'Nos.': 'Numbers',
    'Percentage': 'Percentage',
    'status': 'Percentage'
  };
  return unitMap[unit] || 'Kilometer';
};

const mapUnitToFrontend = (backendUnit) => {
  const reverseMap = {
    'Kilometer': 'Km',
    'Numbers': 'Nos.',
    'Percentage': 'Percentage'
  };
  return reverseMap[backendUnit] || backendUnit;
};

const getProgressFromStatus = (status) => {
  const statusProgress = {
    "PENDING": 0,
    "ONGOING": 50,
    "COMPLETED": 100,
    "DELAYED": 25,
    "HOLD": 10
  };
  return statusProgress[status] || 0;
};

const calculateActivityProgress = (subActivities) => {
  if (!subActivities || subActivities.length === 0) return 0;
  const total = subActivities.reduce((sum, sub) => sum + (sub.progress || 0), 0);
  return Math.round((total / subActivities.length) * 10) / 10;
};

const calculateProjectProgress = (activities) => {
  if (!activities || activities.length === 0) return 0;
  const total = activities.reduce((sum, a) => sum + (a.progress || 0), 0);
  return Math.round((total / activities.length) * 10) / 10;
};

// Helper to convert HH:MM:SS to hours
const timeToHours = (timeStr) => {
  if (!timeStr || timeStr === "00:00:00") return 0;
  if (typeof timeStr === 'number') return timeStr;

  if (typeof timeStr === 'string') {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      const seconds = parseInt(parts[2]);
      return hours + (minutes / 60) + (seconds / 3600);
    }
  }

  return 0;
};

// Format hours to HH:MM:SS
const formatHoursToTime = (hours) => {
  const totalSeconds = Math.floor(hours * 3600);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { projects: apiProjects = [], projectWorkSummary } = useSelector((state) => state.api);
  const { projects: localProjects = [] } = useSelector((state) => state.projects);

  const {
    companies = [],
    subCompanies = [],
    sectors = [],
    clients = [],
    activities = [],
    subActivities = []
  } = useSelector((state) => state.api);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [companyMap, setCompanyMap] = useState({});
  const [subCompanyMap, setSubCompanyMap] = useState({});
  const [sectorMap, setSectorMap] = useState({});
  const [clientMap, setClientMap] = useState({});

  const [project, setProject] = useState(null);
  const [projectActivities, setProjectActivities] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading Project");
  const [loadingSubMessage, setLoadingSubMessage] = useState("Fetching project details...");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedActivities, setExpandedActivities] = useState({});
  const [editingSubActivity, setEditingSubActivity] = useState(null);
  const [editValue, setEditValue] = useState(0);
  const [editField, setEditField] = useState(null);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [selectedActivityForSub, setSelectedActivityForSub] = useState(null);
  const [showActivityExtensionModal, setShowActivityExtensionModal] = useState(false);
  const [selectedActivityForExtension, setSelectedActivityForExtension] = useState(null);
  const [showSubActivityExtensionModal, setShowSubActivityExtensionModal] = useState(false);
  const [selectedSubActivityForExtension, setSelectedSubActivityForExtension] = useState(null);
  const [newSubActivity, setNewSubActivity] = useState({
    name: "",
    unit: "Km",
    plannedQty: 0,
    submissionPayment: 0,
    approvalPayment: 0,
    chainageStart: 0,
    chainageEnd: 0,
    description: ""
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [activityType, setActivityType] = useState(null);


  const [editData, setEditData] = useState({
    subId: '',
    projectId: '',
    activityId: '',
    description: "",
    from_status: "pending",
    to_status: "submitted",
    client_remarks: "",
    client_response_date: "",
    payment_received_amount: "",
    documents: [
      { file: null, document_type: "ref_doc" }, // default one row
    ],
  });

  // ✅ Handle Document Change
  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...editData.documents];
    updatedDocs[index][field] = value;
    setEditData({ ...editData, documents: updatedDocs });
  };

  // ✅ Add New Document Row
  const addDocumentRow = () => {
    setEditData((prev) => ({
      ...prev,
      documents: [
        ...(prev.documents || []),
        { file: null, document_type: "ref_doc" },
      ],
    }));
  };

  // ✅ Remove Document Row
  const removeDocumentRow = (index) => {
    const updatedDocs = editData.documents.filter((_, i) => i !== index);
    setEditData({ ...editData, documents: updatedDocs });
  };




  // Helper function to get project activities
  const getProjectActivities = useCallback(() => {
    return projectActivities;
  }, [projectActivities]);

  // Format date
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

  // Calculate days left
  const calculateDaysLeft = useCallback((endDate) => {
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
  }, []);

  // Get deadline badge
  const getDeadlineBadge = useCallback((endDate, isCompleted = false) => {
    if (isCompleted) return null;
    const days = calculateDaysLeft(endDate);
    if (days === null) return null;
    if (days < 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Overdue</span>;
    if (days === 0) return <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Due Today</span>;
    if (days <= 2) return <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full">{days} days left</span>;
    if (days <= 7) return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">{days} days left</span>;
    return <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">{days} days left</span>;
  }, [calculateDaysLeft]);

  // Get status color
  const getStatusColor = (status) => {
    const frontendStatus = mapStatusToFrontend(status);
    switch (frontendStatus) {
      case "COMPLETED": return "bg-green-100 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400";
      case "ONGOING": return "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400";
      case "DELAYED": return "bg-red-100 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400";
      case "HOLD": return "bg-yellow-100 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress === 100) return "bg-green-500 dark:bg-green-600";
    if (progress >= 75) return "bg-blue-500 dark:bg-blue-600";
    if (progress >= 50) return "bg-yellow-500 dark:bg-yellow-600";
    if (progress >= 25) return "bg-orange-500 dark:bg-orange-600";
    return "bg-red-500 dark:bg-red-600";
  };

  // Load all data
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      setLoadingMessage("Loading Project");
      setLoadingSubMessage("Fetching project details...");

      try {
        await Promise.all([
          dispatch(fetchProjects()).unwrap(),
          dispatch(fetchCompanies()).unwrap(),
          dispatch(fetchSubCompanies()).unwrap(),
          dispatch(fetchSectors()).unwrap(),
          dispatch(fetchClients()).unwrap(),
          dispatch(fetchActivities()).unwrap(),
          dispatch(fetchSubActivities()).unwrap(),
          dispatch(fetchProjectWorkSummary(id)).unwrap() // Add this line
        ]);
      } catch (error) {
        dispatch(showSnackbar({
          message: "Failed to load project data",
          type: "error"
        }));
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadAllData();
    }
  }, [dispatch, id]);

  // Build maps
  useEffect(() => {
    if (companies.length > 0) {
      const map = {};
      companies.forEach(company => {
        if (company && company.id) map[company.id] = company.name;
      });
      setCompanyMap(map);
    }
  }, [companies]);

  useEffect(() => {
    if (subCompanies.length > 0) {
      const map = {};
      subCompanies.forEach(sub => {
        if (sub && sub.id) map[sub.id] = sub.name;
      });
      setSubCompanyMap(map);
    }
  }, [subCompanies]);

  useEffect(() => {
    if (sectors.length > 0) {
      const map = {};
      sectors.forEach(sector => {
        if (sector && sector.id) map[sector.id] = sector.name;
      });
      setSectorMap(map);
    }
  }, [sectors]);

  useEffect(() => {
    if (clients.length > 0) {
      const map = {};
      clients.forEach(client => {
        if (client && client.id) map[client.id] = client.name;
      });
      setClientMap(map);
    }
  }, [clients]);

  // Find project
  useEffect(() => {
    let foundProject = apiProjects.find(p => p.id === id || p.project_id === id);
    if (!foundProject) {
      foundProject = localProjects.find(p => p.id === id || p.project_id === id);
    }
    if (foundProject) {
      setProject(foundProject);
    }
  }, [id, apiProjects, localProjects]);

  // Set project activities
  useEffect(() => {
    if (!project) return;

    let activitiesList = [];

    if (project.activities && Array.isArray(project.activities)) {
      if (project.activities.length > 0) {
        if (typeof project.activities[0] === 'string') {
          activitiesList = project.activities
            .map(id => activities.find(act => act.id === id))
            .filter(act => act !== undefined)
            .map(act => ({
              ...act,
              subactivities: act.subactivities?.map(sub => ({
                ...sub,
                status_display: mapStatusToFrontend(sub.status),
                unit_display: mapUnitToFrontend(sub.unit),
                progress: sub.progress || (sub.status === "Complete" ? 100 :
                  sub.status === "Inprogress" ? 50 :
                    sub.status === "Pending" ? 0 : sub.progress || 0),
                submission_payment: sub.submission_payment || 0,
                approval_payment: sub.approval_payment || 0,
                chainage_start: sub.chainage_start || 0,
                chainage_end: sub.chainage_end || 0,
                description: sub.description || ""
              }))
            }));
        } else if (typeof project.activities[0] === 'object') {
          activitiesList = project.activities.map(act => ({
            ...act,
            subactivities: act.subactivities?.map(sub => ({
              ...sub,
              status_display: mapStatusToFrontend(sub.status),
              unit_display: mapUnitToFrontend(sub.unit),
              progress: sub.progress || (sub.status === "Complete" ? 100 :
                sub.status === "Inprogress" ? 50 :
                  sub.status === "Pending" ? 0 : sub.progress || 0),
              submission_payment: sub.submission_payment || 0,
              approval_payment: sub.approval_payment || 0,
              chainage_start: sub.chainage_start || 0,
              chainage_end: sub.chainage_end || 0,
              description: sub.description || ""
            }))
          }));
        }
      }
    }

    setProjectActivities(activitiesList);
  }, [project, activities]);

  // Project stats with work summary integration
  const projectStats = useMemo(() => {
    const allUsers = new Map();
    let totalSubs = 0;
    let completedSubs = 0;
    let totalTimeSpent = 0;

    // Process work summary from Redux store
    if (projectWorkSummary && projectWorkSummary.activities && Array.isArray(projectWorkSummary.activities)) {
      projectWorkSummary.activities.forEach(activity => {
        // Process activity level users (if any)
        if (activity.users && Array.isArray(activity.users)) {
          activity.users.forEach(userLog => {
            if (userLog.emp_code) {
              if (!allUsers.has(userLog.emp_code)) {
                allUsers.set(userLog.emp_code, {
                  emp_code: userLog.emp_code,
                  emp_name: userLog.name || `Employee ${userLog.emp_code}`,
                  tasks: [],
                  completedTasks: 0,
                  totalTimeSpent: 0,
                  workEntries: []
                });
              }
              const userData = allUsers.get(userLog.emp_code);
              const hoursSpent = timeToHours(userLog.total_time_spent);
              userData.totalTimeSpent += hoursSpent;
              totalTimeSpent += hoursSpent;

              userData.workEntries.push({
                type: 'activity',
                name: activity.activity_name,
                timeSpent: userLog.total_time_spent,
                hoursSpent: hoursSpent
              });
            }
          });
        }

        // Process subactivities
        if (activity.subactivities && Array.isArray(activity.subactivities)) {
          totalSubs += activity.subactivities.length;

          activity.subactivities.forEach(subactivity => {
            // Count completed subactivities if they have progress or completion criteria
            // For now, we'll count based on if there's time spent
            if (subactivity.users && subactivity.users.length > 0) {
              // This is a rough estimate - adjust based on your business logic
              completedSubs += subactivity.users.length > 0 ? 1 : 0;
            }

            if (subactivity.users && Array.isArray(subactivity.users)) {
              subactivity.users.forEach(userLog => {
                if (userLog.emp_code) {
                  if (!allUsers.has(userLog.emp_code)) {
                    allUsers.set(userLog.emp_code, {
                      emp_code: userLog.emp_code,
                      emp_name: userLog.name || `Employee ${userLog.emp_code}`,
                      tasks: [],
                      completedTasks: 0,
                      totalTimeSpent: 0,
                      workEntries: []
                    });
                  }
                  const userData = allUsers.get(userLog.emp_code);
                  const hoursSpent = timeToHours(userLog.total_time_spent);
                  userData.totalTimeSpent += hoursSpent;
                  totalTimeSpent += hoursSpent;

                  userData.tasks.push({
                    subName: subactivity.subactivity_name,
                    activityName: activity.activity_name,
                    timeSpent: userLog.total_time_spent,
                    hoursSpent: hoursSpent,
                    progress: 100 // Since they've logged time, assume completed
                  });

                  userData.workEntries.push({
                    type: 'subactivity',
                    name: subactivity.subactivity_name,
                    activityName: activity.activity_name,
                    timeSpent: userLog.total_time_spent,
                    hoursSpent: hoursSpent
                  });

                  userData.completedTasks++;
                }
              });
            }
          });
        }
      });
    }

    // Also add users from project activities (local data)
    if (projectActivities && Array.isArray(projectActivities)) {
      projectActivities.forEach(activity => {
        const subs = activity.subactivities || [];
        subs.forEach(sub => {
          if (sub.picked_at && Array.isArray(sub.picked_at) && sub.picked_at.length > 0) {
            sub.picked_at.forEach(pick => {
              if (pick && pick.emp_code && !allUsers.has(pick.emp_code)) {
                allUsers.set(pick.emp_code, {
                  emp_code: pick.emp_code,
                  emp_name: pick.emp_name || `Employee ${pick.emp_code}`,
                  tasks: [],
                  completedTasks: 0,
                  totalTimeSpent: 0,
                  workEntries: []
                });
              }
            });
          }
        });
      });
    }

    const usersList = Array.from(allUsers.values()).sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);

    return {
      totalUsers: allUsers.size,
      usersList: usersList,
      totalSubActivities: totalSubs,
      completedSubActivities: completedSubs,
      completionRate: totalSubs > 0 ? (completedSubs / totalSubs * 100).toFixed(1) : 0,
      totalTimeSpent: totalTimeSpent.toFixed(1)
    };
  }, [projectActivities, projectWorkSummary]);

  // Handle field update
  const handleFieldUpdate = async (activityId, subId, fieldName, value) => {
    setIsSubmitting(true);
    setLoadingMessage("Updating Field");
    setLoadingSubMessage(`Updating ${fieldName}...`);

    try {
      const activity = getProjectActivities().find(a => a.id === activityId);
      const subActivity = activity?.subactivities?.find(s => s.id === subId);

      if (!subActivity) throw new Error("Sub-activity not found");

      // Update local state
      const updatedSubs = activity.subactivities.map(sub =>
        sub.id === subId ? { ...sub, [fieldName]: value } : sub
      );

      const updatedActivities = getProjectActivities().map(a =>
        a.id === activity.id ? { ...a, subactivities: updatedSubs } : a
      );
      setProjectActivities(updatedActivities);

      // Prepare API update
      const backendUnit = mapUnitToBackend(subActivity.unit_display || subActivity.unit);
      const updateData = {
        id: subId,
        subactivity_name: subActivity.subactivity_name || subActivity.name,
        unit: backendUnit,
        total_quantity: subActivity.total_quantity || subActivity.plannedQty || 0,
        completed_quantity: subActivity.completed_quantity || subActivity.completedQty || 0,
        progress: subActivity.progress || 0,
        status: subActivity.status || "Pending",
        start_date: subActivity.start_date || subActivity.startDate,
        end_date: subActivity.end_date || subActivity.endDate,
        activity: activity.id,
        [fieldName]: value,
        submission_payment: fieldName === 'submission_payment' ? value : (subActivity.submission_payment || 0),
        approval_payment: fieldName === 'approval_payment' ? value : (subActivity.approval_payment || 0),
        chainage_start: fieldName === 'chainage_start' ? value : (subActivity.chainage_start || 0),
        chainage_end: fieldName === 'chainage_end' ? value : (subActivity.chainage_end || 0),
        description: fieldName === 'description' ? value : (subActivity.description || "")
      };

      await dispatch(updateSubActivityProgressApi({
        subActivityId: subId,
        progressData: updateData
      })).unwrap();

      dispatch(showSnackbar({
        message: `${fieldName.replace('_', ' ')} updated successfully`,
        type: "success"
      }));

    } catch (error) {
      dispatch(showSnackbar({
        message: error.response?.data?.message || error.message || "Failed to update",
        type: "error"
      }));
    } finally {
      setIsSubmitting(false);
      setEditingSubActivity(null);
      setEditField(null);
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (activityId, subId, maxQty) => {
    if (editValue > maxQty) {
      dispatch(showSnackbar({
        message: `Completed quantity cannot exceed planned quantity (${maxQty})`,
        type: "error"
      }));
      return;
    }

    setIsSubmitting(true);
    setLoadingMessage("Updating Progress");
    setLoadingSubMessage("Please wait while we save your changes...");

    try {
      const activity = getProjectActivities().find(a => a.id === activityId);
      const subActivity = activity?.subactivities?.find(s => s.id === subId);

      if (!subActivity) throw new Error("Sub-activity not found");

      let progress = 0;
      if (subActivity.unit === "status") {
        progress = getProgressFromStatus(editValue);
      } else {
        progress = Math.round((editValue / maxQty) * 100);
      }

      const frontendStatus = progress === 100 ? "COMPLETED" : progress > 0 ? "ONGOING" : "PENDING";
      const backendStatus = mapStatusToBackend(frontendStatus, subActivity.unit);
      const backendUnit = mapUnitToBackend(subActivity.unit);

      const subUpdateData = {
        id: subId,
        subactivity_name: subActivity.subactivity_name || subActivity.name,
        unit: backendUnit,
        total_quantity: subActivity.unit === "status" ? 1 : maxQty,
        completed_quantity: subActivity.unit === "status" ? (progress === 100 ? maxQty : 0) : editValue,
        progress: progress,
        status: backendStatus,
        start_date: subActivity.start_date || subActivity.startDate,
        end_date: subActivity.end_date || subActivity.endDate,
        activity: activity.id,
        range: subActivity.unit === "status" ? "status" : null,
        is_completed: frontendStatus === "COMPLETED"
      };

      await dispatch(updateSubActivityProgressApi({
        subActivityId: subId,
        progressData: subUpdateData
      })).unwrap();

      const updatedSubs = activity.subactivities.map(sub =>
        sub.id === subId ? { ...sub, progress, status: frontendStatus, completed_quantity: editValue } : sub
      );

      const activityProgress = calculateActivityProgress(updatedSubs);

      if (activityProgress !== (activity.progress || 0)) {
        const activityBackendStatus = mapStatusToBackend(
          activityProgress === 100 ? "COMPLETED" : activityProgress > 0 ? "ONGOING" : "PENDING",
          "quantity"
        );

        await dispatch(updateActivityProgress({
          activityId: activity.id,
          progressData: {
            id: activity.id,
            activity_name: activity.activity_name || activity.name,
            progress: activityProgress,
            status: activityBackendStatus,
            start_date: activity.start_date || activity.startDate,
            end_date: activity.end_date || activity.endDate,
            weightage: activity.weightage || 0
          }
        })).unwrap();
      }

      const updatedActivities = getProjectActivities().map(a =>
        a.id === activity.id ? { ...a, progress: activityProgress } : a
      );

      const projectProgressVal = calculateProjectProgress(updatedActivities);

      await dispatch(updateProjectProgress({
        projectId: project.id,
        progressData: {
          id: project.id,
          progress: projectProgressVal,
          status: mapStatusToBackend(projectProgressVal === 100 ? "COMPLETED" : "ONGOING", "quantity")
        }
      })).unwrap();

      dispatch(updateSubActivityProgressLocally({
        projectId: project.id,
        activityId,
        subId,
        completedQty: editValue,
        progress,
        status: frontendStatus
      }));

      dispatch(showSnackbar({
        message: "Progress updated successfully",
        type: "success"
      }));

      setEditingSubActivity(null);
      setEditValue(0);
    } catch (error) {
      dispatch(showSnackbar({
        message: error.response?.data?.message || error.message || "Failed to update progress",
        type: "error"
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (activityId, subId, status) => {
    setIsSubmitting(true);
    setLoadingMessage("Updating Status");
    setLoadingSubMessage("Please wait while we update the status...");

    try {
      const activity = getProjectActivities().find(a => a.id === activityId);
      const subActivity = activity?.subactivities?.find(s => s.id === subId);

      if (!subActivity) throw new Error("Sub-activity not found");

      const progress = getProgressFromStatus(status);
      const backendStatus = mapStatusToBackend(status, subActivity.unit);
      const backendUnit = mapUnitToBackend(subActivity.unit);

      const updateData = {
        id: subId,
        subactivity_name: subActivity.subactivity_name || subActivity.name,
        unit: backendUnit,
        total_quantity: subActivity.total_quantity || subActivity.plannedQty || 0,
        completed_quantity: subActivity.completed_quantity || subActivity.completedQty || 0,
        progress: progress,
        status: backendStatus,
        start_date: subActivity.start_date || subActivity.startDate,
        end_date: subActivity.end_date || subActivity.endDate,
        activity: activity.id,
        range: subActivity.unit === "status" ? "status" : null,
        is_completed: status === "COMPLETED"
      };

      await dispatch(updateSubActivityStatusApi({
        subActivityId: subId,
        statusData: updateData
      })).unwrap();

      dispatch(updateSubActivityStatusLocally({
        projectId: project.id,
        activityId,
        subId,
        status,
        progress
      }));

      dispatch(showSnackbar({
        message: `Status updated to ${status}`,
        type: "success"
      }));
    } catch (error) {
      dispatch(showSnackbar({
        message: error.response?.data?.message || error.message || "Failed to update status",
        type: "error"
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle activity expansion
  const toggleActivity = useCallback((activityId) => {
    setExpandedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  }, []);

  // Handle delete sub-activity
  const handleDeleteSubActivity = (activityId, subId, subName) => {
    if (user?.role !== "ACCOUNT") {
      dispatch(showSnackbar({ message: "Only Account can delete sub-activities", type: "error" }));
      return;
    }
    if (window.confirm(`Are you sure you want to delete sub-activity "${subName}"?`)) {
      dispatch(deleteSubActivity({ projectId: project.id, activityId, subId }));
      dispatch(showSnackbar({ message: "Sub-activity deleted successfully", type: "success" }));
    }
  };

  // Handle delete activity
  const handleDeleteActivity = (activityId, activityName) => {
    if (user?.role !== "ACCOUNT") {
      dispatch(showSnackbar({ message: "Only Account can delete activities", type: "error" }));
      return;
    }
    if (window.confirm(`Are you sure you want to delete activity "${activityName}"?`)) {
      dispatch(deleteActivity({ projectId: project.id, activityId }));
      dispatch(showSnackbar({ message: "Activity deleted successfully", type: "success" }));
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();

    // Relationships
    formData.append("project", editData.activityId);
    formData.append("activity", editData.activityId);
    formData.append("subactivity", editData.subId);


    formData.append("to_status", editData.to_status);

    // Remarks
    formData.append("remarks", editData.description);
    formData.append("changed_by ", sessionStorage.getItem('emp_code'));
    // Client fields
    if (editData.client_remarks)
      formData.append("client_remarks", editData.client_remarks);

    if (editData.client_response_date)
      formData.append(
        "client_response_date",
        editData.client_response_date
      );

    if (editData.payment_received_amount)
      formData.append(
        "payment_received_amount",
        editData.payment_received_amount
      );

    // ✅ Documents (IMPORTANT 🔥)
    editData.documents.forEach((doc, index) => {
      if (doc.file) {
        formData.append(`documents`, doc.file);
        formData.append(`document_types`, doc.document_type);
      }
    });

    dispatch(
      updateSubActivity({
        id: editData.subId,
        data: formData,
      })
    );

    setShowEditModal(false);
  };

  // Render sub-activity fields
  const renderSubActivityFields = (sub, activityId) => {
    const fields = [
      { label: "Submission Payment", key: "submission_payment", value: sub.submission_payment || 0, unit: "%", icon: <Banknote size={12} /> },
      { label: "Approval Payment", key: "approval_payment", value: sub.approval_payment || 0, unit: "%", icon: <Banknote size={12} /> },
      { label: "Chainage Start", key: "chainage_start", value: sub.chainage_start || 0, unit: "km", icon: <Ruler size={12} /> },
      { label: "Length", key: "chainage_start", value: sub.covered_area || 0, unit: "m", icon: <Ruler size={12} /> },
      // { label: "Chainage End", key: "chainage_end", value: sub.chainage_end || 0, unit: "km", icon: <Ruler size={12} /> }
    ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
        {fields.map(field => (
          <div key={field.key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-1">
              {field.icon}
              <span className="text-xs text-gray-500 dark:text-gray-400">{field.label}:</span>
            </div>
            {editingSubActivity === sub.id && editField === field.key ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                  className="w-16 px-1 py-0.5 text-xs border rounded"
                  min="0"
                  step="0.01"
                  autoFocus
                />
                <button
                  onClick={() => handleFieldUpdate(activityId, sub.id, field.key, editValue)}
                  className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  <Save size={12} />
                </button>
                <button
                  onClick={() => { setEditingSubActivity(null); setEditField(null); }}
                  className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  <XCircle size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {field.value} {field.unit}
                </span>
                <button
                  onClick={() => { setEditingSubActivity(sub.id); setEditField(field.key); setEditValue(field.value); }}
                  className="p-0.5 text-gray-400 hover:text-blue-600 rounded"
                >
                  <PenLine size={10} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // User Details Modal Component
  const UserDetailsModal = ({ userData, onClose }) => {
    const totalTimeSpent = userData.totalTimeSpent;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-3 border-b">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck size={20} className="text-blue-600" />
              {userData.emp_name}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <XCircle size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div>
                <p className="text-xs text-gray-500">Employee Code</p>
                <p className="font-medium">{userData.emp_code}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Tasks/Activities</p>
                <p className="font-medium">{userData.tasks.length + (userData.workEntries?.filter(w => w.type === 'activity').length || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed Tasks</p>
                <p className="font-medium text-green-600">{userData.completedTasks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Time Spent</p>
                <p className="font-medium text-blue-600">{formatHoursToTime(totalTimeSpent)}</p>
              </div>
            </div>

            <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Briefcase size={16} /> Work Logs & Tasks
            </h4>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {userData.workEntries && userData.workEntries.length > 0 ? (
                userData.workEntries.map((entry, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {entry.type === 'activity' ? entry.name : entry.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.type === 'subactivity' && `Activity: ${entry.activityName}`}
                          {entry.type === 'activity' && 'Activity Level Work'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${entry.type === 'activity' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {entry.type === 'activity' ? 'Activity Log' : 'Task Log'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-gray-400" />
                        <span className="text-gray-500">Time Spent:</span>
                        <span className="font-medium">{entry.timeSpent}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                userData.tasks.map((task, idx) => (
                  <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{task.subName}</p>
                        <p className="text-xs text-gray-500">{task.activityName}</p>
                      </div>
                      {task.progress && (
                        <span className={`text-xs px-2 py-1 rounded-full ${task.progress === 100 ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                          {task.progress}%
                        </span>
                      )}
                    </div>
                    {task.timeSpent && (
                      <div className="text-xs mt-1">
                        <span className="text-gray-500">Time Spent:</span>
                        <span className="ml-1 font-medium">{task.timeSpent}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const showLoading = isLoading || isSubmitting;

  if (!isLoading && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
          <motion.div animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Project not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Project ID: {id}</p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/projects")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Projects
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const projectProgress = calculateProjectProgress(projectActivities);
  const totalSubActivities = projectActivities.reduce((acc, act) => acc + (act.subactivities?.length || 0), 0);

  // DetailItem component
  const DetailItem = ({ label, value, icon = null }) => (
    <div className="space-y-0.5 sm:space-y-1">
      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">{icon && icon}{label}</p>
      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white break-words">{value}</p>
    </div>
  );

  // StatCard component
  const StatCard = ({ label, value, icon = null }) => (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 rounded-xl">
      <div className="flex items-center gap-1 mb-1">{icon && <span className="text-gray-500">{icon}</span>}<p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></div>
      <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );

  const getProjectName = () => project?.name || project?.project_name || "Unnamed Project";
  const getProjectCode = () => project?.code || project?.project_code || "N/A";
  const getProjectShortName = () => project?.shortName || project?.short_name || "—";
  const getProjectCompany = () => {
    const companyId = project?.company || project?.company_id;
    if (!companyId) return "—";
    if (typeof companyId === 'string' && companyMap[companyId]) return companyMap[companyId];
    if (typeof companyId === 'object' && companyId?.name) return companyId.name;
    if (project?.company_detail?.name) return project.company_detail.name;
    return companyId;
  };
  const getProjectLocation = () => project?.location || "—";
  const getProjectSector = () => {
    const sectorId = project?.sector || project?.sector_id;
    if (!sectorId) return "—";
    if (typeof sectorId === 'string' && sectorMap[sectorId]) return sectorMap[sectorId];
    if (typeof sectorId === 'object' && sectorId?.name) return sectorId.name;
    if (project?.sector_detail?.name) return project.sector_detail.name;
    return sectorId;
  };
  const getProjectClient = () => {

    if (project?.client_detail?.client_name) return project.client_detail.client_name;

  };
  const getProjectTotalLength = () => `${project?.total_length || project?.totalLength || 0} km`;
  const getProjectCost = () => `₹ ${project?.cost || project?.workorder_cost || 0} Lakhs`;
  const getProjectLoaDate = () => {
    const date = project?.loa_date || project?.loaDate;
    return date ? formatDate(date) : "Not set";
  };
  const getProjectDirectorProposalDate = () => {
    const date = project?.loa_date || project?.directorProposalDate;
    return date ? formatDate(date) : "Not set";
  };
  const getProjectConfirmationDate = () => {
    const date = project?.completion_date || project?.projectConfirmationDate;
    return date ? formatDate(date) : "Not set";
  };
  const getProjectCompletionDate = () => project?.completion_date || project?.completionDate;
  const getProjectStatus = () => mapStatusToFrontend(project?.status);
  const getProjectExtensionRequested = () => project?.extensionRequested || false;



  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <LoadingModal
        isVisible={showLoading}
        message={loadingMessage}
        submessage={loadingSubMessage}
      />

      <AnimatePresence>
        {showUserDetailsModal && selectedUser && (
          <UserDetailsModal userData={selectedUser} onClose={() => setShowUserDetailsModal(false)} />
        )}
      </AnimatePresence>

      {/* Activity Extension Modal */}
      <ActivityExtensionModal
        isOpen={showActivityExtensionModal}
        onClose={() => { setShowActivityExtensionModal(false); setSelectedActivityForExtension(null); }}
        onSubmit={({ newDate, reason }) => {
          dispatch(extendActivityDeadline({
            projectId: project?.id,
            activityId: selectedActivityForExtension,
            newEndDate: newDate,
            reason,
            extendedBy: user?.name
          }));
          setShowActivityExtensionModal(false);
          setSelectedActivityForExtension(null);
        }}
        item={getProjectActivities().find(a => a.id === selectedActivityForExtension)}
        itemType="activity"
      />

      {/* Sub-Activity Extension Modal */}
      <ActivityExtensionModal
        isOpen={showSubActivityExtensionModal}
        onClose={() => { setShowSubActivityExtensionModal(false); setSelectedSubActivityForExtension(null); }}
        onSubmit={({ newDate, reason }) => {
          dispatch(extendSubActivityDeadline({
            projectId: project?.id,
            activityId: selectedSubActivityForExtension?.activityId,
            subId: selectedSubActivityForExtension?.subId,
            newEndDate: newDate,
            reason,
            extendedBy: user?.name
          }));
          setShowSubActivityExtensionModal(false);
          setSelectedSubActivityForExtension(null);
        }}
        item={{ name: selectedSubActivityForExtension?.subName, endDate: selectedSubActivityForExtension?.endDate, parentActivity: selectedSubActivityForExtension?.activityName }}
        itemType="subactivity"
      />

      {/* Add Sub-Activity Modal */}
      <AnimatePresence>
        {showAddSubModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddSubModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newSubActivity.name.trim()) {
                  alert("Please enter sub-activity name");
                  return;
                }
                if (newSubActivity.unit !== "status" && (!newSubActivity.plannedQty || newSubActivity.plannedQty <= 0)) {
                  alert("Please enter planned quantity");
                  return;
                }
                const activity = getProjectActivities().find(a => a.id === selectedActivityForSub);
                dispatch(addSubActivity({
                  projectId: project?.id,
                  activityId: selectedActivityForSub,
                  subActivity: {
                    name: newSubActivity.name,
                    unit: newSubActivity.unit,
                    plannedQty: newSubActivity.unit !== "status" ? newSubActivity.plannedQty : 1,
                    startDate: activity?.start_date || activity?.startDate,
                    endDate: activity?.end_date || activity?.endDate,
                    submissionPayment: newSubActivity.submissionPayment,
                    approvalPayment: newSubActivity.approvalPayment,
                    chainageStart: newSubActivity.chainageStart,
                    chainageEnd: newSubActivity.chainageEnd,
                    description: newSubActivity.description
                  }
                }));
                dispatch(showSnackbar({ message: "Sub-activity added successfully", type: "success" }));
                setShowAddSubModal(false);
                setNewSubActivity({
                  name: "",
                  unit: "Km",
                  plannedQty: 0,
                  submissionPayment: 0,
                  approvalPayment: 0,
                  chainageStart: 0,
                  chainageEnd: 0,
                  description: ""
                });
              }}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Add Sub-Activity</h3>
                  <button type="button" onClick={() => setShowAddSubModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                    <XCircle size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setActivityType("single")}
                    className={`px-4 py-2 rounded-lg ${activityType === "single"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                      }`}
                  >
                    Single
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivityType("multiple")}
                    className={`px-4 py-2 rounded-lg ${activityType === "multiple"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                      }`}
                  >
                    Multiple
                  </button>
                </div>
                <div className="space-y-4">
                  <input type="text" placeholder="Sub-activity name" value={newSubActivity.name} onChange={(e) => setNewSubActivity({ ...newSubActivity, name: e.target.value })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" required />
                  <select value={newSubActivity.unit} onChange={(e) => setNewSubActivity({ ...newSubActivity, unit: e.target.value })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                    <option value="Km">Kilometer (Km) - Track by distance</option>
                    <option value="Nos.">Numbers (Nos.) - Track by count</option>
                    <option value="Percentage">Percentage (%) - Track by completion %</option>
                    <option value="status">Status Based - Track by status</option>
                  </select>
                  {newSubActivity.unit === "Percentage" ? (
                    <input type="number" placeholder="Target percentage (e.g., 100)" value={newSubActivity.plannedQty} onChange={(e) => setNewSubActivity({ ...newSubActivity, plannedQty: parseFloat(e.target.value) })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" max="100" step="1" required />
                  ) : newSubActivity.unit !== "status" ? (
                    <input type="number" placeholder="Planned quantity" value={newSubActivity.plannedQty} onChange={(e) => setNewSubActivity({ ...newSubActivity, plannedQty: parseFloat(e.target.value) })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" step="0.01" required />
                  ) : (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <Info size={16} /> Status-based tracking - No quantity needed.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Submission Payment (%)" value={newSubActivity.submissionPayment} onChange={(e) => setNewSubActivity({ ...newSubActivity, submissionPayment: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" max="100" step="0.01" />
                    <input type="number" placeholder="Approval Payment (%)" value={newSubActivity.approvalPayment} onChange={(e) => setNewSubActivity({ ...newSubActivity, approvalPayment: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" max="100" step="0.01" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Chainage Start (km)" value={newSubActivity.chainageStart} onChange={(e) => setNewSubActivity({ ...newSubActivity, chainageStart: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" step="0.01" />
                    {/* <input type="number" placeholder="Chainage End (km)" value={newSubActivity.chainageEnd} onChange={(e) => setNewSubActivity({ ...newSubActivity, chainageEnd: parseFloat(e.target.value) || 0 })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white" min="0" step="0.01" /> */}
                  </div>
                  <textarea placeholder="Description" value={newSubActivity.description} onChange={(e) => setNewSubActivity({ ...newSubActivity, description: e.target.value })} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" rows="2" />
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowAddSubModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Sub-Activity</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4"
            onClick={() => {

              setShowEditModal(false);
            }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-lg">Submit Sub-Activity</h3>
                  <XCircle onClick={() => setShowEditModal(false)} />
                </div>

                <div className="space-y-4">
                  {/* Description */}
                  <textarea
                    placeholder="Remarks"
                    className="w-full border p-2 rounded"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  />

                  {/* Status */}
                  <select
                    value={editData.to_status}
                    onChange={(e) =>
                      setEditData({ ...editData, to_status: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">Select Status</option>
                    <option value="pending">Pending</option>
                    <option value="Inprogress">NOTCOMPLETED</option>
                    <option value="Submitted">Submitted</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  {/* 🔥 Documents Section */}
                  <div className="border p-3 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">Documents</h4>
                      <button
                        type="button"
                        onClick={addDocumentRow}
                        className="flex items-center gap-1 text-blue-600"
                      >
                        <PlusCircle size={16} /> Add Document 
                      </button>
                    </div>

                    {editData?.documents?.map((doc, index) => (
                      <div
                        key={index}
                        className="flex gap-2 items-center mb-2"
                      >
                        {/* File */}
                        <input
                          type="file"
                          onChange={(e) =>
                            handleDocumentChange(
                              index,
                              "file",
                              e.target.files[0]
                            )
                          }
                          className="border p-1 rounded w-full"
                        />

                        {/* Type */}
                        <select
                          value={doc.document_type}
                          onChange={(e) =>
                            handleDocumentChange(
                              index,
                              "document_type",
                              e.target.value
                            )
                          }
                          className="border p-1 rounded"
                        >
                          <option value="">SelectDoc Type</option>
                          <option value="ref_doc">Ref</option>
                          <option value="client_doc">Client</option>
                          <option value="other">Other</option>
                        </select>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeDocumentRow(index)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Client Fields */}
                  <input
                    type="text"
                    placeholder="Client Remarks"
                    className="w-full border p-2 rounded"
                    value={editData.client_remarks}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        client_remarks: e.target.value,
                      })
                    }
                  />

                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded"
                    value={editData.client_response_date}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        client_response_date: e.target.value,
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Payment"
                    className="w-full border p-2 rounded"
                    value={editData.payment_received_amount}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        payment_received_amount: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="border px-4 py-2 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLoading && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button whileHover={{ scale: 1.1, x: -5 }} whileTap={{ scale: 0.9 }} onClick={() => navigate("/projects")} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl">
                <ArrowLeft size={isMobile ? 18 : 20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{getProjectName()}</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Code: {getProjectCode()} | Short Name: {getProjectShortName()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/projects/${id}/logs`)} className="bg-gray-800 dark:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-gray-900 flex items-center gap-2 text-sm">
                <FileText size={16} /> View Logs
              </motion.button>
            </div>
          </motion.div>

          {/* Status Banner */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${getProjectStatus() === "DELAYED" ? "bg-red-50 dark:bg-red-900/20 border border-red-200" : getProjectStatus() === "COMPLETED" ? "bg-green-50 dark:bg-green-900/20 border border-green-200" : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200"}`}>
            <div className="flex items-center gap-2 sm:gap-3">
              {getProjectStatus() === "DELAYED" ? <AlertCircle className="text-red-600" size={isMobile ? 20 : 24} /> : getProjectStatus() === "COMPLETED" ? <CheckCircle2 className="text-green-600" size={isMobile ? 20 : 24} /> : <Clock className="text-blue-600" size={isMobile ? 20 : 24} />}
              <div>
                <p className="font-semibold text-sm sm:text-base text-gray-900">Project Status: <span className={getProjectStatus() === "DELAYED" ? "text-red-600" : getProjectStatus() === "COMPLETED" ? "text-green-600" : "text-blue-600"}>{getProjectStatus()}</span></p>
                <p className="text-xs sm:text-sm text-gray-600">{getProjectStatus() === "COMPLETED" ? "Project completed successfully" : getProjectStatus() === "DELAYED" ? "Project is overdue" : "Project is on track"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-600">{getProjectStatus() === "COMPLETED" ? "Completion Date" : "Deadline"}</p>
              <p className="font-semibold text-sm sm:text-base text-gray-900">{formatDate(getProjectCompletionDate())}</p>
              {getProjectStatus() !== "COMPLETED" && getDeadlineBadge(getProjectCompletionDate())}
            </div>
          </motion.div>

          {/* Project Details Card */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 size={isMobile ? 18 : 20} className="text-blue-600" /> Project Details
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <DetailItem label="Company" value={getProjectCompany()} icon={<Building2 size={12} />} />
                  <DetailItem label="Location" value={getProjectLocation()} icon={<MapPin size={12} />} />
                  <DetailItem label="Sector" value={getProjectSector()} icon={<Factory size={12} />} />
                  <DetailItem label="Client" value={getProjectClient()} icon={<Handshake size={12} />} />
                  <DetailItem label="Total Length" value={getProjectTotalLength()} icon={<Ruler size={12} />} />
                  <DetailItem label="Work Order Cost" value={getProjectCost()} icon={<IndianRupee size={12} />} />
                  <DetailItem label="LOA Date" value={getProjectLoaDate()} icon={<Calendar size={12} />} />
                  <DetailItem label="Completion" value={getProjectConfirmationDate()} icon={<Calendar size={12} />} />
                </div>
                {/* <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-800 mb-2">Key Milestones</h4>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <DetailItem label="LOA" value={getProjectDirectorProposalDate()} />
                    <DetailItem label="Completion" value={getProjectConfirmationDate()} />
                  </div>
                </div> */}
              </div>
              <div className="lg:border-l border-gray-200 lg:pl-6">
                <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Progress Overview</h4>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2"><span className="font-medium text-gray-700">Overall Progress</span><span className="text-blue-600 font-bold">{projectProgress}%</span></div>
                    <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${projectProgress}%` }} className={`h-full rounded-full ${getProgressColor(projectProgress)}`} /></div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{projectProgress}% Completed</span><span>{100 - projectProgress}% Remaining</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <StatCard label="Total Activities" value={getProjectActivities().length} />
                    <StatCard label="Total Tasks" value={totalSubActivities} />
                    <StatCard label="Team Members" value={projectStats.totalUsers} icon={<Users size={14} />} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(getProjectStatus())}`}>{getProjectStatus()}</span>
                    {getProjectExtensionRequested() && <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-600">Extension Requested</span>}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team Members Section with Work Summary */}
          {projectStats.totalUsers > 0 && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={isMobile ? 18 : 20} className="text-blue-600" />
                Team Members ({projectStats.totalUsers}) - Work Summary
                {projectStats.totalTimeSpent > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    Total Time: {formatHoursToTime(parseFloat(projectStats.totalTimeSpent))}
                  </span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectStats.usersList.map((member, idx) => (
                  <motion.div
                    key={member.emp_code}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => { setSelectedUser(member); setShowUserDetailsModal(true); }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <UserCheck size={20} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{member.emp_name}</p>
                        <p className="text-xs text-gray-500">ID: {member.emp_code}</p>
                      </div>
                      <Eye size={16} className="text-gray-400" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tasks/Activities:</span>
                        <span className="font-semibold">{member.tasks.length + (member.workEntries?.filter(w => w.type === 'activity').length || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-semibold text-green-600">{member.completedTasks}</span>
                      </div>
                      {member.totalTimeSpent > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Time:</span>
                          <span className="font-semibold text-blue-600">{formatHoursToTime(member.totalTimeSpent)}</span>
                        </div>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Recent Work:</span>
                          <span className="text-blue-600">Click to view details</span>
                        </div>
                        <div className="mt-1">
                          {(member.workEntries || []).slice(0, 2).map((entry, i) => (
                            <p key={i} className="text-xs text-gray-600 truncate">
                              • {entry.type === 'activity' ? '📋 ' : '📝 '}{entry.name}
                            </p>
                          ))}
                          {member.tasks.slice(0, 1).map((task, i) => (
                            <p key={i} className="text-xs text-gray-600 truncate">
                              • 📌 {task.subName}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Activities Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList size={isMobile ? 20 : 24} className="text-blue-600" />
                Activities & Sub-Activities
              </h3>
            </div>

            {getProjectActivities().length > 0 ? (
              getProjectActivities().map((activity, index) => {
                if (!activity || !activity.id) return null;
                const isExpanded = expandedActivities[activity.id];
                const activityProgress = activity.progress || 0;
                const isActivityCompleted = activityProgress === 100;
                const daysLeft = calculateDaysLeft(activity.end_date || activity.endDate);
                const subActivities = activity.subactivities || [];

                return (
                  <motion.div key={activity.id} layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200">
                    <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-r from-gray-50 to-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-900">{activity.activity_name || activity.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${isActivityCompleted ? "bg-green-100 text-green-600" : daysLeft < 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                              {isActivityCompleted ? "Completed" : daysLeft < 0 ? "Delayed" : "Ongoing"}
                            </span>
                            {activity.weightage && <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">{activity.weightage}%</span>}
                            <div className="flex items-center gap-1 ml-auto">
                              {(user?.role === "ADMIN" || user?.role === "ACCOUNT") && (
                                <button onClick={() => {
                                  setSelectedActivityForExtension(activity);
                                  setShowActivityExtensionModal(true);
                                }} className="p-1 text-gray-400 hover:text-blue-600 rounded-lg" title="Extend deadline">
                                  <Calendar size={isMobile ? 14 : 16} />
                                </button>
                              )}
                              {user?.role === "ACCOUNT" && (
                                <button onClick={() => handleDeleteActivity(activity.id, activity.activity_name || activity.name)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg" title="Delete activity">
                                  <Trash2 size={isMobile ? 14 : 16} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1"><Calendar size={12} /><span>Start: {formatDate(activity.start_date || activity.startDate)}</span></div>
                            <div className="flex items-center gap-1"><Calendar size={12} /><span>End: {formatDate(activity.end_date || activity.endDate)}</span></div>
                            {!isActivityCompleted && getDeadlineBadge(activity.end_date || activity.endDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!isMobile && (
                            <div className="w-24 sm:w-32">
                              <div className="flex justify-between text-xs mb-1"><span>Progress</span><span className="font-bold">{activityProgress}%</span></div>
                              <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(activityProgress)}`} style={{ width: `${activityProgress}%` }} /></div>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">{subActivities.length} sub</div>
                          <button onClick={() => toggleActivity(activity.id)} className="p-1.5 hover:bg-gray-200 rounded-lg">
                            {isExpanded ? <ChevronUp size={isMobile ? 16 : 20} /> : <ChevronDown size={isMobile ? 16 : 20} />}
                          </button>
                        </div>
                      </div>
                      {isMobile && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1"><span>Progress</span><span className="font-bold">{activityProgress}%</span></div>
                          <div className="w-full bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(activityProgress)}`} style={{ width: `${activityProgress}%` }} /></div>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200 bg-gray-50">
                          <div className="p-3 sm:p-4 md:p-6">
                            {(user?.role === "ADMIN" || user?.role === "ACCOUNT") && (
                              <div className="mb-4 flex justify-end">
                                <button onClick={() => { setSelectedActivityForSub(activity.id); setShowAddSubModal(true); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs sm:text-sm flex items-center gap-1">
                                  <Plus size={14} /> Add Sub-Activity
                                </button>
                              </div>
                            )}

                            {subActivities.length > 0 ? (
                              <div className="space-y-3">
                                {subActivities.map((sub) => {
                                  if (!sub || !sub.id) return null;
                                  const subDaysLeft = calculateDaysLeft(sub.end_date || sub.endDate);
                                  const isEditing = editingSubActivity === sub.id;
                                  const plannedQty = sub.total_quantity || sub.plannedQty || 0;
                                  const completedQty = sub.completed_quantity || sub.completedQty || 0;
                                  const progress = sub.progress || 0;
                                  const isCompleted = progress === 100;
                                  const unit = sub.unit_display || sub.unit || "Km";
                                  const isStatusBased = unit === "status";

                                  return (
                                    <div key={sub.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <p className="font-medium text-gray-800 dark:text-white">{sub.subactivity_name || sub.name}</p>
                                            <button
                                              onClick={() => {
                                                setEditData((prev) => ({
                                                  ...prev,
                                                  project_id: id,   // make sure these exist
                                                  activity_id: activity.id,
                                                  subId: sub.id,
                                                }));

                                                setShowEditModal(true);
                                              }}
                                              className="p-0.5 text-gray-400 hover:text-blue-600 rounded"
                                            >
                                              <PenLine size={10} />
                                            </button>
                                            {isCompleted && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">✓ Completed</span>}
                                            {subDaysLeft !== null && subDaysLeft < 0 && !isCompleted && (
                                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Overdue</span>
                                            )}
                                            <div className="flex items-center gap-1 ml-auto">
                                              {(user?.role === "ADMIN" || user?.role === "ACCOUNT") && (
                                                <button
                                                  onClick={() => {
                                                    setSelectedSubActivityForExtension({
                                                      activityId: activity.id,
                                                      subId: sub.id,
                                                      subName: sub.subactivity_name || sub.name,
                                                      activityName: activity.activity_name || activity.name,
                                                      endDate: sub.end_date || sub.endDate
                                                    });
                                                    setShowSubActivityExtensionModal(true);
                                                  }}
                                                  className="p-1 text-gray-400 hover:text-blue-600 rounded-lg"
                                                  title="Extend deadline"
                                                >
                                                  <Calendar size={14} />
                                                </button>
                                              )}
                                              {user?.role === "ACCOUNT" && (
                                                <button onClick={() => handleDeleteSubActivity(activity.id, sub.id, sub.subactivity_name || sub.name)} className="p-1 text-gray-400 hover:text-red-600 rounded-lg" title="Delete sub-activity">
                                                  <Trash2 size={14} />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                                            <span>Unit: {unit}</span>
                                            {!isStatusBased && <span>Planned: {plannedQty} {unit}</span>}
                                            {!isStatusBased && <span>Completed: {completedQty} {unit}</span>}
                                            <div className="flex items-center gap-1">
                                              <Calendar size={10} />
                                              <span>End: {formatDate(sub.end_date || sub.endDate)}</span>
                                            </div>
                                            {!isCompleted && getDeadlineBadge(sub.end_date || sub.endDate)}
                                          </div>
                                          {sub.description && (
                                            <p className="text-xs text-gray-500 mb-2">{sub.description}</p>
                                          )}
                                          {renderSubActivityFields(sub, activity.id)}
                                        </div>
                                      </div>

                                      {/* Progress/Status Controls */}
                                      {isStatusBased && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Status:</span>
                                            <div className="flex gap-1">
                                              {["PENDING", "ONGOING", "COMPLETED", "HOLD"].map((status) => (
                                                <button
                                                  key={status}
                                                  onClick={() => handleStatusUpdate(activity.id, sub.id, status)}
                                                  disabled={isSubmitting}
                                                  className={`text-xs px-2 py-1 rounded-lg transition-colors ${sub.status === status ? getStatusColor(status) : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                                >
                                                  {status}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                        // : (
                                        //   <div className="space-y-2">
                                        //     <div className="flex justify-between text-xs mb-1">
                                        //       <span className="text-gray-600">Progress</span>
                                        //       <span className="font-semibold text-blue-600">{progress}%</span>
                                        //     </div>
                                        //     <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        //       <div className={`h-2 rounded-full ${getProgressColor(progress)}`} style={{ width: `${progress}%` }} />
                                        //     </div>
                                        //     {isEditing ? (
                                        //       <div className="flex items-center gap-2 mt-2">
                                        //         <input
                                        //           type="number"
                                        //           value={editValue}
                                        //           onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                                        //           className="w-24 px-2 py-1 text-sm border rounded-lg"
                                        //           min="0"
                                        //           max={plannedQty}
                                        //           step="0.01"
                                        //           autoFocus
                                        //         />
                                        //         <button
                                        //           onClick={() => handleProgressUpdate(activity.id, sub.id, plannedQty)}
                                        //           disabled={isSubmitting}
                                        //           className="px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                                        //         >
                                        //           Save
                                        //         </button>
                                        //         <button
                                        //           onClick={() => { setEditingSubActivity(null); setEditValue(0); }}
                                        //           className="px-2 py-1 bg-gray-400 text-white text-xs rounded-lg hover:bg-gray-500"
                                        //         >
                                        //           Cancel
                                        //         </button>
                                        //       </div>
                                        //     ) : (
                                        //       <div className="flex justify-between items-center mt-2">
                                        //         <div className="text-xs text-gray-500">
                                        //           {completedQty} / {plannedQty} {unit}
                                        //         </div>
                                        //         <button
                                        //           onClick={() => { setEditingSubActivity(sub.id); setEditValue(completedQty); }}
                                        //           className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        //         >
                                        //           <PenLine size={12} /> Update
                                        //         </button>
                                        //       </div>
                                        //     )}
                                        //   </div>
                                        // )
                                      }
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <p>No sub-activities found</p>
                                {(user?.role === "ADMIN" || user?.role === "ACCOUNT") && (
                                  <button onClick={() => { setSelectedActivityForSub(activity.id); setShowAddSubModal(true); }} className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                                    + Add Sub-Activity
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center text-gray-500">
                <ClipboardList size={48} className="mx-auto mb-3 text-gray-400" />
                <p>No activities found for this project</p>
              </div>
            )}
          </div>

        </div>
      )}
    </motion.div>
  );
};

export default ProjectDetails;