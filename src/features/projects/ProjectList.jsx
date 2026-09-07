import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  Plus,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  FolderOpen,
  RefreshCw,
  Loader2,
  Trash2,
  UserCheck,
  Briefcase,
  Shield,
  UserCog,
  User,
  Building2,
  MapPin,
  IndianRupee,
  Ruler,
  CheckCircle,
  Hash,
  X,
  Save,
  PlusCircle,
  FileStack,
  File,
  FileText,
  Trash,
  DownloadCloudIcon,
  EllipsisVertical,
  Pencil,
  UserStar,
  AlertTriangle,
} from "lucide-react";
import {
  getProjectStatusInfo,
  getDaysUntilDeadline,
} from "../../utils/deadlineUtils";
import api, { getLatestServerDate } from "../../services/api";
import {
  fetchProjects,
  fetchOnlyProjectsList,
  fetchProjectDetails,
  fetchSubActivityDetails,
  deleteProject,
  fetchCompanies,
  fetchSectors,
  fetchClients,
  tlSubactivitySubmitwithProof,
  fetchSubActivityDetailsworklog,
} from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import TaskPicker from "../tasks/TaskPicker";
import LoadingModal from "../../components/modals/LoadingModal";
import { SECTOR_UNIT_MAPPING } from "../../utils/enumMapping";
import { saveDailyWorkLog } from "../tasks/taskSlice";
import { CustomImageModal, CustomTooltip } from "../../utils/CustomFunctions";
import { IMAGE_URL } from "../../services/api";
import { projectService } from "../../services/projectService";
import { timeToSeconds, formatSecondsToDuration, formatDuration, formatDurationDetailed } from "../../utils/CustomFormatters";
import MultiWorkLogModal from "./MultilogModal";

