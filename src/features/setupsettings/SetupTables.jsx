// SetupTables.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Layers, ChevronDown, ChevronUp, Search, FolderTree, Users, Building2, TrendingUp, Eye, FileClock } from "lucide-react";
import {
    AddActivityButton,
    EditActivityButton,
    DeleteActivityButton,
    AddSubActivityButton,
    EditSubActivityButton,
    DeleteSubActivityButton,
    EditCompanyButton,
    DeleteCompanyButton,
    AddCompanyButton,
    AddSectorButton,
    EditSectorButton,
    DeleteSectorButton,
    AddClientButton,
    EditClientButton,
    DeleteClientButton,
    ViewTimeStampDetailsButton,
    BulkUploadClientButton
} from "./SetupComponents";
import { fetchStageTemplates, fetchClients, fetchCompanies, fetchSectors, fetchActivities, fetchStageTemplate } from "../api/apiSlice";
import { showSnackbar } from "../notifications/notificationSlice";


const ActivityTable = ({ refreshKey }) => {
    const dispatch = useDispatch();
    const { stageTemplates = [] } = useSelector((state) => state.api || {});

    const [searchTerm, setSearchTerm] = useState("");
    const [expandedActivities, setExpandedActivities] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        // hidden: { y: 20, opacity: 0 },
        hidden: { y: 0, opacity: 1 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } }
    };

    const loadData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                dispatch(fetchStageTemplate()).unwrap(),
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

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    // Filter activities
    const filteredActivities = useMemo(() => {
        if (!stageTemplates || !Array.isArray(stageTemplates)) return [];
        let filtered = [...stageTemplates];
        if (searchTerm) {
            filtered = filtered.filter(activity =>
                activity.activity_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        filtered.sort((a, b) => (a.sorting_var || 0) - (b.sorting_var || 0));
        return filtered;
    }, [stageTemplates, searchTerm]);

    // Toggle activity expansion
    const toggleActivity = (activityId) => {
        setExpandedActivities(prev => ({
            ...prev,
            [activityId]: !prev[activityId]
        }));
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

    const handleRefresh = () => {
        loadData();
    };

    return (
        <>
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 ">
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
                <AddActivityButton onSuccess={handleRefresh} loadData={loadData} />
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
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-4 space-y-4">
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
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                                        Sequence: {activity.sorting_var || 1}
                                                    </span>
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {activity.activity_name}
                                                    </h3>
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
                                                <EditActivityButton
                                                    activity={activity}
                                                    onSuccess={handleRefresh}
                                                    loadData={loadData}
                                                />
                                                <DeleteActivityButton
                                                    activity={activity}
                                                    onSuccess={handleRefresh}
                                                    loadData={loadData}
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleActivity(activity.id)
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
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
                                                        <AddSubActivityButton
                                                            activity={activity}
                                                            onSuccess={handleRefresh}
                                                            loadData={loadData}
                                                        />
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
                                                                        <th className="px-3 py-3 text-center">Toggle</th>
                                                                        <th className="px-3 py-3 text-center">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {subActivities.map((sub) => (
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

                                                                            <td className="px-3 py-3">
                                                                                <div className="flex flex-wrap gap-1 justify-center">
                                                                                    {sub.planned_quantity_exist && (
                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                                                                                            📊 Planned Qty
                                                                                        </span>
                                                                                    )}
                                                                                    {sub.chainage_exist && (
                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">
                                                                                            📏 Chainage
                                                                                        </span>
                                                                                    )}
                                                                                    {sub.length_exist && (
                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                                                                                            📐 Length / Covered Area
                                                                                        </span>
                                                                                    )}
                                                                                    {sub.submission_exist && (
                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">
                                                                                            💰 Submission %
                                                                                        </span>
                                                                                    )}
                                                                                    {sub.approval_exist && (
                                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                                                                                            ✅ Approval %
                                                                                        </span>
                                                                                    )}
                                                                                    {!sub.planned_quantity_exist &&
                                                                                        !sub.chainage_exist &&
                                                                                        !sub.length_exist &&
                                                                                        !sub.submission_exist &&
                                                                                        !sub.approval_exist && (
                                                                                            <span className="text-xs text-gray-400">No features enabled</span>
                                                                                        )}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center">
                                                                                <div className="flex items-center justify-center gap-2">
                                                                                    <EditSubActivityButton
                                                                                        subActivity={sub}
                                                                                        activity={activity}
                                                                                        onSuccess={handleRefresh}
                                                                                        loadData={loadData}
                                                                                    />
                                                                                    <DeleteSubActivityButton
                                                                                        subActivity={sub}
                                                                                        onSuccess={handleRefresh}
                                                                                        loadData={loadData}
                                                                                    />
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
    );
};

const CompaniesTable = ({ refreshKey }) => {
    const dispatch = useDispatch();
    const { companies = [] } = useSelector((state) => state.api || {});
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [showDeleted, setShowDeleted] = useState(false);
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 0, opacity: 1 },
        visible: { y: 0, opacity: 1 }
    };

    const loadData = async () => {
        setRefreshing(true);
        try {
            await dispatch(
                fetchCompanies(showDeleted)
            ).unwrap();
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to load companies",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey, showDeleted]);

    const filteredCompanies = useMemo(() => {
        if (!companies || !Array.isArray(companies)) return [];
        let filtered = [...companies];
        if (searchTerm) {
            filtered = filtered.filter(company =>
                company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.gst_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.pan_no?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [companies, searchTerm]);

    const handleRefresh = () => {
        loadData();
    };
    const prepareMetadata = (company) => {
        return {
            id: company.id,
            name: company.name,
            created_at: company.created_at,
            created_by: company.created_by,
            created_by_details: company.created_by_details,
            updated_at: company.updated_at,
            updated_by: company.updated_by,
            updated_by_details: company.updated_by_details,
            deleted_at: company.deleted_at,
            deleted_by: company.deleted_by,
            deleted_by_details: company.deleted_by_details,

        };
    };

    return (
        <>
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search companies by name, GST, or PAN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <AddCompanyButton onSuccess={handleRefresh} loadData={loadData} companies={filteredCompanies} />

            </div>

            {/* Companies List */}
            <AnimatePresence>
                {filteredCompanies.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-gray-50 rounded-3xl"
                    >
                        <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-2xl font-semibold text-gray-700 mb-2">No companies found</p>
                        <p className="text-gray-500">Click "New Company" to add your first company</p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-600 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Company Name</th>
                                        <th className="px-4 py-3 text-left">GST Number</th>
                                        <th className="px-4 py-3 text-left">PAN Number</th>
                                        <th className="px-4 py-3 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompanies.map((company, index) => {
                                        const metadata = prepareMetadata(company);
                                        return (
                                            <motion.tr
                                                key={company.id}
                                                variants={itemVariants}
                                                className="border-t border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-800 max-w-[5vw] break-words">
                                                    {company.name}
                                                </td>
                                                <td className="px-4 py-3 ">
                                                    <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-mono">
                                                        {company.gst_no || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-mono">
                                                        {company.pan_no || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <EditCompanyButton
                                                            company={company}
                                                            onSuccess={handleRefresh}
                                                            loadData={loadData}
                                                            companies={filteredCompanies}
                                                        />
                                                        <DeleteCompanyButton
                                                            company={company}
                                                            onSuccess={handleRefresh}
                                                            loadData={loadData}
                                                        />
                                                        <ViewTimeStampDetailsButton
                                                            data={company}
                                                            title="Company Details"
                                                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                                                        >
                                                            <FileClock size={18} />
                                                        </ViewTimeStampDetailsButton>
                                                    </div>
                                                </td>
                                            </motion.tr>)
                                    }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const SectorsTableBackup = ({ refreshKey }) => {
    const dispatch = useDispatch();
    const { sectors = [] } = useSelector((state) => state.api || {});
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 0, opacity: 1 },
        visible: { y: 0, opacity: 1 }
    };

    const loadData = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchSectors()).unwrap();
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to load sectors",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const filteredSectors = useMemo(() => {
        if (!sectors || !Array.isArray(sectors)) return [];
        let filtered = [...sectors];
        if (searchTerm) {
            filtered = filtered.filter(sector =>
                sector.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sector.unit?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return filtered;
    }, [sectors, searchTerm]);

    // Helper function to get unit display name
    const getUnitDisplayName = (unit) => {
        const unitMap = {
            'length': 'Length',
            'area': 'Area',
            'quantity': 'Quantity'
        };
        return unitMap[unit] || unit || '-';
    };

    // Helper function to get unit color
    const getUnitColor = (unit) => {
        const colorMap = {
            'length': 'bg-blue-100 text-blue-700',
            'area': 'bg-green-100 text-green-700',
            'quantity': 'bg-purple-100 text-purple-700'
        };
        return colorMap[unit] || 'bg-gray-100 text-gray-600';
    };

    const handleRefresh = () => {
        loadData();
    };

    return (
        <>
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search sectors by name or unit type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <AddSectorButton onSuccess={handleRefresh} loadData={loadData} sectors={filteredSectors} />
            </div>

            {/* Sectors List */}
            <AnimatePresence>
                {filteredSectors.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-gray-50 rounded-3xl"
                    >
                        <TrendingUp size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-2xl font-semibold text-gray-700 mb-2">No sectors found</p>
                        <p className="text-gray-500">Click "New Sector" to add your first sector</p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-600 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Sector Name</th>
                                        <th className="px-4 py-3 text-left">Unit Type</th>
                                        <th className="px-4 py-3 text-center w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSectors.map((sector, index) => (
                                        <motion.tr
                                            key={sector.id}
                                            variants={itemVariants}
                                            className="border-t border-gray-200 hover:bg-gray-50 transition"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-800 max-w-[5vw] break-words">
                                                {/* <td className="px-4 py-3 font-medium text-gray-800"> */}
                                                {sector.name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sector.unit ? (
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getUnitColor(sector.unit)}`}>
                                                        {getUnitDisplayName(sector.unit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Not specified</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <EditSectorButton
                                                        sector={sector}
                                                        onSuccess={handleRefresh}
                                                        loadData={loadData}
                                                        sectors={filteredSectors}
                                                    />
                                                    <DeleteSectorButton
                                                        sector={sector}
                                                        onSuccess={handleRefresh}
                                                        loadData={loadData}
                                                    />
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const SectorsTable = ({ refreshKey }) => {
    const dispatch = useDispatch();
    const { sectors = [] } = useSelector((state) => state.api || {});
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSector, setExpandedSector] = useState({});
    const [showDeleted, setShowDeleted] = useState(false);
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        // hidden: { y: 20, opacity: 0 },
        hidden: { y: 0, opacity: 1 },
        visible: { y: 0, opacity: 1 }
    };

    const loadData = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchSectors(showDeleted)).unwrap();
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to load sectors",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey, showDeleted]);
    const filteredSectors = useMemo(() => {
        if (!sectors || !Array.isArray(sectors)) return [];
        let filtered = [...sectors];
        if (searchTerm) {
            filtered = filtered.filter(sector =>
                sector.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sector.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sector.stage_work_types?.some(wt => wt.name?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        return filtered;
    }, [sectors, searchTerm]);

    const getUnitDisplayName = (unit) => {
        const unitMap = {
            'length': 'Length',
            'area': 'Area',
            'quantity': 'Quantity'
        };
        return unitMap[unit] || unit || '-';
    };

    const getUnitColor = (unit) => {
        const colorMap = {
            'length': 'bg-blue-100 text-blue-700',
            'area': 'bg-green-100 text-green-700',
            'quantity': 'bg-purple-100 text-purple-700'
        };
        return colorMap[unit] || 'bg-gray-100 text-gray-600';
    };

    const handleRefresh = () => {
        loadData();
    };

    // Prepare metadata for viewer
    const prepareMetadata = (sector) => {
        return {
            id: sector.id,
            name: sector.name,
            created_at: sector.created_at,
            created_by: sector.created_by,
            created_by_details: sector.created_by_details,
            updated_at: sector.updated_at,
            updated_by: sector.updated_by,
            updated_by_details: sector.updated_by_details,
            deleted_at: sector.deleted_at,
            deleted_by: sector.deleted_by,
            deleted_by_details: sector.deleted_by_details,
            customSections: [
                {
                    icon: Layers,
                    title: "Work Types",
                    content: (
                        <div className="flex flex-wrap gap-2">
                            {sector.stage_work_types?.length > 0 ? (
                                sector.stage_work_types.map((wt, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-purple-50 text-purple-700 border border-purple-200">
                                        {wt.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm">No work types assigned</p>
                            )}
                        </div>
                    )
                },
                {
                    icon: Building2,
                    title: "Basic Information",
                    content: (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">Unit Type:</span>
                                <span className="ml-2 font-medium">{getUnitDisplayName(sector.unit)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <span className={`ml-2 font-medium ${sector.is_deleted ? 'text-red-600' : 'text-green-600'}`}>
                                    {sector.is_deleted ? 'Deleted' : 'Active'}
                                </span>
                            </div>
                        </div>
                    )
                }
            ]
        };
    };

    const toggleExpand = (sectorId) => {
        setExpandedSector(prev => ({
            ...prev,
            [sectorId]: !prev[sectorId]
        }));
    };

    return (
        <>
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search sectors by name, unit type, or work type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <AddSectorButton onSuccess={handleRefresh} loadData={loadData} sectors={filteredSectors} />

            </div>

            {/* Sectors List */}
            <AnimatePresence>
                {filteredSectors.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-gray-50 rounded-3xl"
                    >
                        <TrendingUp size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-2xl font-semibold text-gray-700 mb-2">No sectors found</p>
                        <p className="text-gray-500">Click "New Sector" to add your first sector</p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 text-xs uppercase text-gray-600 rounded-lg">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Sector Name</th>
                                        <th className="px-4 py-3 text-left">Unit Type</th>
                                        <th className="px-4 py-3 text-left">Work Types</th>
                                        <th className="px-4 py-3 text-center w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSectors.map((sector) => {
                                        const hasWorkTypes = sector.stage_work_types && sector.stage_work_types.length > 0;
                                        const metadata = prepareMetadata(sector);
                                        const isExpanded = expandedSector[sector.id];

                                        return (

                                            <AnimatePresence key={sector.id}>
                                                <motion.tr
                                                    // key={sector.id}
                                                    variants={itemVariants}
                                                    className="border-t border-gray-200 hover:bg-gray-50 transition group"
                                                // onClick={() => toggleExpand(sector.id)}
                                                >
                                                    <td className="px-4 py-3 font-medium text-gray-800">
                                                        {sector.name}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {sector.unit ? (
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getUnitColor(sector.unit)}`}>
                                                                {getUnitDisplayName(sector.unit)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">Not specified</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1"
                                                            onClick={() => toggleExpand(sector.id)}
                                                        >
                                                            {sector.stage_work_types?.slice(0, 2).map((wt, idx) => (
                                                                <span key={`worktype_${idx}`} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                                    {wt.name}
                                                                </span>
                                                            ))}
                                                            {sector.stage_work_types?.length > 2 && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                                    +{sector.stage_work_types.length - 2}
                                                                </span>
                                                            )}
                                                            {(!sector.stage_work_types || sector.stage_work_types.length === 0) && (
                                                                <span className="text-gray-400 text-xs">No Work Types</span>
                                                            )}

                                                            {sector.stage_work_types?.length > 0 && <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleExpand(sector.id)
                                                                }}
                                                                className="px-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                            >
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">

                                                            <EditSectorButton
                                                                sector={sector}
                                                                onSuccess={handleRefresh}
                                                                loadData={loadData}
                                                                sectors={filteredSectors}
                                                            />
                                                            <DeleteSectorButton
                                                                sector={sector}
                                                                onSuccess={handleRefresh}
                                                                loadData={loadData}
                                                            />
                                                            {/* View Details Button - Always visible */}
                                                            <ViewTimeStampDetailsButton
                                                                data={metadata}
                                                                title="Sector Details"
                                                                className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                                                            >
                                                                <FileClock size={18} />
                                                            </ViewTimeStampDetailsButton>
                                                        </div>
                                                    </td>
                                                </motion.tr>

                                                {/* Expanded Row for Metadata */}
                                                {isExpanded && (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        className="bg-gray-50"
                                                    >
                                                        <td colSpan="6" className="px-4 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">

                                                                {/* All Work Types */}
                                                                {sector.stage_work_types && sector.stage_work_types.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                                            <Layers size={14} className="text-purple-500" />
                                                                            All Work Types ({sector.stage_work_types.length})
                                                                        </h4>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {sector.stage_work_types.map((wt, idx) => (
                                                                                <span key={`work-type-${idx}`} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-200 text-gray-700">
                                                                                    {wt.name}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

const ClientsTable = ({ refreshKey }) => {
    const dispatch = useDispatch();
    const { clients = [] } = useSelector((state) => state.api || {});
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [expandedClients, setExpandedClients] = useState({});
    const [showDeleted, setShowDeleted] = useState(false);
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 0, opacity: 1 },
        visible: { y: 0, opacity: 1 }
    };

    const loadData = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchClients(showDeleted)).unwrap();
        } catch (error) {
            dispatch(showSnackbar({
                message: "Failed to load clients",
                type: "error"
            }));
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [refreshKey, showDeleted]);

    const filteredClients = useMemo(() => {
        if (!clients || !Array.isArray(clients)) return [];
        let filtered = [...clients];
        if (searchTerm) {
            filtered = filtered.filter(client =>
                client.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.client_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.pan_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                client.phone?.includes(searchTerm)
            );
        }
        return filtered;
    }, [clients, searchTerm]);

    const toggleClient = (clientId) => {
        setExpandedClients(prev => ({
            ...prev,
            [clientId]: !prev[clientId]
        }));
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'active': 'bg-green-100 text-green-700',
            'inactive': 'bg-red-100 text-red-700',
            'suspended': 'bg-yellow-100 text-yellow-700'
        };
        return colorMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-600';
    };

    const handleRefresh = () => {
        loadData();
    };
    const getUnitDisplayName = (unit) => {
        const unitMap = {
            'length': 'Length',
            'area': 'Area',
            'quantity': 'Quantity'
        };
        return unitMap[unit] || unit || '-';
    };
    const prepareMetadata = (client) => {
        return {
            id: client.id,
            name: client.name,
            created_at: client.created_at,
            created_by: client.created_by,
            created_by_details: client.created_by_details,
            updated_at: client.updated_at,
            updated_by: client.updated_by,
            updated_by_details: client.updated_by_details,
            deleted_at: client.deleted_at,
            deleted_by: client.deleted_by,
            deleted_by_details: client.deleted_by_details,
            customSections: [
                {
                    icon: Layers,
                    title: "Work Types",
                    content: (
                        <div className="flex flex-wrap gap-2">
                            {client.stage_work_types?.length > 0 ? (
                                client.stage_work_types.map((wt, idx) => (
                                    <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-purple-50 text-purple-700 border border-purple-200">
                                        {wt.name}
                                    </span>
                                ))
                            ) : (
                                <p className="text-gray-400 text-sm">No work types assigned</p>
                            )}
                        </div>
                    )
                },
                {
                    icon: Building2,
                    title: "Basic Information",
                    content: (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <span className="text-gray-500">Unit Type:</span>
                                <span className="ml-2 font-medium">{getUnitDisplayName(client.unit)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Status:</span>
                                <span className={`ml-2 font-medium ${client.is_deleted ? 'text-red-600' : 'text-green-600'}`}>
                                    {client.is_deleted ? 'Deleted' : 'Active'}
                                </span>
                            </div>
                        </div>
                    )
                }
            ]
        };
    };
    return (
        <>
            {/* Search and Actions */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Clients by Name, Code, PAN, or Phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <AddClientButton onSuccess={handleRefresh} loadData={loadData} />
                <BulkUploadClientButton onSuccess={handleRefresh} loadData={loadData} />
            </div>

            {/* Clients List */}
            <AnimatePresence>
                {filteredClients.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20 bg-gray-50 rounded-3xl"
                    >
                        <Users size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-2xl font-semibold text-gray-700 mb-2">No clients found</p>
                        <p className="text-gray-500">Click "New Client" to add your first client</p>
                    </motion.div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                        {filteredClients.map((client) => {
                            const isExpanded = expandedClients[client.id];
                            const branches = client.branches || [];
                            const metadata = prepareMetadata(client);
                            return (
                                <motion.div
                                    key={client.id}
                                    variants={itemVariants}
                                    layout
                                    className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-300"
                                >
                                    {/* Client Header */}
                                    <div
                                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors rounded-2xl"
                                        onClick={() => toggleClient(client.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 flex-wrap mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {client.client_name}
                                                    </h3>
                                                    {client.client_code && (
                                                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-600 font-mono">
                                                            Code: {client.client_code}
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                                                        {client.status?.toUpperCase() || 'ACTIVE'}
                                                    </span>
                                                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-600">
                                                        {branches.length} Branch(es)
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500 mt-2">
                                                    {client.pan_no && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">PAN:</span>
                                                            <span className="font-mono">{client.pan_no}</span>
                                                        </div>
                                                    )}
                                                    {client.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">Phone:</span>
                                                            <span>{client.phone}</span>
                                                        </div>
                                                    )}
                                                    {client.address && (
                                                        <div className="flex items-center gap-1 col-span-1 md:col-span-3">
                                                            <span className="font-medium">Address:</span>
                                                            <span className="truncate">{client.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <EditClientButton
                                                    client={client}
                                                    onSuccess={handleRefresh}
                                                    loadData={loadData}
                                                />
                                                <DeleteClientButton
                                                    client={client}
                                                    onSuccess={handleRefresh}
                                                    loadData={loadData}
                                                />
                                                <ViewTimeStampDetailsButton
                                                    data={metadata}
                                                    title="Sector Details"
                                                    className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                                                >
                                                    <FileClock size={18} />
                                                </ViewTimeStampDetailsButton>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleClient(client.id)
                                                    }}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Branches Section */}
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
                                                            <Building2 size={16} />
                                                            Branches
                                                        </h4>
                                                    </div>

                                                    {branches.length === 0 ? (
                                                        <div className="text-center py-8 bg-white rounded-xl">
                                                            <p className="text-gray-400">No branches yet. Click "Add Branch" to create one.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-gray-100 text-xs uppercase text-gray-600 rounded-lg">
                                                                    <tr>
                                                                        <th className="px-3 py-3 text-left">Branch Name</th>
                                                                        <th className="px-3 py-3 text-left">GST Number</th>
                                                                        <th className="px-3 py-3 text-left">State</th>
                                                                        <th className="px-3 py-3 text-center">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {branches.map((branch, index) => (
                                                                        <tr key={index} className="border-t border-gray-200 hover:bg-white transition">
                                                                            <td className="px-3 py-3 font-medium text-gray-700">
                                                                                {branch.name}
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                {/* <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-600 text-xs font-mono"> */}
                                                                                {branch.gst || '-'}
                                                                                {/* </span> */}
                                                                            </td>
                                                                            <td className="px-3 py-3 text-gray-600">
                                                                                {branch.state || '-'}
                                                                            </td>
                                                                            <td className="px-3 py-3 text-center">
                                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${branch.status?.toLowerCase() === 'active'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : 'bg-red-100 text-red-700'
                                                                                    }`}>
                                                                                    {branch.status?.toUpperCase() || 'ACTIVE'}
                                                                                </span>
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
    );
};


export { ActivityTable, CompaniesTable, SectorsTable, ClientsTable };