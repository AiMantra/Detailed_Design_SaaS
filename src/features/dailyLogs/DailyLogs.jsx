
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Search,
  Filter,
  FileText,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Download,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllLogs,
  createLog,
  deleteLog,
  setLogFilters,
  resetFilters,
  setPage,
  nextPage,
  prevPage,
  calculateStats
} from "./logSlice";
import { showSnackbar } from "../notifications/notificationSlice";
import { fetchProjects } from "../api/apiSlice";
import LogCard from "../../components/LogCard";

const DailyLogs = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { projects = [] } = useSelector((state) => state.projects || { projects: [] });
 

  const { filteredLogs, loading, pagination, filters, stats, error } = useSelector((state) => state.logs);

  // Local state
  const [expandedLogs, setExpandedLogs] = useState({});
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [newLog, setNewLog] = useState({
    projectId: "",
    event_type: "MANUAL_LOG",
    message: ""
  });

  // Get current page logs
  const currentLogs = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, pagination.currentPage, pagination.itemsPerPage]);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchAllLogs());
  }, [dispatch]);

  // Calculate stats when logs change
  useEffect(() => {
    if (filteredLogs.length > 0) {
      dispatch(calculateStats());
    }
  }, [filteredLogs, dispatch]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    dispatch(setLogFilters({ [key]: value }));
  };

  const handleClearFilters = () => {
    dispatch(resetFilters());
  };

  const handleRefresh = () => {
    dispatch(fetchAllLogs());
  };

  const handleAddLog = async () => {
    if (!newLog.projectId) {
      dispatch(showSnackbar({
        message: "Please select a project",
        type: "error"
      }));
      return;
    }

    if (!newLog.message.trim()) {
      dispatch(showSnackbar({
        message: "Please enter a message",
        type: "error"
      }));
      return;
    }

    const project = projects.find(p => p.id === newLog.projectId);

    const logData = {
      project: newLog.projectId,
      project_name: project?.name,
      event_type: newLog.event_type,
      message: newLog.message,
      created_at: new Date().toISOString(),
      user: user?.name || "System",
      user_role: user?.role || "USER"
    };

    try {
      await dispatch(createLog(logData)).unwrap();
      dispatch(showSnackbar({
        message: "Log added successfully",
        type: "success"
      }));
      setShowAddLogModal(false);
      setNewLog({
        projectId: "",
        event_type: "MANUAL_LOG",
        message: ""
      });
    } catch (error) {
      dispatch(showSnackbar({
        message: error.message || "Failed to add log",
        type: "error"
      }));
    }
  };

  const handleDeleteLog = async (log) => {
    if (user?.role !== "ACCOUNT") {
      dispatch(showSnackbar({
        message: "Only Account can delete logs",
        type: "error"
      }));
      return;
    }

    setSelectedLog(log);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteLog(selectedLog.id)).unwrap();
      dispatch(showSnackbar({
        message: "Log deleted successfully",
        type: "success"
      }));
      setShowDeleteConfirm(false);
      setSelectedLog(null);
    } catch (error) {
      dispatch(showSnackbar({
        message: error.message || "Failed to delete log",
        type: "error"
      }));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `logs_${filters.date}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const toggleLogExpansion = (logId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const hasActiveFilters = filters.eventType !== 'all' ||
    filters.projectId !== 'all' ||
    filters.search ||
    filters.date !== new Date().toISOString().split('T')[0];


  if (loading && filteredLogs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl flex items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <div>
            <p className="text-lg font-semibold text-gray-800">Loading Logs</p>
            <p className="text-sm text-gray-500">Fetching project history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-6 px-4 py-6"
    >
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Delete Log</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this log? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Log Modal */}
      <AnimatePresence>
        {showAddLogModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddLogModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Add Manual Log</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
                  <select
                    value={newLog.projectId}
                    onChange={(e) => setNewLog({ ...newLog, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Project</option>

                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.project_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={newLog.event_type}
                    onChange={(e) => setNewLog({ ...newLog, event_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MANUAL_LOG">Manual Log</option>
                    <option value="STATUS_UPDATE">Status Update</option>
                    <option value="PROGRESS_CHANGED">Progress Changed</option>
                    <option value="EXTENSION_REQUESTED">Extension Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={newLog.message}
                    onChange={(e) => setNewLog({ ...newLog, message: e.target.value })}
                    placeholder="Log message"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLog}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  Add Log
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         {/* <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Daily Logs Management
          </h1> */}
          {/* <p className="text-gray-500 mt-2">
            Total: {filteredLogs.length} logs
          </p> */}
        {/* </div>  */}

        <div>
  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent pb-1 md:pb-2">
    Daily Logs Management
  </h2>

  
  {/* <p className="text-xs md:text-sm text-gray-500 mt-1">
    Total: {filteredLogs.length} logs
  </p> */}
</div>

        <div className="flex gap-2 w-full md:w-auto">
          {/* <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button> */}
          <button
  onClick={handleRefresh}
  disabled={loading}
  className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <RefreshCw
    size={20}
    className={`text-blue-600 ${loading ? "animate-spin" : ""}`}
  />
  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
    Refresh
  </span>
</button>

          {/* <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button> */}
          {/* <button
            onClick={() => setShowAddLogModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 flex items-center gap-2 flex-1 md:flex-none"
          >
            <FileText size={20} />
            <span className="hidden sm:inline">Add Log</span>
          </button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-bold text-gray-800">{filteredLogs.length}</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-100">
          <p className="text-sm text-blue-600">Projects</p>
          <p className="text-2xl font-bold text-blue-700">
            {Object.keys(stats.byProject || {}).length}
          </p>
        </div>

        <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-100">
          <p className="text-sm text-green-600">Log Types</p>
          <p className="text-2xl font-bold text-green-700">
            {Object.keys(stats.byType || {}).length}
          </p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4 shadow-md border border-purple-100">
          <p className="text-sm text-purple-600">Today's Logs</p>
          <p className="text-2xl font-bold text-purple-700">
            {stats.byDate?.[filters.date] || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="md:hidden p-4 border-b border-gray-100">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between text-gray-700"
          >
            <span className="font-medium">Filters</span>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                  Active
                </span>
              )}
              <ChevronDown size={18} className={`transform transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
            </div>
          </button>
        </div>

        <div className={`${showMobileFilters ? 'block' : 'hidden'} md:block p-4`}>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={14} />
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Project Filter
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Building size={14} />
                Project
              </label>
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.project_code})</option>
                ))}
              </select>
            </div> */}

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Filter size={14} />
                Event Type
              </label>
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Project Created">Project Created</option>
                <option value="Project Updated">Project Updated</option>
                <option value="Progress Changed">Progress Changed</option>
                <option value="Activity Created">Activity Created</option>
                <option value="Activity Updated">Activity Updated</option>
                <option value="SubActivity Created">SubActivity Created</option>
                <option value="SubActivity Updated">SubActivity Updated</option>
                <option value="Extension Requested">Extension Requested</option>
                <option value="Extension Approved">Extension Approved</option>
                <option value="Extension Rejected">Extension Rejected</option>
                <option value="MANUAL_LOG">Manual Logs</option>
                <option value="STATUS_UPDATE">Status Update</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Search size={14} />
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch(prevPage())}
            disabled={!pagination.hasPrev}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
          </span>
          <button
            onClick={() => dispatch(nextPage())}
            disabled={!pagination.hasNext}
            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-red-800">Error loading logs</p>
            <p className="text-sm text-red-600">{typeof error === 'string' ? error : JSON.stringify(error)}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}

      {/* Logs List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {currentLogs.length > 0 ? (
            currentLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onDelete={handleDeleteLog}
                userRole={user?.role}
                isExpanded={expandedLogs[log.id]}
                onToggle={() => toggleLogExpansion(log.id)}
              />
            ))
          ) : !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-2xl border border-gray-200"
            >
              <FileText size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Logs Found</h3>
              <p className="text-gray-500 mb-6">
                {hasActiveFilters
                  ? "No logs match your filters. Try adjusting them."
                  : "No logs have been created yet."}
              </p>
              <button
                onClick={() => setShowAddLogModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <FileText size={18} />
                Add First Log
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DailyLogs;