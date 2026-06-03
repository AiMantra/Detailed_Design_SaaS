// import React, { useState, useMemo, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useDispatch, useSelector } from "react-redux";
// import {
//     Search,
//     Filter,
//     Calendar,
//     Clock,
//     FileText,
//     FolderOpen,
//     RefreshCw,
//     Plus,
//     Briefcase,
//     Hourglass,
//     AlignLeft,
//     X,
//     Edit,
//     CheckCircle2,
//     CircleDashed,
//     UserCheck,
//     ShieldAlert,
//     Users
// } from "lucide-react";

// import { fetchTaskPlanners } from "../api/apiSlice";
// import LoadingModal from "../../components/modals/LoadingModal";
// import MultiWorkLogModal from "./MultilogModal";
// // ✅ IMPORT ADDED: You need this for the onSave function in the modal
// import { saveDailyWorkLog } from "../tasks/taskSlice";

// const TaskPlanner = () => {
//     const dispatch = useDispatch();

//     // Grab state from Redux
//     const { user } = useSelector((state) => state.auth || {});

//     const {
//         taskPlanners = [],
//         projectsOnly = [],
//         projectDetails = {},
//         loading: apiLoading = false,
//         companies = [],
//         sectors = [],
//         clients = [],
//     } = useSelector((state) => state.api || {});

//     // Filters & UI State
//     const [searchTerm, setSearchTerm] = useState("");
//     const [filterDate, setFilterDate] = useState("all");
//     const [refreshing, setRefreshing] = useState(false);
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
//     const [showMultiLog, setShowMultiLog] = useState(false);

//     // --- ROLE-BASED TAB LOGIC ---
//     const availableTabs = useMemo(() => {
//         const role = user?.role;
//         if (role === "ACCOUNT" || role === "ADMIN") {
//             return ["My Tasks", "TL Tasks", "User Tasks"];
//         } else if (role === "TL") {
//             return ["My Tasks", "User Tasks"];
//         }
//         return [];
//     }, [user]);

//     const [activeTab, setActiveTab] = useState("My Tasks");

//     useEffect(() => {
//         dispatch(fetchTaskPlanners());
//     }, [dispatch]);

//     const handleRefresh = async () => {
//         setRefreshing(true);
//         try {
//             await dispatch(fetchTaskPlanners()).unwrap();
//         } catch (error) {
//             console.error("Failed to refresh planners", error);
//         } finally {
//             setRefreshing(false);
//         }
//     };

//     const handleUpdateTask = (task) => {
//         console.log("Updating task:", task);
//         // Add your logic to open edit modal/page
//     };

//     // --- MAIN FILTER LOGIC ---
//     const filteredPlanners = useMemo(() => {
//         const dataArray = Array.isArray(taskPlanners) ? taskPlanners : taskPlanners?.data || [];
//         let filtered = [...dataArray];

//         if (activeTab === "My Tasks" || availableTabs.length === 0) {
//             // filtered = filtered.filter(plan => plan.user === user?.emp_code); 
//         } else if (activeTab === "TL Tasks") {
//             // filtered = filtered.filter(plan => plan.role === "TL"); 
//         } else if (activeTab === "User Tasks") {
//             // filtered = filtered.filter(plan => plan.role === "USER"); 
//         }

//         if (searchTerm) {
//             filtered = filtered.filter((plan) =>
//                 (plan.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 (plan.project || "").toLowerCase().includes(searchTerm.toLowerCase())
//             );
//         }

//         if (startDate || endDate) {
//             filtered = filtered.filter((plan) => {
//                 if (!plan.date) return false;

//                 const planDate = new Date(plan.date);
//                 planDate.setHours(0, 0, 0, 0);

//                 if (startDate) {
//                     const start = new Date(startDate);
//                     start.setHours(0, 0, 0, 0);
//                     if (planDate < start) return false;
//                 }

//                 if (endDate) {
//                     const end = new Date(endDate);
//                     end.setHours(0, 0, 0, 0);
//                     if (planDate > end) return false;
//                 }

//                 return true;
//             });
//         }

//         return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//     }, [taskPlanners, searchTerm, startDate, endDate, activeTab, availableTabs.length, user]);

//     // Formatters
//     const formatDate = (dateString) => {
//         if (!dateString) return "Unscheduled";
//         return new Date(dateString).toLocaleDateString("en-IN", {
//             year: "numeric", month: "short", day: "numeric",
//         });
//     };

//     const formatTime = (timeString) => {
//         if (!timeString) return "N/A";
//         return new Date(timeString).toLocaleTimeString("en-IN", {
//             hour: "2-digit", minute: "2-digit", hour12: true
//         });
//     };

//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
//     };

//     const itemVariants = {
//         hidden: { y: 20, opacity: 0 },
//         visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
//     };

//     const isCurrentlyLoading = apiLoading || refreshing;

//     const getTabIcon = (tabName) => {
//         if (tabName === "My Tasks") return <UserCheck size={16} />;
//         if (tabName === "TL Tasks") return <ShieldAlert size={16} />;
//         return <Users size={16} />;
//     };

//     return (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8 relative">

//             <LoadingModal isVisible={isCurrentlyLoading} />

//             {/* HEADER SECTION */}
//             <div className="mb-8 flex justify-between items-start">
//                 <div>
//                     <div className="flex items-center gap-3 mb-2">
//                         <motion.h1
//                             initial={{ x: -20, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase"
//                         >
//                             Task Planner
//                         </motion.h1>
//                         <motion.div
//                             initial={{ scale: 0 }} animate={{ scale: 1 }}
//                             className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-600"
//                         >
//                             <Calendar size={16} />
//                             {filteredPlanners.length} Tasks
//                         </motion.div>
//                     </div>
//                     <motion.p
//                         initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
//                         className="text-gray-500 text-lg"
//                     >
//                         Manage and schedule your upcoming project sub-activities
//                     </motion.p>
//                 </div>