const ProjectList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  // const showProjectDetailsID = location.state?.showProjectDetailsID;

  // Get projects and user from Redux store
  const {
    // projects = [],
    projectsOnly = [],
    projectsOnlyPagination = {},
    projectDetails = {},
    loading: apiLoading = false,
    companies = [],
    sectors = [],
    clients = [],
  } = useSelector((state) => state.api || {});
  const { user } = useSelector((state) => state.auth);
  const [showMultiLog, setShowMultiLog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectCodeQuery, setProjectCodeQuery] = useState("");
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedActivities, setExpandedActivities] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedTaskfortimelog, setSelectedTaskfortimelog] = useState(null);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading Projects");
  const [loadingSubMessage, setLoadingSubMessage] = useState(
    "Fetching your projects...",
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showTimeLogModal, setShowTimeLogModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeLogData, setTimeLogData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    work_type: '',
    description: ''
  });

  const [worklogreturned, setWorkLogReturned] = useState([]);
  const [expandedProjectDetails, setExpandedProjectDetails] = useState({});
  const [loadingProjectDetails, setLoadingProjectDetails] = useState({});

  const [activePhaseTab, setActivePhaseTab] = useState("All");

  const [showSubActivityModal, setShowSubActivityModal] = useState(false);
  const [subActivityModalData, setSubActivityModalData] = useState(null);
  const [loadingSubActivity, setLoadingSubActivity] = useState(false);

  const [filterProjectType, setFilterProjectType] = useState("all"); // NEW FILTER STATE
  const totalCount = projectsOnlyPagination.total_projects || 0;
  const totalPages = projectsOnlyPagination.total_pages || Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const PROJECT_TYPE_SOURCE_IDS = {
    "detail design": "266931d6-0486-4760-b5a5-fd9f823b3383",
    dpr: "994947cd-a0cf-4648-bef3-42704e955ff0",
    prebid: "c4e54604-9a83-4065-b798-ad0e58673788",
  };
  const sourceId = PROJECT_TYPE_SOURCE_IDS[filterProjectType] || "";

  const getProjectListParams = (page = currentPage) => ({
    page,
    page_size: PAGE_SIZE,
    ...(sourceId ? { source_id: sourceId } : {}),
    ...(projectCodeQuery ? { project_code: projectCodeQuery } : {}),
  });

  // Create lookup maps for IDs to names
  const companyMap = useMemo(() => {
    const map = {};
    if (companies && Array.isArray(companies)) {
      companies.forEach((company) => {
        if (company && company.id) map[company.id] = company.name;
      });
    }
    return map;
  }, [companies]);

  const sectorMap = useMemo(() => {
    const map = {};
    if (sectors && Array.isArray(sectors)) {
      sectors.forEach((sector) => {
        if (sector && sector.id) map[sector.id] = sector.name;
      });
    }
    return map;
  }, [sectors]);

  const clientMap = useMemo(() => {
    const map = {};
    if (clients && Array.isArray(clients)) {
      clients.forEach((client) => {
        if (client && client.id) map[client.id] = client.name;
      });
    }
    return map;
  }, [clients]);

  const getWeightedProgress = (project) => {
    const activities = getActivities(project);

    if (!activities.length) return 0;

    let totalWeight = 0;
    let completedWeight = 0;

    activities.forEach((activity) => {
      const weight = Number(activity.weightage) || 0;
      const subs = activity.subactivities || [];

      if (!subs.length) return;

      const completedSubs = subs.filter(
        (s) => s.is_completed || s.status === "Complete",
      ).length;

      const activityProgress = completedSubs / subs.length;

      totalWeight += weight;
      completedWeight += weight * activityProgress;
    });

    if (totalWeight === 0) return 0;

    return ((completedWeight / totalWeight) * 100);
  };

  // Call API only after the user stops typing in project code search
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchTerm.trim();
      if (nextQuery === projectCodeQuery) return;
      setCurrentPage(1);
      setProjectCodeQuery(nextQuery);
    }, 2000);
    return () => clearTimeout(timer);
    // Only restart the timer when the input changes, not when the last API query updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Load lookup data once
  useEffect(() => {
    const loadLookups = async () => {
      try {
        await Promise.all([
          dispatch(fetchCompanies()).unwrap(),
          dispatch(fetchSectors()).unwrap(),
          dispatch(fetchClients()).unwrap(),
        ]);
      } catch (error) {
        dispatch(
          showSnackbar({
            message: "Failed to load data from server",
            type: "warning",
          }),
        );
      }
    };
    loadLookups();
  }, [dispatch]);

  // Fetch projects whenever page or filters change
  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      setIsInitialLoading(true);
      setLoadingMessage("Loading Projects");
      setLoadingSubMessage("Fetching project data...");
      try {
        await dispatch(fetchOnlyProjectsList(getProjectListParams())).unwrap();
      } catch (error) {
        if (!cancelled) {
          dispatch(
            showSnackbar({
              message: "Failed to load data from server",
              type: "warning",
            }),
          );
        }
      } finally {
        if (!cancelled) setIsInitialLoading(false);
      }
    };
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [dispatch, currentPage, projectCodeQuery, sourceId]);

  // Refresh data
  const loadData = async () => {
    setRefreshing(true);
    setLoadingMessage("Refreshing Projects");
    setLoadingSubMessage("Fetching latest data...");

    try {
      await Promise.all([
        dispatch(fetchCompanies()).unwrap(),
        dispatch(fetchSectors()).unwrap(),
        dispatch(fetchClients()).unwrap(),
        dispatch(fetchOnlyProjectsList(getProjectListParams())).unwrap(),
      ]);
      dispatch(
        showSnackbar({
          message: "Data refreshed successfully",
          type: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showSnackbar({
          message: "Failed to refresh data",
          type: "error",
        }),
      );
    } finally {
      setRefreshing(false);
    }
  };



  const handleViewSubActivity = async (subActivityId, e) => {
    if (e) e.stopPropagation();

    setShowSubActivityModal(true);
    setLoadingSubActivity(true);
    setSubActivityModalData(null);

    try {
      // Dispatch the thunk and use .unwrap() to handle the promise result locally
      const response = await dispatch(fetchSubActivityDetailsworklog(subActivityId)).unwrap();

      // The response is now the resolved payload from your Redux thunk
      setSubActivityModalData(response);

    } catch (error) {
      dispatch(showSnackbar({ message: "Failed to load sub-activity details", type: "error" }));
      setShowSubActivityModal(false);
    } finally {
      setLoadingSubActivity(false);
    }
  };
  const handleDeleteProject = async (projectId, projectName, e) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Are you sure you want to delete project "${projectName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleteInProgress(true);
    setLoadingMessage("Deleting Project");
    setLoadingSubMessage(`Deleting ${projectName}...`);
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      dispatch(
        showSnackbar({
          message: "Project deleted successfully",
          type: "success",
        }),
      );
      await loadData();
    } catch (error) {
      dispatch(
        showSnackbar({
          message: error.message || "Failed to delete project",
          type: "error",
        }),
      );
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handlePickTask = (project, activity, subActivity, e) => {
    e.stopPropagation();
    setSelectedTask({ project, activity, subActivity });
    setShowTaskPicker(true);
  };

  const toggleActivity = (activityId, e) => {
    e.stopPropagation();
    setExpandedActivities((prev) => ({
      // ...prev,
      [activityId]: !prev[activityId],
    }));
  };

  // Role-based checks
  const isACCOUNT = user?.role === "ACCOUNT";
  const isAdmin = user?.role === "ADMIN" || isACCOUNT;
  const isUser = user?.role === "USER";

  // Helper functions
  const getCompanyName = (project) => {
    const companyId = project.company || project.company_id;
    if (companyMap[companyId]) return companyMap[companyId];
    if (project.company_detail?.name) return project.company_detail.name;
    return companyId || "—";
  };

  const getSectorName = (project) => {
    const sectorId = project.sector || project.sector_id;
    if (sectorMap[sectorId]) return sectorMap[sectorId];
    if (project.sector_detail?.name) return project.sector_detail.name;
    return sectorId || "—";
  };

  const getClientName = (project) => {
    const clientId = project.client || project.client_id;
    if (clientMap[clientId]) return clientMap[clientId];
    if (project.client_detail?.name) return project.client_detail.name;
    return clientId || "—";
  };

  const getRoleIcon = () => {
    if (isACCOUNT) return <Shield size={16} className="text-purple-600" />;
    if (isAdmin) return <UserCog size={16} className="text-blue-600" />;
    return <User size={16} className="text-green-600" />;
  };

  const getRoleDisplay = () => {
    if (isACCOUNT) return "Account";
    if (isAdmin) return "Admin";
    return "Employee";
  };

  // Helper function to get sector unit
  const getSectorUnit = (project) => {
    const sectorName = getSectorName(project);
    const sector = sectors.find((s) => s.name === sectorName);
    return SECTOR_UNIT_MAPPING[sector?.unit] || "";
  };

  // Helper function to calculate GST amount
  const calculateGSTAmount = (project) => {
    const cost = Number(getCost(project)) || 0;
    const igst = Number(project.igst_percentage) || 0;
    const cgst = Number(project.cgst_percentage) || 0;
    const gst = (cost * igst) / 100 + (cost * cgst) / 100;
    const amount = gst !== 0 ? gst : (cost * 18) / 100;
    return amount.toFixed(2);
  };

  // Helper function to calculate total with GST
  const calculateTotalWithGST = (project) => {
    const cost = Number(getCost(project)) || 0;
    const gst = Number(calculateGSTAmount(project)) || 0;
    return (cost + gst).toFixed(2);
  };

  // Filter and sort projects
  // const filteredProjects = useMemo(() => {
  //   if (!projectsOnly || !Array.isArray(projectsOnly)) return [];
  //   let filtered = [...projectsOnly];
  //   if (searchTerm) {
  //     filtered = filtered.filter((project) => {
  //       const name = (project.project_name || project.name || "").toLowerCase();
  //       const code = (project.project_code || project.code || "").toLowerCase();
  //       const term = searchTerm.toLowerCase();
  //       return name.includes(term) || code.includes(term);
  //     });
  //   }
  //   if (filterStatus !== "all") {
  //     filtered = filtered.filter((project) => {
  //       const projectStatus = project.status || "ONGOING";
  //       const progress = project.progress || 0;
  //       const daysLeft = getDaysUntilDeadline(
  //         project.completion_date || project.completionDate,
  //       );
  //       if (filterStatus === "delayed")
  //         return (
  //           (projectStatus === "DELAYED" || daysLeft < 0) && progress < 100
  //         );
  //       if (filterStatus === "critical")
  //         return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
  //       if (filterStatus === "ongoing")
  //         return projectStatus === "ONGOING" && progress < 100;
  //       if (filterStatus === "completed")
  //         return progress === 100 || projectStatus === "COMPLETED";
  //       return true;
  //     });
  //   }
  //   filtered.sort((a, b) => {
  //     const aDays =
  //       getDaysUntilDeadline(a.created_at || a.completionDate) || 999;
  //     const bDays =
  //       getDaysUntilDeadline(b.created_at || b.completionDate) || 999;
  //     const aProgress = a.progress || 0;
  //     const bProgress = b.progress || 0;
  //     const aName = a.project_name || a.name || "";
  //     const bName = b.project_name || b.name || "";
  //     if (sortBy === "deadline") return bDays - aDays;
  //     if (sortBy === "progress") return bProgress - aProgress;
  //     if (sortBy === "name") return aName.localeCompare(bName);
  //     return 0;
  //   });
  //   return filtered;
  // }, [projectsOnly, searchTerm, filterStatus, sortBy]);

  const filteredProjects = Array.isArray(projectsOnly) ? projectsOnly : [];

  // const stats = useMemo(() => {
  //   if (!projectsOnly || !Array.isArray(projectsOnly)) {
  //     return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0 };
  //   }
  //   return {
  //     total: projectsOnly.length,
  //     delayed: projectsOnly.filter((p) => {
  //       const status = p.status || "ONGOING";
  //       const progress = p.progress || 0;
  //       const daysLeft = getDaysUntilDeadline(
  //         p.completion_date || p.completionDate,
  //       );
  //       return (status === "DELAYED" || daysLeft < 0) && progress < 100;
  //     }).length,
  //     critical: projectsOnly.filter((p) => {
  //       const progress = p.progress || 0;
  //       const daysLeft = getDaysUntilDeadline(
  //         p.completion_date || p.completionDate,
  //       );
  //       return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
  //     }).length,
  //     completed: projectsOnly.filter(
  //       (p) =>
  //         (p.progress || 0) === 100 || (p.status || "ONGOING") === "COMPLETED",
  //     ).length,
  //     ongoing: projectsOnly.filter((p) => {
  //       const progress = p.progress || 0;
  //       return progress > 0 && progress < 100;
  //     }).length,
  //   };
  // }, [projectsOnly]);

  // const ProjectListStats = useMemo(() => {
  //   if (!projectsOnly || !Array.isArray(projectsOnly)) {
  //     return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0 };
  //   }

  //   return {
  //     total: projectsOnly.length,

  //     // Delayed: projects where completion date is past AND progress < 100
  //     delayed: projectsOnly.filter((p) => {
  //       const progress = p.overall_progress || p.progress || 0;
  //       const completionDate = p.completion_date;
  //       const daysLeft = getDaysUntilDeadline(completionDate);
  //       return daysLeft < 0 && progress < 100;
  //     }).length,

  //     // Critical: projects with 0-2 days left AND progress < 100
  //     critical: projectsOnly.filter((p) => {
  //       const progress = p.overall_progress || p.progress || 0;
  //       const completionDate = p.completion_date;
  //       const daysLeft = getDaysUntilDeadline(completionDate);
  //       return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
  //     }).length,

  //     // Completed: projects with 100% progress
  //     completed: projectsOnly.filter((p) => {
  //       const progress = p.overall_progress || p.progress || 0;
  //       return progress === 100;
  //     }).length,

  //     // Ongoing: projects with progress > 0 and < 100
  //     ongoing: projectsOnly.filter((p) => {
  //       const progress = p.overall_progress || p.progress || 0;
  //       return progress > 0 && progress < 100;
  //     }).length,

  //     // Not Started: projects with 0% progress and not completed
  //     notStarted: projectsOnly.filter((p) => {
  //       const progress = p.overall_progress || p.progress || 0;
  //       return progress === 0;
  //     }).length,
  //   };
  // }, [projectsOnly]);


  const stats = useMemo(() => {
    if (!projectsOnly || !Array.isArray(projectsOnly)) {
      return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0 };
    }

    const baseProjects = projectsOnly;

    return {
      total: projectsOnlyPagination.total_projects || baseProjects.length,
      delayed: baseProjects.filter((p) => {
        const status = p.status || "ONGOING";
        const progress = p.progress || 0;
        const daysLeft = getDaysUntilDeadline(
          p.completion_date || p.completionDate,
        );
        return (status === "DELAYED" || daysLeft < 0) && progress < 100;
      }).length,
      critical: baseProjects.filter((p) => {
        const progress = p.progress || 0;
        const daysLeft = getDaysUntilDeadline(
          p.completion_date || p.completionDate,
        );
        return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
      }).length,
      completed: baseProjects.filter(
        (p) =>
          (p.progress || 0) === 100 || (p.status || "ONGOING") === "COMPLETED",
      ).length,
      ongoing: baseProjects.filter((p) => {
        const progress = p.progress || 0;
        return progress > 0 && progress < 100;
      }).length,
    };
  }, [projectsOnly, projectsOnlyPagination.total_projects]);

  const ProjectListStats = useMemo(() => {
    if (!projectsOnly || !Array.isArray(projectsOnly)) {
      return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0, notStarted: 0 };
    }

    const baseProjects = projectsOnly;

    return {
      total: projectsOnlyPagination.total_projects || baseProjects.length,

      // Delayed: projects where completion date is past AND progress < 100
      delayed: baseProjects.filter((p) => {
        const progress = p.overall_progress || p.progress || 0;
        const completionDate = p.completion_date;
        const daysLeft = getDaysUntilDeadline(completionDate);
        return daysLeft < 0 && progress < 100;
      }).length,

      // Critical: projects with 0-2 days left AND progress < 100
      critical: baseProjects.filter((p) => {
        const progress = p.overall_progress || p.progress || 0;
        const completionDate = p.completion_date;
        const daysLeft = getDaysUntilDeadline(completionDate);
        return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
      }).length,

      // Completed: projects with 100% progress
      completed: baseProjects.filter((p) => {
        const progress = p.overall_progress || p.progress || 0;
        return progress === 100;
      }).length,

      // Ongoing: projects with progress > 0 and < 100
      ongoing: baseProjects.filter((p) => {
        const progress = p.overall_progress || p.progress || 0;
        return progress > 0 && progress < 100;
      }).length,

      // Not Started: projects with 0% progress and not completed
      notStarted: baseProjects.filter((p) => {
        const progress = p.overall_progress || p.progress || 0;
        return progress === 0;
      }).length,
    };
  }, [projectsOnly, projectsOnlyPagination.total_projects]);



  const projectCodeCounts = useMemo(() => {
    const counts = {};
    if (filteredProjects && Array.isArray(filteredProjects)) {
      filteredProjects.forEach(project => {
        const code = project.project_code || project.code || "Uncoded";
        const cleanCode = code.trim() || "Uncoded";
        counts[cleanCode] = (counts[cleanCode] || 0) + 1;
      });
    }
    // Convert object to array and sort by count (highest first)
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredProjects]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const dateOnly = String(dateString).split("T")[0];
      const parts = dateOnly.split("-");
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        if (year && month && day) {
          return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        }
      }
      const parsed = new Date(dateString);
      if (Number.isNaN(parsed.getTime())) return "N/A";
      return parsed.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", damping: 15, stiffness: 100 },
    },
  };

  const handleRefresh = () => loadData();

  const getProjectId = (project) => project.id || project.project_id;
  const getProjectName = (project) =>
    project.project_name || project.name || "Unnamed Project";
  const getProjectCode = (project) =>
    project.project_code || project.code || "N/A";
  const getCompletionDate = (project) =>
    project.completion_date || project.completionDate || project.deadline;
  const getActualCompletionDate = (project) =>
    project.actual_completion_date ||
    project.completed_at ||
    project.updated_at;
  const getProgress = (project) => project.progress || 0;
  const getLocation = (project) => project.location || "No location specified";
  const getCost = (project) => project.workorder_cost || project.cost || 0;
  const getTotalLength = (project) =>
    project.total_length || project.totalLength || 0;
  const getLoaDate = (project) => project.loa_date || project.loaDate;
  const getDirectorProposalDate = (project) =>
    project.director_proposal_date || project.directorProposalDate;
  const getProjectConfirmationDate = (project) =>
    project.project_confirmation_date || project.projectConfirmationDate;
  const getActivities = (project) =>
    project.activities_detail || project.activities || [];

  const handleProjectNavigation = (projectId, e) => {
    if (e) e.stopPropagation();
    if (isUser) {
      navigate(`/my-projects/${projectId}`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const showLoading = isInitialLoading || refreshing || deleteInProgress;
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



  const handleSaveTimeLog = async () => {
    if (!selectedTaskfortimelog) return;

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

    if (!timeLogData.work_type) {
      dispatch(showSnackbar({
        message: 'Please Select Work Type',
        type: 'error'
      }));
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(saveDailyWorkLog({
        projectId: selectedTaskfortimelog.project_id,
        subActivityId: selectedTaskfortimelog.id,
        date: timeLogData.date,
        startTime: timeLogData.startTime,
        endTime: timeLogData.endTime,
        work_type: timeLogData.work_type,
        note: timeLogData.description,
        status: 'WORKED',
        stage: selectedTaskfortimelog.stage,
      })).unwrap();
      await fetchProjectDetailsIfNeeded(selectedTaskfortimelog?.project_id);
      dispatch(showSnackbar({
        message: 'Work hours saved successfully!',
        type: 'success'
      }));

      const mixedData = {
        ...selectedTaskfortimelog,
        date: timeLogData.date,
        startTime: timeLogData.startTime,
        endTime: timeLogData.endTime,
        work_type: timeLogData.work_type,
        description: timeLogData.description
      };
      setWorkLogReturned((prev) => [...prev, mixedData]);

      setShowTimeLogModal(false);
      setSelectedTaskfortimelog(null);
      setTimeLogData({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        work_type: '',
        description: ''
      });

    } catch (error) {
      // dispatch(showSnackbar({
      //   message: error.message || 'Your total work log exceeds 24 hours.',
      //   type: 'error'
      // }));
    } finally {
      setIsSaving(false);
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


  // Add this state
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false);
  const [targetSubActivityId, setTargetSubActivityId] = useState(null);
  const [targetActivityId, setTargetActivityId] = useState(null);
  const [proofData, setProofData] = useState({
    stage_type: "",
    documents: [],
    rejection_proof: [],
    rejection_reason: "",
    rejection_type: "",
    subactivity: "",
    to_status: "",
    changed_by: user?.emp_code || "",
    remarks: "",
    document_type: "ref_doc",
    client_remarks: "",
    raised_amount: "",
    extra_amount: "",
    received_amount: "",
  });

  const [viewdocumentmodel, setViewDocumentModel] = useState({
    model: false,
    data: []
  });
  const [loder, setLoder] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);


  // Replace your existing useEffect with this:
  useEffect(() => {
    const projectId = location.state?.showProjectDetailsID;
    const activityId = location.state?.showActivityDetailsID;
    const subActivityId = location.state?.showSubAcivityDetailsID;

    if (projectId && !hasAutoExpanded && !isInitialLoading && filteredProjects.length > 0) {
      // Check if the project exists in filteredProjects
      const projectExists = filteredProjects.some(p => {
        const pid = p.id || p.project_id;
        return pid === projectId;
      });

      if (projectExists) {

        // // Fetch details when auto-expanding
        // fetchProjectDetailsIfNeeded(projectId);

        // Store target IDs for subactivity expansion
        if (activityId) setTargetActivityId(activityId);
        if (subActivityId) setTargetSubActivityId(subActivityId);

        // Expand the card
        setExpandedCard(projectId);

        // Small delay to ensure DOM is updated with expanded content
        setTimeout(() => {
          const element = document.getElementById(`project-card-${projectId}`);
          if (element) {
            // Scroll to the element
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }

          // If subactivity ID is provided, expand the specific activity and scroll to subactivity
          if (subActivityId) {
            // Find which activity contains this subactivity
            const project = filteredProjects.find(p => (p.id || p.project_id) === projectId);
            if (project && project.activities_detail) {
              const activity = project.activities_detail.find(act =>
                act.subactivities && act.subactivities.some(sub => sub.id === subActivityId)
              );

              if (activity) {
                // Expand the activity
                setExpandedActivities(prev => ({
                  ...prev,
                  [activity.id]: true
                }));

                // Scroll to the subactivity after a delay
                setTimeout(() => {
                  const subActivityElement = document.getElementById(`subactivity-row-${subActivityId}`);
                  if (subActivityElement) {
                    subActivityElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                    });
                    // // Add highlight effect
                    // subActivityElement.classList.add('bg-yellow-50', 'transition-all', 'duration-300');
                    // setTimeout(() => {
                    //   subActivityElement.classList.remove('bg-yellow-50');
                    // }, 2000);
                  }
                }, 300);
              }
            }
          } else if (activityId) {
            // If only activity ID is provided, expand that activity
            setExpandedActivities(prev => ({
              ...prev,
              [activityId]: true
            }));

            // Scroll to the activity after a delay
            setTimeout(() => {
              const activityElement = document.getElementById(`activity-${activityId}`);
              if (activityElement) {
                activityElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
                // activityElement.classList.add('ring-2', 'ring-blue-400', 'transition-all', 'duration-300');
                // setTimeout(() => {
                //   activityElement.classList.remove('ring-2', 'ring-blue-400');
                // }, 2000);
              }
            }, 300);
          }
        }, 200);

        setHasAutoExpanded(true);

        // Clear the location state
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, isInitialLoading, filteredProjects, hasAutoExpanded]);


  const fetchProjectDetailsIfNeeded = useCallback(async (projectId) => {
    // // Don't fetch if already fetched or currently fetching
    // if (expandedProjectDetails[projectId] || loadingProjectDetails[projectId]) {
    //   return;
    // }

    setLoadingProjectDetails(prev => ({ ...prev, [projectId]: true }));

    try {
      const result = await dispatch(fetchProjectDetails(projectId)).unwrap();
      setExpandedProjectDetails(prev => ({ ...prev, [projectId]: result }));
    } catch (error) {
      dispatch(
        showSnackbar({
          message: "Failed to load project details",
          type: "error",
        })
      );
    } finally {
      setLoadingProjectDetails(prev => ({ ...prev, [projectId]: false }));
    }
  }, [dispatch, expandedProjectDetails, loadingProjectDetails]);

  const handleSubmissionapproveStatus = (status, sub, value, amount, extraPayment, projectId, url) => {
    setShowProofModal(true);
    setProofData({
      ...proofData,
      stage_type: status,
      stage: status,
      to_status: value,
      raised_amount: parseFloat(amount),
      received_amount: parseFloat(amount),
      extra_amount: parseFloat(extraPayment),
      subactivity: sub.id,
      projectId: projectId,
      url: url,
      created_by: user?.emp_code || "",

    })


  };
  const handleSubmitProof = async () => {
    setLoder(true);
    const response = await dispatch(tlSubactivitySubmitwithProof(proofData)).unwrap();
    await fetchProjectDetailsIfNeeded(proofData.projectId);
    setLoder(false);
    setProofData({
      stage_type: "",
      documents: [],
      rejection_proof: [],
      rejection_reason: "",
      rejection_type: "",
      subactivity: "",
      to_status: "",
      changed_by: user?.emp_code || "",
      remarks: "",
      document_type: "ref_doc",
      client_remarks: "",
      raised_amount: "",
      url: '',
      received_amount: "",
      stage: '',
      created_by: '',
      extra_amount: '',
    });
    setShowProofModal(false);
  };

  const handleEditProject = (projectid) => {
    navigate("/project/update/" + projectid)
  }

  function formatNumber(value) {
    const str = value.toString();

    // If there's no decimal, return as-is
    if (!str.includes(".")) return str;

    const [intPart, decimalPart] = str.split(".");

    // If decimal part is all zeros → remove it
    if (/^0+$/.test(decimalPart)) {
      return intPart;
    }

    // Otherwise return original value (no trimming)
    return str;
  }


  function getDaysStatus(dateStr) {
    if (!dateStr) return null;

    const createdDate = new Date(dateStr);
    const today = new Date();

    const diffTime = today - createdDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const remaining = 15 - diffDays;

    let text = "";
    let color = "";
    let extraClass = "";

    if (remaining > 0) {
      text = `${remaining} days left`;

      if (remaining > 10) {
        color = "bg-green-600 text-white";
      } else if (remaining > 5) {
        color = "bg-yellow-500 text-white";
      } else {
        color = "bg-orange-600 text-white";
      }

    } else if (remaining === 0) {
      text = `0 days left`;
      color = "bg-orange-600 text-white";

    } else {
      const dueDays = Math.abs(remaining);
      text = `${dueDays} days due`;
      color = "bg-red-500 text-white";

      // 🔥 vibration condition (more than 10 days overdue)
      if (dueDays > 5) {
        extraClass = "animate-vibrate";
        // extraClass = "animate-pulse-slow";
      }
    }

    return (
      <div
        className={`Badges text-xs mt-1 px-1 py-0.5 rounded-full font-medium ${color} ${extraClass}`}
      >
        {text}
      </div>
    );
  }

  const [openMenuId, setOpenMenuId] = useState(null);
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest(`.project-menu-${openMenuId}`)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const TIME_OPTIONS = (() => {
    const options = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (const min of ["00", "30"]) {
        if (hour === 20 && min === "30") continue; // stop exactly at 8:00 PM
        options.push(`${String(hour).padStart(2, "0")}:${min}`);
      }
    }
    return options;
  })();

  const [serverDate, setServerDate] = useState(null);   // true date, from backend
  const [dateTampered, setDateTampered] = useState(false);
  const [checkingClock, setCheckingClock] = useState(true);
  useEffect(() => {
    if (!showTimeLogModal) return;

    const trueNow = getLatestServerDate();
    console.log("True server date:", trueNow);
    if (!trueNow) {
      setServerDate(new Date());
      setDateTampered(false);
      setCheckingClock(false);
      return;
    }

    const driftMs = Math.abs(new Date().getTime() - trueNow.getTime());
    setDateTampered(driftMs > 2 * 60 * 1000);
    setServerDate(trueNow);
    setCheckingClock(false);
  }, [showTimeLogModal]);

  const maxSelectableDate = useMemo(() => {
    if (!serverDate) return null;
    const yesterday = new Date(serverDate);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }, [serverDate]);

  // Agar already-selected date server-verified max se aage nikal jaaye, clamp kar do
  // useEffect(() => {
  //   if (maxSelectableDate && timeLogData.date && timeLogData.date > maxSelectableDate) {
  //     setTimeLogData((prev) => ({ ...prev, date: maxSelectableDate }));
  //   }
  // }, [maxSelectableDate]);


  // Function to download all project data as an Excel-compatible CSV
  const handleDownloadExcel = async () => {
    setRefreshing(true);
    setLoadingMessage("Exporting Projects");
    setLoadingSubMessage("Fetching all project data...");

    try {
      const allProjects = await projectService.getAllProjectsLessDetails(user, {
        ...(sourceId ? { source_id: sourceId } : {}),
        ...(projectCodeQuery ? { project_code: projectCodeQuery } : {}),
      });

      if (!allProjects || allProjects.length === 0) {
        dispatch(showSnackbar({ message: "No project data available to download", type: "warning" }));
        return;
      }

      const PROJECT_TYPE_LABELS = {
        "266931d6-0486-4760-b5a5-fd9f823b3383": "Detail Design",
        "994947cd-a0cf-4648-bef3-42704e955ff0": "DPR",
        "c4e54604-9a83-4065-b798-ad0e58673788": "Prebid",
      };

      const getExportClientName = (project) => {
        if (project?.client_detail?.client_name) return project.client_detail.client_name;
        const clientId = project.client || project.client_id;
        if (clientId && clientMap[clientId]) return clientMap[clientId];
        return "";
      };

      const exportData = allProjects.map((project) => {
        try {
          return {
            "Project Name": project.project_name || project.name || "",
            "Project Code": project.project_code || project.code || "",
            "Project Type": PROJECT_TYPE_LABELS[project.source_id] || "",
            "Client Name": getExportClientName(project),
            "Company": getCompanyName(project) || "",
            "Sector": getSectorName(project) || "",
            "Location": project.location || "",
            "Total Length": getTotalLength(project) || 0,
            "Workorder Amount (Lakhs)": getCost(project) || 0,
            "GST Amount (Lakhs)": calculateGSTAmount(project) || 0,
            "Total with GST (Lakhs)": calculateTotalWithGST(project) || 0,
            "LOA Date": formatDate(getLoaDate(project)),
            "Deadline": formatDate(project.completion_date || project.completionDate),
            "Status": project.status || "Ongoing",
            "Physical Progress (%)": project.physical_progress ?? 0,
            "Financial Progress (%)": project.financial_progress ?? 0,
            "Overall Progress (%)": project.overall_progress ?? 0,
          };
        } catch (rowError) {
          console.error("Export row failed", project?.id, rowError);
          return {
            "Project Name": project.project_name || project.name || "",
            "Project Code": project.project_code || project.code || "",
            "Project Type": PROJECT_TYPE_LABELS[project.source_id] || "",
            "Client Name": "",
            "Company": "",
            "Sector": "",
            "Location": project.location || "",
            "Total Length": "",
            "Workorder Amount (Lakhs)": "",
            "GST Amount (Lakhs)": "",
            "Total with GST (Lakhs)": "",
            "LOA Date": formatDate(project.loa_date),
            "Deadline": formatDate(project.completion_date),
            "Status": project.status || "Ongoing",
            "Physical Progress (%)": project.physical_progress ?? 0,
            "Financial Progress (%)": project.financial_progress ?? 0,
            "Overall Progress (%)": project.overall_progress ?? 0,
          };
        }
      });

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((fieldName) => {
              const value = row[fieldName];
              const str = value === null || value === undefined ? "" : String(value);
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Project_List_Export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      dispatch(showSnackbar({
        message: `Exported ${allProjects.length} projects`,
        type: "success",
      }));
    } catch (error) {
      dispatch(showSnackbar({
        message: "Failed to export projects",
        type: "error",
      }));
    } finally {
      setRefreshing(false);
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-8"
    >
      <LoadingModal isVisible={showLoading} />

      {showTaskPicker && selectedTask && (
        <TaskPicker
          project={selectedTask.project}
          activity={selectedTask.activity}
          subActivity={selectedTask.subActivity}
          onClose={() => {
            setShowTaskPicker(false);
            setSelectedTask(null);
          }}
        />
      )}
      {/* Time Log Modal */}
      <AnimatePresence>
        {showTimeLogModal && selectedTaskfortimelog && (
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
                <p className="font-medium text-gray-800">{selectedTaskfortimelog.subactivity_name}</p>
                <p className="text-sm text-gray-500">{selectedTaskfortimelog.project_name}</p>
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                {console.log(timeLogData.date, "timeLogData.date")}
                <input
                  type="date"
                  value={timeLogData.date}
                  min={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                  onChange={(e) => setTimeLogData({ ...timeLogData, date: e.target.value })}
                  max={
                    maxSelectableDate ||
                    (() => {
                      const d = new Date();
                      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    })()
                  }
                  disabled={dateTampered || checkingClock}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {dateTampered && (
                <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-600 text-sm font-medium">
                    Your device's date/time appears incorrect. Please correct your system date to continue.
                  </p>
                </div>
              )}

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
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
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
                    {TIME_OPTIONS.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
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
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Work Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={timeLogData.work_type || ""}
                  onChange={(e) =>
                    setTimeLogData({ ...timeLogData, work_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select work type</option>
                  {/* You need to get the current project's sector_detail.stage_work_types */}
                  {(() => {
                    const workTypes = selectedTaskfortimelog.stage_work_types || [];
                    if (workTypes.length > 0) {
                      return workTypes.map((workType) => (
                        <option key={workType.id} value={workType.id}>
                          {workType.name}
                        </option>
                      ));
                    } else {
                      return <option value="" disabled>No work types available for this sector</option>;
                    }
                  })()}
                </select>
              </div>
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
                    checkingClock ||
                    dateTampered ||
                    !timeLogData.startTime ||
                    !timeLogData.endTime ||
                    timeLogData.endTime <= timeLogData.startTime
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Submit Document */}
      <AnimatePresence>
        {showProofModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowProofModal(false);
              setProofData({
                stage_type: "",
                documents: [],
                rejection_proof: [],
                rejection_reason: "",
                rejection_type: "",
                subactivity: "",
                to_status: "",
                changed_by: user?.emp_code || "",
                remarks: "",
                document_type: "ref_doc",
                client_remarks: "",
                raised_amount: "",
                received_amount: "",
                extra_amount: "",
              });
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  📎{" "}
                  {proofData?.to_status === "Raised"
                    ? "Raised Work Proof"
                    : proofData?.to_status === "Received"
                      ? "Received Work Proof"
                      : "Submit Work Proof"}
                </h3>
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofData({
                      stage_type: "",
                      documents: [],
                      rejection_proof: [],
                      rejection_reason: "",
                      rejection_type: "",
                      subactivity: "",
                      to_status: "",
                      changed_by: user?.emp_code || "",
                      remarks: "",
                      document_type: "ref_doc",
                      client_remarks: "",
                      received_amount: "",
                      raised_amount: "",
                      extra_amount: "",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* UPLOAD AREA */}
              <div className="mb-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Upload Documents{" "}
                  {proofData?.to_status === "Raised" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
              </div>
              <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-blue-400 transition">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setProofData({
                      ...proofData,
                      documents: [...proofData.documents, ...Array.from(e.target.files)],
                    })
                  }
                />
                <p className="text-sm text-gray-500">
                  <span className="text-blue-600 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF, DOC</p>
              </label>

              {/* FILE PREVIEW GRID */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {proofData?.documents?.map((file, i) => {
                  const isImage = file.type.startsWith("image/");
                  const url = URL.createObjectURL(file);

                  return (
                    <div
                      key={i}
                      className="relative border rounded-lg overflow-hidden group"
                    >
                      {isImage ? (
                        <img
                          src={url}
                          alt="preview"
                          className="w-full h-24 object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center p-2 text-center bg-gray-100 text-xs text-gray-600 h-full">
                          📄 {file.name}
                        </div>
                      )}

                      {/* REMOVE BUTTON */}
                      <button
                        onClick={() =>
                          setProofData({
                            ...proofData,
                            documents: proofData.documents.filter(
                              (_, index) => index !== i
                            ),
                          })
                        }
                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* MESSAGE */}
              {proofData.to_status !== "Rejected" && (
                <div className="mt-5">
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Message{" "}
                    {proofData?.to_status === "Raised" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <textarea
                    value={proofData.remarks}
                    onChange={(e) =>
                      setProofData({ ...proofData, remarks: e.target.value })
                    }
                    placeholder="Describe your proof..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* REJECTION FIELDS */}
              {proofData.to_status === "Rejected" && (
                <>
                  <div className="mt-5">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Rejection Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={proofData.rejection_type || ""}
                      onChange={(e) =>
                        setProofData({ ...proofData, rejection_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="" disabled>
                        Select Rejection Type
                      </option>
                      <option value="Quality Issue">Quality Issue</option>
                      <option value="Incomplete Work">Incomplete Work</option>
                      <option value="Client Requirement Mismatch">
                        Client Requirement Mismatch
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={proofData.rejection_reason || ""}
                      onChange={(e) =>
                        setProofData({ ...proofData, rejection_reason: e.target.value })
                      }
                      placeholder="Enter reason for rejection..."
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Rejection Proof
                    </label>
                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-red-400 transition">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          setProofData({
                            ...proofData,
                            rejection_proof: [
                              ...(proofData.rejection_proof || []),
                              ...Array.from(e.target.files),
                            ],
                          })
                        }
                      />
                      <p className="text-sm text-gray-500">
                        <span className="text-red-600 font-medium">
                          browse rejection proofs
                        </span>
                      </p>
                    </label>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {proofData?.rejection_proof?.map((file, i) => {
                        const isImage = file.type.startsWith("image/");
                        const url = URL.createObjectURL(file);

                        return (
                          <div
                            key={i}
                            className="relative border rounded-lg overflow-hidden group"
                          >
                            {isImage ? (
                              <img
                                src={url}
                                alt="preview"
                                className="w-full h-24 object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center p-2 text-center bg-gray-100 text-xs text-gray-600 h-full">
                                📄 {file.name}
                              </div>
                            )}

                            <button
                              onClick={() =>
                                setProofData({
                                  ...proofData,
                                  rejection_proof: proofData.rejection_proof.filter(
                                    (_, index) => index !== i
                                  ),
                                })
                              }
                              className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-5 relative">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  {proofData?.to_status === "Raised"
                    ? "Raised Amount"
                    : "Received Amount"}
                </label>
                <input
                  type="number"
                  value={
                    proofData?.to_status === "Raised"
                      ? proofData.raised_amount
                      : proofData.received_amount
                  }
                  onChange={(e) =>
                    setProofData({
                      ...proofData,
                      [proofData?.to_status === "Raised"
                        ? "raised_amount"
                        : "received_amount"]: e.target.value,
                    })
                  }
                  placeholder={`Enter the ${proofData?.to_status === "Raised" ? "raised" : "received"
                    } amount...`}
                  className="w-full px-3 py-2 pr-14 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />

                <span className="absolute right-3 top-9 text-xs text-gray-400">
                  LAKH
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowProofModal(false);
                    setProofData({
                      stage_type: "",
                      documents: [],
                      rejection_proof: [],
                      rejection_reason: "",
                      rejection_type: "",
                      subactivity: "",
                      to_status: "",
                      changed_by: user?.emp_code || "",
                      remarks: "",
                      document_type: "ref_doc",
                      client_remarks: "",
                      raised_amount: "",
                      received_amount: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmitProof}
                  disabled={
                    loder ||
                    !proofData?.documents?.length ||
                    (proofData?.to_status === "Raised" && !proofData?.remarks?.trim())
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loder ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show Document */}
      <AnimatePresence>
        {viewdocumentmodel.model && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setViewDocumentModel({ model: false, data: [] })}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border scroll"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  📄 {viewdocumentmodel?.title || "Proof Details"}
                </h3>
                <button
                  onClick={() => setViewDocumentModel({ model: false, data: [] })}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto pr-2 py-4 space-y-5">

                {viewdocumentmodel?.data?.map((item, index) => {
                  const isReceived = item?.to_status === "Received";

                  return (
                    <div
                      key={index}
                      className={`overflow-hidden relative rounded-xl p-5 bg-white border transition-all duration-300 
        hover:shadow-lg hover:-translate-y-[2px]
        ${isReceived ? "border-green-200" : "border-blue-200"}`}
                    >

                      {/* LEFT STATUS STRIP */}
                      <div
                        className={`absolute left-[0px] top-0 h-full w-1 rounded-l-2xl 
          ${isReceived ? "bg-green-500" : "bg-blue-500"}`}
                      />

                      {/* HEADER */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            Document #{index + 1}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(
                              item?.created_at
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm
            ${isReceived
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"}`}
                        >
                          {item?.to_status}
                        </span>
                      </div>

                      {/* STATUS FLOW */}
                      <div className="flex items-center gap-2 text-xs mb-4">
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                          {item?.from_status}
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600">
                          {item?.to_status}
                        </span>
                      </div>

                      {/* GRID CONTENT */}
                      <div className="grid grid-cols-2 gap-4">

                        {/* LEFT SIDE */}
                        <div className="space-y-3">

                          {/* USER */}
                          {item?.changed_by && (
                            <div>
                              <p className="text-xs text-gray-400">Action By</p>
                              <p className="text-sm font-medium text-gray-700">
                                {item.changed_by}
                              </p>
                            </div>
                          )}

                          {/* MESSAGE */}
                          <div>
                            <p className="text-xs text-gray-400">Message</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {item?.remarks || "—"}
                            </p>
                          </div>

                          {/* AMOUNT */}
                          {(item?.raised_amount != null ||
                            item?.received_amount != null) && (
                              <div>
                                <p className="text-xs text-gray-400">
                                  {isReceived ? "Received Amount" : "Raised Amount"}
                                </p>

                                <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg mt-1">
                                  <span className="text-lg font-semibold text-gray-800">
                                    ₹{" "}
                                    {isReceived
                                      ? item?.received_amount || 0
                                      : item?.raised_amount || 0}
                                  </span>
                                  <span className="text-xs text-gray-400">LAKH</span>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* RIGHT SIDE - DOCUMENTS */}
                        <div>
                          <p className="text-xs text-gray-400 mb-2">Documents</p>

                          <div className="grid grid-cols-2 gap-2">
                            {item?.documents?.map((doc) => {
                              const isImage = doc.document.match(/\.(jpg|jpeg|png)$/i);

                              return (
                                <a
                                  key={doc.id}
                                  href={doc.document}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group border rounded-lg overflow-hidden bg-gray-50 hover:shadow transition"
                                >
                                  {isImage ? (
                                    <img
                                      src={doc.document}
                                      alt=""
                                      className="w-full h-20 object-cover group-hover:scale-105 transition"
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-500 text-lg">
                                      📄
                                    </div>
                                  )}

                                  <div className="text-[10px] text-gray-400 px-1 py-1 truncate">
                                    {doc.document.split("/").pop()}
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                      {/* FOOTER DATE */}
                      <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex justify-between">
                        <span>
                          {new Date(
                            item?.received_at ||
                            item?.raised_at ||
                            item?.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                    </div>
                  );
                })}

              </div>


              {/* ACTION */}
              <div className="flex mt-6">
                <button
                  onClick={() => setViewDocumentModel({ model: false, data: [] })}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-Activity Details Modal */}
      <AnimatePresence>
        {showSubActivityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowSubActivityModal(false);
              setSubActivityModalData(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl border flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-5 pb-4 border-b">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Eye size={20} className="text-blue-500" />
                    Sub-Activity Details
                  </h3>
                  {subActivityModalData && (
                    <p className="text-sm text-gray-500 mt-1">
                      {subActivityModalData.subactivity_name} • Status:{" "}
                      <span className="font-semibold text-blue-600">
                        {subActivityModalData.status}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowSubActivityModal(false);
                    setSubActivityModalData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                {loadingSubActivity ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-500">Fetching activity data...</p>
                  </div>
                ) : subActivityModalData ? (
                  <div className="space-y-6">
                    {/* Overall Summary */}
                    <div className="bg-blue-50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                          Total Time Spent
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          {formatDuration(
                            subActivityModalData.work_summary?.total_hours || "00:00:00"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                          Total Cycles
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                          {subActivityModalData.cycles?.length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Work Cycles */}
                    <div className="space-y-5">
                      <h4 className="text-lg font-semibold text-gray-800 border-b pb-2">
                        Work Cycles & Stages
                      </h4>

                      {subActivityModalData.cycles?.map((cycle, cycleIdx) => (
                        <div
                          key={cycleIdx}
                          className="bg-white border rounded-xl shadow-sm overflow-hidden"
                        >
                          {/* Cycle Header */}
                          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b flex justify-between items-center">
                            <h5 className="font-bold text-gray-700 flex items-center gap-2">
                              <RefreshCw
                                size={16}
                                className={
                                  cycle.cycle_number === 0
                                    ? "text-green-500"
                                    : "text-orange-500"
                                }
                              />
                              {cycle.cycle_name}
                              {cycle.cycle_number > 0 && cycle.rejection_details && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                  Rework
                                </span>
                              )}
                            </h5>
                            {cycle.cycle_total_time && (
                              <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600 shadow-sm">
                                Total: {formatDuration(cycle.cycle_total_time)}
                              </span>
                            )}
                          </div>

                          {/* Rejection Details (if any) */}
                          {cycle.rejection_details && (
                            <div className="bg-red-50 p-4 border-b border-red-100">
                              <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-1">
                                <XCircle size={16} /> Rejection Details
                              </p>
                              <p className="text-sm text-red-600">
                                <span className="font-semibold">Reason:</span>{" "}
                                {cycle.rejection_details.reason}
                              </p>
                              <p className="text-xs text-red-500 mt-1">
                                Rejected by {cycle.rejection_details.rejected_by} on{" "}
                                {new Date(cycle.rejection_details.rejected_at).toLocaleString("en-IN")}
                              </p>
                            </div>
                          )}

                          {/* Stages within Cycle */}
                          <div className="divide-y divide-gray-100">
                            {cycle.stages?.map((stage, stageIdx) => {
                              // Find current work status (the one with logs)
                              const currentWorkStatus = stage.work_status_logs?.find(
                                (status) => status.total_time_spent !== "00:00:00" && status.logs?.length > 0
                              );

                              // Get all statuses that have logs
                              const statusesWithLogs = stage.work_status_logs?.filter(
                                (status) => status.logs?.length > 0
                              ) || [];

                              // If no logs at all for this stage, skip rendering
                              if (statusesWithLogs.length === 0 && (!currentWorkStatus || currentWorkStatus.logs?.length === 0)) {
                                return null;
                              }

                              return (
                                <div key={stage.stage_id || stageIdx} className="p-4">
                                  {/* Stage Header */}
                                  <div className="flex justify-between items-center mb-4">
                                    <div>
                                      <h6 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                          Stage
                                        </span>
                                        {stage.stage_name}
                                      </h6>
                                      {stage.sorting_var !== undefined && (
                                        <p className="text-xs text-gray-400 mt-1">
                                          Order: {stage.sorting_var}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                      Total: {formatDuration(stage.total_time_spent || "00:00:00")}
                                    </span>
                                  </div>

                                  {/* Status-wise logs for this stage */}
                                  <div className="space-y-4">
                                    {statusesWithLogs.map((statusLog, statusIdx) => {
                                      // Get status color
                                      const getStatusColor = (status) => {
                                        switch (status) {
                                          case "Inprogress":
                                            return "bg-yellow-100 text-yellow-700 border-yellow-200";
                                          case "Submitted":
                                            return "bg-green-100 text-green-700 border-green-200";
                                          case "Rejected":
                                            return "bg-red-100 text-red-700 border-red-200";
                                          case "Approved":
                                            return "bg-blue-100 text-blue-700 border-blue-200";
                                          case "Completed":
                                            return "bg-purple-100 text-purple-700 border-purple-200";
                                          default:
                                            return "bg-gray-100 text-gray-600 border-gray-200";
                                        }
                                      };

                                      return (
                                        <div key={statusIdx} className="ml-4">
                                          {/* Status Badge */}
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                              <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(statusLog.work_status)}`}>
                                                {statusLog.work_status}
                                              </div>
                                              {statusLog.total_time_spent !== "00:00:00" && (
                                                <span className="text-xs text-gray-500">
                                                  ({formatDuration(statusLog.total_time_spent)})
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Logs for this status */}
                                          {statusLog.logs?.length > 0 ? (
                                            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                                              {statusLog.logs.map((log, logIdx) => (
                                                <div
                                                  key={logIdx}
                                                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow"
                                                >
                                                  <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                      {/* User Info */}
                                                      <div className="flex items-center gap-2 mb-2">
                                                        {log.user_name && (
                                                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                            👤 {log.user_name}
                                                          </span>
                                                        )}
                                                        {log.work_type && (
                                                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                                            📋 {log.work_type}
                                                          </span>
                                                        )}
                                                        {log.date && (
                                                          <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {new Date(log.date).toLocaleDateString("en-IN")}
                                                          </span>
                                                        )}
                                                      </div>

                                                      {/* Description */}
                                                      <p className="text-sm text-gray-700 leading-relaxed">
                                                        {log.description || (
                                                          <span className="italic text-gray-400">No description</span>
                                                        )}
                                                      </p>

                                                      {/* Time Range if available */}
                                                      {/* {(log.start_time || log.end_time) && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                          ⏱️ {log.start_time ? new Date(log.start_time).toLocaleTimeString() : "N/A"}
                                                          {log.end_time && ` → ${new Date(log.end_time).toLocaleTimeString()}`}
                                                        </p>
                                                      )} */}
                                                      {(log.start_time || log.end_time) && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                          ⏱️ {log.start_time ? new Date(log.start_time).toLocaleTimeString(undefined, { timeZone: 'UTC' }) : "N/A"}
                                                          {log.end_time && ` → ${new Date(log.end_time).toLocaleTimeString(undefined, { timeZone: 'UTC' })}`}
                                                        </p>
                                                      )}
                                                    </div>

                                                    {/* Time Spent */}
                                                    <div className="text-right">
                                                      <span className="text-sm font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">
                                                        {formatDuration(log.time_spent)}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="pl-4 text-center text-sm text-gray-400 py-2">
                                              No logs for {statusLog.work_status} status
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {/* If no stages have logs */}
                            {(!cycle.stages || cycle.stages.filter(s =>
                              s.work_status_logs?.some(w => w.logs?.length > 0)
                            ).length === 0) && (
                                <div className="p-8 text-center text-sm text-gray-400">
                                  No work logs recorded for this cycle
                                </div>
                              )}
                          </div>
                        </div>
                      ))}

                      {(!subActivityModalData.cycles || subActivityModalData.cycles.length === 0) && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                          <AlertCircle size={40} className="mx-auto mb-3 text-gray-300" />
                          <p>No work cycles found for this activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <AlertCircle size={40} className="mb-4 text-gray-300" />
                    <p>Failed to load data or data is empty.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showLoading && (
        <>

          <div className="mb-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent pb-1 md:pb-2"
                >
                  {isAdmin ? "Project Portfolio" : "AVAILABLE PROJECTS"}
                </motion.h1>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isACCOUNT
                    ? "bg-purple-100 text-purple-600"
                    : isAdmin
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                    }`}
                >
                  {getRoleIcon()}
                  {getRoleDisplay()}
                </motion.div>
              </div>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 text-lg"
              >
                {isAdmin
                  ? "Track and manage all your construction projects in one place"
                  : "Browse projects and pick tasks to work on"}
              </motion.p>
            </div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleRefresh}
              disabled={showLoading}
              className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
            >
              <RefreshCw
                size={20}
                className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-medium text-gray-700">Refresh</span>
            </motion.button>
          </div>


          {/* Stats Cards - Removed Critical/Delayed for user, only shown to Admin */}

          {/* Stats Cards - Only shown to Admin */}
          {isAdmin && (totalCount > 0 || projectsOnly.length > 0) && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8"
            >
              {/* Total Projects - Primary/Overview */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <FolderOpen size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.total}</p>
                <p className="text-sm opacity-90">Total Projects</p>
              </motion.div>

              {/* Not Started - Neutral/Waiting */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <Clock size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.notStarted}</p>
                <p className="text-sm opacity-90">Not Started</p>
              </motion.div>

              {/* In Progress - Active/Working */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <TrendingUp size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.ongoing}</p>
                <p className="text-sm opacity-90">In Progress</p>
              </motion.div>

              {/* Completed - Success/Green */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <CheckCircle2 size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.completed}</p>
                <p className="text-sm opacity-90">Completed</p>
              </motion.div>

              {/* <hr /> */}

              {/* Critical - Warning/Urgent */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <AlertCircle size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.critical}</p>
                <p className="text-sm opacity-90">Critical</p>
              </motion.div>

              {/* Delayed - Danger/Blocked */}
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <XCircle size={24} className="mb-2 opacity-80" />
                <p className="text-3xl font-bold">{ProjectListStats.delayed}</p>
                <p className="text-sm opacity-90">Delayed</p>
              </motion.div>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by project code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* 🟢 NEW Filter for Detail Design & DPR */}
              <div className="relative">
                <select
                  value={filterProjectType}
                  onChange={(e) => {
                    setFilterProjectType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                >
                  <option value="all">All Types</option>
                  <option value="detail design">Detail Design</option>
                  <option value="dpr">DPR</option>
                  <option value="prebid">Prebid</option>
                </select>
                <Filter
                  className="absolute right-3 top-3 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3">
                  {/* Excel Download Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadExcel}
                    className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <DownloadCloudIcon size={20} className="text-green-600" />
                    Export
                  </motion.button>

                  {/* New Project Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/project/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Plus size={20} />
                    New Project
                  </motion.button>
                </div>
              )}
            </div>

            {isUser && (
              <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl">
                <UserCheck size={18} />
                <span>
                  You're browsing as <strong>{user?.name}</strong> (Employee).
                </span>
              </div>
            )}
          </motion.div>



          {/* ========================================== */}
          {/* 🟢 NEW: PROJECT CODE COUNTS TABLE UI       */}
          {/* ========================================== */}
          {projectCodeCounts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Hash size={18} className="text-blue-600" />
                  Project Code Distribution
                </h4>
              </div>

              <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-6 pt-0 mt-4">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 bg-gray-100 text-gray-600 uppercase text-xs font-bold shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg border-b border-gray-200">Project Code</th>
                      <th className="px-4 py-3 rounded-tr-lg border-b border-gray-200 text-center w-40">Total Projects</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projectCodeCounts.map(([code, count]) => (
                      <tr key={code} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                          <Hash size={14} className="text-gray-400" />
                          {code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                            {count}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          {/* ========================================== */}

          <AnimatePresence>
            {filteredProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100"
              >
                <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
                <p className="text-2xl font-semibold text-gray-700 mb-2">
                  No projects found
                </p>
                {isAdmin && (
                  <button
                    onClick={() => navigate("/project/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all inline-flex items-center gap-2 text-lg"
                  >
                    <Plus size={24} /> Create New Project
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6"
              >
                {filteredProjects.map((project) => {
                  const projectId = getProjectId(project);
                  const projectName = getProjectName(project);
                  const projectCode = getProjectCode(project);
                  const completionDate = getCompletionDate(project);
                  const actualCompletionDate = getActualCompletionDate(project);
                  const progress = getProgress(project);
                  const location = getLocation(project);
                  const daysLeft = getDaysUntilDeadline(completionDate);
                  const activities = getActivities(project);
                  const isCompleted = progress === 100;
                  // const weightedProgress = getWeightedProgress(project);
                  const weightedProgress = project.overall_progress || 0;
                  const physicalProgress = project.physical_progress || 0;
                  const financialProgress = project.financial_progress || 0;
                  const statusInfo = getProjectStatusInfo({
                    // status: project.status || "ONGOING",
                    completionDate: completionDate,
                    progress: project.overall_progress,
                  });
                  const isExpanded = expandedCard === projectId;

                  return (
                    <motion.div
                      id={`project-card-${projectId}`}
                      key={projectId}
                      variants={itemVariants}
                      layout
                      className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 transition-all duration-300 relative group
                        ${isCompleted
                          ? "border-green-200 hover:border-green-300"
                          : statusInfo.status === "DELAYED"
                            ? "border-red-200 hover:border-red-300"
                            : statusInfo.status === "DUE_TODAY"
                              ? "border-orange-200 hover:border-orange-300"
                              : statusInfo.status === "CRITICAL"
                                ? "border-yellow-200 hover:border-yellow-300"
                                : "border-gray-100 hover:border-blue-200"
                        }`}
                    >

                      <div
                        className="p-6 cursor-pointer"
                        // onClick={() =>
                        //   setExpandedCard(isExpanded ? null : projectId)
                        // }
                        onClick={() => {
                          const newExpandedState = isExpanded ? null : projectId;
                          setExpandedCard(newExpandedState);
                          if (!isExpanded) {
                            fetchProjectDetailsIfNeeded(projectId);
                          }
                        }}
                      >
                        {/* <div className="p-6 cursor-pointer" > */}
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                          {/* LEFT SECTION */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                              <h3 className="text-lg md:text-lg font-semibold text-gray-800  flex items-center gap-2 w-full" title={projectName}>
                                {projectName.length > 200 ? `${projectName.substring(0, 200)}...` : projectName}
                              </h3>
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1
                                  ${isCompleted
                                    ? "bg-green-100 text-green-700"
                                    : `${statusInfo.colors.bg} ${statusInfo.colors.text}`
                                  }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle size={14} />
                                ) : (
                                  statusInfo.icon
                                )}
                                {isCompleted ? "Completed" : statusInfo.label}
                              </motion.span>

                              {/* Code */}
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.colors.bg} ${statusInfo.colors.text}`}
                              >
                                <Hash size={12} />
                                {projectCode}
                              </motion.span>

                              {/* 🔹 Location */}
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.colors.bg} ${statusInfo.colors.text}`}
                              >
                                <MapPin size={14} />
                                <span className="text-sm">{location}</span>
                              </motion.span>
                            </div>

                            {/* 🔹 Key Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <Calendar
                                    size={16}
                                    className="text-blue-600"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Start</p>
                                  <p className="text-sm font-semibold">
                                    {formatDate(getLoaDate(project))}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div
                                  className={`p-2 rounded-lg ${isCompleted
                                    ? "bg-green-50"
                                    : daysLeft < 0
                                      ? "bg-red-50"
                                      : daysLeft <= 2
                                        ? "bg-orange-50"
                                        : "bg-green-50"
                                    }`}
                                >
                                  <Clock
                                    size={16}
                                    className={
                                      isCompleted
                                        ? "text-green-600"
                                        : daysLeft < 0
                                          ? "text-red-600"
                                          : "text-green-600"
                                    }
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    {isCompleted ? "Completed" : "Deadline"}
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {isCompleted
                                      ? formatDate(actualCompletionDate)
                                      : formatDate(completionDate)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                  <TrendingUp
                                    size={16}
                                    className="text-purple-600"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Status
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {progress === 100
                                      ? "Completed"
                                      : progress > 0
                                        ? "Ongoing"
                                        : "Pending"}
                                  </p>
                                </div>
                              </div>


                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                  <UserStar
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Client
                                  </p>
                                  <p className="text-sm font-semibold">
                                    {project?.client_detail?.client_name ||
                                      getClientName(project)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                  <UserCog
                                    size={16}
                                    className="text-indigo-600"
                                  />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Assigned To
                                  </p>

                                  <p className="text-sm font-semibold">
                                    {project?.assigned_to?.length > 0 ? (() => {
                                      const assigned = project.assigned_to;
                                      const count = assigned.length;

                                      // Tooltip content (full list)
                                      const tooltipContent = (
                                        <div className="bg-white shadow-lg rounded-md p-2 text-xs text-gray-700">
                                          {assigned.map((name, i) => (
                                            <p key={i}>{name}</p>
                                          ))}
                                        </div>
                                      );

                                      // Case 1: Only 1
                                      if (count === 1) {
                                        return assigned[0];
                                      }

                                      // Case 2: 2 users → show both
                                      if (count === 2) {
                                        return assigned.join(", ");
                                      }

                                      // Case 3: More than 2
                                      return (
                                        <CustomTooltip tooltipContent={tooltipContent}>
                                          <span>
                                            {assigned[0]}, {assigned[1]}{" "}
                                            <span className="text-blue-600">
                                              and {count - 2} more
                                            </span>
                                          </span>
                                        </CustomTooltip>
                                      );
                                    })() : (
                                      "Not Assigned"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>



                          <div className="flex flex-row items-center justify-center gap-2">



                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCard(isExpanded ? null : projectId);
                                if (!isExpanded) {
                                  fetchProjectDetailsIfNeeded(projectId);
                                }
                              }}
                              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp size={20} />
                              ) : (
                                <ChevronDown size={20} />
                              )}
                            </button>


                            {isAdmin && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Toggle dropdown
                                    const dropdown = document.getElementById(`project-menu-${projectId}`);
                                    if (dropdown) {
                                      dropdown.classList.toggle("hidden");
                                    }
                                  }}
                                  // className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-lg transition-all hover:scale-110"
                                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                  title="More options"
                                >
                                  <EllipsisVertical size={20} />
                                </button>

                                <div
                                  id={`project-menu-${projectId}`}
                                  className="hidden absolute right-0 mt-2 w-50 bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden"
                                >
                                  <div className="py-1">
                                    {project?.workorder_document && (
                                      <a
                                        href={project?.workorder_document}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-150"
                                      >
                                        <DownloadCloudIcon size={16} />
                                        <span>Workorder Document</span>
                                      </a>
                                    )}

                                    <button
                                      onClick={() => {
                                        handleEditProject(projectId);
                                      }}
                                      className="flex items-center gap-3 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 w-full"
                                    >
                                      <Pencil size={16} />
                                      <span>Edit Project</span>
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        // Close menu
                                        document.getElementById(`project-menu-${projectId}`)?.classList.add("hidden");
                                        handleDeleteProject(projectId, projectName, e);
                                      }}
                                      disabled={deleteInProgress}
                                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Trash2 size={16} />
                                      <span>Delete Project</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}



                          </div>
                        </div>
                        {/* 🔥 Progress Section */}

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

                          {/* Physical Progress */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Physical Progress
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {physicalProgress}%
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${physicalProgress}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-3 rounded-full bg-green-500"
                              />
                            </div>
                          </div>

                          {/* Financial Progress */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600">
                                Financial Progress
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {financialProgress}%
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${financialProgress}%` }}
                                transition={{ duration: 0.8 }}
                                className="h-3 rounded-full bg-blue-500"
                              />
                            </div>
                          </div>

                        </div>



                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-6 pt-6 border-t border-gray-100 overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Key Metrics Dashboard */}
                              {!isUser && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Total Length
                                    </p>
                                    <p className="text-xl font-bold text-blue-700">
                                      {getTotalLength(project)}{" "}
                                      <span className="text-sm font-normal">
                                        {getSectorUnit(project)}
                                      </span>
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Workorder Amount
                                    </p>
                                    <p className="text-xl font-bold text-green-700">
                                      ₹{getCost(project)}{" "}
                                      <span className="text-sm font-normal">
                                        Lakhs
                                      </span>
                                    </p>
                                  </div>

                                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                      GST Amount
                                    </p>
                                    <p className="text-xl font-bold text-orange-700">
                                      ₹{calculateGSTAmount(project)}{" "}
                                      <span className="text-sm font-normal">
                                        Lakhs
                                      </span>
                                    </p>
                                  </div>
                                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Total with GST
                                    </p>
                                    <p className="text-xl font-bold text-teal-700">
                                      ₹{calculateTotalWithGST(project)}{" "}
                                      <span className="text-sm font-normal">
                                        Lakhs
                                      </span>
                                    </p>
                                  </div>

                                </div>
                              )}

                              {/* Two Column Layout for Details */}
                              <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {/* Left Column - Basic Information */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                  <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                    <Building2
                                      size={18}
                                      className="text-blue-600"
                                    />
                                    Basic Information
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Project Code :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {projectCode}
                                      </span>
                                    </div>
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Short Name :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {project.short_name ||
                                          project.shortName ||
                                          "—"}
                                      </span>
                                    </div>
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Location :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {location}
                                      </span>
                                    </div>
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Our Company :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {getCompanyName(project)}
                                      </span>
                                    </div>
                                    {project.gst_no && (
                                      <div className="flex items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500 w-40">
                                          Company GST :
                                        </span>
                                        <span className="text-sm font-medium text-gray-800 font-mono">
                                          {project.gst_no}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Sector :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {getSectorName(project)}
                                      </span>
                                    </div>
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Client :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {project?.client_detail?.client_name ||
                                          getClientName(project)}
                                      </span>
                                    </div>

                                    {project.clientbranch &&
                                      (() => {
                                        const matchedBranch = project.client_detail?.branches
                                        return (
                                          <>
                                            <div className="flex items-center py-2 border-b border-gray-200">
                                              <span className="text-sm text-gray-500 w-40">
                                                Branch :
                                              </span>
                                              <span className="text-sm font-medium text-gray-800">
                                                {matchedBranch?.name?.trim() || ""}{" "}-{" "}{matchedBranch?.state?.trim() || ""}
                                              </span>
                                            </div>

                                            {!isUser && (
                                              <div className="flex items-center py-2">
                                                <span className="text-sm text-gray-500 w-40">
                                                  Client GST :
                                                </span>
                                                <span className="text-sm font-medium text-gray-800">
                                                  {matchedBranch?.gst || "—"}
                                                </span>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                  </div>
                                </div>

                                {/* Right Column - Project Specifications & Dates */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                  <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                    <Calendar
                                      size={18}
                                      className="text-green-600"
                                    />
                                    Project Specifications & Dates
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center py-2 border-b border-gray-200">
                                      <span className="text-sm text-gray-500 w-40">
                                        Total Length :
                                      </span>
                                      <span className="text-sm font-medium text-gray-800">
                                        {getTotalLength(project)}{" "}
                                        {getSectorUnit(project)}
                                      </span>
                                    </div>
                                    {!isUser && (
                                      <div className="flex items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500 w-40">
                                          Workorder Amount :
                                        </span>
                                        <span className="text-sm font-medium text-gray-800">
                                          ₹{getCost(project)} Lakhs
                                        </span>
                                      </div>
                                    )}
                                    {project.igst_percentage && (
                                      <div className="flex items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500 w-40">
                                          GST Percentage :
                                        </span>
                                        <span className="text-sm font-medium text-gray-800">
                                          {project.igst_percentage}%
                                        </span>
                                      </div>
                                    )}
                                    {project.cgst_percentage && (
                                      <div className="flex items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500 w-40">
                                          CGST Percentage :
                                        </span>
                                        <span className="text-sm font-medium text-gray-800">
                                          {project.cgst_percentage}%
                                        </span>
                                      </div>
                                    )}
                                    {!isUser && (
                                      <>
                                        <div className="flex items-center py-2 border-b border-gray-200">
                                          <span className="text-sm text-gray-500 w-40">
                                            LOA Date :
                                          </span>
                                          <span className="text-sm font-medium text-gray-800">
                                            {formatDate(getLoaDate(project))}
                                          </span>
                                        </div>
                                        <div className="flex items-center py-2 border-b border-gray-200">
                                          <span className="text-sm text-gray-500 w-40">
                                            Completion Date :
                                          </span>
                                          <span className="text-sm font-medium text-gray-800">
                                            {formatDate(completionDate)}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                    {isCompleted && actualCompletionDate && (
                                      <div className="flex items-center py-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-500 w-40">
                                          Actual Completion Date :
                                        </span>
                                        <span className="text-sm font-medium text-green-600">
                                          {formatDate(actualCompletionDate)}
                                        </span>
                                      </div>
                                    )}

                                    {!isCompleted && daysLeft !== undefined && (
                                      <div
                                        className={`flex items-center py-2 border-b border-gray-200 ${daysLeft < 0 ? "bg-red-50 -mx-2 px-2 rounded-lg" : daysLeft <= 2 ? "bg-orange-50 -mx-2 px-2 rounded-lg" : ""}`}
                                      >
                                        <span className="text-sm text-gray-500 w-40">
                                          Days Remaining :
                                        </span>
                                        <span
                                          className={`text-sm font-bold ${daysLeft < 0 ? "text-red-600" : daysLeft <= 2 ? "text-orange-600" : "text-green-600"}`}
                                        >
                                          {daysLeft < 0
                                            ? `Overdue by ${Math.abs(daysLeft)} days`
                                            : `${daysLeft} days left`}
                                        </span>
                                      </div>
                                    )}


                                  </div>
                                </div>
                              </div>

                              {/* GST Calculation Summary */}
                              {(project.igst_percentage ||
                                project.cgst_percentage) &&
                                getCost(project) > 0 && (
                                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
                                    <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                      <Percent
                                        size={18}
                                        className="text-blue-600"
                                      />
                                      GST Calculation Summary
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                          Workorder Amount
                                        </p>
                                        <p className="text-lg font-bold text-gray-800">
                                          ₹{getCost(project)} Lakhs
                                        </p>
                                      </div>
                                      {project.igst_percentage && (
                                        <div>
                                          <p className="text-xs text-gray-500 mb-1">
                                            GST ({project.igst_percentage}%)
                                          </p>
                                          <p className="text-lg font-bold text-blue-600">
                                            ₹
                                            {(
                                              (getCost(project) *
                                                project.igst_percentage) /
                                              100
                                            ).toFixed(2)}{" "}
                                            Lakhs
                                          </p>
                                        </div>
                                      )}
                                      <div>
                                        <p className="text-xs text-gray-500 mb-1">
                                          Total with GST
                                        </p>
                                        <p className="text-lg font-bold text-green-600">
                                          ₹
                                          {(
                                            getCost(project) +
                                            (getCost(project) *
                                              (project.igst_percentage || 0)) /
                                            100
                                          ).toFixed(2)}{" "}
                                          Lakhs
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Show loading indicator while fetching */}
                              {loadingProjectDetails[projectId] ? (
                                <div className="flex justify-center items-center py-12">
                                  <Loader2 size={32} className="animate-spin text-blue-600" />
                                  <span className="ml-3 text-gray-600">Loading project details...</span>
                                </div>
                              ) : (
                                <>
                                  {/* Use expandedProjectDetails[projectId] data if available, fallback to original project data */}
                                  {(() => {
                                    const projectData = expandedProjectDetails[projectId] || project;
                                    return (
                                      <>
                                        {/* Activities Section */}
                                        {projectData?.activities_detail?.length > 0 && (
                                          <div className="mt-6">
                                            <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                              <Briefcase
                                                size={18}
                                                className="text-blue-600"
                                              />
                                              Activities & Sub-Activities (
                                              {projectData?.activities_detail?.length})
                                            </h4>
                                            <div className="space-y-3 max-h-[900px] overflow-y-auto pr-2">
                                              {[...(projectData?.activities_detail || [])]
                                                // .sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0))
                                                .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0))
                                                .map((activity, actIndex) => {
                                                  // if (activity.activity_name == "Deliverable Item" && isUser) return null; // Skip rendering this activity
                                                  const subs = activity.subactivities || [];
                                                  const isActivityExpanded =
                                                    expandedActivities[activity.id];

                                                  const activityProgress = activity.activity_progress || 0
                                                  const financialProgress = activity.financial_progress || 0



                                                  const daysLeft = calculateDaysLeft(
                                                    activity?.end_date || activity.endDate,
                                                  );
                                                  return (
                                                    <div
                                                      id={`activity-${activity.id}`}
                                                      key={activity.id || actIndex}
                                                      className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                                                    >
                                                      <div
                                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                                        onClick={(e) =>
                                                          toggleActivity(activity.id, e)
                                                        }
                                                      >
                                                        <div className="flex-1">
                                                          <div className="flex items-center gap-3 flex-wrap">
                                                            <h5 className="font-semibold text-gray-800">
                                                              {activity.activity_name}
                                                            </h5>
                                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                                              Weightage:{" "}
                                                              {activity.weightage.toFixed(2) || 0}%
                                                            </span>
                                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                                              {subs.length} tasks
                                                            </span>

                                                            <span
                                                              className={`text-xs px-2 py-1 rounded-full ${activityProgress == 100 ? "bg-green-100 text-green-600" : daysLeft < 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
                                                            >
                                                              {activityProgress == 100
                                                                ? "Completed"
                                                                : daysLeft < 0
                                                                  ? "Delayed"
                                                                  : "Ongoing"}
                                                            </span>
                                                          </div>
                                                          <div className="mt-2">




                                                          </div>
                                                          {activity.start_date &&
                                                            activity.end_date && (
                                                              <p className="text-xs text-gray-400 mt-2">
                                                                {formatDate(
                                                                  activity.start_date,
                                                                )}{" "}
                                                                →{" "}
                                                                {formatDate(
                                                                  activity.end_date,
                                                                )}
                                                              </p>
                                                            )}
                                                        </div>
                                                        <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                                          {isActivityExpanded ? (
                                                            <ChevronUp size={18} />
                                                          ) : (
                                                            <ChevronDown size={18} />
                                                          )}
                                                        </button>
                                                      </div>

                                                      <AnimatePresence>
                                                        {isActivityExpanded && (
                                                          <motion.div
                                                            initial={{
                                                              height: 0,
                                                              opacity: 0,
                                                            }}
                                                            animate={{
                                                              height: "auto",
                                                              opacity: 1,
                                                            }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-gray-200"
                                                          >


                                                            <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
                                                              {/* Table wrapper with fixed height and scroll */}
                                                              <div className="max-h-[500px] overflow-y-auto relative">
                                                                <table className="w-full text-sm">

                                                                  {/* HEADER */}
                                                                  <thead className="sticky top-0 z-10 bg-gray-100 text-[10px] uppercase text-gray-600 shadow-sm">
                                                                    <tr>
                                                                      <th className="px-2 py-3"></th>
                                                                      <th className="px-2 py-3 text-left ">Sub Activity</th>
                                                                      <th className="px-2 py-3 text-center">Chainage</th>
                                                                      <th className="px-2 py-3 text-center">Qty</th>
                                                                      <th className="px-2 py-3 text-center">Area</th>

                                                                      {
                                                                        !isUser &&
                                                                        <>
                                                                          <th className="px-2 py-3 text-center">view</th>
                                                                          <th className="px-2 py-3 text-center">Stage</th>
                                                                          <th className="px-2 py-3 text-center">%</th>
                                                                          <th className="px-2 py-3 text-center">Amount ₹</th>
                                                                          <th className="px-2 py-3 text-center">Raised</th>
                                                                          <th className="px-2 py-3 text-center">Received</th>
                                                                          <th className="px-2 py-3 text-center">Remaining</th>

                                                                          <th className="px-2 py-3 text-center" title="Project Owner Status">PO Status</th>
                                                                          <th className="px-2 py-3 text-center">Invoice Status</th>
                                                                        </>
                                                                      }
                                                                      {
                                                                        isUser &&
                                                                        <>
                                                                          <th className="px-2 py-3 text-center">Stage</th>
                                                                          <th className="px-2 py-3 text-center" title="Project Owner Status">PO Status</th>


                                                                          <th className="px-2 py-3 text-center">Action</th>
                                                                        </>
                                                                      }
                                                                    </tr>
                                                                  </thead>

                                                                  {/* BODY */}
                                                                  <tbody>
                                                                    {/* {subs */}
                                                                    {[...(subs || [])]
                                                                      .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0))
                                                                      .map((sub, i) => {
                                                                        const changeStatus = sub.status || "Pending";

                                                                        return (
                                                                          <Fragment key={sub.id}>

                                                                            {isUser ? (
                                                                              // ==========================================
                                                                              // EMPLOYEE VIEW (Now with Stages)
                                                                              // ==========================================
                                                                              sub.stages && sub.stages.length > 0 ? (
                                                                                sub.stages.map((stage, sIdx) => {
                                                                                  const rowSpanCount = Math.max(1, sub.stages?.length || 0);
                                                                                  const workStatus = stage.work_status || "Pending";

                                                                                  return (
                                                                                    <Fragment key={stage.id}>
                                                                                      <tr
                                                                                        className="border-t text-[12px] bg-white hover:bg-gray-50 transition-colors"
                                                                                        onClick={() => {
                                                                                          if (sub.work_summary?.users?.length > 0) {
                                                                                            setExpandedRow(expandedRow === sub.id ? null : sub.id);
                                                                                          }
                                                                                        }}
                                                                                      >
                                                                                        {/* 🟢 Render Sub-Activity Parent Info ONLY on the FIRST stage row */}
                                                                                        {sIdx === 0 && (
                                                                                          <>
                                                                                            <td rowSpan={rowSpanCount} className="px-2 text-center align-middle border-r border-gray-100">
                                                                                              {sub.work_summary?.users?.length > 0 ? (
                                                                                                <motion.button
                                                                                                  onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setExpandedRow(expandedRow === sub.id ? null : sub.id);
                                                                                                  }}
                                                                                                  whileHover={{ scale: 1.1 }}
                                                                                                  whileTap={{ scale: 0.95 }}
                                                                                                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${expandedRow === sub.id
                                                                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                                                    }`}
                                                                                                  title={expandedRow === sub.id ? "Collapse" : "Expand"}
                                                                                                >
                                                                                                  {expandedRow === sub.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                                                </motion.button>
                                                                                              ) : (
                                                                                                <div className="w-6 h-6 opacity-0 pointer-events-none"></div>
                                                                                              )}
                                                                                            </td>
                                                                                            <td rowSpan={rowSpanCount} className="px-2 font-medium align-middle border-r border-gray-100">
                                                                                              {"Stage " + (sub.sorting_var || 0) + " - " + sub.subactivity_name}
                                                                                            </td>
                                                                                            <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                              {formatNumber(sub.chainage_start)}
                                                                                            </td>
                                                                                            <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                              {sub.total_quantity}
                                                                                            </td>
                                                                                            <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                              {formatNumber(sub.covered_area)}
                                                                                            </td>


                                                                                          </>
                                                                                        )}

                                                                                        {/* 🔵 EMPLOYEE STAGE COLUMNS */}
                                                                                        <td className="text-center font-semibold text-blue-600 border-gray-300 py-3">
                                                                                          {stage.name}
                                                                                        </td>

                                                                                        {/* Stage Status */}
                                                                                        <td className="text-center p-1">
                                                                                          <div className="relative inline-block py-2 !inline-flex items-center">
                                                                                            <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                                                             ${workStatus === "Inprogress"
                                                                                                ? "bg-yellow-100 text-yellow-600 border-yellow-600"
                                                                                                : workStatus === "Submitted"
                                                                                                  ? "bg-green-100 text-green-600 border-green-200"
                                                                                                  : workStatus === "Rejected"
                                                                                                    ? "bg-red-100 text-red-600 border-red-200"
                                                                                                    : workStatus === "Approved"
                                                                                                      ? "bg-green-100 text-green-600 border-green-200"
                                                                                                      : workStatus === "Completed"
                                                                                                        ? "bg-purple-100 text-purple-600 border-purple-200"
                                                                                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                                                                              }`}
                                                                                            >
                                                                                              {/* {workStatus === "Approved" ? "Submitted" : workStatus === "Pending" ? "Not Started" : workStatus} */}

                                                                                              {workStatus === "Pending" ? "Not Started" : workStatus}
                                                                                            </span>
                                                                                          </div>
                                                                                        </td>

                                                                                        {/* View Details Button */}


                                                                                        {/* Work Log Button (Now on each stage with stage.id) */}
                                                                                        <td className="text-center align-middle px-2 py-2 border-l border-gray-100">
                                                                                          <button
                                                                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 inline-flex items-center gap-1"
                                                                                            onClick={(e) => {
                                                                                              e.stopPropagation();
                                                                                              setSelectedTaskfortimelog({
                                                                                                id: sub.id,
                                                                                                stage: stage.id,  // ✅ ADDED stage_id
                                                                                                project_id: projectId,
                                                                                                subactivity_name: sub.subactivity_name,
                                                                                                stage_name: stage.name,  // ✅ ADDED stage_name for display
                                                                                                project_name: project.short_name || project.project_name,
                                                                                                stage_work_types: expandedProjectDetails[projectId]?.sector_detail?.stage_work_types || []
                                                                                              });
                                                                                              setTimeLogData({
                                                                                                date: new Date().toISOString().split("T")[0],
                                                                                                startTime: "",
                                                                                                endTime: "",
                                                                                                description: "",
                                                                                                work_type: ""
                                                                                              });
                                                                                              setShowTimeLogModal(true);
                                                                                            }}
                                                                                          >
                                                                                            <PlusCircle size={14} />
                                                                                            Work Log
                                                                                          </button>
                                                                                        </td>
                                                                                      </tr>


                                                                                    </Fragment>
                                                                                  );
                                                                                })
                                                                              ) : (
                                                                                /* Fallback row if no stages are recorded */
                                                                                <tr className="border-t text-[12px] bg-white">
                                                                                  <td className="px-2 text-center align-middle border-r border-gray-100">
                                                                                    <div className="w-6 h-6 opacity-0 pointer-events-none"></div>
                                                                                  </td>
                                                                                  <td className="px-2 font-medium align-middle border-r border-gray-100">
                                                                                    {"Stage " + (sub.sorting_var || 0) + " - " + sub.subactivity_name}
                                                                                  </td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">
                                                                                    {formatNumber(sub.chainage_start)}
                                                                                  </td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">
                                                                                    {sub.total_quantity}
                                                                                  </td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">
                                                                                    {formatNumber(sub.covered_area)}
                                                                                  </td>
                                                                                  <td colSpan="4" className="text-center text-gray-400 py-4 italic">
                                                                                    No work stages found for this sub-activity
                                                                                  </td>
                                                                                </tr>
                                                                              )
                                                                            ) : (
                                                                              // ==========================================
                                                                              // ADMIN / ACCOUNT VIEW (1 Row per Stage)
                                                                              // ==========================================
                                                                              sub.stages && sub.stages.length > 0 ? (
                                                                                sub.stages.map((stage, sIdx) => {
                                                                                  const rowSpanCount = Math.max(1, sub.stages?.length || 0);
                                                                                  const stageAmount = (((project?.workorder_cost || 0) * (parseFloat(stage.payment_percent) || 0)) / 100) * 1.18;
                                                                                  const stageRaised = (stage.payment_logs || [])
                                                                                    .filter(log => log.to_status === "Raised")
                                                                                    .reduce((sum, item) => sum + (parseFloat(item.raised_amount) || 0), 0);

                                                                                  const stageReceived = (stage.payment_logs || [])
                                                                                    .filter(log => log.to_status === "Received")
                                                                                    .reduce((sum, item) => sum + (parseFloat(item.received_amount) || 0), 0);

                                                                                  const stageRemaining = parseFloat(stageAmount) + parseFloat(stage.extra_payment_amount || 0) - stageReceived;
                                                                                  const workStatus = stage.work_status || "Pending";
                                                                                  const paymentStatus = stage.payment_status || "Waiting";

                                                                                  return (
                                                                                    <tr
                                                                                      key={stage.id}
                                                                                      className="border-t text-[12px] bg-white hover:bg-gray-50 transition-colors"
                                                                                      onClick={() => {
                                                                                        if (sub.work_summary?.users?.length > 0) {
                                                                                          setExpandedRow(expandedRow === sub.id ? null : sub.id);
                                                                                        }
                                                                                      }}
                                                                                    >
                                                                                      {/* 🟢 Render Sub-Activity Parent Info ONLY on the FIRST stage row */}
                                                                                      {sIdx === 0 && (
                                                                                        <>
                                                                                          <td rowSpan={rowSpanCount} className="px-2 text-center align-middle border-r border-gray-100">
                                                                                            {sub.work_summary?.users?.length > 0 ? (
                                                                                              <motion.button
                                                                                                onClick={(e) => {
                                                                                                  e.stopPropagation();
                                                                                                  setExpandedRow(expandedRow === sub.id ? null : sub.id);
                                                                                                }}
                                                                                                whileHover={{ scale: 1.1 }}
                                                                                                whileTap={{ scale: 0.95 }}
                                                                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${expandedRow === sub.id
                                                                                                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                                                  : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                                                  }`}
                                                                                                title={expandedRow === sub.id ? "Collapse" : "Expand"}
                                                                                              >
                                                                                                {expandedRow === sub.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                                              </motion.button>
                                                                                            ) : (
                                                                                              <div className="w-6 h-6 opacity-0 pointer-events-none"></div>
                                                                                            )}
                                                                                          </td>
                                                                                          <td rowSpan={rowSpanCount} className="px-2 font-medium align-middle border-r border-gray-100">
                                                                                            {"Stage " + (sub.sorting_var || 0) + " - " + sub.subactivity_name}
                                                                                          </td>
                                                                                          <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                            {formatNumber(sub.chainage_start)}
                                                                                          </td>
                                                                                          <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                            {sub.total_quantity}
                                                                                          </td>
                                                                                          <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                            {formatNumber(sub.covered_area)}
                                                                                          </td>


                                                                                          {/* 👁️ Eye Button Moved inside the sIdx === 0 check so it spans rows */}
                                                                                          <td rowSpan={rowSpanCount} className="text-center align-middle border-r border-gray-100">
                                                                                            <button
                                                                                              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full cursor-pointer hover:bg-blue-200 transition-colors"
                                                                                              onClick={(e) => handleViewSubActivity(sub.id, e)}
                                                                                              title="View Details"
                                                                                            >
                                                                                              <span className='flex flex-row items-center justify-center gap-1'>
                                                                                                <Eye size={16} />
                                                                                              </span>
                                                                                            </button>
                                                                                          </td>
                                                                                        </>
                                                                                      )}

                                                                                      {/* 🔵 ADMIN / ACCOUNT COLUMNS (Stage Specific) */}
                                                                                      <td className="text-center font-semibold text-blue-600 border-gray-300 py-3">{stage.name}</td>
                                                                                      <td className="text-center text-blue-600">{stage.payment_percent || 0}%</td>
                                                                                      <td className="text-center">₹ {stageAmount.toFixed(2)} L {stage.extra_payment_amount ? ` + ${stage.extra_payment_amount.toFixed(2)} L` : ''} </td>






                                                                                      {/* Raised */}
                                                                                      <td className="text-center">
                                                                                        {stageRaised.toFixed(2)} L
                                                                                        {stageRaised > 0 && (
                                                                                          <FileText
                                                                                            className="inline-block ml-1 -mt-1 text-red-500 cursor-pointer"
                                                                                            size={13}
                                                                                            title="View Raised Files"
                                                                                            onClick={(e) => {
                                                                                              e.stopPropagation();
                                                                                              setViewDocumentModel({
                                                                                                model: true,
                                                                                                data: (stage.payment_logs || []).filter((log) => log.to_status === "Raised"),
                                                                                                title: `${stage.name} - Raised Documents`
                                                                                              });
                                                                                            }}
                                                                                          />
                                                                                        )}
                                                                                      </td>

                                                                                      {/* Received */}
                                                                                      <td className="text-center">
                                                                                        {stageReceived === 0 && (stage.payment_logs || []).some(log => log.to_status === "Raised") ? (
                                                                                          getDaysStatus(
                                                                                            (stage.payment_logs || []).find(log => log.to_status === "Raised")?.created_at
                                                                                          )
                                                                                        ) : (
                                                                                          <>
                                                                                            {stageReceived.toFixed(2)} L
                                                                                            {stageReceived > 0 && (
                                                                                              <FileText
                                                                                                className="inline-block ml-1 -mt-1 text-red-500 cursor-pointer"
                                                                                                size={13}
                                                                                                title="View Received Files"
                                                                                                onClick={(e) => {
                                                                                                  e.stopPropagation();
                                                                                                  setViewDocumentModel({
                                                                                                    model: true,
                                                                                                    data: (stage.payment_logs || []).filter((log) => log.to_status === "Received"),
                                                                                                    title: `${stage.name} - Received Documents`
                                                                                                  });
                                                                                                }}
                                                                                              />
                                                                                            )}
                                                                                          </>
                                                                                        )}
                                                                                      </td>

                                                                                      {/* Remaining */}
                                                                                      <td className={`text-center font-medium ${stageRemaining <= 0 ? "text-green-500" : "text-red-500"}`}>
                                                                                        {stageRemaining <= 0 ? "0.00" : stageRemaining.toFixed(2)} L
                                                                                      </td>

                                                                                      {/* PO Status (Invoice Status Dropdown) */}
                                                                                      {/* 1. PO Status (Work Status Display) - Now matches the 7th column header */}
                                                                                      <td className="text-center">
                                                                                        <div className="relative inline-block py-2 !inline-flex items-center">
                                                                                          <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                        ${workStatus === "Inprogress" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                              workStatus === "Submitted" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                workStatus === "Rejected" ? "bg-red-100 text-red-600 border-red-200" :
                                                                                                  workStatus === "Approved" ? "bg-blue-100 text-blue-600 border-blue-200" :
                                                                                                    workStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                      "bg-gray-100 text-gray-600 border-gray-200"}`}
                                                                                          >
                                                                                            {/* {workStatus === "Approved" ? "Submitted" : workStatus === "Pending" ? "Not Started" : workStatus} */}
                                                                                            {workStatus === "Pending" ? "Not Started" : workStatus}

                                                                                          </span>
                                                                                          {
                                                                                            (workStatus === "Submitted" || workStatus === "Approved") &&
                                                                                            <FileText className="inline-block ml-1 text-red-500 cursor-pointer" size={13} title="Work Proof Files" onClick={(e) => {
                                                                                              e.stopPropagation();
                                                                                              setViewDocumentModel({
                                                                                                model: true,
                                                                                                data: (stage.work_logs || []).filter((log) => log.to_status === workStatus),
                                                                                                title: `${stage.name} Work Proofs`
                                                                                              });
                                                                                            }} />
                                                                                          }
                                                                                        </div>
                                                                                      </td>

                                                                                      {/* 2. Invoice Status (Dropdown) - Now matches the 8th column header */}
                                                                                      <td className="text-center p-1" onClick={(e) => e.stopPropagation()}>
                                                                                        <div className="relative inline-block">
                                                                                          <select
                                                                                            value={paymentStatus}
                                                                                            disabled={paymentStatus === "Waiting"}

                                                                                            onChange={(e) => {
                                                                                              const selectedAction = e.target.value;

                                                                                              // 🔥 Intercept the action: Check if Account is trying to raise without TL approval
                                                                                              if (isACCOUNT && workStatus !== "Approved" && selectedAction === "Raised") {
                                                                                                // Show error message popup
                                                                                                dispatch(showSnackbar({
                                                                                                  message: "Team Lead has not approved this yet. You cannot raise the amount.",
                                                                                                  type: "error"
                                                                                                }));

                                                                                                // Revert the dropdown back to its original value
                                                                                                e.target.value = invoiceStatus;
                                                                                                return; // Stop the function here so the modal doesn't open
                                                                                              }

                                                                                              // If validation passes, open the modal normally
                                                                                              handleSubmissionapproveStatus(
                                                                                                stage.id,
                                                                                                sub,
                                                                                                selectedAction,
                                                                                                stageRemaining > 0 ? stageRemaining.toFixed(2) : stageAmount.toFixed(2),
                                                                                                stage.extra_payment_amount || 0,
                                                                                                projectId,
                                                                                                'payment'
                                                                                              );
                                                                                            }}
                                                                                            className="text-xs border m-1 rounded cursor-pointer w-[90px] p-1"
                                                                                            style={{
                                                                                              backgroundColor:
                                                                                                paymentStatus === "Pending" ? "#FEF3C7" :
                                                                                                  paymentStatus === "Raised" ? "#DBEAFE" :
                                                                                                    paymentStatus === "Received" ? "#D1FAE5" :
                                                                                                      paymentStatus === "Completed" ? "#F3E8FF" : "#F3F4F6",
                                                                                              color:
                                                                                                paymentStatus === "Pending" ? "#D97706" :
                                                                                                  paymentStatus === "Raised" ? "#2563EB" :
                                                                                                    paymentStatus === "Received" ? "#059669" :
                                                                                                      paymentStatus === "Completed" ? "#9333EA" : "#6B7280",
                                                                                              borderColor:
                                                                                                paymentStatus === "Pending" ? "#D97706" :
                                                                                                  paymentStatus === "Raised" ? "#2563EB" :
                                                                                                    paymentStatus === "Received" ? "#059669" :
                                                                                                      paymentStatus === "Completed" ? "#9333EA" : "#D1D5DB"
                                                                                            }}
                                                                                          >
                                                                                            <option value="Waiting" disabled style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>Not Started</option>
                                                                                            <option value="Pending" disabled style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>Pending</option>
                                                                                            <option value="Raised" style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}>Raised</option>
                                                                                            <option value="Received" disabled={paymentStatus !== "Raised"} style={{ backgroundColor: "#D1FAE5", color: "#059669" }}>Received</option>
                                                                                          </select>
                                                                                        </div>
                                                                                      </td>

                                                                                    </tr>
                                                                                  );
                                                                                })
                                                                              ) : (
                                                                                /* Fallback row if no stages are recorded */
                                                                                <tr className="border-t text-[12px] bg-white">
                                                                                  <td className="px-2 text-center align-middle border-r border-gray-100"></td>
                                                                                  <td className="px-2 font-medium align-middle border-r border-gray-100">{"Stage " + (sub.sorting_var || 0) + " - " + sub.subactivity_name}</td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">{formatNumber(sub.chainage_start)}</td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">{sub.total_quantity}</td>
                                                                                  <td className="text-center align-middle border-r border-gray-100">{formatNumber(sub.covered_area)}</td>
                                                                                  <td colSpan="8" className="text-center text-gray-400 py-4 italic">No work stages found for this sub-activity</td>
                                                                                </tr>
                                                                              )
                                                                            )}

                                                                            {/* 🟡 Expanded Time Logs Row (Same for everyone) */}
                                                                            {expandedRow === sub.id && (
                                                                              <tr className="bg-gray-50/80">
                                                                                <td colSpan="14" className="px-4 py-4 w-full">
                                                                                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                                                                      <div className="flex items-center gap-2">
                                                                                        <Clock size={16} className="text-blue-500" />
                                                                                        <span className="text-sm font-medium text-gray-700">Time Logs</span>
                                                                                      </div>
                                                                                      <span className="text-xs text-gray-500">
                                                                                        Total: {sub.work_summary?.total_hours || "00:00:00"}
                                                                                      </span>
                                                                                    </div>

                                                                                    <div className="divide-y divide-gray-100">
                                                                                      {sub.work_summary?.users?.length > 0 ? (
                                                                                        sub.work_summary.users.map((log, i) => (
                                                                                          <div key={i} className="px-4 py-2.5 flex justify-between items-center hover:bg-gray-50">
                                                                                            <div className="flex items-center gap-2">
                                                                                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                                                                                {log.name?.charAt(0)?.toUpperCase()}
                                                                                              </div>
                                                                                              <span className="text-sm text-gray-700">{log.name}</span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-3">
                                                                                              <span className="text-xs text-gray-400">{log.days_worked} day(s)</span>
                                                                                              <span className="text-sm font-mono font-medium text-blue-600">
                                                                                                {log.total_time_spent}
                                                                                              </span>
                                                                                            </div>
                                                                                          </div>
                                                                                        ))
                                                                                      ) : (
                                                                                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                                                                                          No time logs recorded
                                                                                        </div>
                                                                                      )}
                                                                                    </div>

                                                                                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
                                                                                      <button
                                                                                        onClick={() => setExpandedRow(null)}
                                                                                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto"
                                                                                      >
                                                                                        <ChevronUp size={12} />
                                                                                        Collapse
                                                                                      </button>
                                                                                    </div>
                                                                                  </div>
                                                                                </td>
                                                                              </tr>
                                                                            )}
                                                                          </Fragment>
                                                                        );
                                                                      })}
                                                                  </tbody>
                                                                </table>
                                                              </div>
                                                            </div>
                                                          </motion.div>
                                                        )}
                                                      </AnimatePresence>
                                                    </div>
                                                  );
                                                })}
                                            </div>
                                          </div >
                                        )
                                        }
                                      </>
                                    );
                                  })()}
                                </>
                              )}

                              {/* Assigned Personnel Section */}
                              {
                                !loadingProjectDetails[projectId] && expandedProjectDetails[projectId]?.assigned_to_detail?.length > 0 &&
                                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                                  <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                    <UserCog size={18} className="text-blue-600" />
                                    Assigned Personnel
                                  </h4>
                                  <div className="flex flex-row gap-4 flex-wrap">
                                    {expandedProjectDetails[projectId]?.assigned_to_detail?.length > 0 && (
                                      // {project.assigned_to_detail?.length > 10 && (
                                      expandedProjectDetails[projectId]?.assigned_to_detail?.map((data, index) =>
                                        <div key={index} className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                            {data?.profilepic ? (
                                              <CustomImageModal customStyle>
                                                <img
                                                  src={`${IMAGE_URL}${data?.profilepic}`}
                                                  alt={data?.name}
                                                  className="w-10 h-10 rounded-full object-cover"
                                                />
                                              </CustomImageModal>
                                            ) : (
                                              // <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-medium">
                                              <div >
                                                {data?.name?.charAt(0)}
                                              </div>
                                            )}
                                            {/* {data?.name?.charAt(0)?.toUpperCase() || "U"} */}
                                          </div>
                                          <div>
                                            {/* <p className="text-sm font-medium text-gray-800">{data?.name}</p> */}
                                            <p className="text-sm font-medium text-gray-800">{data?.name}</p>
                                            {/* <p className="text-xs text-gray-500">Project Owner</p> */}
                                            {/* <p className="text-xs text-gray-500">{data?.role || "Project Owner"}</p> */}
                                            <p className="text-xs text-gray-500">{expandedProjectDetails[projectId]?.assigned_to_detail?.length > 1 ? "Project CO-Owner" : "Project Owner"}</p>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              }
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div >
            )}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 bg-white rounded-2xl shadow-xl px-6 py-4 border border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}
                  {" - "}
                  {Math.min(currentPage * PAGE_SIZE, totalCount)}
                  {" of "}
                  {totalCount} projects
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            <MultiWorkLogModal
              isOpen={showMultiLog}
              onClose={() => setShowMultiLog(false)}
              projects={projectsOnly}          // your full projects array

              onSave={async (date, rows) => {
                try {
                  // Append the 'date' and default 'status' to every row 
                  // so the thunk can process it correctly
                  const payloadArray = rows.map(row => ({
                    ...row,
                    date: date,
                    status: row.status || "WORKED" // fallback to "WORKED" if not provided
                  }));

                  // Dispatch the thunk ONCE with the full array
                  await dispatch(saveDailyWorkLog(payloadArray)).unwrap();

                  // Note: The thunk handles the success snackbar now via showSuccess()

                } catch (error) {
                  // The thunk handles the error snackbar now via showError()
                }
              }}
            />
          </AnimatePresence >
        </>
      )
      }
    </motion.div >
  );
};

export default ProjectList;
