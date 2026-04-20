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
    FileText
} from "lucide-react";
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
    tlSubactivitySubmitwithProof
} from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import TaskPicker from "../tasks/TaskPicker";
import LoadingModal from "../../components/modals/LoadingModal";
import { SECTOR_UNIT_MAPPING } from "../../utils/enumMapping";
import { saveDailyWorkLog } from "../tasks/taskSlice";
import { p } from "framer-motion/client";

const TlProjectList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get projects and user from Redux store
    const {
        projects = [],
        projectsOnly = [],
        projectDetails = {},
        loading: apiLoading = false,
        companies = [],
        subCompanies = [],
        sectors = [],
        clients = []
    } = useSelector((state) => state.api || {});
    const { user } = useSelector((state) => state.auth);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("deadline");
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
    const [isSaving, setIsSaving] = useState(false);
    const [handleApprovalStatus, setHandleStatus] = useState({});
    const [showProofModal, setShowProofModal] = useState(false);
    const [proofData, setProofData] = useState({
        documents: [],
        subactivity: "",
        to_status: "Submitted",
        changed_by: user?.emp_code || "",
        remarks: "",
        document_type: "ref_doc",
        client_remarks: "",
    });
    const [viewdocumentmodel, setViewDocumentModel] = useState({
        model: false,
        data: []
    });

    // const [selectedTaskfortimelog, setSelectedTaskfortimelog] = useState(null);
    // const [worklogreturned, setWorkLogReturned] = useState([]);
    // const [timeLogData, setTimeLogData] = useState({
    //     date: new Date().toISOString().split('T')[0],
    //     startTime: '',
    //     endTime: '',
    //     description: ''
    // });

    const [expandedProjectDetails, setExpandedProjectDetails] = useState({});
    const [loadingProjectDetails, setLoadingProjectDetails] = useState({});

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

    // Load all data in a single loading session
    useEffect(() => {
        const loadAllData = async () => {
            setIsInitialLoading(true);
            setLoadingMessage("Loading Projects");
            setLoadingSubMessage("Fetching project data...");
            try {
                await Promise.all([
                    dispatch(fetchCompanies()).unwrap(),
                    dispatch(fetchSectors()).unwrap(),
                    dispatch(fetchClients()).unwrap(),
                    // dispatch(fetchProjects()).unwrap()
                    dispatch(fetchOnlyProjectsList()).unwrap(),
                ]);
            } catch (error) {
                console.error("Error loading data:", error);
                dispatch(showSnackbar({
                    message: "Failed to load data from server",
                    type: "warning"
                }));
            } finally {
                setIsInitialLoading(false);
            }
        };
        loadAllData();
    }, [dispatch]);

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
                // dispatch(fetchProjects()).unwrap(),
                dispatch(fetchOnlyProjectsList()).unwrap(),
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
            ...prev,
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

    // Filter and sort projects
    const filteredProjects = useMemo(() => {
        if (!projectsOnly || !Array.isArray(projectsOnly)) return [];
        let filtered = [...projectsOnly];
        if (searchTerm) {
            filtered = filtered.filter(project => {
                const name = (project.project_name || project.name || "").toLowerCase();
                const code = (project.project_code || project.code || "").toLowerCase();
                const term = searchTerm.toLowerCase();
                return name.includes(term) || code.includes(term);
            });
        }
        if (filterStatus !== "all") {
            filtered = filtered.filter(project => {
                const projectStatus = project.status || "ONGOING";
                const progress = project.progress || 0;
                const daysLeft = getDaysUntilDeadline(project.completion_date || project.completionDate);
                if (filterStatus === "delayed") return (projectStatus === "DELAYED" || daysLeft < 0) && progress < 100;
                if (filterStatus === "critical") return daysLeft <= 2 && daysLeft >= 0 && progress < 100;
                if (filterStatus === "ongoing") return projectStatus === "ONGOING" && progress < 100;
                if (filterStatus === "completed") return progress === 100 || projectStatus === "COMPLETED";
                return true;
            });
        }
        filtered.sort((a, b) => {
            const aDays = getDaysUntilDeadline(a.completion_date || a.completionDate) || 999;
            const bDays = getDaysUntilDeadline(b.completion_date || b.completionDate) || 999;
            const aProgress = a.progress || 0;
            const bProgress = b.progress || 0;
            const aName = a.project_name || a.name || "";
            const bName = b.project_name || b.name || "";
            if (sortBy === "deadline") return aDays - bDays;
            if (sortBy === "progress") return bProgress - aProgress;
            if (sortBy === "name") return aName.localeCompare(bName);
            return 0;
        });
        return filtered;
    }, [projectsOnly, searchTerm, filterStatus, sortBy]);

    const stats = useMemo(() => {
        if (!projectsOnly || !Array.isArray(projectsOnly)) {
            return { total: 0, delayed: 0, critical: 0, completed: 0, ongoing: 0 };
        }
        return {
            total: projectsOnly.length,
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
            total: projectsOnly.length,

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
    }, [projectsOnly]);

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

    // const handleSaveTimeLog = async () => {
    //     if (!selectedTaskfortimelog) return;
    //     if (!timeLogData.startTime || !timeLogData.endTime) {
    //         dispatch(showSnackbar({ message: 'Please enter both start and end time', type: 'error' }));
    //         return;
    //     }
    //     if (timeLogData.startTime >= timeLogData.endTime) {
    //         dispatch(showSnackbar({ message: 'End time must be after start time', type: 'error' }));
    //         return;
    //     }
    //     setIsSaving(true);
    //     try {
    //         await dispatch(saveDailyWorkLog({
    //             projectId: selectedTaskfortimelog.project_id,
    //             subActivityId: selectedTaskfortimelog.id,
    //             date: timeLogData.date,
    //             startTime: timeLogData.startTime,
    //             endTime: timeLogData.endTime,
    //             note: timeLogData.description,
    //             status: 'WORKED'
    //         })).unwrap();
    //         dispatch(showSnackbar({ message: 'Work hours saved successfully!', type: 'success' }));
    //         const mixedData = { ...selectedTaskfortimelog, date: timeLogData.date, startTime: timeLogData.startTime, endTime: timeLogData.endTime, description: timeLogData.description };
    //         setWorkLogReturned((prev) => [...prev, mixedData]);
    //         setShowTimeLogModal(false);
    //         setSelectedTaskfortimelog(null);
    //         setTimeLogData({ date: new Date().toISOString().split('T')[0], startTime: '', endTime: '', description: '' });
    //     } catch (error) {
    //         dispatch(showSnackbar({ message: error.message || 'Failed to save record', type: 'error' }));
    //     } finally {
    //         setIsSaving(false);
    //     }
    // };

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
            console.error("Failed to fetch project details:", error);
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
            subactivity: "",
            to_status: "Submitted",
            changed_by: user?.emp_code || "",
            remarks: "",
            document_type: "ref_doc",
            client_remarks: ""
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
                {/* <AnimatePresence>
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
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                        <Clock size={20} className="text-blue-500" />
                                        Log Work Hours
                                    </h3>
                                    <button onClick={() => setShowTimeLogModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mb-5 p-3 bg-gray-50 rounded-xl border">
                                    <p className="font-medium text-gray-800">{selectedTaskfortimelog.subactivity_name}</p>
                                    <p className="text-sm text-gray-500">{selectedTaskfortimelog.project_name}</p>
                                </div>
                                <div className="mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
                                    <input
                                        type="date"
                                        value={timeLogData.date}
                                        onChange={(e) => setTimeLogData({ ...timeLogData, date: e.target.value })}
                                        max={new Date().toISOString().split("T")[0]}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                                        <select
                                            value={timeLogData.startTime}
                                            onChange={(e) => setTimeLogData({ ...timeLogData, startTime: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select</option>
                                            {Array.from({ length: 24 }).map((_, hour) =>
                                                ["00", "30"].map((min) => {
                                                    const time = `${String(hour).padStart(2, "0")}:${min}`;
                                                    return <option key={time} value={time}>{time}</option>;
                                                })
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">End Time</label>
                                        <select
                                            value={timeLogData.endTime}
                                            onChange={(e) => setTimeLogData({ ...timeLogData, endTime: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select</option>
                                            {Array.from({ length: 24 }).map((_, hour) =>
                                                ["00", "30"].map((min) => {
                                                    const time = `${String(hour).padStart(2, "0")}:${min}`;
                                                    return <option key={time} value={time}>{time}</option>;
                                                })
                                            )}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {[
                                        { label: "Full Day", start: "09:00", end: "18:00" },
                                        { label: "Half Day", start: "09:00", end: "13:00" },
                                        { label: "Evening", start: "14:00", end: "18:00" },
                                    ].map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setTimeLogData({ ...timeLogData, startTime: preset.start, endTime: preset.end })}
                                            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                                {timeLogData.startTime && timeLogData.endTime && (
                                    <div className="mb-4 p-3 rounded-lg border bg-blue-50">
                                        {timeLogData.endTime <= timeLogData.startTime ? (
                                            <p className="text-red-500 text-sm font-medium">End time must be after start time</p>
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-blue-700">Total Hours:</span>
                                                <span className="text-lg font-semibold text-blue-700">
                                                    {calculateHours(timeLogData.startTime, timeLogData.endTime).toFixed(2)} hrs
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mb-5">
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                    <textarea
                                        value={timeLogData.description}
                                        onChange={(e) => setTimeLogData({ ...timeLogData, description: e.target.value })}
                                        placeholder="Describe what you worked on..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowTimeLogModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                                    <button
                                        onClick={handleSaveTimeLog}
                                        disabled={isSaving || !timeLogData.startTime || !timeLogData.endTime || timeLogData.endTime <= timeLogData.startTime}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                                    >
                                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence> */}
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
                                    subactivity: "",
                                    to_status: "Submitted",
                                    changed_by: user?.emp_code || "",
                                    remarks: "",
                                    document_type: "ref_doc",
                                    client_remarks: ""
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
                                        📎 Submit Work Proof
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowProofModal(false)
                                            setProofData({
                                                documents: [],
                                                subactivity: "",
                                                to_status: "Submitted",
                                                changed_by: user?.emp_code || "",
                                                remarks: "",
                                                document_type: "ref_doc",
                                                client_remarks: ""
                                            })
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* UPLOAD AREA */}
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
                                    <p className="text-xs text-gray-400 mt-1">
                                        JPG, PNG, PDF, DOC
                                    </p>
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

                                {/* MESSAGE */}
                                <div className="mt-5">
                                    <label className="text-sm font-medium text-gray-700 block mb-1">
                                        Message
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

                                {/* ACTIONS */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowProofModal(false)
                                            setProofData({
                                                documents: [],
                                                subactivity: "",
                                                to_status: "Submitted",
                                                changed_by: user?.emp_code || "",
                                                remarks: "",
                                                document_type: "ref_doc",
                                                client_remarks: ""
                                            })
                                        }}
                                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={handleSubmitProof}
                                        disabled={(!proofData?.documents?.length || loder)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        Submit Proof
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
                        {projects.length > 0 && (
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
                                        placeholder="Search projects by name or code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                                    >
                                        <option value="all">All Projects</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="critical">Critical</option>
                                        <option value="delayed">Delayed</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <Filter className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                                </div>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
                                    >
                                        <option value="deadline">Sort by Deadline</option>
                                        <option value="progress">Sort by Progress</option>
                                        <option value="name">Sort by Name</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={20} />
                                </div>
                                {isAdmin && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate("/projects/create")}
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
                                        <button onClick={() => navigate("/projects/create")} className="bg-gradient-to-r from-blue-600 to-amber-600 text-white px-8 py-4 rounded-xl hover:shadow-xl transition-all inline-flex items-center gap-2 text-lg">
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
                                                                    <div className="p-2 bg-indigo-50 rounded-lg"><UserCheck size={16} className="text-indigo-600" /></div>
                                                                    <div><p className="text-xs text-gray-500">Client</p><p className="text-sm font-semibold">{project?.client_detail?.client_name || getClientName(project)}</p></div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); setExpandedCard(isExpanded ? null : projectId); }} className="p-3 hover:bg-gray-100 rounded-xl transition-colors">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Progress Section */}
                                                    <div className="mt-5">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-xs text-gray-500 font-medium">Overall Progress</span>
                                                            <span className="text-sm font-bold text-blue-600">{weightedProgress}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${weightedProgress}%` }}
                                                                transition={{ duration: 0.8 }}
                                                                // className={`h-2 rounded-full ${weightedProgress === 100 ? "bg-green-500" : weightedProgress > 70 ? "bg-blue-500" : weightedProgress > 40 ? "bg-yellow-500" : "bg-red-500"}`}
                                                                className={`h-2 rounded-full bg-blue-500`}

                                                            />
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
                                                                                    {projectData?.activities_detail.length > 0 && (
                                                                                        <div className="mt-6">
                                                                                            <h4 className="font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                                                                                <Briefcase size={18} className="text-blue-600" />
                                                                                                Activities & Sub-Activities ({projectData?.activities_detail.length})
                                                                                            </h4>
                                                                                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                                                                                {/* {projectData?.activities_detail?.sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0)).map((activity, actIndex) => { */}
                                                                                                {[...(projectData?.activities_detail || [])]
                                                                                                    .sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0))
                                                                                                    .map((activity, actIndex) => {
                                                                                                        const subs = activity.subactivities || [];
                                                                                                        const isActivityExpanded = expandedActivities[activity.id];
                                                                                                        // const activityProgress = subs.length > 0 ? (subs.filter(s => s.is_completed || s.status === "Complete").length / subs.length) * 100 : 0;
                                                                                                        const activityProgress = activity.activity_progress || 0
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
                                                                                                                        <div className="mt-2">
                                                                                                                            <div className="flex justify-between text-xs mb-1">
                                                                                                                                <span className="text-gray-500">Activity Progress</span>
                                                                                                                                <span className="font-medium text-blue-600">{Math.round(activityProgress)}%</span>
                                                                                                                            </div>
                                                                                                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                                                                                                <motion.div initial={{ width: 0 }} animate={{ width: `${activityProgress}%` }}
                                                                                                                                    // className="h-full bg-gradient-to-r from-blue-500 to-indigo--500 rounded-full" 
                                                                                                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                                                                                                                />
                                                                                                                            </div>
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
                                                                                                                                <table className="w-full text-sm">
                                                                                                                                    <thead className="bg-gray-100 text-[10px] uppercase text-gray-600">
                                                                                                                                        <tr>
                                                                                                                                            <th className="px-2 py-3"></th>
                                                                                                                                            <th className="px-2 py-3 text-left">Sub Activity</th>
                                                                                                                                            <th className="px-2 py-3 text-center">Chainage</th>
                                                                                                                                            <th className="px-2 py-3 text-center">Qty</th>
                                                                                                                                            <th className="px-2 py-3 text-center">Area</th>
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
                                                                                                                                            {/* <th className="px-2 py-3 text-center">Action</th> */}
                                                                                                                                        </tr>
                                                                                                                                    </thead>
                                                                                                                                    <tbody>
                                                                                                                                        {subs.map((sub, i) => {
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
                                                                                                                                                    <tr className="border-t text-[13px] ">
                                                                                                                                                        {/* <td rowSpan="2" className="px-2 text-center align-center text-lg">
                                                                                                                                                            {(sub.work_summary?.users.length > 0) && (
                                                                                                                                                                <button onClick={() => setExpandedRow(expandedRow === sub.id ? null : sub.id)}>
                                                                                                                                                                    {expandedRow === sub.id ? "−" : "+"}
                                                                                                                                                                </button>
                                                                                                                                                            )}
                                                                                                                                                        </td> */}
                                                                                                                                                        <td rowSpan="2" className="px-2 text-center align-middle">
                                                                                                                                                            {(sub.work_summary?.users?.length > 0) ? (
                                                                                                                                                                <motion.button
                                                                                                                                                                    onClick={() => setExpandedRow(expandedRow === sub.id ? null : sub.id)}
                                                                                                                                                                    whileHover={{ scale: 1.1 }}
                                                                                                                                                                    whileTap={{ scale: 0.95 }}
                                                                                                                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${expandedRow === sub.id
                                                                                                                                                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                                                                                                                                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                                                                                                                                        }`}
                                                                                                                                                                    title={expandedRow === sub.id ? "Collapse" : "Expand"}
                                                                                                                                                                >
                                                                                                                                                                    {expandedRow === sub.id ? (
                                                                                                                                                                        <ChevronUp size={14} />
                                                                                                                                                                    ) : (
                                                                                                                                                                        <ChevronDown size={14} />
                                                                                                                                                                    )}
                                                                                                                                                                </motion.button>
                                                                                                                                                            ) : (
                                                                                                                                                                <div className="w-6 h-6 opacity-0 pointer-events-none"></div>
                                                                                                                                                            )}
                                                                                                                                                        </td>
                                                                                                                                                        <td rowSpan="2" className="px-2 font-medium align-center">{sub.subactivity_name}</td>
                                                                                                                                                        <td rowSpan="2" className="text-center">{formatNumber(sub.chainage_start)}</td>
                                                                                                                                                        <td rowSpan="2" className="text-center">{sub.total_quantity}</td>
                                                                                                                                                        <td rowSpan="2" className="text-center">{formatNumber(sub.covered_area)}</td>

                                                                                                                                                        {
                                                                                                                                                            sub.submission_payment > 0 ? (
                                                                                                                                                                <>
                                                                                                                                                                    <td className={`text-center font-semibold text-green-600 border-b border-gray-300 border-l ${blurstatus}`}>Submission</td>
                                                                                                                                                                    <td className={`text-center text-green-600 border-b border-gray-300 ${blurstatus}`}>{sub.submission_payment}%</td>
                                                                                                                                                                    <td className={`text-center border-b border-gray-300 ${blurstatus}`}>₹ {submissionAmount.toFixed(2)} L</td>
                                                                                                                                                                    <td className={`text-center border-b border-gray-300 ${blurstatus}`}>{subRaised.toFixed(2)} L
                                                                                                                                                                        {
                                                                                                                                                                            subRaised > 0 &&
                                                                                                                                                                            <FileText className="inline-block ml-1 -mt-1 text-red-500" size={13} title="Raised Files" onClick={(e) => setViewDocumentModel({
                                                                                                                                                                                model: true,
                                                                                                                                                                                data: sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "submission") || [],
                                                                                                                                                                                title: "Raised Stage Documents"
                                                                                                                                                                            })} />
                                                                                                                                                                        }
                                                                                                                                                                    </td>
                                                                                                                                                                    <td className={`text-center border-b border-gray-300 ${blurstatus}`}>
                                                                                                                                                                        {subReceived == 0 && sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "submission")[0] ?
                                                                                                                                                                            getDaysStatus(sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "submission")[0]?.created_at)
                                                                                                                                                                            : subReceived.toFixed(2) + " L"}
                                                                                                                                                                        {
                                                                                                                                                                            subReceived > 0 &&
                                                                                                                                                                            <FileText className="inline-block ml-1 -mt-1 text-red-500" size={13} title="Raised Files" onClick={(e) => setViewDocumentModel({
                                                                                                                                                                                model: true,
                                                                                                                                                                                data: sub?.payment_stages?.filter((stage) => stage.to_status == "Received" && stage.stage_type == "submission") || [],
                                                                                                                                                                                title: "Received Stage Documents"
                                                                                                                                                                            })} />
                                                                                                                                                                        }
                                                                                                                                                                    </td>
                                                                                                                                                                    {/* <td className={"text-center border-b border-gray-300 " + blurstatus + (subRemaining.toFixed(2) == 0 ? " text-black-500" : subRemaining.toFixed(2) < 0 ? " text-green-500" : " text-red-500")}>
                                                                                                                                                                        {subRemaining.toFixed(2) == 0 ? "0" : subRemaining.toFixed(2)} L

                                                                                                                                                                        {console.log(sub?.submission_stages?.filter((stage) => stage.to_status == changeStatus)[0]?.created_at)}
                                                                                                                                                                    </td> */}

                                                                                                                                                                    <td
                                                                                                                                                                        className={"text-center border-b border-gray-300 " + blurstatus + (subRemaining.toFixed(2) == 0 ? " text-black-500" : subRemaining.toFixed(2) < 0 ? " text-green-500" : " text-red-500")}>
                                                                                                                                                                        {subRemaining.toFixed(2) === 0 ? "0" : subRemaining.toFixed(2)} L

                                                                                                                                                                    </td>
                                                                                                                                                                    <td className={"text-center border-b border-gray-300 " + blurstatus}>
                                                                                                                                                                        <div className="relative inline-block py-2 !inline-flex items-center" >
                                                                                                                                                                            <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                                                                                                                                                                                ${changeStatus === "Inprogress" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                    changeStatus === "Submitted" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                        changeStatus === "Rejected" ? "bg-red-100 text-red-600 border-red-200" :
                                                                                                                                                                                            changeStatus === "Approved" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                                changeStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                                    "bg-gray-100 text-gray-600 border-gray-200"
                                                                                                                                                                                }`}>
                                                                                                                                                                                {changeStatus == "Approved" ? "Submitted" : changeStatus == "Pending" ? "Not Started" : changeStatus}
                                                                                                                                                                            </span>
                                                                                                                                                                            {
                                                                                                                                                                                !isUser && sub?.submission_stages[0] && (changeStatus == "Submitted" || changeStatus == "Approved") &&
                                                                                                                                                                                <FileText className="inline-block ml-1 text-red-500" size={13} title="Raised Files"
                                                                                                                                                                                    onClick={(e) => setViewDocumentModel({
                                                                                                                                                                                        model: true,
                                                                                                                                                                                        data: sub?.submission_stages?.filter((stage) => stage.to_status == changeStatus) || [],
                                                                                                                                                                                        title: "Submission Stage Documents"
                                                                                                                                                                                    })} />
                                                                                                                                                                            }
                                                                                                                                                                        </div>
                                                                                                                                                                    </td>
                                                                                                                                                                    <td className={"text-center border-b border-gray-300 " + blurstatus}>
                                                                                                                                                                        {

                                                                                                                                                                            <button
                                                                                                                                                                                onClick={() => {
                                                                                                                                                                                    setShowProofModal(true)
                                                                                                                                                                                    setProofData({ ...proofData, subactivity: sub.id, to_status: "Submitted" })
                                                                                                                                                                                }}
                                                                                                                                                                                // disabled={changeStatus != "Inprogress"}
                                                                                                                                                                                className={`text-m px-1.5 text-green-600 flex items-center gap-1 `
                                                                                                                                                                                    // + (changeStatus != "Inprogress" ? "!cursor-no-drop opacity-70" : "")
                                                                                                                                                                                }
                                                                                                                                                                                title={"Submit"}>
                                                                                                                                                                                <CheckCircle size={12} /> Submit
                                                                                                                                                                            </button>
                                                                                                                                                                        }
                                                                                                                                                                    </td>
                                                                                                                                                                    <td className={`text-center border-b border-gray-300 ${blurstatus}`}>
                                                                                                                                                                        <div className="relative inline-block p-2 ${blurstatus}">
                                                                                                                                                                            <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                                                                                                                                                   ${submissionStatus === "Pending" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                    submissionStatus === "Raised" ? "bg-blue-100 text-blue-600 border-blue-200" :
                                                                                                                                                                                        submissionStatus === "Received" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                            submissionStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                                "bg-gray-100  border-gray-200"
                                                                                                                                                                                }`}>
                                                                                                                                                                                {submissionStatus == "Waiting" ? "Not Started" : submissionStatus}
                                                                                                                                                                            </span>
                                                                                                                                                                        </div>
                                                                                                                                                                        {/* <div className="relative inline-block p-2">

                                                                                                                                                    <select
                                                                                                                                                        value={handleApprovalStatus}
                                                                                                                                                        onChange={(e) =>
                                                                                                                                                            setHandleApprovalStatus(e.target.value)
                                                                                                                                                        }
                                                                                                                                                        className={`appearance-none text-[11px] font-medium px-3 py-1 pr-6 rounded-full border
                                                                                                                                                                ${handleApprovalStatus === "Pending" ? "bg-yellow-100 text-yellow-600 border-yellow-600" : handleApprovalStatus === "Raised" ?
                                                                                                                                                                "bg-blue-100 text-blue-600 border-blue-200" : handleApprovalStatus === "Received"
                                                                                                                                                                    ? "bg-purple-100 text-purple-600 border-purple-200"
                                                                                                                                                                    : handleApprovalStatus === "Completed"
                                                                                                                                                                        ? "bg-green-100 text-green-600 border-green-200"
                                                                                                                                                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                                                                                                                                            }
  `}
                                                                                                                                                    >
                                                                                                                                                        <option value="Waiting">Pending</option>
                                                                                                                                                        <option value="Pending">Submit</option>
                                                                                                                                                        <option value="Received">Received</option>
                                                                                                                                                        <option value="Completed">Completed</option>
                                                                                                                                                    </select>

                                                                                                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
                                                                                                                                                        <ChevronDown size={13} />
                                                                                                                                                    </span>
                                                                                                                                                </div> */}
                                                                                                                                                                    </td>
                                                                                                                                                                </>
                                                                                                                                                            ) : (<tr className="border-b border-gray-300"></tr>)}
                                                                                                                                                        {/* <td className="text-right px-2 py-2 border-b border-gray-300">
                                                                                                                                    <button
                                                                                                                                        className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-300 transition"
                                                                                                                                    // onClick={() => {
                                                                                                                                    //     setSelectedTaskfortimelog({
                                                                                                                                    //         id: sub.id,
                                                                                                                                    //         project_id: project.id || project.project_id,
                                                                                                                                    //         subactivity_name: sub.subactivity_name,
                                                                                                                                    //         project_name: project.shortName || project.short_name,
                                                                                                                                    //     });
                                                                                                                                    //     setTimeLogData({
                                                                                                                                    //         date: new Date().toISOString().split("T")[0],
                                                                                                                                    //         startTime: "",
                                                                                                                                    //         endTime: "",
                                                                                                                                    //         description: "",
                                                                                                                                    //     });
                                                                                                                                    //     setShowTimeLogModal(true);
                                                                                                                                    // }}
                                                                                                                                    >
                                                                                                                                        Submit
                                                                                                                                    </button>
                                                                                                                                </td> */}
                                                                                                                                                    </tr>
                                                                                                                                                    {
                                                                                                                                                        sub.approval_payment > 0 ? (
                                                                                                                                                            <tr className={`text-[13px] border-b `
                                                                                                                                                                // + (approvalStatus === "Waiting" ? "opacity-50" : "")
                                                                                                                                                            }>
                                                                                                                                                                <td className="text-center font-semibold text-blue-600 border-l border-gray-300">Approval</td>
                                                                                                                                                                <td className="text-center text-blue-600">{sub.approval_payment}%</td>
                                                                                                                                                                <td className="text-center">₹ {approvalAmount.toFixed(2)} L</td>
                                                                                                                                                                <td className="text-center">{apprRaised.toFixed(2)} L
                                                                                                                                                                    {
                                                                                                                                                                        apprRaised > 0 &&
                                                                                                                                                                        <FileText className="inline-block ml-1 -mt-1 text-red-500" size={13} title="Raised Files" onClick={(e) => setViewDocumentModel({
                                                                                                                                                                            model: true,
                                                                                                                                                                            data: sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "approval") || [],
                                                                                                                                                                            title: "Raised Stage Documents"
                                                                                                                                                                        })} />
                                                                                                                                                                    }
                                                                                                                                                                </td>
                                                                                                                                                                <td className="text-center">{
                                                                                                                                                                    apprReceived == 0 && sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "approval")[0] ?
                                                                                                                                                                        getDaysStatus(sub?.payment_stages?.filter((stage) => stage.to_status == "Raised" && stage.stage_type == "approval")[0]?.created_at)
                                                                                                                                                                        : apprReceived.toFixed(2) + " L"}
                                                                                                                                                                    {

                                                                                                                                                                        apprReceived > 0 &&
                                                                                                                                                                        <FileText className="inline-block ml-1 -mt-1 text-red-500" size={13} title="Raised Files" onClick={(e) => setViewDocumentModel({
                                                                                                                                                                            model: true,
                                                                                                                                                                            data: sub?.payment_stages?.filter((stage) => stage.to_status == "Received" && stage.stage_type == "approval") || [],
                                                                                                                                                                            title: "Received Stage Documents"
                                                                                                                                                                        })} />
                                                                                                                                                                    }
                                                                                                                                                                </td>
                                                                                                                                                                <td className={"text-center " + (apprRemaining.toFixed(2) == 0 ? " text-black-500" : apprRemaining.toFixed(2) < 0 ? " text-green-500" : " text-red-500")}>
                                                                                                                                                                    {apprRemaining.toFixed(2) == 0 ? "0" : apprRemaining.toFixed(2)} L

                                                                                                                                                                </td>
                                                                                                                                                                <td className="text-center">
                                                                                                                                                                    <div className="relative inline-block py-2 !inline-flex items-center" >
                                                                                                                                                                        <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                                                                                                                                                                            ${changeStatus === "Inprogress" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                changeStatus === "Submitted" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                    changeStatus === "Rejected" ? "bg-red-100 text-red-600 border-red-200" :
                                                                                                                                                                                        changeStatus === "Approved" ? "bg-blue-100 text-blue-600 border-blue-200" :
                                                                                                                                                                                            changeStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                                "bg-gray-100 text-gray-600 border-gray-200"
                                                                                                                                                                            }`}>
                                                                                                                                                                            {changeStatus == "Submitted" ? "Inprogress" : changeStatus == "Pending" ? "Not Started" : changeStatus}
                                                                                                                                                                        </span>
                                                                                                                                                                        {
                                                                                                                                                                            !isUser && sub?.submission_stages[0] && changeStatus == "Approved" &&
                                                                                                                                                                            <FileText className="inline-block ml-1 text-red-500" size={13} title="Raised Files"
                                                                                                                                                                                onClick={(e) => setViewDocumentModel({
                                                                                                                                                                                    model: true,
                                                                                                                                                                                    data: sub?.submission_stages?.filter((stage) => stage.to_status == changeStatus) || [],
                                                                                                                                                                                    title: "Approved Stage Documents"
                                                                                                                                                                                })} />
                                                                                                                                                                        }
                                                                                                                                                                    </div>
                                                                                                                                                                </td>
                                                                                                                                                                <td className="text-center">
                                                                                                                                                                    {

                                                                                                                                                                        <button
                                                                                                                                                                            onClick={() => {
                                                                                                                                                                                setShowProofModal(true)
                                                                                                                                                                                setProofData({ ...proofData, subactivity: sub.id, to_status: "Approved" })
                                                                                                                                                                            }}
                                                                                                                                                                            // disabled={changeStatus != "Inprogress" || changeStatus != "Submitted"}
                                                                                                                                                                            className={`text-m px-1.5 text-blue-600 flex items-center gap-1 `
                                                                                                                                                                                // + (changeStatus != "Inprogress" || changeStatus != "Submitted" ? "!cursor-no-drop opacity-70" : "")
                                                                                                                                                                            }
                                                                                                                                                                            title={"Approve"}>
                                                                                                                                                                            <Handshake size={13} /> Approve
                                                                                                                                                                        </button>
                                                                                                                                                                    }
                                                                                                                                                                </td>
                                                                                                                                                                <td className="text-center">
                                                                                                                                                                    <div className="relative inline-block p-2">
                                                                                                                                                                        <span className={`min-w-[80px] text-center appearance-none text-[11px] font-medium px-3 py-1 block rounded-full border
                                                                                                                                                                            ${approvalStatus === "Pending" ? "bg-yellow-100 text-yellow-600 border-yellow-600" :
                                                                                                                                                                                approvalStatus === "Raised" ? "bg-blue-100 text-blue-600 border-blue-200" :
                                                                                                                                                                                    approvalStatus === "Received" ? "bg-green-100 text-green-600 border-green-200" :
                                                                                                                                                                                        approvalStatus === "Completed" ? "bg-purple-100 text-purple-600 border-purple-200" :
                                                                                                                                                                                            "bg-gray-100 border-gray-200"
                                                                                                                                                                            }`}>
                                                                                                                                                                            {approvalStatus == "Waiting" ? "Not Started" : approvalStatus}
                                                                                                                                                                        </span>
                                                                                                                                                                    </div>
                                                                                                                                                                    {/* <div className="relative inline-block p-2">

                                                                                                                                                                        <select
                                                                                                                                                                            value={approvalStatus}
                                                                                                                                                                            onChange={(e) =>
                                                                                                                                                                                handleApprovalStatus(sub, e.target.value)
                                                                                                                                                                            }
                                                                                                                                                                            className={`appearance-none text-[11px] font-medium px-3 py-1 pr-6 rounded-full border
    ${approvalStatus === "Completed"
                                                                                                                                                                                    ? "bg-green-100 text-green-600 border-green-200"
                                                                                                                                                                                    : approvalStatus === "Submitted"
                                                                                                                                                                                        ? "bg-blue-100 text-blue-600 border-blue-200"
                                                                                                                                                                                        : "bg-gray-100 text-gray-600 border-gray-200"
                                                                                                                                                                                }
  `}
                                                                                                                                                                        >
                                                                                                                                                                            <option>Pending</option>
                                                                                                                                                                            <option>Submitted</option>
                                                                                                                                                                            <option>Completed</option>
                                                                                                                                                                        </select>

                                                                                                                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">
                                                                                                                                                                            <ChevronDown size={13} />
                                                                                                                                                                        </span>
                                                                                                                                                                    </div> */}
                                                                                                                                                                </td>
                                                                                                                                                                {/* <td className="text-right px-2 py-2">
                                                                                                                                                            <button
                                                                                                                                                                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-300 transition"
                                                                                                                                                            // onClick={() => {
                                                                                                                                                            //     setSelectedTaskfortimelog({
                                                                                                                                                            //         id: sub.id,
                                                                                                                                                            //         project_id: project.id || project.project_id,
                                                                                                                                                            //         subactivity_name: sub.subactivity_name,
                                                                                                                                                            //         project_name: project.shortName || project.short_name,
                                                                                                                                                            //     });
                                                                                                                                                            //     setTimeLogData({
                                                                                                                                                            //         date: new Date().toISOString().split("T")[0],
                                                                                                                                                            //         startTime: "",
                                                                                                                                                            //         endTime: "",
                                                                                                                                                            //         description: "",
                                                                                                                                                            //     });
                                                                                                                                                            //     setShowTimeLogModal(true);
                                                                                                                                                            // }}
                                                                                                                                                            >
                                                                                                                                                                Submit
                                                                                                                                                            </button>
                                                                                                                                                        </td> */}
                                                                                                                                                            </tr>
                                                                                                                                                        ) : (
                                                                                                                                                            <tr className="text-[12px] border-b">
                                                                                                                                                            </tr>)
                                                                                                                                                    }
                                                                                                                                                    {/* 🔽 EXPAND ROW - Minimalist Version */}
                                                                                                                                                    {expandedRow === sub.id && (
                                                                                                                                                        <tr className="bg-gray-50">
                                                                                                                                                            <td colSpan="14" className="px-4 py-4 w-full">
                                                                                                                                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

                                                                                                                                                                    {/* Header */}
                                                                                                                                                                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                                                                                                                                                        <div className="flex items-center gap-2">
                                                                                                                                                                            <Clock size={16} className="text-blue-500" />
                                                                                                                                                                            <span className="text-sm font-medium text-gray-700">Time Logs</span>
                                                                                                                                                                        </div>
                                                                                                                                                                        <span className="text-xs text-gray-500">
                                                                                                                                                                            Total: {sub.work_summary?.total_hours || "00:00:00"}
                                                                                                                                                                        </span>
                                                                                                                                                                    </div>

                                                                                                                                                                    {/* Time Log Entries */}
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

                                                                                                                                                                    {/* Collapse Button */}
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
                                                                {project.assigned_to && (
                                                                    <div className="mt-6 bg-gray-50 rounded-xl p-4">
                                                                        <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                                                            <UserCheck size={18} className="text-blue-600" />
                                                                            Assigned Personnel
                                                                        </h4>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                                                                {project.assigned_to?.charAt(0)?.toUpperCase() || "U"}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-gray-800">{project.assigned_to_detail?.name || project.assigned_to}</p>
                                                                                <p className="text-xs text-gray-500">Project Owner</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
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
                    </>
                )}
            </div>
        </motion.div >
    );
};

export default TlProjectList;