//                 <div className="flex gap-3">
//                     <motion.button
//                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
//                         onClick={handleRefresh}
//                         disabled={isCurrentlyLoading}
//                         className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
//                     >
//                         <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
//                         <span className="text-sm font-medium text-gray-700 hidden sm:inline">Refresh</span>
//                     </motion.button>

//                     <motion.button
//                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
//                         onClick={() => setShowMultiLog(true)}
//                         className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
//                     >
//                         <Plus size={20} />
//                         <span className="text-sm font-medium hidden sm:inline">Plan Task</span>
//                     </motion.button>
//                 </div>
//             </div>

//             {/* ROLE-BASED TABS */}
//             {availableTabs.length > 0 && (
//                 <motion.div
//                     initial={{ y: 10, opacity: 0 }}
//                     animate={{ y: 0, opacity: 1 }}
//                     className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit mb-6 border border-gray-200/50"
//                 >
//                     {availableTabs.map((tab) => (
//                         <button
//                             key={tab}
//                             onClick={() => setActiveTab(tab)}
//                             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab
//                                 ? "bg-white text-blue-600 shadow-sm border border-gray-200"
//                                 : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
//                                 }`}
//                         >
//                             {getTabIcon(tab)}
//                             {tab}
//                         </button>
//                     ))}
//                 </motion.div>
//             )}

//             {/* SEARCH AND FILTERS */}
//             {!isCurrentlyLoading && (
//                 <>
//                     <motion.div
//                         initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
//                         className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
//                     >
//                         <div className="flex flex-col lg:flex-row gap-4">
//                             {/* Search Input */}
//                             <div className="flex-1 relative">
//                                 <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//                                 <input
//                                     type="text"
//                                     placeholder="Search tasks by note or project ID..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//                                 />
//                             </div>

//                             {/* Date Range Picker */}
//                             <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
//                                 <div className="relative">
//                                     <input
//                                         type="date"
//                                         value={startDate}
//                                         onChange={(e) => setStartDate(e.target.value)}
//                                         className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
//                                     />
//                                     <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
//                                 </div>
//                                 <span className="text-gray-400 text-sm font-medium">to</span>
//                                 <div className="relative">
//                                     <input
//                                         type="date"
//                                         value={endDate}
//                                         min={startDate}
//                                         onChange={(e) => setEndDate(e.target.value)}
//                                         className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
//                                     />
//                                     <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
//                                 </div>

//                                 {/* Clear Dates Button */}
//                                 {(startDate || endDate) && (
//                                     <button
//                                         onClick={() => {
//                                             setStartDate("");
//                                             setEndDate("");
//                                         }}
//                                         className="p-3 ml-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0"
//                                         title="Clear date filter"
//                                     >
//                                         <X size={18} />
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* RENDER PLANNER CARDS */}
//                     <AnimatePresence>
//                         {filteredPlanners.length === 0 ? (
//                             <motion.div
//                                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
//                                 className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100"
//                             >
//                                 <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
//                                 <p className="text-2xl font-semibold text-gray-700 mb-2">
//                                     No {activeTab.toLowerCase()} found
//                                 </p>
//                                 <p className="text-gray-400">Try adjusting your search or filters.</p>
//                             </motion.div>
//                         ) : (
//                             <motion.div
//                                 variants={containerVariants} initial="hidden" animate="visible"
//                                 className="grid gap-6"
//                             >
//                                 {filteredPlanners.map((plan) => {
//                                     const isScheduled = plan.date !== null;
//                                     const taskStatus = plan.status || "Pending";
//                                     const isCompleted = taskStatus.toLowerCase() === "completed";

//                                     return (
//                                         <motion.div
//                                             key={plan.id}
//                                             variants={itemVariants}
//                                             layout
//                                             className={`bg-white rounded-3xl shadow-lg hover:shadow-2xl border-2 transition-all duration-300 relative group
//                                                 ${isCompleted
//                                                     ? "border-emerald-100 hover:border-emerald-300"
//                                                     : isScheduled
//                                                         ? "border-blue-100 hover:border-blue-300"
//                                                         : "border-yellow-100 hover:border-yellow-300"}
//                                             `}
//                                         >
//                                             <div className="p-6">
//                                                 <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
//                                                     <div className="flex-1">
//                                                         {/* Header: Title + Badges + Action */}
//                                                         <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
//                                                             <div className="flex flex-wrap items-center gap-3">
//                                                                 <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
//                                                                     <FileText size={22} className={isCompleted ? "text-emerald-500" : isScheduled ? "text-blue-500" : "text-yellow-500"} />
//                                                                     {plan.note || "Untitled Task"}
//                                                                 </h3>

//                                                                 {/* Scheduled Badge */}
//                                                                 <motion.span
//                                                                     whileHover={{ scale: 1.05 }}
//                                                                     className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${isScheduled ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
//                                                                         }`}
//                                                                 >
//                                                                     <Calendar size={14} />
//                                                                     {isScheduled ? "Scheduled" : "Needs Scheduling"}
//                                                                 </motion.span>

//                                                                 {/* Status Badge */}
//                                                                 <motion.span
//                                                                     whileHover={{ scale: 1.05 }}
//                                                                     className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"
//                                                                         }`}
//                                                                 >
//                                                                     {isCompleted ? <CheckCircle2 size={14} /> : <CircleDashed size={14} />}
//                                                                     {taskStatus}
//                                                                 </motion.span>
//                                                             </div>

//                                                             {/* Update Button */}
//                                                             <button
//                                                                 onClick={() => handleUpdateTask(plan)}
//                                                                 className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-blue-600 rounded-xl border border-gray-200 transition-colors shadow-sm"
//                                                                 title="Update Task"
//                                                             >
//                                                                 <Edit size={16} />
//                                                                 <span className="text-sm font-medium">Update</span>
//                                                             </button>
//                                                         </div>

