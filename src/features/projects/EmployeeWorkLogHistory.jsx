                                                                                
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Search, Calendar, Clock, FileText, FolderOpen, RefreshCw,
  Briefcase, AlignLeft, ChevronDown, ChevronRight, User,
  CheckCircle2, CircleDashed, Hourglass
} from "lucide-react";

import LoadingModal from "../../components/modals/LoadingModal";
import { fetchEmployeeWorklogHistory } from "../api/apiSlice";

// ─── Status Config ────────────────────────────────────────────────────────────
const getStatusConfig = (status) => {
  const s = status?.toLowerCase();
  
  // IF STATUS IS "stop", WE OVERRIDE THE LABEL TO "Completed"
  if (s === "stop" || s === "completed" || s === "approved") {
    return {
      label: "Completed", 
      icon: <CheckCircle2 size={13} />,
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    };
  }
  return {
    label: status || "Pending",
    icon: <CircleDashed size={13} />,
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-400",
  };
};

// ─── Format Helpers ───────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
  });
};

// ─── Summary Bar ──────────────────────────────────────────────────────────────
const SummaryBar = ({ summary }) => {
  const items = [
    { label: "Total Employees", value: summary?.total_users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Logs", value: summary?.total_worklogs, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Hours", value: summary?.total_hours?.toFixed(1), color: "text-emerald-600", bg: "bg-emerald-50" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {items.map((item) => (
        <div key={item.label} className={`rounded-2xl p-5 ${item.bg} border border-gray-100 shadow-sm flex flex-col items-center justify-center`}>
          <p className={`text-3xl font-bold ${item.color}`}>{item.value ?? 0}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Employee Worklog Card ────────────────────────────────────────────────────
const EmployeeHistoryCard = ({ employee, defaultExpanded = false }) => {
  const [collapsed, setCollapsed] = useState(!defaultExpanded);

  // Group worklogs by Date
  const groupedLogs = useMemo(() => {
    if (!employee.worklogs) return [];
    
    const groups = {};
    employee.worklogs.forEach((log) => {
      const dateKey = log.date || "Unscheduled";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });

    // Convert object to array and sort dates descending (newest first)
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        logs: groups[date],
      }));
  }, [employee.worklogs]);

  if (!employee.worklogs || employee.worklogs.length === 0) return null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-blue-100 shadow-lg overflow-hidden">
      
      {/* Employee Header — Click to collapse */}
      <button onClick={() => setCollapsed((c) => !c)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50/40 to-transparent border-b border-blue-100 hover:bg-blue-50/70 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
            <User size={20} />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-lg">{employee.user_name}</p>
            <p className="text-xs font-medium text-gray-500">{employee.user_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
              {employee.total_worklogs} Logs
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Clock size={12} /> {employee.total_hours?.toFixed(1)} Hrs
            </span>
          </div>
          {collapsed ? <ChevronRight size={20} className="text-gray-400 ml-2" /> : <ChevronDown size={20} className="text-gray-400 ml-2" />}
        </div>
      </button>

      {/* Date-Grouped Tables */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-slate-50/50">
            
            <div className="p-5 space-y-6">
              {groupedLogs.map((group) => (
                <div key={group.date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  
                  {/* Date Header */}
                  <div className="bg-gray-100/60 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white rounded-md shadow-sm border border-gray-200">
                        <Calendar size={16} className="text-blue-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm">{formatDate(group.date)}</h3>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-sm">
                      {group.logs.length} Log{group.logs.length !== 1 && 's'}
                    </span>
                  </div>

                  {/* 4-Column Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead>
                        <tr className="bg-gray-50/30 text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-3">Project & Activity</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3 text-center">Hours</th>
                          <th className="px-6 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {group.logs.map((log) => {
                          const cfg = getStatusConfig(log.status);

                          return (
                            <tr key={log.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                              
                              {/* Project & Activity Stacked */}
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2">
                                    <Briefcase size={13} className="text-blue-500 shrink-0" />
                                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">
                                      {log.project || "—"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <AlignLeft size={11} className="shrink-0" />
                                    <span className="truncate max-w-[220px]">
                                      {log.activity} {log.subactivity ? `› ${log.subactivity}` : ""}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Description */}
                              <td className="px-6 py-4 max-w-[280px] whitespace-normal">
                                <div className="flex items-start gap-2">
                                  <FileText size={14} className="text-gray-400 shrink-0 mt-0.5" />
                                  <span className="text-sm text-gray-600 line-clamp-2">
                                    {log.description || "No description provided."}
                                  </span>
                                </div>
                              </td>

                              {/* Hours */}
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center gap-1 text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">
                                  <Hourglass size={12} className="text-indigo-500" />
                                  {log.hours?.toFixed(1)}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border min-w-[100px] ${cfg.badge}`}>
                                  {cfg.icon}
                                  {/* Renders cfg.label (which is "Completed" if status is "stop") */}
                                  <span className="capitalize">{cfg.label}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeWorklogHistory = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const {
    employeeWorklogHistory,
    loading,
  } = useSelector((state) => state.api || {});
  const historyData = employeeWorklogHistory || { total_users: 0, results: [] };

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Determine role-based view settings
  const isAdminOrTL = ["ACCOUNT", "ADMIN", "TL"].includes(user?.role);

  const historyFilters = useMemo(() => {
    const filters = {};
    if (startDate) filters.start_date = startDate;
    if (endDate) filters.end_date = endDate;
    return filters;
  }, [startDate, endDate]);

  useEffect(() => {
   

    dispatch(fetchEmployeeWorklogHistory(historyFilters));
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);

    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    try {
      await dispatch(fetchEmployeeWorklogHistory(historyFilters)).unwrap();
    } catch {
      // The thunk already stores the error and shows the toast.
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Filter Logic ─────────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    if (!historyData.results) return [];
    
    let filtered = [...historyData.results];

    // Filter by Search Term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      
      // If user is ADMIN, ACCOUNT, or TL, search by employee info
      if (["ACCOUNT", "ADMIN", "TL"].includes(user?.role)) {
        filtered = filtered.filter(emp => 
          (emp.user_name || "").toLowerCase().includes(q) || 
          (emp.user_id || "").toLowerCase().includes(q)
        );
      } 
      // If user is a standard USER, search inside their own logs by project/description
      else {
        filtered = filtered.map(emp => {
          const matchingLogs = emp.worklogs.filter(log => 
            (log.project || "").toLowerCase().includes(q) ||
            (log.description || "").toLowerCase().includes(q)
          );
          return matchingLogs.length > 0 ? { ...emp, worklogs: matchingLogs } : null;
        }).filter(Boolean);
      }
    }

    // Filter by Date inside worklogs
    if (startDate && endDate) {
      filtered = filtered.map(emp => {
        const matchingLogs = emp.worklogs.filter(log => {
          const logDate = new Date(log.date);
          logDate.setHours(0, 0, 0, 0);
          
          if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); if (logDate < s) return false; }
          if (endDate) { const e = new Date(endDate); e.setHours(0, 0, 0, 0); if (logDate > e) return false; }
          return true;
        });
        
        // Recalculate totals for the filtered view
        const totalHours = matchingLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
        return matchingLogs.length > 0 ? { ...emp, worklogs: matchingLogs, total_worklogs: matchingLogs.length, total_hours: totalHours } : null;
      }).filter(Boolean);
    }

    return filtered;
  }, [historyData.results, searchTerm, startDate, endDate]);

  const calculatedSummary = useMemo(() => {
    return {
      total_users: filteredData.length,
      total_worklogs: filteredData.reduce((acc, curr) => acc + curr.total_worklogs, 0),
      total_hours: filteredData.reduce((acc, curr) => acc + curr.total_hours, 0)
    };
  }, [filteredData]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8 relative">
      <LoadingModal isVisible={loading || refreshing} />

      {/* ── Header ── */}
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.h1
              initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase">
              Worklog History
            </motion.h1>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-600">
              <FileText size={14} />
              {calculatedSummary.total_worklogs} Total Logs
            </motion.div>
          </div>
          <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-gray-500 text-lg">
            Review detailed past work logs and submitted hours
          </motion.p>
        </div>

        <div className="flex gap-3">
          <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            onClick={handleRefresh} disabled={loading || refreshing}
            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2">
            <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">Refresh Data</span>
          </motion.button>
        </div>
      </div>

      {/* ── Search + Date Filter ── */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input type="text"
              placeholder={isAdminOrTL ? "Search by employee name, ID" : "Search by project or description..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm" />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="appearance-none pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm text-gray-600 min-w-[150px]" />
              <Calendar className="absolute left-3 top-4 text-gray-400 pointer-events-none" size={16} />
            </div>
            <span className="text-gray-400 font-medium">to</span>
            <div className="relative">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="appearance-none pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm text-gray-600 min-w-[150px]" />
              <Calendar className="absolute left-3 top-4 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

        </div>
      </motion.div>

      {/* ── Summary & List ── */}
      <AnimatePresence>
        {filteredData.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100">
            <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-2xl font-semibold text-gray-700 mb-2">No history found</p>
            <p className="text-gray-400">Adjust your search or date range to see results.</p>
          </motion.div>
        ) : (
          <motion.div initial="hidden" animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            
            {isAdminOrTL && <SummaryBar summary={calculatedSummary} />}

            <div className="flex flex-col gap-6">
              {filteredData.map((emp) => (
                <EmployeeHistoryCard 
                  key={emp.user_id} 
                  employee={emp} 
                  defaultExpanded={!isAdminOrTL || filteredData.length === 1} // Auto-expand if single user
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmployeeWorklogHistory;
