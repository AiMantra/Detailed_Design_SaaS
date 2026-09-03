import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
    Percent,
    Layers,
    Activity,
    Timer,
    EllipsisVertical,
    Handshake,
    FileText,
    UserStar,
    PlusCircle,
    Pencil,
    AlertTriangle,
} from "lucide-react";
import api, { getLatestServerDate } from "../../services/api";
import { getProjectStatusInfo, getDaysUntilDeadline } from "../../utils/deadlineUtils";
import {
    fetchProjects,
    fetchOnlyProjectsList,
    fetchProjectDetails,
    deleteProject,
    fetchCompanies,
    fetchSubCompanies,
    fetchSectors,
    fetchClients,
    tlSubactivitySubmitwithProof,
    fetchSubActivityDetailsworklog
} from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import TaskPicker from "../tasks/TaskPicker";
import LoadingModal from "../../components/modals/LoadingModal";
import { SECTOR_UNIT_MAPPING } from "../../utils/enumMapping";
import { saveDailyWorkLog } from "../tasks/taskSlice";
import { p } from "framer-motion/client";
import { timeToSeconds, formatSecondsToDuration, formatDuration, formatDurationDetailed } from "../../utils/CustomFormatters";
import { CustomImageModal, CustomTooltip } from "../../utils/CustomFunctions";
import { IMAGE_URL } from "../../services/api";