//                                                         {/* KEY INFO GRID */}
//                                                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                                                             <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
//                                                                 <div className={`p-2 rounded-lg ${isScheduled ? "bg-blue-100" : "bg-gray-200"}`}>
//                                                                     <Calendar size={18} className={isScheduled ? "text-blue-600" : "text-gray-500"} />
//                                                                 </div>
//                                                                 <div>
//                                                                     <p className="text-xs text-gray-500">Execution Date</p>
//                                                                     <p className={`text-sm font-semibold ${isScheduled ? "text-gray-800" : "text-gray-400 italic"}`}>
//                                                                         {formatDate(plan.date)}
//                                                                     </p>
//                                                                 </div>
//                                                             </div>

//                                                             <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl col-span-1 md:col-span-2 border border-gray-100">
//                                                                 <div className="p-2 bg-indigo-100 rounded-lg">
//                                                                     <Clock size={18} className="text-indigo-600" />
//                                                                 </div>
//                                                                 <div className="flex gap-4">
//                                                                     <div>
//                                                                         <p className="text-xs text-gray-500">Start Time</p>
//                                                                         <p className="text-sm font-semibold text-gray-800">{formatTime(plan.start_time)}</p>
//                                                                     </div>
//                                                                     <div className="w-px bg-gray-300 h-8 self-center"></div>
//                                                                     <div>
//                                                                         <p className="text-xs text-gray-500">End Time</p>
//                                                                         <p className="text-sm font-semibold text-gray-800">{formatTime(plan.end_time)}</p>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>

//                                                             <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
//                                                                 <div className="p-2 bg-purple-100 rounded-lg">
//                                                                     <Hourglass size={18} className="text-purple-600" />
//                                                                 </div>
//                                                                 <div>
//                                                                     <p className="text-xs text-gray-500">Duration</p>
//                                                                     <p className="text-sm font-semibold text-gray-800">
//                                                                         {plan.duration || "00:00:00"} hrs
//                                                                     </p>
//                                                                 </div>
//                                                             </div>
//                                                         </div>

//                                                         {/* Reference IDs Footer */}
//                                                         <div className="mt-5 flex items-center gap-4 border-t border-gray-100 pt-4">
//                                                             <div className="flex items-center gap-1 text-xs text-gray-500">
//                                                                 <Briefcase size={14} className="text-gray-400" />
//                                                                 Project ID: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{plan.project?.split('-')[0]}...</span>
//                                                             </div>
//                                                             <div className="flex items-center gap-1 text-xs text-gray-500">
//                                                                 <AlignLeft size={14} className="text-gray-400" />
//                                                                 Subactivity: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{plan.subactivity?.split('-')[0]}...</span>
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </motion.div>
//                                     );
//                                 })}
//                             </motion.div>
//                         )}
//                     </AnimatePresence>
//                 </>
//             )}

//             {/* ✅ MOVED OUTSIDE THE CONDITIONAL LOADING BLOCK */}
//             <MultiWorkLogModal
//                 isOpen={showMultiLog}
//                 onClose={() => setShowMultiLog(false)}
//                 projects={projectsOnly}
//                 onSave={async (date, rows) => {
//                     try {
//                         const payloadArray = rows.map(row => ({
//                             ...row,
//                             date: date,
//                             status: row.status || "WORKED"
//                         }));
//                         await dispatch(saveDailyWorkLog(payloadArray)).unwrap();
//                     } catch (error) {
//                         console.error("Failed to save", error);
//                     }
//                 }}
//             />

//         </motion.div>
//     );
// };

// export default TaskPlanner;


// import React, { useState, useMemo, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useDispatch, useSelector } from "react-redux";
// import {
//     Search,
//     Calendar,
//     Clock,
//     FileText,
//     FolderOpen,
//     RefreshCw,
//     Plus,
//     Briefcase,
//     Hourglass,
//     AlignLeft,
//     X,
//     Edit,
//     CheckCircle2,
//     CircleDashed,
//     UserCheck,
//     ShieldAlert,
//     Users
// } from "lucide-react";

// import { fetchTaskPlanners, fetchOnlyProjectsList } from "../api/apiSlice";
// import LoadingModal from "../../components/modals/LoadingModal";
// import MultiWorkLogModal from "./MultilogModal";
// import UpdateGroupModal from "./UpdateGroupModal";
// import { saveDailyWorkLog, updateDailyWorkLog } from "../tasks/taskSlice";

// // Helper to get today's date in YYYY-MM-DD format safely
// const getTodayStr = () => {
//     const today = new Date();
//     // Use local time instead of UTC to avoid timezone shift issues
//     const year = today.getFullYear();
//     const month = String(today.getMonth() + 1).padStart(2, '0');
//     const day = String(today.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// };

// const TaskPlanner = () => {
//     const dispatch = useDispatch();

//     // 1. Grab state from Redux
//     const { user } = useSelector((state) => state.auth || {});

//     const {
//         taskPlanners = [],
//         projectsOnly = [],
//         loading: apiLoading = false,
//     } = useSelector((state) => state.api || {});

//     // 2. Filters & UI State
//     const [searchTerm, setSearchTerm] = useState("");
//     const [refreshing, setRefreshing] = useState(false);
//     const [startDate, setStartDate] = useState("");
//     const [endDate, setEndDate] = useState("");
    
//     // Original Modal State
//     const [showMultiLog, setShowMultiLog] = useState(false);
    
//     // Update Modal State
//     const [updateModalData, setUpdateModalData] = useState({
//         isOpen: false,
//         date: "",
//         tasks: []
//     });

//     // 3. ROLE-BASED TAB LOGIC
//     const availableTabs = useMemo(() => {
//         const role = user?.role;
//         if (role === "ACCOUNT" || role === "ADMIN") {
//             return ["My Tasks", "TL Tasks", "User Tasks"];
//         } else if (role === "TL") {
//             return ["My Tasks", "User Tasks"];
//         }
//         return []; // Normal USER gets no tabs
//     }, [user]);

