// Settings.jsx
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Settings,
    Layers,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    Loader2,
    CheckCircle,
    AlertCircle,
    FolderTree,
    Hash,
    Calendar,
    Percent,
    Ruler,
    TrendingUp,
    Users,
    Building2,
    RefreshCw,
    Eye,
    Clock,
    MoveVertical,
    GripVertical
} from "lucide-react";
import {
    fetchActivityTemplates,
    createActivityTemplate,
    updateActivityTemplate,
    deleteActivityTemplate,
    createSubActivity,
    updateSubActivity,
    deleteSubActivity,
    fetchCompanies,
    fetchSectors
} from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import LoadingModal from "../../components/modals/LoadingModal";

const SettingsComponent = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const {
        activityTemplates = [],
        companies = [],
        sectors = [],
        loading: apiLoading = false
    } = useSelector((state) => state.api || {});

    const [activeTab, setActiveTab] = useState("activities");
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedActivities, setExpandedActivities] = useState({});
    const [editingActivity, setEditingActivity] = useState(null);
    const [editingSubActivity, setEditingSubActivity] = useState(null);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [showSubActivityModal, setShowSubActivityModal] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form states
    const [activityForm, setActivityForm] = useState({
        activity_name: "",
        sorting_var: "",
        template_description: "",
        start_date: "",
        end_date: "",
        weightage: "",
        company: "",
        sector: ""
    });

    const [subActivityForm, setSubActivityForm] = useState({
        subactivity_name: "",
        sorting_var: "",
        description: "",
        unit: "",
        submission_payment: "0",
        approval_payment: "0",
        chainage_start: "0",
        chainage_end: "0",
        covered_area: "0",
        total_quantity: "",
        chainage_exist: true,
        planned_quantity_exist: true,
        length_exist: true,
        submission_exist: true,
        approval_exist: true,
        range: "",
        range_no: ""
    });

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                dispatch(fetchActivityTemplates()).unwrap(),
                dispatch(fetchCompanies()).unwrap(),
                dispatch(fetchSectors()).unwrap()
            ]);
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to load data",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    // Filter activities
    const filteredActivities = useMemo(() => {

        if (!activityTemplates || !Array.isArray(activityTemplates)) return [];
        let filtered = [...activityTemplates];
        if (searchTerm) {
            filtered = filtered.filter(activity =>
                activity.activity_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        // Sort by sorting_var
        filtered.sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0));

        return filtered;
    }, [activityTemplates, searchTerm]);


    // Toggle activity expansion
    const toggleActivity = (activityId) => {
        setExpandedActivities(prev => ({
            ...prev,
            [activityId]: !prev[activityId]
        }));
    };

    // Activity CRUD Operations
    const handleCreateActivity = async () => {
        if (!activityForm.activity_name.trim()) {
            dispatch(showSnackbar({ message: "Activity name is required", type: "error" }));
            return;
        }

        setLoading(true);
        try {
            await dispatch(createActivityTemplate({
                activity_name: activityForm.activity_name,
                sorting_var: activityForm.sorting_var || "1",
                template_description: activityForm.template_description,
                start_date: activityForm.start_date || null,
                end_date: activityForm.end_date || null,
                weightage: activityForm.weightage || null,
                company: activityForm.company || null,
                sector: activityForm.sector || null
            })).unwrap();

            dispatch(showSnackbar({ message: "Activity created successfully", type: "success" }));
            setShowActivityModal(false);
            resetActivityForm();
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to create activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    // Updated handleUpdateActivity function in Settings.jsx

    const handleUpdateActivity = async () => {
        if (!editingActivity) return;

        setLoading(true);
        try {
            // Get current subactivities from the editing activity
            const currentSubActivities = editingActivity.subactivities || [];

            // Prepare the update data with subactivities
            const updateData = {
                activity_name: activityForm.activity_name,
                sorting_var: activityForm.sorting_var || "1",
                template_description: activityForm.template_description,
                start_date: activityForm.start_date || null,
                end_date: activityForm.end_date || null,
                weightage: activityForm.weightage || null,
                company: activityForm.company || null,
                sector: activityForm.sector || null,
                subactivities: currentSubActivities.map(sub => ({
                    id: sub.id,
                    subactivity_name: sub.subactivity_name,
                    sorting_var: sub.sorting_var,
                    description: sub.description,
                    unit: sub.unit,
                    submission_payment: sub.submission_payment,
                    approval_payment: sub.approval_payment,
                    chainage_start: sub.chainage_start,
                    chainage_end: sub.chainage_end,
                    covered_area: sub.covered_area,
                    total_quantity: sub.total_quantity,
                    chainage_exist: sub.chainage_exist,
                    planned_quantity_exist: sub.planned_quantity_exist,
                    length_exist: sub.length_exist,
                    submission_exist: sub.submission_exist,
                    approval_exist: sub.approval_exist,
                    range: sub.range,
                    range_no: sub.range_no
                }))
            };

            await dispatch(updateActivityTemplate({
                id: editingActivity.id,
                data: updateData
            })).unwrap();

            dispatch(showSnackbar({
                message: "Activity updated successfully",
                type: "success"
            }));

            setEditingActivity(null);
            setShowActivityModal(false);
            resetActivityForm();
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({
                message: error.message || "Failed to update activity",
                type: "error"
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteActivity = async (activity) => {
        if (!window.confirm(`Are you sure you want to delete "${activity.activity_name}"? This will also delete all associated sub-activities.`)) {
            return;
        }

        setLoading(true);
        try {
            await dispatch(deleteActivityTemplate(activity.id)).unwrap();
            dispatch(showSnackbar({ message: "Activity deleted successfully", type: "success" }));
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to delete activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const editActivity = (activity) => {
        setEditingActivity(activity);
        setActivityForm({
            activity_name: activity.activity_name || "",
            sorting_var: activity.sorting_var || "",
            template_description: activity.template_description || "",
            start_date: activity.start_date || "",
            end_date: activity.end_date || "",
            weightage: activity.weightage || "",
            company: activity.company || "",
            sector: activity.sector || ""
        });
        setShowActivityModal(true);
    };

    const resetActivityForm = () => {
        setActivityForm({
            activity_name: "",
            sorting_var: "",
            template_description: "",
            start_date: "",
            end_date: "",
            weightage: "",
            company: "",
            sector: ""
        });
    };

    // Sub-Activity CRUD Operations
    const handleCreateSubActivity = async () => {
        if (!subActivityForm.subactivity_name.trim()) {
            dispatch(showSnackbar({ message: "Sub-activity name is required", type: "error" }));
            return;
        }

        setLoading(true);
        try {
            await dispatch(createSubActivity({
                activity_template: selectedActivity.id,
                ...subActivityForm,
                submission_payment: parseFloat(subActivityForm.submission_payment) || 0,
                approval_payment: parseFloat(subActivityForm.approval_payment) || 0,
                chainage_start: parseFloat(subActivityForm.chainage_start) || 0,
                chainage_end: parseFloat(subActivityForm.chainage_end) || 0,
                covered_area: parseFloat(subActivityForm.covered_area) || 0,
                total_quantity: subActivityForm.total_quantity || null
            })).unwrap();

            dispatch(showSnackbar({ message: "Sub-activity created successfully", type: "success" }));
            setShowSubActivityModal(false);
            resetSubActivityForm();
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to create sub-activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSubActivity = async () => {
        if (!editingSubActivity) return;

        setLoading(true);
        try {
            await dispatch(updateSubActivity({
                id: editingSubActivity.id,
                data: {
                    ...subActivityForm,
                    submission_payment: parseFloat(subActivityForm.submission_payment) || 0,
                    approval_payment: parseFloat(subActivityForm.approval_payment) || 0,
                    chainage_start: parseFloat(subActivityForm.chainage_start) || 0,
                    chainage_end: parseFloat(subActivityForm.chainage_end) || 0,
                    covered_area: parseFloat(subActivityForm.covered_area) || 0,
                    total_quantity: subActivityForm.total_quantity || null
                }
            })).unwrap();

            dispatch(showSnackbar({ message: "Sub-activity updated successfully", type: "success" }));
            setEditingSubActivity(null);
            setShowSubActivityModal(false);
            resetSubActivityForm();
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to update sub-activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSubActivity = async (subActivity, activityId) => {
        if (!window.confirm(`Are you sure you want to delete "${subActivity.subactivity_name}"?`)) {
            return;
        }

        setLoading(true);
        try {
            await dispatch(deleteSubActivity(subActivity.id)).unwrap();
            dispatch(showSnackbar({ message: "Sub-activity deleted successfully", type: "success" }));
            await loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to delete sub-activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    const editSubActivity = (subActivity, activity) => {
        setEditingSubActivity(subActivity);
        setSelectedActivity(activity);
        setSubActivityForm({
            subactivity_name: subActivity.subactivity_name || "",
            sorting_var: subActivity.sorting_var || "",
            description: subActivity.description || "",
            unit: subActivity.unit || "",
            submission_payment: subActivity.submission_payment || "0",
            approval_payment: subActivity.approval_payment || "0",
            chainage_start: subActivity.chainage_start || "0",
            chainage_end: subActivity.chainage_end || "0",
            covered_area: subActivity.covered_area || "0",
            total_quantity: subActivity.total_quantity || "",
            chainage_exist: subActivity.chainage_exist !== false,
            planned_quantity_exist: subActivity.planned_quantity_exist !== false,
            length_exist: subActivity.length_exist !== false,
            submission_exist: subActivity.submission_exist !== false,
            approval_exist: subActivity.approval_exist !== false,
            range: subActivity.range || "",
            range_no: subActivity.range_no || ""
        });
        setShowSubActivityModal(true);
    };

    const resetSubActivityForm = () => {
        setSubActivityForm({
            subactivity_name: "",
            sorting_var: "",
            description: "",
            unit: "",
            submission_payment: "0",
            approval_payment: "0",
            chainage_start: "0",
            chainage_end: "0",
            covered_area: "0",
            total_quantity: "",
            chainage_exist: true,
            planned_quantity_exist: true,
            length_exist: true,
            submission_exist: true,
            approval_exist: true,
            range: "",
            range_no: ""
        });
    };

    const openCreateSubActivity = (activity) => {
        setSelectedActivity(activity);
        setEditingSubActivity(null);
        resetSubActivityForm();
        setShowSubActivityModal(true);
    };

    // Tab configurations
    const tabs = [
        { id: "activities", label: "Activities & Sub-activities", icon: Layers },
        { id: "companies", label: "Companies", icon: Building2, comingSoon: true },
        { id: "sectors", label: "Sectors", icon: TrendingUp, comingSoon: true },
        { id: "users", label: "User Management", icon: Users, comingSoon: true }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return "N/A";
        }
    };

    const unitOptions = [
        "Kilometer", "Meter", "Square Meter", "Cubic Meter",
        "Numbers", "Lump Sum", "Percentage", "Status", "Hour", "Day"
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <div className="max-w-7xl mx-auto px-4 py-6">
                <LoadingModal isVisible={loading || refreshing} />

                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                            >
                                Settings
                            </motion.h1>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-purple-100 text-purple-600"
                            >
                                <Settings size={14} />
                                Admin Panel
                            </motion.div>
                        </div>
                        <motion.p
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-500 text-lg"
                        >
                            Manage activities, sub-activities, and system configurations
                        </motion.p>
                    </div>
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={loadData}
                        disabled={refreshing}
                        className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                        <span className="text-sm font-medium text-gray-700">Refresh</span>
                    </motion.button>
                </div>

                {/* Tabs */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-xl mb-8 border border-gray-100"
                >
                    <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
                                    ${activeTab === tab.id
                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }
                                    ${tab.comingSoon ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                                `}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                                {tab.comingSoon && (
                                    <span className="text-xs ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full">Soon</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === "activities" && (
                            <>
                                {/* Search and Actions */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search activities..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setEditingActivity(null);
                                            resetActivityForm();
                                            setShowActivityModal(true);
                                        }}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        New Activity
                                    </motion.button>
                                </div>

                                {/* Activities List */}
                                <AnimatePresence>
                                    {filteredActivities.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center py-20 bg-gray-50 rounded-3xl"
                                        >
                                            <FolderTree size={64} className="mx-auto mb-4 text-gray-300" />
                                            <p className="text-2xl font-semibold text-gray-700 mb-2">No activities found</p>
                                            <p className="text-gray-500">Click "New Activity" to create your first activity template</p>
                                        </motion.div>
                                    ) : (
                                        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                                            {
                                                console.log(filteredActivities, "activityTemplates")
                                            }
                                            {filteredActivities.map((activity) => {
                                                const isExpanded = expandedActivities[activity.id];
                                                const subActivities = activity.subactivities || [];

                                                return (
                                                    <motion.div
                                                        key={activity.id}
                                                        variants={itemVariants}
                                                        layout
                                                        className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 !opacity-100"
                                                    >
                                                        {/* Activity Header */}
                                                        <div
                                                            className="p-5 cursor-pointer hover:bg-gray-50 transition-colors rounded-2xl"
                                                            onClick={() => toggleActivity(activity.id)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 flex-wrap mb-2">
                                                                        <h3 className="text-lg font-semibold text-gray-800">
                                                                            {activity.activity_name}
                                                                        </h3>
                                                                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                                                            Sort: {activity.sorting_var || 1}
                                                                        </span>
                                                                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-600">
                                                                            {subActivities.length} Sub-activities
                                                                        </span>
                                                                        {activity.weightage && (
                                                                            <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                                                                                Weightage: {activity.weightage}%
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {activity.template_description && (
                                                                        <p className="text-sm text-gray-500 mt-1">{activity.template_description}</p>
                                                                    )}
                                                                    {(activity.start_date || activity.end_date) && (
                                                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                                                            {activity.start_date && (
                                                                                <span>📅 Start: {formatDate(activity.start_date)}</span>
                                                                            )}
                                                                            {activity.end_date && (
                                                                                <span>⏰ End: {formatDate(activity.end_date)}</span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            editActivity(activity);
                                                                        }}
                                                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                                                                        title="Edit Activity"
                                                                    >
                                                                        <Edit size={18} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteActivity(activity);
                                                                        }}
                                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                                                                        title="Delete Activity"
                                                                    >
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                                                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Sub-activities Section */}
                                                        <AnimatePresence>
                                                            {isExpanded && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="border-t border-gray-100"
                                                                >
                                                                    <div className="p-5 bg-gray-50 rounded-b-2xl">
                                                                        <div className="flex justify-between items-center mb-4">
                                                                            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                                                <Layers size={16} />
                                                                                Sub-activities
                                                                            </h4>
                                                                            <motion.button
                                                                                whileHover={{ scale: 1.02 }}
                                                                                whileTap={{ scale: 0.98 }}
                                                                                onClick={() => openCreateSubActivity(activity)}
                                                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                                                                            >
                                                                                <Plus size={14} />
                                                                                Add Sub-activity
                                                                            </motion.button>
                                                                        </div>

                                                                        {subActivities.length === 0 ? (
                                                                            <div className="text-center py-8 bg-white rounded-xl">
                                                                                <p className="text-gray-400">No sub-activities yet. Click "Add Sub-activity" to create one.</p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="overflow-x-auto">
                                                                                <table className="w-full text-sm">
                                                                                    <thead className="bg-gray-100 text-xs uppercase text-gray-600 rounded-lg">
                                                                                        <tr>
                                                                                            <th className="px-3 py-3 text-left">Sort</th>
                                                                                            <th className="px-3 py-3 text-left">Sub-activity Name</th>
                                                                                            <th className="px-3 py-3 text-center">Unit</th>
                                                                                            <th className="px-3 py-3 text-center">Submission %</th>
                                                                                            <th className="px-3 py-3 text-center">Approval %</th>
                                                                                            <th className="px-3 py-3 text-center">Chainage</th>
                                                                                            <th className="px-3 py-3 text-center">Area</th>
                                                                                            <th className="px-3 py-3 text-center">Actions</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {subActivities
                                                                                            // .sort((a, b) => (a.sorting_var) - (b.sorting_var))
                                                                                            .map((sub) => (
                                                                                                <tr key={sub.id} className="border-t border-gray-200 hover:bg-white transition">
                                                                                                    <td className="px-3 py-3 text-center text-gray-500">
                                                                                                        {sub.sorting_var || "-"}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 font-medium text-gray-700">
                                                                                                        {sub.subactivity_name}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center">
                                                                                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs">
                                                                                                            {sub.unit || "-"}
                                                                                                        </span>
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center text-green-600">
                                                                                                        {sub.submission_payment}%
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center text-blue-600">
                                                                                                        {sub.approval_payment}%
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center text-gray-600">
                                                                                                        {sub.chainage_start} - {sub.chainage_end}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center text-gray-600">
                                                                                                        {sub.covered_area}
                                                                                                    </td>
                                                                                                    <td className="px-3 py-3 text-center">
                                                                                                        <div className="flex items-center justify-center gap-2">
                                                                                                            <button
                                                                                                                onClick={() => editSubActivity(sub, activity)}
                                                                                                                className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
                                                                                                                title="Edit"
                                                                                                            >
                                                                                                                <Edit size={14} />
                                                                                                            </button>
                                                                                                            <button
                                                                                                                onClick={() => handleDeleteSubActivity(sub, activity.id)}
                                                                                                                className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
                                                                                                                title="Delete"
                                                                                                            >
                                                                                                                <Trash2 size={14} />
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                </tr>
                                                                                            ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}

                        {/* Placeholder for other tabs */}
                        {activeTab !== "activities" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20"
                            >
                                <Settings size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</p>
                                <p className="text-gray-500">This section is under development</p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Activity Modal */}
            <AnimatePresence>
                {showActivityModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setShowActivityModal(false);
                            setEditingActivity(null);
                            resetActivityForm();
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <Layers size={20} className="text-blue-600" />
                                    {editingActivity ? "Edit Activity" : "Create New Activity"}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowActivityModal(false);
                                        setEditingActivity(null);
                                        resetActivityForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Activity Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={activityForm.activity_name}
                                        onChange={(e) => setActivityForm({ ...activityForm, activity_name: e.target.value })}
                                        placeholder="Enter activity name"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label>
                                        <input
                                            type="number"
                                            value={activityForm.sorting_var}
                                            onChange={(e) => setActivityForm({ ...activityForm, sorting_var: e.target.value })}
                                            placeholder="1, 2, 3..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Weightage (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={activityForm.weightage}
                                            onChange={(e) => setActivityForm({ ...activityForm, weightage: e.target.value })}
                                            placeholder="0-100"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                    <textarea
                                        value={activityForm.template_description}
                                        onChange={(e) => setActivityForm({ ...activityForm, template_description: e.target.value })}
                                        placeholder="Activity description..."
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={activityForm.start_date}
                                            onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                                        <input
                                            type="date"
                                            value={activityForm.end_date}
                                            onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowActivityModal(false);
                                        setEditingActivity(null);
                                        resetActivityForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingActivity ? handleUpdateActivity : handleCreateActivity}
                                    disabled={loading || !activityForm.activity_name.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingActivity ? "Update" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-Activity Modal */}
            <AnimatePresence>
                {showSubActivityModal && selectedActivity && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => {
                            setShowSubActivityModal(false);
                            setEditingSubActivity(null);
                            setSelectedActivity(null);
                            resetSubActivityForm();
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <Layers size={20} className="text-blue-600" />
                                    {editingSubActivity ? "Edit Sub-activity" : "Create New Sub-activity"}
                                    <span className="text-sm font-normal text-gray-500">for {selectedActivity.activity_name}</span>
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSubActivityModal(false);
                                        setEditingSubActivity(null);
                                        setSelectedActivity(null);
                                        resetSubActivityForm();
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Sub-activity Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={subActivityForm.subactivity_name}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, subactivity_name: e.target.value })}
                                            placeholder="Enter sub-activity name"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Sort Order</label>
                                        <input
                                            type="number"
                                            value={subActivityForm.sorting_var}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, sorting_var: e.target.value })}
                                            placeholder="1, 2, 3..."
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                    <textarea
                                        value={subActivityForm.description}
                                        onChange={(e) => setSubActivityForm({ ...subActivityForm, description: e.target.value })}
                                        placeholder="Sub-activity description..."
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Unit</label>
                                        <select
                                            value={subActivityForm.unit}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, unit: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Unit</option>
                                            {unitOptions.map(unit => (
                                                <option key={unit} value={unit}>{unit}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Total Quantity</label>
                                        <input
                                            type="text"
                                            value={subActivityForm.total_quantity}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, total_quantity: e.target.value })}
                                            placeholder="Optional"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Submission Payment (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subActivityForm.submission_payment}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, submission_payment: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Approval Payment (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subActivityForm.approval_payment}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, approval_payment: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Chainage Start</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subActivityForm.chainage_start}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, chainage_start: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Chainage End</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subActivityForm.chainage_end}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, chainage_end: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Covered Area</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={subActivityForm.covered_area}
                                            onChange={(e) => setSubActivityForm({ ...subActivityForm, covered_area: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Features</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={subActivityForm.chainage_exist}
                                                onChange={(e) => setSubActivityForm({ ...subActivityForm, chainage_exist: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Enable Chainage</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={subActivityForm.planned_quantity_exist}
                                                onChange={(e) => setSubActivityForm({ ...subActivityForm, planned_quantity_exist: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Enable Planned Quantity</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={subActivityForm.length_exist}
                                                onChange={(e) => setSubActivityForm({ ...subActivityForm, length_exist: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Enable Length</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={subActivityForm.submission_exist}
                                                onChange={(e) => setSubActivityForm({ ...subActivityForm, submission_exist: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Enable Submission</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={subActivityForm.approval_exist}
                                                onChange={(e) => setSubActivityForm({ ...subActivityForm, approval_exist: e.target.checked })}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-600">Enable Approval</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowSubActivityModal(false);
                                        setEditingSubActivity(null);
                                        setSelectedActivity(null);
                                        resetSubActivityForm();
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingSubActivity ? handleUpdateSubActivity : handleCreateSubActivity}
                                    disabled={loading || !subActivityForm.subactivity_name.trim()}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingSubActivity ? "Update" : "Create"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default SettingsComponent;