const TlProjectList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get projects and user from Redux store
    const {
        projects = [],
        projectsOnly = [],
        projectsOnlyPagination = {},
        projectDetails = {},
        loading: apiLoading = false,
        companies = [],
        subCompanies = [],
        sectors = [],
        clients = []
    } = useSelector((state) => state.api || {});
    const { user } = useSelector((state) => state.auth);

    const [searchTerm, setSearchTerm] = useState("");
    const [projectCodeQuery, setProjectCodeQuery] = useState("");
    const PAGE_SIZE = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedCard, setExpandedCard] = useState(null);
    const [expandedActivities, setExpandedActivities] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("Loading Projects");
    const [loadingSubMessage, setLoadingSubMessage] = useState("Fetching your projects...");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [showTimeLogModal, setShowTimeLogModal] = useState(false);
    const [selectedTaskfortimelog, setSelectedTaskfortimelog] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [handleApprovalStatus, setHandleStatus] = useState({});
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofData, setProofData] = useState({
        documents: [],
        rejection_proof: [],
        rejection_reason: "",
        rejection_type: "",
        // approval_proof: [],
        stage: "",
        to_status: "Submitted",
        created_by: user?.emp_code || "",
        remarks: "",
        event_type: "",             // <-- New
        extra_payment_percent: "",  // <-- New
        document_type: "ref_doc",
        client_remarks: "",
    });
    const [viewdocumentmodel, setViewDocumentModel] = useState({
        model: false,
        data: []
    });

    // const [selectedTaskfortimelog, setSelectedTaskfortimelog] = useState(null);
    const [worklogreturned, setWorkLogReturned] = useState([]);
    const [timeLogData, setTimeLogData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        description: ''
    });

    const [expandedProjectDetails, setExpandedProjectDetails] = useState({});
    const [loadingProjectDetails, setLoadingProjectDetails] = useState({});
    const [filterProjectType, setFilterProjectType] = useState("all");
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
            companies.forEach(company => {
                if (company && company.id) map[company.id] = company.name;
            });
        }
        return map;
    }, [companies]);

    const subCompanyMap = useMemo(() => {
        const map = {};
        if (subCompanies && Array.isArray(subCompanies)) {
            subCompanies.forEach(sub => {
                if (sub && sub.id) map[sub.id] = sub.name;
            });
        }
        return map;
    }, [subCompanies]);

    const sectorMap = useMemo(() => {
        const map = {};
        if (sectors && Array.isArray(sectors)) {
            sectors.forEach(sector => {
                if (sector && sector.id) map[sector.id] = sector.name;
            });
        }
        return map;
    }, [sectors]);

    const clientMap = useMemo(() => {
        const map = {};
        if (clients && Array.isArray(clients)) {
            clients.forEach(client => {
                if (client && client.id) map[client.id] = client.name;
            });
        }
        return map;
    }, [clients]);

    // Debounce project_code search; reset to page 1 only when the query actually changes
    useEffect(() => {
        const timer = setTimeout(() => {
            const nextQuery = searchTerm.trim();
            if (nextQuery !== projectCodeQuery) {
                setProjectCodeQuery(nextQuery);
                setCurrentPage(1);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, projectCodeQuery]);

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
                dispatch(showSnackbar({
                    message: "Failed to load data from server",
                    type: "warning"
                }));
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
                    dispatch(showSnackbar({
                        message: "Failed to load data from server",
                        type: "warning"
                    }));
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
            dispatch(showSnackbar({
                message: "Data refreshed successfully",
                type: "success"
            }));
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to refresh data",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteProject = async (projectId, projectName, e) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
            return;
        }
        setDeleteInProgress(true);
        setLoadingMessage("Deleting Project");
        setLoadingSubMessage(`Deleting ${projectName}...`);
        try {
            await dispatch(deleteProject(projectId)).unwrap();
            dispatch(showSnackbar({
                message: "Project deleted successfully",
                type: "success"
            }));
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({
                message: error.message || "Failed to delete project",
                type: "error"
            }));
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
        setExpandedActivities(prev => ({
            // ...prev,
            [activityId]: !prev[activityId]
        }));
    };

    // Helper function to get sector unit
    const getSectorUnit = (project) => {
        const sectorName = getSectorName(project);
        const sector = sectors.find((s) => s.name === sectorName);
        return SECTOR_UNIT_MAPPING[sector?.unit] || "";
    };

    // Helper function to calculate GST amount
    const calculateGSTAmount = (project) => {
        const cost = getCost(project);
        const igst = project.igst_percentage || 0;
        const cgst = project.cgst_percentage || 0;
        const total = ((cost * igst) / 100 + (cost * cgst) / 100).toFixed(2);
        return total != 0.0 ? total : ((cost * 18) / 100).toFixed(2);
    };

    // Helper function to calculate total with GST
    const calculateTotalWithGST = (project) => {
        const cost = getCost(project);
        const igst = project.igst_percentage || 0;
        const cgst = project.cgst_percentage || 0;
        const total = ((cost * igst) / 100 + (cost * cgst) / 100).toFixed(2);
        return (cost + (total != 0.0 ? total : (cost * 18) / 100)).toFixed(2);
    };

    // Role-based checks
    const isACCOUNT = user?.role === "ACCOUNT";
    const isAdmin = user?.role === "ADMIN" || isACCOUNT;
    const isUser = user?.role === "USER";
    const isTL = user?.role === "TL";

    // Helper functions
    const getCompanyName = (project) => {
        const companyId = project.company || project.company_id;
        if (companyMap[companyId]) return companyMap[companyId];
        if (project.company_detail?.name) return project.company_detail.name;
        return companyId || "—";
    };

    const getSubCompanyName = (project) => {
        const subCompanyId = project.sub_company || project.sub_company_id;
        if (subCompanyMap[subCompanyId]) return subCompanyMap[subCompanyId];
        if (project.sub_company_detail?.name) return project.sub_company_detail.name;
        return subCompanyId || "—";
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
        if (isTL) return <Briefcase size={16} className="text-blue-600" />;
        return <User size={16} className="text-green-600" />;
    };

    const getRoleDisplay = () => {
        if (isACCOUNT) return "Account";
        if (isAdmin) return "Admin";
        if (isTL) return "Team Lead";
        return "Employee";
    };

    const filteredProjects = Array.isArray(projectsOnly) ? projectsOnly : [];

    const stats = useMemo(() => {
        if (!projectsOnly || !Array.isArray(projectsOnly)) {
            return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0 };
        }
        return {
            total: projectsOnlyPagination.total_projects || projectsOnly.length,
            delayed: projectsOnly.filter(p => {
                const status = p.status || "ONGOING";
                const progress = p.progress || 0;
                const daysLeft = getDaysUntilDeadline(p.completion_date || p.completionDate);
                return (status === "DELAYED" || daysLeft < 0) && progress < 100;
            }).length,
            critical: projectsOnly.filter(p => {
                const progress = p.progress || 0;
                const daysLeft = getDaysUntilDeadline(p.completion_date || p.completionDate);
                return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
            }).length,
            completed: projectsOnly.filter(p => (p.progress || 0) === 100 || (p.status || "ONGOING") === "COMPLETED").length,
            ongoing: projectsOnly.filter(p => {
                const progress = p.progress || 0;
                return progress > 0 && progress < 100;
            }).length
        };
    }, [projectsOnly]);

    const ProjectListStats = useMemo(() => {
        if (!projectsOnly || !Array.isArray(projectsOnly)) {
            return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0, notStarted: 0 };
        }

        return {
            total: projectsOnlyPagination.total_projects || projectsOnly.length,

            // Delayed: projectsOnly where completion date is past AND progress < 100
            delayed: projectsOnly.filter(p => {
                const progress = p.overall_progress || p.progress || 0;
                const completionDate = p.completion_date;
                const daysLeft = getDaysUntilDeadline(completionDate);
                return daysLeft < 0 && progress < 100;
            }).length,

            // Critical: projectsOnly with 0-2 days left AND progress < 100
            critical: projectsOnly.filter(p => {
                const progress = p.overall_progress || p.progress || 0;
                const completionDate = p.completion_date;
                const daysLeft = getDaysUntilDeadline(completionDate);
                return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
            }).length,

            // Completed: projectsOnly with 100% progress
            completed: projectsOnly.filter(p => {
                const progress = p.overall_progress || p.progress || 0;
                return progress === 100;
            }).length,

            // Ongoing: projectsOnly with progress > 0 and < 100
            ongoing: projectsOnly.filter(p => {
                const progress = p.overall_progress || p.progress || 0;
                return progress > 0 && progress < 100;
            }).length,

            // Not Started: projectsOnly with 0% progress
            notStarted: projectsOnly.filter(p => {
                const progress = p.overall_progress || p.progress || 0;
                return progress === 0;
            }).length,
        };
    }, [projectsOnly, projectsOnlyPagination.total_projects]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch { return "N/A"; }
    };

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

    const handleSaveTimeLog = async () => {
        if (!selectedTaskfortimelog) return;
        if (!timeLogData.startTime || !timeLogData.endTime) {
            dispatch(showSnackbar({ message: 'Please enter both start and end time', type: 'error' }));
            return;
        }
        if (timeLogData.startTime >= timeLogData.endTime) {
            dispatch(showSnackbar({ message: 'End time must be after start time', type: 'error' }));
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
                note: timeLogData.description,
                status: 'WORKED'
            })).unwrap();
            dispatch(showSnackbar({ message: 'Work hours saved successfully!', type: 'success' }));
            const mixedData = { ...selectedTaskfortimelog, date: timeLogData.date, startTime: timeLogData.startTime, endTime: timeLogData.endTime, description: timeLogData.description };
            setWorkLogReturned((prev) => [...prev, mixedData]);
            setShowTimeLogModal(false);
            setSelectedTaskfortimelog(null);
            setTimeLogData({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', description: '' });
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || 'Failed to save record', type: 'error' }));
        } finally {
            setIsSaving(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", damping: 15, stiffness: 100 }
        }
    };

    const handleRefresh = () => loadData();

    const getProjectId = (project) => project.id || project.project_id;
    const getProjectName = (project) => project.project_name || project.name || "Unnamed Project";
    const getProjectCode = (project) => project.project_code || project.code || "N/A";
    const getCompletionDate = (project) => project.completion_date || project.completionDate || project.deadline;
    const getActualCompletionDate = (project) => project.actual_completion_date || project.completed_at || project.updated_at;
    const getProgress = (project) => project.progress || 0;
    const getLocation = (project) => project.location || "No location specified";
    const getCost = (project) => project.workorder_cost || project.cost || 0;
    const getTotalLength = (project) => project.total_length || project.totalLength || 0;
    const getLoaDate = (project) => project.loa_date || project.loaDate;
    // const getDirectorProposalDate = (project) => project.director_proposal_date || project.directorProposalDate;
    // const getProjectConfirmationDate = (project) => project.project_confirmation_date || project.projectConfirmationDate;

    // const handleProjectNavigation = (projectId, e) => {
    //     if (e) e.stopPropagation();
    //     if (isUser) {
    //         navigate(`/my-projects/${projectId}`);
    //     } else {
    //         navigate(`/projects/${projectId}`);
    //     }
    // };


    // Add this function before the return statement
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


    const showLoading = isInitialLoading || refreshing || deleteInProgress;
    const [loder, setloder] = useState(false)
    const handleSubmitProof = async () => {
        setloder(true)
        const response = await dispatch(tlSubactivitySubmitwithProof(proofData)).unwrap();
        await fetchProjectDetailsIfNeeded(proofData.projectId);
        setloder(false)
        setProofData({
            documents: [],
            rejection_proof: [],
            rejection_reason: "",
            rejection_type: "",
            // subactivity: "",
            stage: "",
            to_status: "Submitted",
            created_by: user?.emp_code || "",
            remarks: "",
            document_type: "ref_doc",
            client_remarks: "",
        });
        setShowProofModal(false);

    };

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

    const [showSubActivityModal, setShowSubActivityModal] = useState(false);
    const [subActivityModalData, setSubActivityModalData] = useState(null);
    const [loadingSubActivity, setLoadingSubActivity] = useState(false);

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

    const handleEditProject = (projectid) => {
        navigate("/project/update/" + projectid)
    }

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
    //     if (maxSelectableDate && timeLogData.date && timeLogData.date > maxSelectableDate) {
    //         setTimeLogData((prev) => ({ ...prev, date: maxSelectableDate }));
    //     }
    // }, [maxSelectableDate]);
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <div className="max-w-7xl mx-auto px-4 py-6">
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
                                    <input
                                        type="date"
                                        value={timeLogData.date}
                                        min={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                                        onChange={(e) => setTimeLogData({ ...timeLogData, date: e.target.value })}
                                        max={maxSelectableDate || new Date().toISOString().split("T")[0]}
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
                                setShowProofModal(false)
                                setProofData({
                                    documents: [],
                                    rejection_proof: [],
                                    rejection_reason: "",
                                    rejection_type: "",
                                    stage: "",
                                    to_status: "Submitted",
                                    created_by: user?.emp_code || "",
                                    remarks: "",
                                    document_type: "ref_doc",
                                    client_remarks: "",
                                    projectId: null
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
                                        {proofData.to_status === "Approved" && "✅ Approve Work"}
                                        {proofData.to_status === "Rejected" && "❌ Reject Work"}
                                        {proofData.to_status === "Submitted" && "📎 Submit Work Proof"}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowProofModal(false)
                                            setProofData({
                                                documents: [],
                                                rejection_proof: [],
                                                rejection_reason: "",
                                                rejection_type: "",
                                                stage: "",
                                                to_status: "Submitted",
                                                created_by: user?.emp_code || "",
                                                remarks: "",
                                                document_type: "ref_doc",
                                                client_remarks: "",
                                                projectId: null
                                            })
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        ✕
                                    </button>
                                </div>



                                {/* For APPROVE - Confirmation, Proof, and Remarks */}
                                {/* For APPROVE - Confirmation, Proof, and Remarks */}
                                {proofData.to_status === "Approved" && (
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <p className="text-green-800 text-sm">
                                                Are you sure you want to approve this work?
                                            </p>
                                            <p className="text-green-600 text-xs mt-1">
                                                This will mark the stage as approved and move to next stage.
                                            </p>
                                        </div>

                                        {/* Approval Proof Upload (Reusing the 'documents' state) */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Approval Proof <span className="text-red-500">*</span>
                                            </label>
                                            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-green-400 transition">
                                                <input
                                                    type="file"

                                                    className="hidden"
                                                    onChange={(e) =>
                                                        setProofData({
                                                            ...proofData,
                                                            // Notice we use 'documents' here!
                                                            // documents: [...(proofData.documents || []), ...Array.from(e.target.files)],
                                                            documents: Array.from(e.target.files),
                                                        })
                                                    }
                                                />
                                                <p className="text-sm text-gray-500">
                                                    <span className="text-green-600 font-medium">browse approval proofs</span>
                                                </p>
                                            </label>

                                            {/* File Preview Grid */}
                                            <div className="grid grid-cols-3 gap-3 mt-4">
                                                {proofData?.documents?.map((file, i) => {
                                                    const isImage = file.type.startsWith("image/");
                                                    const url = URL.createObjectURL(file);
                                                    return (
                                                        <div key={i} className="relative border rounded-lg overflow-hidden group">
                                                            {isImage ? (
                                                                <img src={url} alt="preview" className="w-full h-20 object-cover" />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-20 bg-gray-100 text-xs text-gray-600">
                                                                    📄 {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    setProofData({
                                                                        ...proofData,
                                                                        // Notice we use 'documents' here too!
                                                                        documents: proofData.documents.filter((_, index) => index !== i),
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

                                        <div className="mt-5">
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Remarks <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={proofData.remarks}
                                                onChange={(e) =>
                                                    setProofData({ ...proofData, remarks: e.target.value })
                                                }
                                                placeholder="Add any approval remarks..."
                                                rows={3}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* For REJECT - Need rejection details and proof */}
                                {proofData.to_status === "Rejected" && (
                                    <div className="space-y-4">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-red-800 text-sm">
                                                Please provide rejection details
                                            </p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Event Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={proofData.event_type || ""}
                                                onChange={(e) =>
                                                    setProofData({ ...proofData, event_type: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 bg-white"
                                            >
                                                <option value="" disabled>Select Event Type</option>
                                                <option value="work_mistake">Work Mistake</option>
                                                <option value="client_change">Client Change</option>
                                            </select>
                                        </div>

                                        {/* Conditional Field: Only shows if "Client Change" is selected */}
                                        {proofData.event_type === "client_change" && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                                    Extra Payment Percent (%) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={proofData.extra_payment_percent || ""}
                                                    onChange={(e) =>
                                                        setProofData({ ...proofData, extra_payment_percent: e.target.value })
                                                    }
                                                    placeholder="Enter percentage..."
                                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Remarks (Reason) <span className="text-red-500">*</span>
                                            </label>
                                            {/* Uses 'remarks' instead of 'rejection_reason' to match API */}
                                            <textarea
                                                value={proofData.remarks || ""}
                                                onChange={(e) =>
                                                    setProofData({ ...proofData, remarks: e.target.value })
                                                }
                                                placeholder="Enter detailed reason for rejection..."
                                                rows={3}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                            />
                                        </div>

                                        {/* Rejection Proof Upload (Reusing the 'documents' state) */}
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Rejection Proof <span className="text-red-500">*</span>
                                            </label>
                                            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-red-400 transition">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        setProofData({
                                                            ...proofData,
                                                            documents: Array.from(e.target.files), // Same logic as Approve
                                                        })
                                                    }
                                                />
                                                <p className="text-sm text-gray-500">
                                                    <span className="text-red-600 font-medium">browse rejection proofs</span>
                                                </p>
                                            </label>

                                            {/* File Preview Grid */}
                                            <div className="grid grid-cols-3 gap-3 mt-4">
                                                {proofData?.documents?.map((file, i) => {
                                                    const isImage = file.type.startsWith("image/");
                                                    const url = URL.createObjectURL(file);
                                                    return (
                                                        <div key={i} className="relative border rounded-lg overflow-hidden group">
                                                            {isImage ? (
                                                                <img src={url} alt="preview" className="w-full h-20 object-cover" />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-20 bg-gray-100 text-xs text-gray-600">
                                                                    📄 {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                                                                </div>
                                                            )}
                                                            <button
                                                                onClick={() =>
                                                                    setProofData({
                                                                        ...proofData,
                                                                        documents: proofData.documents.filter((_, index) => index !== i),
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
                                    </div>
                                )}

                                {/* For SUBMIT - Upload work proof */}
                                {proofData.to_status === "Submitted" && (
                                    <div className="space-y-4">
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
                                                <span className="text-blue-600 font-medium">browse</span> to upload work proof
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                JPG, PNG, PDF, DOC
                                            </p>
                                        </label>

                                        {/* File Preview Grid */}
                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                            {proofData?.documents?.map((file, i) => {
                                                const isImage = file.type.startsWith("image/");
                                                const url = URL.createObjectURL(file);
                                                return (
                                                    <div key={i} className="relative border rounded-lg overflow-hidden group">
                                                        {isImage ? (
                                                            <img src={url} alt="preview" className="w-full h-20 object-cover" />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-20 bg-gray-100 text-xs text-gray-600">
                                                                📄 {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() =>
                                                                setProofData({
                                                                    ...proofData,
                                                                    documents: proofData.documents.filter((_, index) => index !== i),
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

                                        <div>
                                            <label className="text-sm font-medium text-gray-700 block mb-1">
                                                Message
                                            </label>
                                            <textarea
                                                value={proofData.remarks}
                                                onChange={(e) =>
                                                    setProofData({ ...proofData, remarks: e.target.value })
                                                }
                                                placeholder="Describe your work..."
                                                rows={3}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                )}




                                {/* ACTIONS */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowProofModal(false)
                                            setProofData({
                                                documents: [],
                                                stage: "",
                                                to_status: "Submitted",
                                                created_by: user?.emp_code || "",
                                                remarks: "",
                                                event_type: "",
                                                extra_payment_percent: "",
                                                document_type: "ref_doc",
                                                client_remarks: "",
                                                projectId: null
                                            })
                                        }}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSubmitProof}


                                        disabled={
                                            loder ||
                                            // 1. Submit Validation
                                            (proofData.to_status === "Submitted" && (!proofData.documents || proofData.documents.length < 1)) ||
                                            // 2. Reject Validation
                                            (proofData.to_status === "Rejected" && (
                                                !proofData.event_type ||
                                                !proofData.remarks ||
                                                !proofData.remarks.trim() ||
                                                proofData.documents.length < 1 || // Prevents just typing spaces
                                                (proofData.event_type === "client_change" && !proofData.extra_payment_percent)
                                            )) ||
                                            // 3. Approve Validation: BOTH remarks AND documents are MANDATORY
                                            (proofData.to_status === "Approved" && (
                                                !proofData.remarks ||
                                                !proofData.remarks.trim() ||
                                                !proofData.documents ||
                                                proofData.documents.length < 1
                                            ))
                                        }

                                        className={`flex-1 px-4 py-2 rounded-lg text-white transition disabled:opacity-50 ${proofData.to_status === "Approved"
                                            ? "bg-green-600 hover:bg-green-700"
                                            : proofData.to_status === "Rejected"
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-blue-600 hover:bg-blue-700"
                                            }`}
                                    >
                                        {loder ? <Loader2 size={16} className="animate-spin mx-auto" /> :
                                            proofData.to_status === "Approved" ? "Confirm Approval" :
                                                proofData.to_status === "Rejected" ? "Confirm Rejection" : "Submit Proof"
                                        }
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
                                                        {item?.created_by && (
                                                            <div>
                                                                <p className="text-xs text-gray-400">Created By</p>
                                                                <p className="text-sm font-medium text-gray-700">
                                                                    {item.created_by}
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

                                                {subActivityModalData.cycles?.map((cycle, cycleIdx) => {

                                                    // 🟢 NEW: Match the cycle_number to rework_details to fetch the name
                                                    const reworkInfo = subActivityModalData.rework_details?.find(
                                                        (rework) => rework.cycle_number === cycle.cycle_number
                                                    );
                                                    const rejectedByName = reworkInfo?.rejected_by_name;

                                                    return (
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
                                                            {/* Rejection Details (if any) */}
                                                            {cycle.rejection_details && (
                                                                <div className="bg-red-50 p-4 border-b border-red-100">
                                                                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2 mb-3">
                                                                        <XCircle size={16} /> Rejection Details
                                                                    </p>

                                                                    {/* Added Grid for Reason, Type, and Extra Amount */}
                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                                                        <p className="text-sm text-red-600">
                                                                            <span className="font-semibold block text-xs uppercase tracking-wider opacity-80 mb-0.5">Reason</span>
                                                                            {cycle.rejection_details.reason || "Not specified"}
                                                                        </p>

                                                                        <p className="text-sm text-red-600">
                                                                            <span className="font-semibold block text-xs uppercase tracking-wider opacity-80 mb-0.5">Type</span>
                                                                            <span className="capitalize">{cycle.rejection_details.type?.replace('_', ' ')}</span>
                                                                        </p>

                                                                        <p className="text-sm text-red-600">
                                                                            <span className="font-semibold block text-xs uppercase tracking-wider opacity-80 mb-0.5">Extra Amount</span>
                                                                            {cycle.rejection_details.extra_amount?.toFixed(2) || "0.00"} %
                                                                        </p>
                                                                    </div>

                                                                    <p className="text-xs text-red-500 pt-2 border-t border-red-200/60">
                                                                        Rejected by {" "}
                                                                        <span className="font-semibold">
                                                                            {rejectedByName
                                                                                ? `${rejectedByName} (${cycle.rejection_details.rejected_by})`
                                                                                : cycle.rejection_details.rejected_by}
                                                                        </span>{" "}
                                                                        on {new Date(cycle.rejection_details.rejected_at).toLocaleString("en-IN")}
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
                                                    );
                                                })}

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
                        {/* Welcome Header */}
                        <div className="mb-10 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <motion.h1
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                                    >
                                        {user?.name || 'Team Lead'}

                                    </motion.h1>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-blue-100 text-blue-600`}
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


                        {/* Stats Cards - Full set for TL */}
                        {(totalCount > 0 || projectsOnly.length > 0) && (
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

                        {/* Search and Filters */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search by project code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
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
                                    <Filter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                                </div>
                                {isAdmin && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate("/project/create")}
                                        className="bg-gradient-to-r from-blue-600 to-amber-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        New Project
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {filteredProjects.length === 0 ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100">
                                    <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-2xl font-semibold text-gray-700 mb-2">No projects found</p>
                                    {isAdmin && (
                                        <button onClick={() => navigate("/project/create")} className="bg-gradient-to-r from-blue-600 to-amber-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all inline-flex items-center gap-2 text-lg">
                                            <Plus size={24} /> Create New Project
                                        </button>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-6">
                                    {filteredProjects.map((project) => {
                                        const projectId = getProjectId(project);
                                        const projectName = getProjectName(project);
                                        const projectCode = getProjectCode(project);
                                        const completionDate = getCompletionDate(project);
                                        const actualCompletionDate = getActualCompletionDate(project);
                                        const progress = getProgress(project);
                                        const location = getLocation(project);
                                        const daysLeft = getDaysUntilDeadline(completionDate);
                                        const isCompleted = progress === 100;
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
                                                key={projectId}
                                                variants={itemVariants}
                                                layout
                                                className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 transition-all duration-300 relative group
                                                    ${isCompleted ? "border-green-200 hover:border-green-300" :
                                                        statusInfo.status === "DELAYED" ? "border-red-200 hover:border-red-300" :
                                                            statusInfo.status === "DUE_TODAY" ? "border-blue-200 hover:border-blue-300" :
                                                                statusInfo.status === "CRITICAL" ? "border-yellow-200 hover:border-yellow-300" :
                                                                    "border-gray-100 hover:border-blue-200"}`}
                                            >
                                                <div
                                                    className="p-6 cursor-pointer"
                                                    // onClick={() => setExpandedCard(isExpanded ? null : projectId)}
                                                    onClick={() => {
                                                        const newExpandedState = isExpanded ? null : projectId;
                                                        setExpandedCard(newExpandedState);
                                                        if (!isExpanded) {
                                                            fetchProjectDetailsIfNeeded(projectId);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                                                        {/* LEFT SECTION */}
                                                        <div className="flex-1">
                                                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                                                <h3 className="text-lg md:text-lg font-semibold text-gray-800 flex items-center gap-2">
                                                                    {projectName}
                                                                </h3>
                                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1
                                                                     ${isCompleted ? "bg-green-100 text-green-700" : `${statusInfo.colors.bg} ${statusInfo.colors.text}`}`}>
                                                                    {isCompleted ? <CheckCircle size={14} /> : statusInfo.icon}
                                                                    {isCompleted ? "Completed" : statusInfo.label}
                                                                </motion.span>
                                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.colors.bg} ${statusInfo.colors.text}`}>
                                                                    <Hash size={12} />
                                                                    {projectCode}
                                                                </motion.span>
                                                                <motion.span whileHover={{ scale: 1.05 }} className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.colors.bg} ${statusInfo.colors.text}`}>
                                                                    <MapPin size={14} />
                                                                    <span className="text-sm">{location}</span>
                                                                </motion.span>
                                                            </div>

                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-blue-50 rounded-lg"><Calendar size={16} className="text-blue-600" /></div>
                                                                    <div><p className="text-xs text-gray-500">Start</p><p className="text-sm font-semibold">{formatDate(getLoaDate(project))}</p></div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`p-2 rounded-lg ${isCompleted ? "bg-green-50" : daysLeft < 0 ? "bg-red-50" : daysLeft <= 2 ? "bg-orange-50" : "bg-green-50"}`}>
                                                                        <Clock size={16} className={isCompleted ? "text-green-600" : daysLeft < 0 ? "text-red-600" : "text-green-600"} />
                                                                    </div>
                                                                    <div><p className="text-xs text-gray-500">{isCompleted ? "Completed" : "Deadline"}</p><p className="text-sm font-semibold">{isCompleted ? formatDate(actualCompletionDate) : formatDate(completionDate)}</p></div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-purple-50 rounded-lg"><TrendingUp size={16} className="text-purple-600" /></div>
                                                                    <div><p className="text-xs text-gray-500">Status</p><p className="text-sm font-semibold">{progress === 100 ? "Completed" : progress > 0 ? "Ongoing" : "Pending"}</p></div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-2 bg-indigo-50 rounded-lg"><UserStar size={16} className="text-indigo-600" /></div>
                                                                    <div><p className="text-xs text-gray-500">Client</p><p className="text-sm font-semibold">{project?.client_detail?.client_name || getClientName(project)}</p></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <button onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedCard(isExpanded ? null : projectId);
                                                                if (!isExpanded) {
                                                                    fetchProjectDetailsIfNeeded(projectId);
                                                                }
                                                            }} className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
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


                                                                    <button
                                                                        onClick={() => {
                                                                            handleEditProject(projectId);
                                                                        }}
                                                                        className="flex items-center gap-3 px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 w-full"
                                                                    >
                                                                        <Pencil size={16} />
                                                                        <span>Edit Project</span>
                                                                    </button>


                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>



                                                    {/* Progress Section */}
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
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3">
                                                                        <p className="text-xs text-gray-500 mb-1">Total Length</p>
                                                                        <p className="text-xl font-bold text-blue-700">{getTotalLength(project)} <span className="text-sm font-normal">{getSectorUnit(project)}</span></p>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3">
                                                                        <p className="text-xs text-gray-500 mb-1">Workorder Amount</p>
                                                                        <p className="text-xl font-bold text-green-700">₹{getCost(project)} <span className="text-sm font-normal">Lakhs</span></p>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3">
                                                                        <p className="text-xs text-gray-500 mb-1">GST Amount</p>
                                                                        <p className="text-xl font-bold text-orange-700">₹{calculateGSTAmount(project)} <span className="text-sm font-normal">Lakhs</span></p>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3">
                                                                        <p className="text-xs text-gray-500 mb-1">Total with GST</p>
                                                                        <p className="text-xl font-bold text-teal-700">₹{calculateTotalWithGST(project)} <span className="text-sm font-normal">Lakhs</span></p>
                                                                    </div>
                                                                </div>

                                                                {/* Two Column Layout for Details */}
                                                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                                                    <div className="bg-gray-50 rounded-xl p-4">
                                                                        <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                                                            <Building2 size={18} className="text-blue-600" />
                                                                            Basic Information
                                                                        </h4>
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Project Code :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{projectCode}</span>
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
                                                                                <span className="text-sm text-gray-500 w-40">Our Company :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{getCompanyName(project)}</span>
                                                                            </div>
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Sector :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{getSectorName(project)}</span>
                                                                            </div>
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Client :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{project?.client_detail?.client_name || getClientName(project)}</span>
                                                                            </div>
                                                                            {project.clientbranch && (() => {
                                                                                // const matchedBranch = project.client_detail?.branches?.find(b => b.gst?.trim() === project.clientbranch?.trim());
                                                                                const matchedBranch = project.client_detail?.branches
                                                                                return (
                                                                                    <>
                                                                                        <div className="flex items-center py-2 border-b border-gray-200">
                                                                                            <span className="text-sm text-gray-500 w-40">Branch :</span>
                                                                                            <span className="text-sm font-medium text-gray-800">{matchedBranch?.name?.trim() || ""} - {matchedBranch?.state?.trim() || ""}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center py-2">
                                                                                            <span className="text-sm text-gray-500 w-40">Client GST :</span>
                                                                                            <span className="text-sm font-medium text-gray-800">{matchedBranch?.gst || "—"}</span>
                                                                                        </div>
                                                                                    </>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-gray-50 rounded-xl p-4">
                                                                        <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                                                            <Calendar size={18} className="text-green-600" />
                                                                            Project Specifications & Dates
                                                                        </h4>
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Total Length :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{getTotalLength(project)} {getSectorUnit(project)}</span>
                                                                            </div>
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Workorder Amount :</span>
                                                                                <span className="text-sm font-medium text-gray-800">₹{getCost(project)} Lakhs</span>
                                                                            </div>
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">LOA Date :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{formatDate(getLoaDate(project))}</span>
                                                                            </div>
                                                                            <div className="flex items-center py-2 border-b border-gray-200">
                                                                                <span className="text-sm text-gray-500 w-40">Completion Date :</span>
                                                                                <span className="text-sm font-medium text-gray-800">{formatDate(completionDate)}</span>
                                                                            </div>
                                                                            {isCompleted && actualCompletionDate && (
                                                                                <div className="flex items-center py-2 border-b border-gray-200">
                                                                                    <span className="text-sm text-gray-500 w-40">Actual Completion Date :</span>
                                                                                    <span className="text-sm font-medium text-green-600">{formatDate(actualCompletionDate)}</span>
                                                                                </div>
                                                                            )}
                                                                            {!isCompleted && daysLeft !== undefined && (
                                                                                <div className={`flex items-center py-2 border-b border-gray-200 ${daysLeft < 0 ? "bg-red-50 -mx-2 px-2 rounded-lg" : daysLeft <= 2 ? "bg-orange-50 -mx-2 px-2 rounded-lg" : ""}`}>
                                                                                    <span className="text-sm text-gray-500 w-40">Days Remaining :</span>
                                                                                    <span className={`text-sm font-bold ${daysLeft < 0 ? "text-red-600" : daysLeft <= 2 ? "text-blue-600" : "text-green-600"}`}>
                                                                                        {daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)} days` : `${daysLeft} days left`}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

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
                                                                                                <Briefcase size={18} className="text-blue-600" />
                                                                                                Activities & Sub-Activities ({projectData?.activities_detail?.length})
                                                                                            </h4>
                                                                                            <div className="space-y-3 max-h-[900px] overflow-y-auto pr-2">
                                                                                                {[...(projectData?.activities_detail || [])]
                                                                                                    // .sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0))
                                                                                                    .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0))
                                                                                                    .map((activity, actIndex) => {
                                                                                                        const subs = activity.subactivities || [];
                                                                                                        const isActivityExpanded = expandedActivities[activity.id];
                                                                                                        // const activityProgress = subs.length > 0 ? (subs.filter(s => s.is_completed || s.status === "Complete").length / subs.length) * 100 : 0;
                                                                                                        const activityProgress = activity.physical_progress || 0
                                                                                                        const financialProgress = activity.financial_progress || 0;
                                                                                                        const daysLeft = calculateDaysLeft(activity?.end_date || activity.endDate);
                                                                                                        return (
                                                                                                            <div key={activity.id || actIndex} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                                                                                                                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={(e) => toggleActivity(activity.id, e)}>
                                                                                                                    <div className="flex-1">
                                                                                                                        <div className="flex items-center gap-3 flex-wrap">
                                                                                                                            <h5 className="font-semibold text-gray-800">{activity.activity_name}</h5>
                                                                                                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">Weightage: {activity.weightage || 0}%</span>
                                                                                                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">{subs.length} tasks</span>
                                                                                                                            <span className={`text-xs px-2 py-1 rounded-full ${activityProgress == 100 ? "bg-green-100 text-green-600" : daysLeft < 0 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                                                                                                                                {activityProgress == 100 ? "Completed" : daysLeft < 0 ? "Delayed" : "Ongoing"}
                                                                                                                            </span>
                                                                                                                        </div>

                                                                                                                        {activity.start_date && activity.end_date && (
                                                                                                                            <p className="text-xs text-gray-400 mt-2">{formatDate(activity.start_date)} → {formatDate(activity.end_date)}</p>
                                                                                                                        )}
                                                                                                                    </div>
                                                                                                                    <button className="p-2 hover:bg-white rounded-lg transition-colors">
                                                                                                                        {isActivityExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                                                                                    </button>
                                                                                                                </div>

                                                                                                                <AnimatePresence>
                                                                                                                    {isActivityExpanded && (
                                                                                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-200">
                                                                                                                            <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
                                                                                                                                <div className="max-h-[500px] overflow-y-auto relative">
                                                                                                                                    <table className="w-full text-sm">
                                                                                                                                        <thead className="sticky top-0 z-10 bg-gray-100 text-[10px] uppercase text-gray-600 shadow-sm">
                                                                                                                                            <tr>
                                                                                                                                                <th className="px-2 py-3"></th>
                                                                                                                                                <th className="px-2 py-3 text-left">Sub Activity</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Chainage</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Qty</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Area</th>
                                                                                                                                                <th className="px-2 py-3 text-center">View</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Stage</th>
                                                                                                                                                <th className="px-2 py-3 text-center">%</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Amount ₹</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Raised</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Received</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Remaining</th>
                                                                                                                                                <th className="px-2 py-3 text-center" title="Project Owner Status">PO Status</th>
                                                                                                                                                {/* <th className="px-2 py-3 text-center" >Status</th> */}
                                                                                                                                                <th className="px-2 py-3 text-center">Action</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Invoice Status</th>
                                                                                                                                                <th className="px-2 py-3 text-center">Tl Work Log</th>
                                                                                                                                            </tr>
                                                                                                                                        </thead>
                                                                                                                                        <tbody>
                                                                                                                                            {/* {subs */}
                                                                                                                                            {[...(subs || [])]
                                                                                                                                                .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0))
                                                                                                                                                .map((sub, i) => {
                                                                                                                                                    const stages = sub?.payment_stages || [];

                                                                                                                                                    const getAmount = (type, status, key) => {
                                                                                                                                                        return stages
                                                                                                                                                            .filter(
                                                                                                                                                                (s) => s.stage_type === type && s.to_status === status
                                                                                                                                                            )
                                                                                                                                                            .reduce((sum, item) => sum + (item?.[key] || 0), 0);
                                                                                                                                                    };
                                                                                                                                                    const submissionAmount = (((project?.workorder_cost || 0) * (sub?.submission_payment || 0)) / 100) * 1.18;
                                                                                                                                                    const approvalAmount = (((project?.workorder_cost || 0) * (sub?.approval_payment || 0)) / 100) * 1.18;
                                                                                                                                                    // submission
                                                                                                                                                    const subRaised = getAmount("submission", "Raised", "raised_amount");
                                                                                                                                                    const subReceived = getAmount("submission", "Received", "received_amount");
                                                                                                                                                    const subRemaining = submissionAmount - subReceived;

                                                                                                                                                    // approval
                                                                                                                                                    const apprRaised = getAmount("approval", "Raised", "raised_amount");
                                                                                                                                                    const apprReceived = getAmount("approval", "Received", "received_amount");

                                                                                                                                                    const apprRemaining = approvalAmount - apprReceived;
                                                                                                                                                    const submissionStatus = sub?.submission_status;
                                                                                                                                                    const approvalStatus = sub?.approval_status;
                                                                                                                                                    const changeStatus = (sub.status || "Pending");
                                                                                                                                                    // const blurstatus = sub?.submission_status === "Waiting" && sub.status == "Pending" ? "opacity-50" : "";
                                                                                                                                                    const blurstatus = ""
                                                                                                                                                    return (
                                                                                                                                                        <Fragment key={sub.id}>
                                                                                                                                                            {sub.stages && sub.stages.length > 0 ? (
                                                                                                                                                                sub.stages.map((stage, sIdx) => {
                                                                                                                                                                    // Stage Calculations
                                                                                                                                                                    const stageAmount = (((project?.workorder_cost || 0) * (parseFloat(stage.payment_percent) || 0)) / 100) * 1.18;
                                                                                                                                                                    const raisedLogs = (stage.payment_logs || []).filter(
                                                                                                                                                                        (log) => log.to_status === "Raised"
                                                                                                                                                                    );


                                                                                                                                                                    const stageRaised1 = raisedLogs.reduce(
                                                                                                                                                                        (sum, item) => sum + (parseFloat(item.raised_amount) || 0),
                                                                                                                                                                        0
                                                                                                                                                                    );

                                                                                                                                                                    // Extract Raised/Received directly from the stage's payment_logs if available
                                                                                                                                                                    const stageRaised = ((stage.payment_logs || [])
                                                                                                                                                                        .filter(log => log.to_status === "Raised")
                                                                                                                                                                        .reduce((sum, item) => sum + (parseFloat(item.raised_amount) || 0), 0))
                                                                                                                                                                    // + (parseFloat(stage.extra_payment_amount) || 0);

                                                                                                                                                                    const stageReceived = (stage.payment_logs || [])
                                                                                                                                                                        .filter(log => log.to_status === "Received")
                                                                                                                                                                        .reduce((sum, item) => sum + (parseFloat(item.received_amount) || 0), 0);

                                                                                                                                                                    const stageRemaining = stageAmount - stageReceived;

                                                                                                                                                                    const workStatus = stage.work_status || "Pending";
                                                                                                                                                                    const invoiceStatus = stage.payment_status || "Waiting";
                                                                                                                                                                    const rowSpanCount = Math.max(1, sub.stages?.length || 0);

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

                                                                                                                                                                            {/* 🔵 Dynamic Stage Info Columns */}

                                                                                                                                                                            <td className="text-center font-semibold text-blue-600 border-gray-300 py-3">{stage.name}</td>
                                                                                                                                                                            <td className="text-center text-blue-600">{stage.payment_percent || 0}%</td>
                                                                                                                                                                            <td className="text-center">₹ {stageAmount.toFixed(2)} L {stage.extra_payment_amount ? ` + ${stage.extra_payment_amount.toFixed(2)}` : ''} L</td>

                                                                                                                                                                            {/* Raised */}
                                                                                                                                                                            <td className="text-center">
                                                                                                                                                                                {stageRaised.toFixed(2)} L
                                                                                                                                                                                {!isUser && stage.payment_logs?.length > 0 && (
                                                                                                                                                                                    <FileText
                                                                                                                                                                                        className="inline-block ml-1 -mt-1 text-red-500 cursor-pointer"
                                                                                                                                                                                        size={13}
                                                                                                                                                                                        title="View Raised Files"
                                                                                                                                                                                        onClick={(e) => {
                                                                                                                                                                                            e.stopPropagation();
                                                                                                                                                                                            setViewDocumentModel({
                                                                                                                                                                                                model: true,
                                                                                                                                                                                                data: stage.payment_logs.filter((log) => log.to_status === "Raised"),
                                                                                                                                                                                                title: `${stage.name} Raised Documents`
                                                                                                                                                                                            });
                                                                                                                                                                                        }}
                                                                                                                                                                                    />
                                                                                                                                                                                )}
                                                                                                                                                                            </td>

                                                                                                                                                                            {/* Received */}
                                                                                                                                                                            {/* Received */}
                                                                                                                                                                            <td className="text-center">
                                                                                                                                                                                {stageReceived === 0 && (stage.payment_logs || []).some(log => log.to_status === "Raised") ? (
                                                                                                                                                                                    getDaysStatus(
                                                                                                                                                                                        (stage.payment_logs || []).find(log => log.to_status === "Raised")?.created_at
                                                                                                                                                                                    )
                                                                                                                                                                                ) : (
                                                                                                                                                                                    `${stageReceived.toFixed(2)} L`
                                                                                                                                                                                )}
                                                                                                                                                                            </td>

                                                                                                                                                                            {/* Remaining */}
                                                                                                                                                                            <td className={`text-center font-medium ${stageRemaining <= 0 ? "text-green-500" : "text-red-500"}`}>
                                                                                                                                                                                {stageRemaining <= 0 ? "0.00" : stageRemaining.toFixed(2)} L
                                                                                                                                                                            </td>

                                                                                                                                                                            {/* PO Work Status */}
                                                                                                                                                                            <td className="text-center">
                                                                                                                                                                                <div className="relative inline-block py-2 !inline-flex items-center">
                                                                                                                                                                                    <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                      ${workStatus === "Inprogress" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                            workStatus === "Submitted" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                                workStatus === "Rejected" ? "bg-red-100 text-red-600 border-red-200" :
                                                                                                                                                                                                    workStatus === "Approved" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                                        workStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                                            "bg-gray-100 text-gray-600 border-gray-200"}`}
                                                                                                                                                                                    >
                                                                                                                                                                                        {/* {workStatus === "Approved" ? "Submitted" : workStatus === "Pending" ? "Not Started" : workStatus} */}
                                                                                                                                                                                        {workStatus === "Pending" ? "Not Started" : workStatus}
                                                                                                                                                                                    </span>
                                                                                                                                                                                </div>
                                                                                                                                                                            </td>



                                                                                                                                                                            {/* Action (Approve/Reject Dropdown for Submitted/Approved tasks, Submit button for others) */}
                                                                                                                                                                            <td className="text-center">
                                                                                                                                                                                {!isUser && (
                                                                                                                                                                                    (workStatus === "Submitted" || workStatus === "Approved") ? (
                                                                                                                                                                                        // Show Approve/Reject dropdown when status is Submitted OR Approved
                                                                                                                                                                                        <div className="relative inline-block">
                                                                                                                                                                                            <select
                                                                                                                                                                                                onChange={(e) => {
                                                                                                                                                                                                    e.stopPropagation();
                                                                                                                                                                                                    const action = e.target.value;
                                                                                                                                                                                                    if (action === "Approve") {
                                                                                                                                                                                                        setShowProofModal(true);
                                                                                                                                                                                                        setProofData({
                                                                                                                                                                                                            ...proofData,
                                                                                                                                                                                                            stage: stage.id,
                                                                                                                                                                                                            to_status: "Approved",
                                                                                                                                                                                                            projectId: projectId
                                                                                                                                                                                                        });
                                                                                                                                                                                                    } else if (action === "Reject") {
                                                                                                                                                                                                        setShowProofModal(true);
                                                                                                                                                                                                        setProofData({
                                                                                                                                                                                                            ...proofData,
                                                                                                                                                                                                            stage: stage.id,
                                                                                                                                                                                                            to_status: "Rejected",
                                                                                                                                                                                                            projectId: projectId
                                                                                                                                                                                                        });
                                                                                                                                                                                                    }
                                                                                                                                                                                                    // Reset select value to default
                                                                                                                                                                                                    e.target.value = "";
                                                                                                                                                                                                }}
                                                                                                                                                                                                defaultValue=""
                                                                                                                                                                                                className="mx-2 h-8 w-24 box-border text-xs px-2 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"                                                                                                                                                                                            >
                                                                                                                                                                                                <option value="" disabled>Action</option>
                                                                                                                                                                                                {/* Hide Approve option if it's already Approved */}
                                                                                                                                                                                                {workStatus !== "Approved" && (
                                                                                                                                                                                                    <option value="Approve" className="text-green-600">✅ Approve</option>
                                                                                                                                                                                                )}
                                                                                                                                                                                                <option value="Reject" className="text-red-600">❌ Reject</option>
                                                                                                                                                                                            </select>
                                                                                                                                                                                        </div>
                                                                                                                                                                                    ) : (
                                                                                                                                                                                        // Show Submit button for other statuses (Pending, Inprogress, Rejected, etc.)
                                                                                                                                                                                        <button
                                                                                                                                                                                            onClick={(e) => {
                                                                                                                                                                                                e.stopPropagation();
                                                                                                                                                                                                setShowProofModal(true);
                                                                                                                                                                                                setProofData({
                                                                                                                                                                                                    ...proofData,
                                                                                                                                                                                                    stage: stage.id,
                                                                                                                                                                                                    to_status: "Submitted",
                                                                                                                                                                                                    projectId: projectId
                                                                                                                                                                                                });
                                                                                                                                                                                            }}
                                                                                                                                                                                            disabled={workStatus === "Completed"}
                                                                                                                                                                                            className={`h-8 w-24 box-border border border-transparent text-xs px-2 py-1 flex items-center justify-center gap-1 mx-auto rounded transition  ${workStatus === "Completed"
                                                                                                                                                                                                ? "!cursor-no-drop opacity-50 bg-gray-100 text-gray-500"
                                                                                                                                                                                                : workStatus === "Rejected"
                                                                                                                                                                                                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                                                                                                                                                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                                                                                                                                                }`}
                                                                                                                                                                                            title={workStatus === "Rejected" ? "Resubmit with corrections" : "Submit Proof"}
                                                                                                                                                                                        >
                                                                                                                                                                                            <CheckCircle size={12} />
                                                                                                                                                                                            {workStatus === "Rejected" ? "Resubmit" : "Submit"}
                                                                                                                                                                                        </button>
                                                                                                                                                                                    )
                                                                                                                                                                                )}
                                                                                                                                                                            </td>

                                                                                                                                                                            {/* Invoice Status */}
                                                                                                                                                                            <td className="text-center">
                                                                                                                                                                                <div className="relative inline-block py-2 !inline-flex items-center">
                                                                                                                                                                                    <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                      ${invoiceStatus === "Pending" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                            invoiceStatus === "Raised" ? "bg-blue-100 text-blue-600 border-blue-200" :
                                                                                                                                                                                                invoiceStatus === "Received" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                                    invoiceStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                                        "bg-gray-100 text-gray-600 border-gray-200"}`}
                                                                                                                                                                                    >
                                                                                                                                                                                        {invoiceStatus === "Waiting" ? "Not Started" : invoiceStatus}
                                                                                                                                                                                    </span>
                                                                                                                                                                                </div>
                                                                                                                                                                            </td>
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
                                                                                                                                                                    <td colSpan="9" className="text-center text-gray-400 py-4 italic">No work stages found for this sub-activity</td>
                                                                                                                                                                </tr>
                                                                                                                                                            )}


                                                                                                                                                            {expandedRow === sub.id && (
                                                                                                                                                                <tr className="bg-gray-50">
                                                                                                                                                                    <td colSpan="14" className="px-4 py-4">
                                                                                                                                                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">

                                                                                                                                                                            {/* Header */}
                                                                                                                                                                            <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
                                                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                                                                                                                                                                        <Clock size={16} className="text-blue-600" />
                                                                                                                                                                                    </div>
                                                                                                                                                                                    <span className="text-sm font-semibold text-gray-700">Time Logs</span>
                                                                                                                                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                                                                                                                                                                        {sub.work_summary?.users?.length || 0} contributors
                                                                                                                                                                                    </span>
                                                                                                                                                                                </div>
                                                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                                                    <div className="text-xs text-gray-500">Total Hours:</div>
                                                                                                                                                                                    <div className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                                                                                                                                                        {formatDuration(sub.work_summary?.total_hours || "00:00:00")}
                                                                                                                                                                                    </div>
                                                                                                                                                                                </div>
                                                                                                                                                                            </div>

                                                                                                                                                                            {/* User Summary Cards */}
                                                                                                                                                                            {sub.work_summary?.users?.length > 0 && (
                                                                                                                                                                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                                                                                                                                                                    <div className="flex flex-wrap gap-3">
                                                                                                                                                                                        {sub.work_summary.users.map((userLog, i) => (
                                                                                                                                                                                            <div
                                                                                                                                                                                                key={i}
                                                                                                                                                                                                className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                                                                                                                                                                                            >
                                                                                                                                                                                                {userLog.profilepic ? (
                                                                                                                                                                                                    <CustomImageModal customStyle>
                                                                                                                                                                                                        <img
                                                                                                                                                                                                            src={`${IMAGE_URL}${userLog.profilepic}`}
                                                                                                                                                                                                            alt={userLog.name}
                                                                                                                                                                                                            className="w-8 h-8 rounded-full object-cover"
                                                                                                                                                                                                        />
                                                                                                                                                                                                    </CustomImageModal>
                                                                                                                                                                                                ) : (
                                                                                                                                                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                                                                                                                                                                                                        {userLog.name?.charAt(0)?.toUpperCase()}
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                )}
                                                                                                                                                                                                <div>
                                                                                                                                                                                                    <p className="text-sm font-medium text-gray-800">{userLog.name}</p>
                                                                                                                                                                                                    <div className="flex items-center gap-2 text-xs">
                                                                                                                                                                                                        <span className="text-gray-400">
                                                                                                                                                                                                            {userLog.days_worked} day{userLog.days_worked !== 1 ? 's' : ''}
                                                                                                                                                                                                        </span>
                                                                                                                                                                                                        <span className="text-gray-300">•</span>
                                                                                                                                                                                                        <span className="font-semibold text-blue-600">
                                                                                                                                                                                                            {formatDuration(userLog.total_time_spent)}
                                                                                                                                                                                                        </span>
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                </div>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        ))}
                                                                                                                                                                                    </div>
                                                                                                                                                                                </div>
                                                                                                                                                                            )}

                                                                                                                                                                            {/* Detailed Daily Logs - With Date-wise breakdown */}
                                                                                                                                                                            <div className="max-h-[400px] overflow-y-auto">
                                                                                                                                                                                {sub.work_summary?.users?.length > 0 ? (
                                                                                                                                                                                    <div className="divide-y divide-gray-100">
                                                                                                                                                                                        {sub.work_summary.users.map((userLog, userIdx) => (
                                                                                                                                                                                            <div key={userIdx} className="bg-white">

                                                                                                                                                                                                {/* User Header for daily logs */}
                                                                                                                                                                                                <div className="px-5 py-2 bg-gray-50 flex items-center gap-2 sticky top-0 z-10">
                                                                                                                                                                                                    {/* <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                                                                                                                                                                                        {userLog.name?.charAt(0)?.toUpperCase()}
                                                                                                                                                                                                        </div> */}
                                                                                                                                                                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                                                                                                                                                                        {userLog.profilepic ? (
                                                                                                                                                                                                            <CustomImageModal customStyle>
                                                                                                                                                                                                                <img
                                                                                                                                                                                                                    src={`${IMAGE_URL}${userLog.profilepic}`}
                                                                                                                                                                                                                    alt={userLog.name}
                                                                                                                                                                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                                                                                                                                                                />
                                                                                                                                                                                                            </CustomImageModal>
                                                                                                                                                                                                        ) : (
                                                                                                                                                                                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium">
                                                                                                                                                                                                                {userLog.name?.charAt(0)?.toUpperCase()}
                                                                                                                                                                                                            </div>
                                                                                                                                                                                                        )}
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                    <span className="text-xs font-medium text-gray-600">{userLog.name}</span>
                                                                                                                                                                                                    <div className="flex gap-1 ml-auto text-xs text-gray-400">
                                                                                                                                                                                                        <span className="text-xs text-gray-500">
                                                                                                                                                                                                            Total: {formatDuration(userLog.total_time_spent)}
                                                                                                                                                                                                        </span>
                                                                                                                                                                                                        <span className="text-xs text-gray-400">
                                                                                                                                                                                                            (
                                                                                                                                                                                                            {userLog.days_worked} day{userLog.days_worked !== 1 ? 's' : ''}
                                                                                                                                                                                                            )
                                                                                                                                                                                                        </span>
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                </div>

                                                                                                                                                                                                {/* Date-wise logs for this user */}
                                                                                                                                                                                                <div className="px-5 py-3 space-y-3">
                                                                                                                                                                                                    {userLog.date_wise?.map((dayLog, dayIdx) => (
                                                                                                                                                                                                        <div key={dayIdx} className="border-l-2 border-blue-200 pl-3">
                                                                                                                                                                                                            {/* Date Header */}
                                                                                                                                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                                                                                                                                <Calendar size={12} className="text-gray-400" />
                                                                                                                                                                                                                <span className="text-xs font-medium text-gray-500">
                                                                                                                                                                                                                    {new Date(dayLog.date).toLocaleDateString('en-IN', {
                                                                                                                                                                                                                        weekday: 'short',
                                                                                                                                                                                                                        year: 'numeric',
                                                                                                                                                                                                                        month: 'short',
                                                                                                                                                                                                                        day: 'numeric'
                                                                                                                                                                                                                    })}
                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                                                                                                                                                                    {formatDuration(dayLog.total_time_spent)}
                                                                                                                                                                                                                </span>
                                                                                                                                                                                                            </div>

                                                                                                                                                                                                            {/* Log entries for this date */}
                                                                                                                                                                                                            <div className="space-y-2 ml-2">
                                                                                                                                                                                                                {dayLog.logs?.map((log, logIdx) => (
                                                                                                                                                                                                                    <div
                                                                                                                                                                                                                        key={logIdx}
                                                                                                                                                                                                                        className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                                                                                                                                                                                                                    >
                                                                                                                                                                                                                        <div className="flex justify-between items-start">
                                                                                                                                                                                                                            <div className="flex-1">
                                                                                                                                                                                                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                                                                                                                                                                                    {log.work_type && (
                                                                                                                                                                                                                                        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                                                                                                                                                                                                                            {log.work_type}
                                                                                                                                                                                                                                        </span>
                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                    {log.description && (
                                                                                                                                                                                                                                        <p className="text-sm text-gray-600 leading-relaxed">
                                                                                                                                                                                                                                            {log.description}
                                                                                                                                                                                                                                        </p>
                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                {!log.description && !log.work_type && (
                                                                                                                                                                                                                                    <p className="text-sm text-gray-400 italic">
                                                                                                                                                                                                                                        No description provided
                                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                                )}
                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                            <div className="ml-3">
                                                                                                                                                                                                                                <span
                                                                                                                                                                                                                                    className="text-xs font-mono font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded whitespace-nowrap"
                                                                                                                                                                                                                                    title={formatDurationDetailed(log.time_spent)}
                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                    {formatDuration(log.time_spent)}
                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                ))}
                                                                                                                                                                                                            </div>
                                                                                                                                                                                                        </div>
                                                                                                                                                                                                    ))}

                                                                                                                                                                                                    {/* Show if user has no date-wise logs but has total time */}
                                                                                                                                                                                                    {(!userLog.date_wise || userLog.date_wise.length === 0) && userLog.total_time_spent !== "00:00:00" && (
                                                                                                                                                                                                        <div className="text-sm text-gray-500 italic ml-2">
                                                                                                                                                                                                            No detailed logs available for this user
                                                                                                                                                                                                        </div>
                                                                                                                                                                                                    )}
                                                                                                                                                                                                </div>
                                                                                                                                                                                            </div>
                                                                                                                                                                                        ))}
                                                                                                                                                                                    </div>
                                                                                                                                                                                ) : (
                                                                                                                                                                                    <div className="px-5 py-12 text-center">
                                                                                                                                                                                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                                                                                                                                                                                            <Clock size={24} className="text-gray-400" />
                                                                                                                                                                                        </div>
                                                                                                                                                                                        <p className="text-sm text-gray-400">No time logs recorded yet</p>
                                                                                                                                                                                        <p className="text-xs text-gray-300 mt-1">Time logs will appear here once team members log their work hours</p>
                                                                                                                                                                                    </div>
                                                                                                                                                                                )}
                                                                                                                                                                            </div>

                                                                                                                                                                            {/* Collapse Button */}
                                                                                                                                                                            <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex justify-center">
                                                                                                                                                                                <button
                                                                                                                                                                                    onClick={() => setExpandedRow(null)}
                                                                                                                                                                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                                                                                                                                                                                >
                                                                                                                                                                                    <ChevronUp size={14} />
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
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </>
                                                                )}

                                                                {/* Assigned Personnel Section */}
                                                                <div className="mt-6 bg-gray-50 rounded-xl p-4">
                                                                    <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                                                        <UserCog size={18} className="text-blue-600" />
                                                                        Assigned Personnel
                                                                    </h4>
                                                                    <div className="flex flex-row gap-4 flex-wrap">
                                                                        {expandedProjectDetails[projectId]?.assigned_to_detail?.length > 0 && (
                                                                            expandedProjectDetails[projectId]?.assigned_to_detail?.map((data, index) => (
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
                                                                                        <p className="text-sm font-medium text-gray-800">{data?.name}</p>
                                                                                        {/* <p className="text-xs text-gray-500">{data?.role || "Project Owner"}</p> */}
                                                                                        <p className="text-xs text-gray-500">{expandedProjectDetails[projectId]?.assigned_to_detail?.length > 1 ? "Project CO-Owner" : "Project Owner"}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                    </>
                )}
            </div>
        </motion.div >
    );
};

export default TlProjectList;