//     const [activeTab, setActiveTab] = useState("My Tasks");
    

//     useEffect(() => {
//         const loadInitialData = async () => {
//             setRefreshing(true);
//             try {
//                 // Fetch both planners and the projects list concurrently
//                 await Promise.all([
//                     dispatch(fetchTaskPlanners()).unwrap(),
//                     dispatch(fetchOnlyProjectsList()).unwrap()
//                 ]);
//             } catch (error) {
//                 console.error("Failed to load initial data:", error);
//             }finally {
//             setRefreshing(false);
//         }
//         };

//         loadInitialData();
//     }, [dispatch]);

//     const handleRefresh = async () => {
//         setRefreshing(true);
//         try {
//             // Refresh both when the user clicks the refresh button
//             await Promise.all([
//                 dispatch(fetchTaskPlanners()).unwrap(),
//                 dispatch(fetchOnlyProjectsList()).unwrap()
//             ]);
//         } catch (error) {
//             console.error("Failed to refresh planners", error);
//         } finally {
//             setRefreshing(false);
//         }
//     };

//     // 4. MAIN FILTER LOGIC
//     const filteredPlanners = useMemo(() => {
//         const dataArray = Array.isArray(taskPlanners) ? taskPlanners : taskPlanners?.data || [];
//         let filtered = [...dataArray];

//         // Tab Filtering (Role Based)
//         if (activeTab === "My Tasks" || availableTabs.length === 0) {
//             // filtered = filtered.filter(plan => plan.user === user?.emp_code); 
//         } else if (activeTab === "TL Tasks") {
//             // filtered = filtered.filter(plan => plan.role === "TL"); 
//         } else if (activeTab === "User Tasks") {
//             // filtered = filtered.filter(plan => plan.role === "USER"); 
//         }

//         // Search Filter
//         if (searchTerm) {
//             filtered = filtered.filter((plan) =>
//                 (plan.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 (plan.project || "").toLowerCase().includes(searchTerm.toLowerCase())
//             );
//         }

//         // Date Range Filter
//         if (startDate || endDate) {
//             filtered = filtered.filter((plan) => {
//                 if (!plan.date) return false;

//                 const planDate = new Date(plan.date);
//                 planDate.setHours(0, 0, 0, 0);

//                 if (startDate) {
//                     const start = new Date(startDate);
//                     start.setHours(0, 0, 0, 0);
//                     if (planDate < start) return false;
//                 }

//                 if (endDate) {
//                     const end = new Date(endDate);
//                     end.setHours(0, 0, 0, 0);
//                     if (planDate > end) return false;
//                 }

//                 return true;
//             });
//         }

//         return filtered;
//     }, [taskPlanners, searchTerm, startDate, endDate, activeTab, availableTabs.length, user]);

//     // 5. GROUP TASKS BY DATE
//     const groupedPlanners = useMemo(() => {
//         const groups = {};

//         filteredPlanners.forEach((plan) => {
//             const dateKey = plan.date ? plan.date.split("T")[0] : "Unscheduled";
//             if (!groups[dateKey]) {
//                 groups[dateKey] = [];
//             }
//             groups[dateKey].push(plan);
//         });

//         return Object.keys(groups)
//             .sort((a, b) => {
//                 if (a === "Unscheduled") return 1; 
//                 if (b === "Unscheduled") return -1;
//                 return new Date(a) - new Date(b); 
//             })
//             .map((dateKey) => ({
//                 date: dateKey,
//                 tasks: groups[dateKey].sort((t1, t2) => {
//                     if (!t1.start_time) return 1;
//                     if (!t2.start_time) return -1;
//                     return t1.start_time.localeCompare(t2.start_time);
//                 })
//             }));
//     }, [filteredPlanners]);

//     // Check if we have tasks for TODAY to determine which header button to show
//     const todayString = getTodayStr();
//     const todaysGroup = groupedPlanners.find(g => g.date === todayString);

//     // 6. Formatters
//     const formatGroupDate = (dateString) => {
//         if (dateString === "Unscheduled") return "Unscheduled Tasks";
//         return new Date(dateString).toLocaleDateString("en-IN", {
//             weekday: "long", year: "numeric", month: "long", day: "numeric",
//         });
//     };

//     const formatTime = (timeString) => {
//         if (!timeString) return "N/A";
//         return new Date(timeString).toLocaleTimeString("en-IN", {
//             hour: "2-digit", minute: "2-digit", hour12: true
//         });
//     };

//     const containerVariants = {
//         hidden: { opacity: 0 },
//         visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
//     };

//     const itemVariants = {
//         hidden: { y: 20, opacity: 0 },
//         visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
//     };

//     const isCurrentlyLoading = apiLoading || refreshing;

//     const getTabIcon = (tabName) => {
//         if (tabName === "My Tasks") return <UserCheck size={16} />;
//         if (tabName === "TL Tasks") return <ShieldAlert size={16} />;
//         return <Users size={16} />;
//     };

//     return (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8 relative">

//             <LoadingModal isVisible={isCurrentlyLoading} />

//             {/* HEADER SECTION */}
//             <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
//                 <div>
//                     <div className="flex items-center gap-3 mb-2">
//                         <motion.h1
//                             initial={{ x: -20, opacity: 0 }}
//                             animate={{ x: 0, opacity: 1 }}
//                             className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase"
//                         >
//                             Task Planner
//                         </motion.h1>
//                         <motion.div
//                             initial={{ scale: 0 }} animate={{ scale: 1 }}
//                             className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-600"
//                         >
//                             <Calendar size={16} />
//                             {filteredPlanners.length} Tasks
//                         </motion.div>
//                     </div>
//                     <motion.p
//                         initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
//                         className="text-gray-500 text-lg"
//                     >
//                         Manage and schedule your upcoming project sub-activities
//                     </motion.p>
//                 </div>

