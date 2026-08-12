

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
    Search, Calendar, Clock, FileText, FolderOpen, RefreshCw,
    Plus, Briefcase, Hourglass, AlignLeft, X, Edit,
    CheckCircle2, CircleDashed, UserCheck, ShieldAlert, Users,
    ChevronDown, ChevronRight, Sparkles, XCircle
} from "lucide-react";

import { fetchTaskPlanners, fetchOnlyProjectsList } from "../api/apiSlice";
import LoadingModal from "../../components/modals/LoadingModal";
import MultiWorkLogModal from "./MultilogModal";
import UpdateGroupModal from "./UpdateGroupModal";
import { saveDailyWorkplan, updateDailyWorkplan, saveDailyWorkLogBulk } from "../tasks/taskSlice";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatTime = (t) => {
    if (!t) return "N/A";
    return new Date(t).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const formatGroupDate = (dateStr) => {
    if (dateStr === "Unscheduled") return "Unscheduled Tasks";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
};

// ─── Build comparison rows for one employee ───────────────────────────────────
// Matches planners and time_logs by subactivity_id.
// Result types: "completed" | "pending" | "extra"
const buildComparisonRows = (planners = [], timeLogs = [], date = "") => {
    const isToday = date === getTodayStr();
    const rows = [];
    const logsBySubactivity = {};
    timeLogs.forEach((log) => {
        const key = log.subactivity_id;
        if (!logsBySubactivity[key]) logsBySubactivity[key] = [];
        logsBySubactivity[key].push(log);
    });
    const matchedLogIds = new Set();
    planners.forEach((planner) => {
        const candidates = logsBySubactivity[planner.subactivity_id] || [];
        const matchedLog = candidates.find((l) => !matchedLogIds.has(l.id)) || null;
        if (matchedLog) matchedLogIds.add(matchedLog.id);
        rows.push({
            type: matchedLog ? "completed" : isToday ? "pending" : "not_done",  // ← key change
            planner,
            worklog: matchedLog,
        });
    });
    timeLogs.forEach((log) => {
        if (!matchedLogIds.has(log.id)) {
            rows.push({ type: "extra", planner: null, worklog: log });
        }
    });
    return rows;
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
    completed: {
        label: "Completed",
        icon: <CheckCircle2 size={13} />,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        rowHover: "hover:bg-emerald-50/30",
        dot: "bg-emerald-500",
    },
    pending: {
        label: "Pending",
        icon: <CircleDashed size={13} />,
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        rowHover: "hover:bg-orange-50/30",
        dot: "bg-orange-400",
    },
    not_done: {
        label: "Not Done",
        icon: <XCircle size={13} />,
        badge: "bg-red-50 text-red-700 border-red-200",
        rowHover: "hover:bg-red-50/30",
        dot: "bg-red-400",
    },
    extra: {
        label: "Unplanned Work",
        icon: <Sparkles size={13} />,
        badge: "bg-purple-50 text-purple-700 border-purple-200",
        rowHover: "hover:bg-purple-50/30",
        dot: "bg-purple-400",
    },
};
// ─── Summary bar (comparison view header) ─────────────────────────────────────
const SummaryBar = ({ summary }) => {
    const items = [
        { label: "Employees", value: summary?.total_employees, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Total planners", value: summary?.total_planners, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Completed", value: summary?.completed_planners, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Pending", value: summary?.pending_planners, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Work logs", value: summary?.total_time_logs, color: "text-teal-600", bg: "bg-teal-50" },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {items.map((item) => (
                <div key={item.label} className={`rounded-xl p-4 ${item.bg} border border-gray-100`}>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                </div>
            ))}
        </div>
    );
};

// ─── Employee comparison card ─────────────────────────────────────────────────
const EmployeeComparisonCard = ({ employee, date }) => {
    const [collapsed, setCollapsed] = useState(false);

    const rows = useMemo(
        () => buildComparisonRows(employee.planners || [], employee.time_logs || [], date),
        [employee, date]
    );

    const counts = useMemo(() => ({
        completed: rows.filter((r) => r.type === "completed").length,
        pending: rows.filter((r) => r.type === "pending").length,
        extra: rows.filter((r) => r.type === "extra").length,
    }), [rows]);

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm shrink-0">
                    {employee.emp_name?.[0] || "?"}
                </div>
                <div>
                    <p className="font-semibold text-gray-800">{employee.emp_name}</p>
                    <p className="text-xs text-gray-400">{employee.emp_code} · No planners or logs</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border-2 border-blue-100 shadow-xl overflow-hidden">

            {/* Employee header — click to collapse */}
            <button onClick={() => setCollapsed((c) => !c)}
                className="w-full px-6 py-4 flex items-center justify-between bg-blue-50/40 border-b border-blue-100 hover:bg-blue-50/70 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {/* {employee.emp_name?.[0] || "?"} */}
                        <img src={employee?.profilepic} alt="employee profile picture" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-800">{employee.emp_name}</p>
                        <p className="text-xs text-gray-400">{employee.emp_code}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {counts.completed > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 size={11} /> {counts.completed}
                        </span>
                    )}
                    
                  {counts.pending > 0 && (
    <div className="flex flex-col items-center justify-center">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1 w-max">
            <CircleDashed size={11} /> {counts.pending}
        </span>
        <span className="text-[10px] text-gray-500 font-medium mt-0.5">Pending</span>
    </div>
)}

{counts.extra > 0 && (
    <div className="flex flex-col items-center justify-center">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 w-max">
            <Sparkles size={11} /> {counts.extra}
        </span>
        <span className="text-[10px] text-gray-500 font-medium mt-0.5">Unplanned</span>
    </div>
)}

                    {collapsed
                        ? <ChevronRight size={18} className="text-gray-400 ml-1" />
                        : <ChevronDown size={18} className="text-gray-400 ml-1" />}
                </div>
            </button>

            {/* Comparison table */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <th className="px-4 py-3 font-medium w-3" />
                                        <th className="px-4 py-3 font-medium">Project</th>
                                        <th className="px-4 py-3 font-medium">Activity / Subactivity</th>
                                        <th className="px-4 py-3 font-medium">Planned</th>
                                        <th className="px-4 py-3 font-medium">Actual log</th>
                                        <th className="px-4 py-3 font-medium text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((row, idx) => {
                                        const cfg = STATUS[row.type];
                                        const p = row.planner;
                                        const w = row.worklog;

                                        return (
                                            <tr key={idx} className={`transition-colors ${cfg?.rowHover}`}>
                                                {/* Status dot */}
                                                <td className="pl-5 pr-2 py-4">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${cfg?.dot}`} />
                                                </td>

                                                {/* Project */}
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Briefcase size={13} className="text-gray-400 shrink-0" />
                                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
                                                            {p?.project_name || w?.project_name || "—"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-0.5 pl-5">
                                                        {p?.project_code || w?.project_code || ""}
                                                    </p>
                                                </td>

                                                {/* Activity / Subactivity */}
                                                <td className="px-4 py-4">
                                                    <p className="text-sm font-medium text-gray-700">
                                                        {p?.activity_name || w?.activity_name || "—"}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                        <AlignLeft size={11} />
                                                        {p?.subactivity_name || w?.subactivity_name || "—"}
                                                    </p>
                                                </td>

                                                {/* Planned time */}
                                                <td className="px-4 py-4">
                                                    {p ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                <Clock size={12} className="text-indigo-400" />
                                                                {/* <span>
                                                                    {(() => {
                                                                        const utcDate = new Date(p.start_time);
                                                                        const hours = utcDate.getUTCHours();
                                                                        const minutes = utcDate.getUTCMinutes();
                                                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                                                        const displayHours = hours % 12 || 12;
                                                                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                                    })()}
                                                                </span>
                                                                <span>
                                                                    to {(() => {
                                                                        const utcDate = new Date(p.end_time);
                                                                        const hours = utcDate.getUTCHours();
                                                                        const minutes = utcDate.getUTCMinutes();
                                                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                                                        const displayHours = hours % 12 || 12;
                                                                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                                    })()}
                                                                </span> */}

                                                                <span>
                                                                    {(() => {
                                                                        const utcDate = new Date(w.start_time);
                                                                        const hours = utcDate.getUTCHours();
                                                                        const minutes = utcDate.getUTCMinutes();
                                                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                                                        const displayHours = hours % 12 || 12;
                                                                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                                    })()}
                                                                </span>
                                                                <span>
                                                                    to {(() => {
                                                                        const utcDate = new Date(w.end_time);
                                                                        const hours = utcDate.getUTCHours();
                                                                        const minutes = utcDate.getUTCMinutes();
                                                                        const ampm = hours >= 12 ? 'PM' : 'AM';
                                                                        const displayHours = hours % 12 || 12;
                                                                        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Hourglass size={11} className="text-purple-400" />
                                                                {p.duration || "—"}
                                                            </div>
                                                            {p.note && (
                                                                <p className="text-xs text-gray-400 italic truncate max-w-[180px]">
                                                                    {p.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">Not planned</span>
                                                    )}
                                                </td>

                                                {/* Actual worklog */}
                                                <td className="px-4 py-4">
                                                    {w ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                                <Clock size={12} className="text-teal-400" />
                                                                {formatTime(w.start_time)} – {formatTime(w.end_time)}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                <Hourglass size={11} className="text-teal-400" />
                                                                {w.duration || "—"}
                                                            </div>
                                                            {w.note && (
                                                                <p className="text-xs text-gray-400 italic truncate max-w-[180px]">
                                                                    {w.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">No log</span>
                                                    )}
                                                </td>

                                                {/* Status badge */}
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border w-max mx-auto ${cfg?.badge}`}>
                                                        {cfg?.icon}
                                                        {cfg?.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}

                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

//─── My Tasks table(standard single - user view) ───────────────────────────────
// const MyTasksTable = ({ group }) => {
//     const isUnscheduled = group.date === "Unscheduled";
//     return (
//         <div className="overflow-x-auto">
//             <table className="w-full text-left border-collapse whitespace-nowrap">
//                 <thead>
//                     <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
//                         <th className="px-4 py-4 font-medium">Task note</th>
//                         <th className="px-4 py-4 font-medium">Project</th>
//                         <th className="px-4 py-4 font-medium">Subactivity</th>
//                         <th className="px-4 py-4 font-medium">Schedule</th>
//                         <th className="px-4 py-4 font-medium text-center">Duration</th>
//                         <th className="px-4 py-4 font-medium text-center">Status</th>
//                     </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100">
//                     {group.tasks.map((task) => {
//                         const isCompleted = task.status !== "not_done";
//                         return (
//                             <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
//                                 <td className="px-4 py-4">
//                                     <div className="flex items-center gap-3">
//                                         <FileText size={18} className={isCompleted ? "text-emerald-500" : isUnscheduled ? "text-yellow-500" : "text-blue-500"} />
//                                         <span className="text-sm font-semibold text-gray-800">{task.note || "Untitled task"}</span>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-4">
//                                     <div className="flex items-center gap-1.5">
//                                         <Briefcase size={14} className="text-gray-400" />
//                                         <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
//                                             {task?.project_detail?.project_name || task.project_name || "Unnamed project"}
//                                         </span>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-4">
//                                     <div className="flex items-center gap-1.5">
//                                         <AlignLeft size={14} className="text-gray-400" />
//                                         <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
//                                             {task.subactivity_detail?.subactivity_name || task.subactivity_name || "Unnamed subactivity"}
//                                         </span>
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-4">
//                                     <div className="flex items-center gap-2 text-sm text-gray-700">
//                                         <Clock size={16} className="text-indigo-400" />
//                                         {formatTime(task.start_time)} <span className="text-gray-400 mx-0.5">–</span> {formatTime(task.end_time)}
//                                     </div>
//                                 </td>
//                                 <td className="px-4 py-4 text-center">
//                                     <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
//                                         <Hourglass size={14} className="text-purple-500" />
//                                         {task.duration || "00:00:00"}
//                                     </span>
//                                 </td>
//                                 <td className="px-4 py-4 text-center">
//                                     <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border w-max mx-auto ${isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
//                                         {isCompleted ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
//                                         {isCompleted ? "Completed" : "Pending"}
//                                     </span>
//                                 </td>
//                             </tr>
//                         );
//                     })}
//                 </tbody>
//             </table>
//         </div>
//     );
// };

// ─── My Tasks table (Clean, beautiful tabular layout for users) ───────────────
const MyTasksTable = ({ group }) => {
    const isUnscheduled = group.date === "Unscheduled";
    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-200">
                        <th className="px-6 py-4 whitespace-nowrap">Task Note</th>
                        <th className="px-6 py-4 whitespace-nowrap">Project Code</th>
                        <th className="px-6 py-4 whitespace-nowrap">Project</th>
                        <th className="px-6 py-4 whitespace-nowrap">Subactivity</th>
                        <th className="px-6 py-4 whitespace-nowrap">Schedule</th>
                        <th className="px-6 py-4 whitespace-nowrap text-center">Duration</th>
                        <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                    {group.tasks.map((task) => {
                        const isCompleted = task.status !== "not_done";
                        return (
                            <tr key={task.id} className="hover:bg-blue-50/30 transition-all duration-200 group">

                                {/* Task Note */}
                                <td className="px-6 py-4 max-w-[280px]">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isCompleted ? "bg-emerald-100 text-emerald-600" : isUnscheduled ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>
                                            <FileText size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-800 break-words leading-snug">
                                            {task.note || "Untitled task"}
                                        </span>
                                    </div>
                                </td>

                                {/* Project details stacked */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-md shrink-0">
                                            <Briefcase size={14} className="text-gray-500" />
                                        </div>
                                        <div className="flex flex-col">

                                            <span className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                {task?.project_detail?.project_code || task.project_code || "No code available"}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-md shrink-0">
                                            <Briefcase size={14} className="text-gray-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {task?.project_detail?.project_name || task.project_name || "Unnamed project"}
                                            </span>

                                        </div>
                                    </div>
                                </td>

                                {/* Subactivity details stacked */}

                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-md shrink-0">
                                            <AlignLeft size={14} className="text-gray-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-700">
                                                {task.subactivity_detail?.subactivity_name || task.subactivity_name || "Unnamed subactivity"}
                                            </span>
                                            <span className="text-[11px] text-gray-400 mt-0.5">
                                                {task.activity_detail?.activity_name || task.activity_name || "Unknown activity"}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Time Schedule */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-indigo-50 rounded-md shrink-0">
                                            <Clock size={14} className="text-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">
                                                {(() => {
                                                    const utcDate = new Date(task.start_time);
                                                    const hours = utcDate.getUTCHours();
                                                    const minutes = utcDate.getUTCMinutes();
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    const displayHours = hours % 12 || 12;
                                                    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                })()}
                                            </span>
                                            <span className="text-[11px] text-gray-400 font-medium">
                                                to {(() => {
                                                    const utcDate = new Date(task.end_time);
                                                    const hours = utcDate.getUTCHours();
                                                    const minutes = utcDate.getUTCMinutes();
                                                    const ampm = hours >= 12 ? 'PM' : 'AM';
                                                    const displayHours = hours % 12 || 12;
                                                    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* Duration Pill */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 min-w-[95px]">
                                        <Hourglass size={12} className="text-purple-500 shrink-0" />
                                        {task.duration || "00:00:00"}
                                    </span>
                                </td>

                                {/* Status Pill */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border min-w-[110px] ${isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                                        {isCompleted ? <CheckCircle2 size={14} className="shrink-0" /> : <CircleDashed size={14} className="shrink-0" />}
                                        {isCompleted ? "Completed" : "Pending"}
                                    </span>
                                </td>

                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};


// ─── Main component ───────────────────────────────────────────────────────────
const TaskPlanner = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth || {});

    // Read both flat planners (My Tasks) and full data (comparison view)
    const {
        taskPlanners = [],       // flat array — used for My Tasks
        taskPlannersData = null, // { employees[], summary } — used for comparison
        projectsOnly = [],
        loading: apiLoading = false,
    } = useSelector((state) => state.api || {});

    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showMultiLog, setShowMultiLog] = useState(false);
    const [updateModalData, setUpdateModalData] = useState({ isOpen: false, date: "", tasks: [] });

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const availableTabs = useMemo(() => {
        const role = user?.role;
        if (role === "ACCOUNT" || role === "ADMIN") return ["My Tasks", "User Tasks"];
        if (role === "TL") return ["My Tasks", "User Tasks"];
        return [];
    }, [user]);

    const [activeTab, setActiveTab] = useState("My Tasks");
    const isComparisonTab = activeTab === "TL Tasks" || activeTab === "User Tasks";

    // ── Load data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setRefreshing(true);
            try {
                await Promise.all([
                    dispatch(fetchTaskPlanners({ user, activeTab, date: startDate || getTodayStr() })).unwrap(),
                    dispatch(fetchOnlyProjectsList()).unwrap(),
                ]);
            } catch (e) {
            } finally {
                setRefreshing(false);
            }
        };
        load();
    }, [dispatch, user, activeTab, startDate]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await dispatch(fetchTaskPlanners({ user, activeTab, date: startDate || getTodayStr() })).unwrap();
        } catch (e) {
        } finally {
            setRefreshing(false);
        }
    };

    // ── My Tasks: filter + group by date ──────────────────────────────────────
    const filteredPlanners = useMemo(() => {
        const arr = Array.isArray(taskPlanners) ? taskPlanners : [];
        return arr.filter((p) => {
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                if (!(p.note || "").toLowerCase().includes(q) &&
                    !(p.project_name || "").toLowerCase().includes(q)) return false;
            }
            if (startDate || endDate) {
                if (!p.date) return false;
                const d = new Date(p.date); d.setHours(0, 0, 0, 0);
                if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); if (d < s) return false; }
                if (endDate) { const e = new Date(endDate); e.setHours(0, 0, 0, 0); if (d > e) return false; }
            }
            return true;
        });
    }, [taskPlanners, searchTerm, startDate, endDate]);

    const groupedPlanners = useMemo(() => {
        const groups = {};
        filteredPlanners.forEach((p) => {
            const key = p.date ? p.date.split("T")[0] : "Unscheduled";
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return Object.keys(groups)
            .sort((a, b) => {
                if (a === "Unscheduled") return 1;
                if (b === "Unscheduled") return -1;
                return new Date(b) - new Date(a);
            })
            .map((key) => ({
                date: key,
                tasks: groups[key].sort((a, b) => {
                    if (!a.start_time) return 1;
                    if (!b.start_time) return -1;
                    return a.start_time.localeCompare(b.start_time);
                }),
            }));
    }, [filteredPlanners]);

    // ── Comparison view: employees from taskPlannersData ──────────────────────
    const comparisonEmployees = useMemo(() => {
        if (!isComparisonTab) return [];
        return taskPlannersData?.employees || [];
    }, [isComparisonTab, taskPlannersData]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return comparisonEmployees;
        const q = searchTerm.toLowerCase();
        return comparisonEmployees.filter((emp) =>
            (emp.emp_name || "").toLowerCase().includes(q) ||
            (emp.emp_code || "").toLowerCase().includes(q)
        );
    }, [comparisonEmployees, searchTerm]);

    const comparisonSummary = taskPlannersData?.summary || null;

    // ── Today's group (for header button) ────────────────────────────────────
    const todayStr = getTodayStr();
    const todaysGroup = groupedPlanners.find((g) => g.date === todayStr);
    const isEdit = (() => {
        if (!todaysGroup?.tasks?.length) return false;
        const first = [...todaysGroup.tasks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
        if (!first?.created_at) return false;
        return (new Date() - new Date(first.created_at)) / 60000 <= 60;
    })();

    const isLoading = apiLoading || refreshing;

    const tabIcon = (tab) => {
        if (tab === "My Tasks") return <UserCheck size={15} />;
        if (tab === "TL Tasks") return <ShieldAlert size={15} />;
        return <Users size={15} />;
    };

    const itemVariants = {
        hidden: { y: 16, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 15, stiffness: 100 } },
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 py-8 relative">
            <LoadingModal isVisible={isLoading} />

            {/* ── Header ── */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                            className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent uppercase">
                            Task Planner
                        </motion.h1>
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-indigo-100 text-indigo-600">
                            <Calendar size={14} />
                            {isComparisonTab
                                ? `${filteredEmployees.length} employees`
                                : `${filteredPlanners.length} tasks`}
                        </motion.div>
                    </div>
                    <motion.p initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                        className="text-gray-500 text-lg">
                        {isComparisonTab
                            ? "Planner vs worklog — see what was planned and what was actually done"
                            : "Manage and schedule your upcoming project sub-activities"}
                    </motion.p>
                </div>

                <div className="flex gap-3">
                    <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                        onClick={handleRefresh} disabled={isLoading}
                        className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2">
                        <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                        <span className="text-sm font-medium text-gray-700 hidden sm:inline">Refresh</span>
                    </motion.button>

                    {!isComparisonTab && (
                            todaysGroup ? (
                            <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                onClick={() => setUpdateModalData({ isOpen: true, date: todaysGroup.date, tasks: todaysGroup.tasks })}
                                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                <Edit size={20} />
                                <span className="text-sm font-medium hidden sm:inline">Update today's plan</span>
                            </motion.button>
                        ) : (
                            <motion.button initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                onClick={() => setShowMultiLog(true)}
                                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                                <Plus size={20} />
                                <span className="text-sm font-medium hidden sm:inline">Plan task</span>
                            </motion.button>
                        )
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            {availableTabs.length > 0 && (
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="flex space-x-2 bg-gray-100/80 p-1.5 rounded-2xl w-fit mb-6 border border-gray-200/50">
                    {availableTabs.map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab
                                ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                }`}>
                            {tabIcon(tab)} {tab}
                        </button>
                    ))}
                </motion.div>
            )}

            {/* ── Search + date filter ── */}
            {!isLoading && (
                <>
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
                        <div className="flex flex-col lg:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input type="text"
                                    placeholder={isComparisonTab ? "Search by employee name or code..." : "Search by note or project..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                        className="appearance-none pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm text-gray-600 min-w-[150px]" />
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                                {startDate && (
                                    <button onClick={() => { setStartDate(""); setEndDate(""); }}
                                        className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors shrink-0" title="Clear date filter">
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                    {['ACCOUNT', 'ADMIN', 'TL'].includes(user?.role) && (
                        <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Completed — planned &amp; logged</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" /> Pending — planned, not logged</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Extra work — logged without a plan</span>
                        </div>
                    )}
                    {/* ── Comparison view ── */}
                    {isComparisonTab ? (
                        <AnimatePresence>
                            {filteredEmployees.length === 0 ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100">
                                    <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-2xl font-semibold text-gray-700 mb-2">No data found</p>
                                    <p className="text-gray-400">No employees with plans for the selected date.</p>
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {comparisonSummary && <SummaryBar summary={comparisonSummary} />}
                                    <div className="flex flex-col gap-4">
                                        {filteredEmployees.map((emp) => (
                                            <EmployeeComparisonCard key={emp.emp_code} employee={emp} date={startDate || getTodayStr()} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    ) : (
                        /* ── My Tasks view ── */
                        <AnimatePresence>
                            {groupedPlanners.length === 0 ? (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className="text-center py-20 bg-white rounded-3xl shadow-xl border border-gray-100">
                                    <FolderOpen size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-2xl font-semibold text-gray-700 mb-2">No tasks found</p>
                                    <p className="text-gray-400">Try adjusting your search or date filter.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial="hidden" animate="visible"
                                    variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
                                    className="grid gap-8">
                                    {groupedPlanners.map((group) => {
                                        const isUnscheduled = group.date === "Unscheduled";
                                        return (
                                            <motion.div key={group.date} variants={itemVariants} layout
                                                className={`bg-white rounded-3xl shadow-xl border-2 overflow-hidden ${isUnscheduled ? "border-yellow-200" : "border-blue-100"}`}>
                                                <div className={`px-6 py-5 flex items-center justify-between flex-wrap gap-4 ${isUnscheduled ? "bg-yellow-50/50 border-b border-yellow-100" : "bg-blue-50/30 border-b border-blue-100"}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isUnscheduled ? "bg-yellow-100 text-yellow-600" : "bg-blue-100 text-blue-600"}`}>
                                                            <Calendar size={20} />
                                                        </div>
                                                        <h2 className="text-xl font-bold text-gray-800">{formatGroupDate(group.date)}</h2>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${isUnscheduled ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                                        {group.tasks.length} {group.tasks.length === 1 ? "task" : "tasks"}
                                                    </span>
                                                </div>
                                                <MyTasksTable group={group} />
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </>
            )}

            {/* ── Modals ── */}
            <MultiWorkLogModal
                isOpen={showMultiLog}
                onClose={() => setShowMultiLog(false)}
                projects={projectsOnly}
                onSave={async (date, rows) => {
                    try {
                        const payload = rows.map((r) => ({ ...r, date, status: r.status || "WORKED" }));
                        await dispatch(saveDailyWorkplan(payload)).unwrap();
                        setShowMultiLog(false);
                        dispatch(fetchTaskPlanners({ user, activeTab, date: startDate || getTodayStr() }));
                    } catch (e) {
                    }
                }}
            />

            <UpdateGroupModal
                isOpen={updateModalData.isOpen}
                onClose={() => setUpdateModalData({ ...updateModalData, isOpen: false })}
                projects={projectsOnly}
                isEdit={isEdit}
                initialData={updateModalData}
                onSave={async (date, rows) => {
                    try {
                        const payload = rows.map((r) => ({ ...r, date, status: r.status || "WORKED" }));
                        await dispatch(updateDailyWorkplan(payload)).unwrap();
                        dispatch(fetchTaskPlanners({ user, activeTab, date: startDate || getTodayStr() }));
                    } catch (e) {
                    }
                }}
                onSaveWorklog={async (date, rows) => {
                    try {
                        const payload = rows.map((r) => ({ ...r, date, status: r.status || "WORKED" }));
                        await dispatch(saveDailyWorkLogBulk(payload)).unwrap();
                        dispatch(fetchTaskPlanners({ user, activeTab, date: startDate || getTodayStr() }));
                    } catch (e) {
                    }
                }}
            />
        </motion.div>
    );
};

export default TaskPlanner;