//                 <div className="flex gap-3">
//                     <motion.button
//                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
//                         onClick={handleRefresh}
//                         disabled={isCurrentlyLoading}
//                         className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
//                     >
//                         <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
//                         <span className="text-sm font-medium text-gray-700 hidden sm:inline">Refresh</span>
//                     </motion.button>

//                     {/* ✅ CONDITIONAL TOP BUTTON: "Update Today" or "Plan Task" */}
//                     {todaysGroup ? (
//                         <motion.button
//                             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
//                             onClick={() => setUpdateModalData({ isOpen: true, date: todaysGroup.date, tasks: todaysGroup.tasks })}
//                             className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
//                         >
//                             <Edit size={20} />
//                             <span className="text-sm font-medium hidden sm:inline">Update Today's Plan</span>
//                         </motion.button>
//                     ) : (
//                         <motion.button
//                             initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
//                             onClick={() => setShowMultiLog(true)}
//                             className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
//                         >
//                             <Plus size={20} />
//                             <span className="text-sm font-medium hidden sm:inline">Plan Task</span>
//                         </motion.button>
//                     )}
//                 </div>
//             </div>

//             {/* ROLE-BASED TABS */}
//             {availableTabs.length > 0 && (
//                 <motion.div
//                     initial={{ y: 10, opacity: 0 }}
//                     animate={{ y: 0, opacity: 1 }}
//                     className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit mb-6 border border-gray-200/50"
//                 >
//                     {availableTabs.map((tab) => (
//                         <button
//                             key={tab}
//                             onClick={() => setActiveTab(tab)}
//                             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
//                                 activeTab === tab
//                                     ? "bg-white text-blue-600 shadow-sm border border-gray-200"
//                                     : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
//                             }`}
//                         >
//                             {getTabIcon(tab)}
//                             {tab}
//                         </button>
//                     ))}
//                 </motion.div>
//             )}

//             {/* SEARCH AND FILTERS */}
//             {!isCurrentlyLoading && (
//                 <>
//                     <motion.div
//                         initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
//                         className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
//                     >
//                         <div className="flex flex-col lg:flex-row gap-4">
//                             {/* Search Input */}
//                             <div className="flex-1 relative">
//                                 <Search className="absolute left-3 top-3 text-gray-400" size={20} />
//                                 <input
//                                     type="text"
//                                     placeholder="Search tasks by note or project ID..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
//                                 />
//                             </div>

//                             {/* Date Range Picker */}
//                             <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
//                                 <div className="relative">
//                                     <input
//                                         type="date"
//                                         value={startDate}
//                                         onChange={(e) => setStartDate(e.target.value)}
//                                         className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
//                                     />
//                                     <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
//                                 </div>
//                                 <span className="text-gray-400 text-sm font-medium">to</span>
//                                 <div className="relative">
//                                     <input
//                                         type="date"
//                                         value={endDate}
//                                         min={startDate}
//                                         onChange={(e) => setEndDate(e.target.value)}
//                                         className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
//                                     />
//                                     <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
//                                 </div>

//                                 {/* Clear Dates Button */}
//                                 {(startDate || endDate) && (
//                                     <button
//                                         onClick={() => {
//                                             setStartDate("");
//                                             setEndDate("");
//                                         }}
//                                         className="p-3 ml-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0"
//                                         title="Clear date filter"
//                                     >
//                                         <X size={18} />
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </motion.div>

//                     {/* RENDER GROUPED PLANNER CARDS */}
//                     <AnimatePresence>
//                         {groupedPlanners.length === 0 ? (
//                             <motion.div
//                                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
//                                 className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100"
//                             >
//                                 <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
//                                 <p className="text-2xl font-semibold text-gray-700 mb-2">
//                                     No {activeTab.toLowerCase()} found
//                                 </p>
//                                 <p className="text-gray-400">Try adjusting your search or filters.</p>
//                             </motion.div>
//                         ) : (
//                             <motion.div
//                                 variants={containerVariants} initial="hidden" animate="visible"
//                                 className="flex flex-col gap-8"
//                             >
//                                 {groupedPlanners.map((group) => {
//                                     const isUnscheduled = group.date === "Unscheduled";

//                                     return (
//                                         <motion.div
//                                             key={group.date}
//                                             variants={itemVariants}
//                                             layout
//                                             className={`bg-white rounded-3xl shadow-xl border-2 overflow-hidden transition-all duration-300
//                                                 ${isUnscheduled ? "border-yellow-200" : "border-blue-100"}
//                                             `}
//                                         >
//                                             {/* Date Group Header */}
//                                             <div className={`px-6 py-5 border-b flex items-center justify-between flex-wrap gap-4 ${isUnscheduled ? "bg-yellow-50/50 border-yellow-100" : "bg-blue-50/30 border-blue-100"}`}>
//                                                 <div className="flex items-center gap-3">
//                                                     <div className={`p-2.5 rounded-xl ${isUnscheduled ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>
//                                                         <Calendar size={20} />
//                                                     </div>
//                                                     <h2 className="text-xl font-bold text-gray-800">
//                                                         {formatGroupDate(group.date)}
//                                                     </h2>
//                                                 </div>
                                                
//                                                 <div className="flex items-center gap-4">
//                                                     <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${isUnscheduled ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
//                                                         {group.tasks.length} {group.tasks.length === 1 ? 'Task' : 'Tasks'}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {/* Tasks List within this Date */}
//                                             <div className="divide-y divide-gray-100">
//                                                 {group.tasks.map((task) => {
//                                                     const taskStatus = task.status || "Pending";
//                                                     const isCompleted = taskStatus.toLowerCase() === "completed";

//                                                     return (
//                                                         <div key={task.id} className="p-6 hover:bg-gray-50/50 transition-colors">
//                                                             <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
//                                                                 <div className="flex-1">
                                                                    
//                                                                     {/* Task Header */}
//                                                                     <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
//                                                                         <div className="flex flex-wrap items-center gap-3">
//                                                                             <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
//                                                                                 <FileText size={20} className={isCompleted ? "text-emerald-500" : isUnscheduled ? "text-yellow-500" : "text-blue-500"} />
//                                                                                 {task.note || "Untitled Task"}
//                                                                             </h3>

//                                                                             {/* Status Badge */}
//                                                                             <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border ${
//                                                                                 isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"
//                                                                             }`}>
//                                                                                 {isCompleted ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
//                                                                                 {taskStatus}
//                                                                             </span>
//                                                                         </div>
//                                                                     </div>

//                                                                     {/* KEY INFO GRID */}
//                                                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                        
//                                                                         {/* Time Frame */}
//                                                                         <div className="flex items-center gap-3 bg-white p-3 rounded-xl col-span-1 md:col-span-2 border border-gray-100 shadow-sm">
//                                                                             <div className="p-2 bg-indigo-50 rounded-lg">
//                                                                                 <Clock size={16} className="text-indigo-600" />
//                                                                             </div>
//                                                                             <div className="flex gap-4">
//                                                                                 <div>
//                                                                                     <p className="text-[11px] text-gray-500 uppercase tracking-wider">Start Time</p>
//                                                                                     <p className="text-sm font-semibold text-gray-800">{formatTime(task.start_time)}</p>
//                                                                                 </div>
//                                                                                 <div className="w-px bg-gray-200 h-8 self-center"></div>
//                                                                                 <div>
//                                                                                     <p className="text-[11px] text-gray-500 uppercase tracking-wider">End Time</p>
//                                                                                     <p className="text-sm font-semibold text-gray-800">{formatTime(task.end_time)}</p>
//                                                                                 </div>
//                                                                             </div>
//                                                                         </div>

//                                                                         {/* Duration */}
//                                                                         <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
//                                                                             <div className="p-2 bg-purple-50 rounded-lg">
//                                                                                 <Hourglass size={16} className="text-purple-600" />
//                                                                             </div>
//                                                                             <div>
//                                                                                 <p className="text-[11px] text-gray-500 uppercase tracking-wider">Duration</p>
//                                                                                 <p className="text-sm font-semibold text-gray-800">
//                                                                                     {task.duration || "00:00:00"} hrs
//                                                                                 </p>
//                                                                             </div>
//                                                                         </div>
//                                                                     </div>

//                                                                     {/* Reference IDs Footer */}
//                                                                     <div className="mt-4 flex flex-wrap items-center gap-4">
//                                                                         <div className="flex items-center gap-1.5 text-xs text-gray-500">
//                                                                             <Briefcase size={14} className="text-gray-400" />
//                                                                             Project: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{task.project?.split('-')[0]}...</span>
//                                                                         </div>
//                                                                         <div className="flex items-center gap-1.5 text-xs text-gray-500">
//                                                                             <AlignLeft size={14} className="text-gray-400" />
//                                                                             Subactivity: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">{task.subactivity?.split('-')[0]}...</span>
//                                                                         </div>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </div>
//                                                     );
//                                                 })}
//                                             </div>
//                                         </motion.div>
//                                     );
//                                 })}
//                             </motion.div>
//                         )}
//                     </AnimatePresence>
//                 </>
//             )}

//             {/* CREATE MODAL */}
//             <MultiWorkLogModal
//                 isOpen={showMultiLog}
//                 onClose={() => setShowMultiLog(false)}
//                 projects={projectsOnly}
//                 onSave={async (date, rows) => {
//                     try {
//                         const payloadArray = rows.map(row => ({
//                             ...row,
//                             date: date,
//                             status: row.status || "WORKED"
//                         }));
//                         await dispatch(saveDailyWorkLog(payloadArray)).unwrap();
//                         dispatch(fetchTaskPlanners()); 
//                     } catch (error) {
//                         console.error("Failed to save", error);
//                     }
//                 }}
//             />

//             {/* UPDATE MODAL */}
//             <UpdateGroupModal
//                 isOpen={updateModalData.isOpen}
//                 onClose={() => setUpdateModalData({ ...updateModalData, isOpen: false })}
//                 projects={projectsOnly}
//                 initialData={updateModalData}
//                 onSave={async (date, rows) => {
//         try {
//             const payloadArray = rows.map(row => ({
//                 ...row,
//                 date: date,
//                 status: row.status || "WORKED"
//             }));
//             await dispatch(updateDailyWorkLog(payloadArray)).unwrap();
//             dispatch(fetchTaskPlanners()); // Refresh view after save
//         } catch (error) {
//             console.error("Failed to save", error);
//         }
//     }}
//             />

//         </motion.div>
//     );
// };

// export default TaskPlanner;


import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
    Search,
    Calendar,
    Clock,
    FileText,
    FolderOpen,
    RefreshCw,
    Plus,
    Briefcase,
    Hourglass,
    AlignLeft,
    X,
    Edit,
    CheckCircle2,
    CircleDashed,
    UserCheck,
    ShieldAlert,
    Users
} from "lucide-react";

import { fetchTaskPlanners, fetchOnlyProjectsList } from "../api/apiSlice";
import LoadingModal from "../../components/modals/LoadingModal";
import MultiWorkLogModal from "./MultilogModal";
import UpdateGroupModal from "./UpdateGroupModal";
import { saveDailyWorkLog, updateDailyWorkLog } from "../tasks/taskSlice";

// Helper to get today's date in YYYY-MM-DD format safely
const getTodayStr = () => {
    const today = new Date();
    // Use local time instead of UTC to avoid timezone shift issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const TaskPlanner = () => {
    const dispatch = useDispatch();

    // 1. Grab state from Redux
    const { user } = useSelector((state) => state.auth || {});

    const {
        taskPlanners = [],
        projectsOnly = [],
        loading: apiLoading = false,
    } = useSelector((state) => state.api || {});

    // 2. Filters & UI State
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    // Original Modal State
    const [showMultiLog, setShowMultiLog] = useState(false);
    
    // Update Modal State
    const [updateModalData, setUpdateModalData] = useState({
        isOpen: false,
        date: "",
        tasks: []
    });

    // 3. ROLE-BASED TAB LOGIC
    const availableTabs = useMemo(() => {
        const role = user?.role;
        if (role === "ACCOUNT" || role === "ADMIN") {
            return ["My Tasks", "TL Tasks", "User Tasks"];
        } else if (role === "TL") {
            return ["My Tasks", "User Tasks"];
        }
        return []; // Normal USER gets no tabs
    }, [user]);

    const [activeTab, setActiveTab] = useState("My Tasks");
    
    useEffect(() => {
        const loadInitialData = async () => {
            setRefreshing(true);
            try {
                // Fetch both planners and the projects list concurrently
                await Promise.all([
                    dispatch(fetchTaskPlanners()).unwrap(),
                    dispatch(fetchOnlyProjectsList()).unwrap()
                ]);
            } catch (error) {
                console.error("Failed to load initial data:", error);
            } finally {
                setRefreshing(false);
            }
        };

        loadInitialData();
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // Refresh both when the user clicks the refresh button
            await Promise.all([
                dispatch(fetchTaskPlanners()).unwrap(),
                dispatch(fetchOnlyProjectsList()).unwrap()
            ]);
        } catch (error) {
            console.error("Failed to refresh planners", error);
        } finally {
            setRefreshing(false);
        }
    };

    // 4. MAIN FILTER LOGIC
    const filteredPlanners = useMemo(() => {
        const dataArray = Array.isArray(taskPlanners) ? taskPlanners : taskPlanners?.data || [];
        let filtered = [...dataArray];

        // Tab Filtering (Role Based)
        if (activeTab === "My Tasks" || availableTabs.length === 0) {
            // filtered = filtered.filter(plan => plan.user === user?.emp_code); 
        } else if (activeTab === "TL Tasks") {
            // filtered = filtered.filter(plan => plan.role === "TL"); 
        } else if (activeTab === "User Tasks") {
            // filtered = filtered.filter(plan => plan.role === "USER"); 
        }

        // Search Filter
        if (searchTerm) {
            filtered = filtered.filter((plan) =>
                (plan.note || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plan.project || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Date Range Filter
        if (startDate || endDate) {
            filtered = filtered.filter((plan) => {
                if (!plan.date) return false;

                const planDate = new Date(plan.date);
                planDate.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (planDate < start) return false;
                }

                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(0, 0, 0, 0);
                    if (planDate > end) return false;
                }

                return true;
            });
        }

        return filtered;
    }, [taskPlanners, searchTerm, startDate, endDate, activeTab, availableTabs.length, user]);

    // 5. GROUP TASKS BY DATE
    const groupedPlanners = useMemo(() => {
        const groups = {};

        filteredPlanners.forEach((plan) => {
            const dateKey = plan.date ? plan.date.split("T")[0] : "Unscheduled";
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(plan);
        });

        return Object.keys(groups)
            .sort((a, b) => {
                if (a === "Unscheduled") return 1; 
                if (b === "Unscheduled") return -1;
                return new Date(a) - new Date(b); 
            })
            .map((dateKey) => ({
                date: dateKey,
                tasks: groups[dateKey].sort((t1, t2) => {
                    if (!t1.start_time) return 1;
                    if (!t2.start_time) return -1;
                    return t1.start_time.localeCompare(t2.start_time);
                })
            }));
    }, [filteredPlanners]);

    // Check if we have tasks for TODAY to determine which header button to show
    const todayString = getTodayStr();
    const todaysGroup = groupedPlanners.find(g => g.date === todayString);

    // 6. Formatters
    const formatGroupDate = (dateString) => {
        if (dateString === "Unscheduled") return "Unscheduled Tasks";
        return new Date(dateString).toLocaleDateString("en-IN", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return "N/A";
        return new Date(timeString).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
    };

    const isCurrentlyLoading = apiLoading || refreshing;

    const getTabIcon = (tabName) => {
        if (tabName === "My Tasks") return <UserCheck size={16} />;
        if (tabName === "TL Tasks") return <ShieldAlert size={16} />;
        return <Users size={16} />;
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8 relative">

            <LoadingModal isVisible={isCurrentlyLoading} />

            {/* HEADER SECTION */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase"
                        >
                            Task Planner
                        </motion.h1>
                        <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-600"
                        >
                            <Calendar size={16} />
                            {filteredPlanners.length} Tasks
                        </motion.div>
                    </div>
                    <motion.p
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg"
                    >
                        Manage and schedule your upcoming project sub-activities
                    </motion.p>
                </div>

                <div className="flex gap-3">
                    <motion.button
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        onClick={handleRefresh}
                        disabled={isCurrentlyLoading}
                        className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Refresh</span>
                    </motion.button>

                    {/* ✅ CONDITIONAL TOP BUTTON: "Update Today" or "Plan Task" */}
                    {todaysGroup ? (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            onClick={() => setUpdateModalData({ isOpen: true, date: todaysGroup.date, tasks: todaysGroup.tasks })}
                            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <Edit size={20} />
                            <span className="text-sm font-medium hidden sm:inline">Update Today's Plan</span>
                        </motion.button>
                    ) : (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            onClick={() => setShowMultiLog(true)}
                            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                        >
                            <Plus size={20} />
                            <span className="text-sm font-medium hidden sm:inline">Plan Task</span>
                        </motion.button>
                    )}
                </div>
            </div>

            {/* ROLE-BASED TABS */}
            {availableTabs.length > 0 && (
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit mb-6 border border-gray-200/50"
                >
                    {availableTabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                activeTab === tab
                                    ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                        >
                            {getTabIcon(tab)}
                            {tab}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* SEARCH AND FILTERS */}
            {!isCurrentlyLoading && (
                <>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100"
                    >
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search tasks by note or project ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Date Range Picker */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
                                    />
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                                <span className="text-gray-400 text-sm font-medium">to</span>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm text-gray-600 min-w-[150px]"
                                    />
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>

                                {/* Clear Dates Button */}
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => {
                                            setStartDate("");
                                            setEndDate("");
                                        }}
                                        className="p-3 ml-1 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0"
                                        title="Clear date filter"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* RENDER GROUPED PLANNER TABLES */}
                    <AnimatePresence>
                        {groupedPlanners.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100"
                            >
                                <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
                                <p className="text-2xl font-semibold text-gray-700 mb-2">
                                    No {activeTab.toLowerCase()} found
                                </p>
                                <p className="text-gray-400">Try adjusting your search or filters.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                variants={containerVariants} initial="hidden" animate="visible"
                                className="flex flex-col gap-8"
                            >
                                {groupedPlanners.map((group) => {
                                    const isUnscheduled = group.date === "Unscheduled";

                                    return (
                                        <motion.div
                                            key={group.date}
                                            variants={itemVariants}
                                            layout
                                            className={`bg-white rounded-3xl shadow-xl border-2 overflow-hidden transition-all duration-300
                                                ${isUnscheduled ? "border-yellow-200" : "border-blue-100"}
                                            `}
                                        >
                                            {/* Date Group Header */}
                                            <div className={`px-6 py-5 flex items-center justify-between flex-wrap gap-4 ${isUnscheduled ? "bg-yellow-50/50 border-b border-yellow-100" : "bg-blue-50/30 border-b border-blue-100"}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl ${isUnscheduled ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>
                                                        <Calendar size={20} />
                                                    </div>
                                                    <h2 className="text-xl font-bold text-gray-800">
                                                        {formatGroupDate(group.date)}
                                                    </h2>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${isUnscheduled ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                                        {group.tasks.length} {group.tasks.length === 1 ? 'Task' : 'Tasks'}
                                                    </span>
                                                    {/* NO UPDATE BUTTON HERE IN THE INDIVIDUAL CARD HEADER */}
                                                </div>
                                            </div>

                                            {/* TABULAR Tasks List within this Date */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                                    <thead>
                                                        <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                                            <th className="px-6 py-4 font-medium">Task Note</th>
                                                            <th className="px-6 py-4 font-medium">Project ID</th>
                                                            <th className="px-6 py-4 font-medium">Subactivity ID</th>
                                                            <th className="px-6 py-4 font-medium">Schedule</th>
                                                            <th className="px-6 py-4 font-medium text-center">Duration</th>
                                                            <th className="px-6 py-4 font-medium text-center">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {group.tasks.map((task) => {
                                                            const taskStatus = task.status || "Pending";
                                                            const isCompleted = taskStatus.toLowerCase() === "completed";

                                                            return (
                                                                <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                                                                    
                                                                    {/* Task Note */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <FileText size={18} className={isCompleted ? "text-emerald-500" : isUnscheduled ? "text-yellow-500" : "text-blue-500"} />
                                                                            <span className="text-sm font-semibold text-gray-800">
                                                                                {task.note || "Untitled Task"}
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Project ID */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <Briefcase size={14} className="text-gray-400" />
                                                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                                                                {task.project?.split('-')[0]}...
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Subactivity ID */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <AlignLeft size={14} className="text-gray-400" />
                                                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                                                                {task.subactivity?.split('-')[0]}...
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Schedule Time */}
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                                                            <Clock size={16} className="text-indigo-400" />
                                                                            <span>
                                                                                {formatTime(task.start_time)} <span className="text-gray-400 font-normal mx-0.5">-</span> {formatTime(task.end_time)}
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                    {/* Duration */}
                                                                    <td className="px-6 py-4 text-center">
                                                                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                                                                            <Hourglass size={14} className="text-purple-500" />
                                                                            {task.duration || "00:00:00"}
                                                                        </span>
                                                                    </td>

                                                                    {/* Status Badge */}
                                                                    <td className="px-6 py-4 text-center">
                                                                        <div className="flex justify-center">
                                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border w-max ${
                                                                                isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                                                            }`}>
                                                                                {isCompleted ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
                                                                                {taskStatus}
                                                                            </span>
                                                                        </div>
                                                                    </td>

                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* CREATE MODAL */}
            <MultiWorkLogModal
                isOpen={showMultiLog}
                onClose={() => setShowMultiLog(false)}
                projects={projectsOnly}
                onSave={async (date, rows) => {
                    try {
                        const payloadArray = rows.map(row => ({
                            ...row,
                            date: date,
                            status: row.status || "WORKED"
                        }));
                        await dispatch(saveDailyWorkLog(payloadArray)).unwrap();
                        dispatch(fetchTaskPlanners()); 
                    } catch (error) {
                        console.error("Failed to save", error);
                    }
                }}
            />

            {/* UPDATE MODAL */}
            <UpdateGroupModal
                isOpen={updateModalData.isOpen}
                onClose={() => setUpdateModalData({ ...updateModalData, isOpen: false })}
                projects={projectsOnly}
                initialData={updateModalData}
                onSave={async (date, rows) => {
                    try {
                        const payloadArray = rows.map(row => ({
                            ...row,
                            date: date,
                            status: row.status || "WORKED"
                        }));
                        await dispatch(updateDailyWorkLog(payloadArray)).unwrap();
                        dispatch(fetchTaskPlanners()); 
                    } catch (error) {
                        console.error("Failed to save", error);
                    }
                }}
            />

        </motion.div>
    );
};

export default TaskPlanner;