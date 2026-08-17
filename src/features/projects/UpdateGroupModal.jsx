import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Plus, Trash2, Clock, Save, Loader2,
    Calendar, ChevronDown, AlertCircle, FolderOpen, Edit, CheckSquare, Pencil, CheckCircle2
} from "lucide-react";
import { fetchProjectDetails } from "../api/apiSlice";
import api, { getLatestServerDate } from "../../services/api";
// ─── Constants & Helpers ──────────────────────────────────────────────────────

const TIME_PRESETS = [
    { label: "Full Day", start: "09:00", end: "18:00" },
    { label: "Half Day", start: "09:00", end: "13:00" },
    { label: "Afternoon", start: "14:00", end: "18:00" },
];

const todayStr = () => new Date().toISOString().split("T")[0];

const extractTime = (isoString) => {
    if (!isoString) return "";
    if (isoString.includes("T")) return isoString.split("T")[1].substring(0, 5);
    return isoString;
};

const calcHours = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? mins / 60 : 0;
};

const formatHrs = (h) => (h > 0 ? `${h.toFixed(2)} hrs` : "—");

const timeOptions = (() => {
    const options = [];
    for (let hour = 9; hour <= 20; hour++) {
        for (const min of ["00", "30"]) {
            options.push(`${String(hour).padStart(2, "0")}:${min}`);
        }
    }
    return options;
})();

const emptyRow = () => ({
    _id: crypto.randomUUID(),
    taskId: null,
    projectId: "",
    activityId: "",
    subActivityId: "",
    startTime: "",
    endTime: "",
    workType: "",
    description: "",
    isSelected: true, // ✅ NEW: Selected by default when adding a new row
});

const Highlighted = ({ text = "", term = "" }) => {
    if (!term || !text.toLowerCase().includes(term.toLowerCase())) return <>{text}</>;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? <span key={i} className="bg-yellow-200 font-semibold">{part}</span> : part
            )}
        </>
    );
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ProjectSearchInput = ({ projects, value, onChange, error, disabled, onToggle }) => {
    const selectedProject = projects.find((p) => (p.id || p.project_id) === value);
    const displayName = (p) => p.short_name || p.shortName || p.project_name || p.name || "";

    const [search, setSearch] = useState(selectedProject ? displayName(selectedProject) : "");
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    useEffect(() => {
        if (onToggle) {
            onToggle(open);
        }
    }, [open, onToggle]);

    useEffect(() => {
        setSearch(selectedProject ? displayName(selectedProject) : "");
    }, [value]);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                if (!value) setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [value]);

    const filtered = projects.filter((p) =>
        displayName(p).toLowerCase().includes(search.toLowerCase()) ||
        (p.project_code || p.code || "").toLowerCase().includes(search.toLowerCase())
    );

    const sortedFiltered = [...filtered].sort((a, b) => {
        const aName = displayName(a).toLowerCase();
        const bName = displayName(b).toLowerCase();
        const term = search.toLowerCase();
        const aM = aName.includes(term);
        const bM = bName.includes(term);
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return aName.localeCompare(bName);
    });

    const handleSelect = (project) => {
        const pid = project.id || project.project_id;
        setSearch(displayName(project));
        setOpen(false);
        onChange(pid, project);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        setSearch("");
        setOpen(false);
        onChange("", null);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        if (value) onChange("", null);
        setOpen(true);
    };

    return (
        <div className="relative" ref={containerRef}>
            <FolderOpen size={11} className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 ${disabled ? "text-gray-300" : "text-gray-400"}`} />
            <input
                type="text"
                value={search}
                placeholder="Search project…"
                disabled={disabled}
                onFocus={() => { if (!value && !disabled) setOpen(true); }}
                onBlur={() => setTimeout(() => { if (!value) setSearch(""); setOpen(false); }, 180)}
                onChange={handleInputChange}
                className={`w-full pl-6 pr-6 py-1.5 text-xs border rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition
          ${error ? "border-red-400 bg-red-50" : "border-gray-200"}
          ${value ? "font-medium text-gray-800" : "text-gray-500"}
          ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : ""}`}
            />
            {value && !disabled && (
                <button
                    type="button"
                    onMouseDown={handleClear}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 hover:bg-red-50 w-4 h-4 rounded flex items-center justify-center transition-colors"
                >
                    <X size={10} />
                </button>
            )}
            <AnimatePresence>
                {open && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                        className="absolute z-[9999] mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        {search && sortedFiltered.length > 0 && (
                            <div className="px-2 py-1.5 border-b border-gray-100 text-[9px] text-gray-400 bg-gray-50">
                                {sortedFiltered.length} of {projects.length} projects
                            </div>
                        )}
                        {sortedFiltered.length === 0 ? (
                            <div className="px-3 py-3 text-[11px] text-gray-400 text-center">No matching projects</div>
                        ) : (
                            sortedFiltered.map((p) => {
                                const pid = p.id || p.project_id;
                                return (
                                    <div
                                        key={pid}
                                        onMouseDown={() => handleSelect(p)}
                                        className={`px-2.5 py-2 cursor-pointer transition-colors text-xs ${pid === value ? "bg-blue-50 text-blue-700" : "hover:bg-blue-50/60 text-gray-700"}`}
                                    >
                                        <div className="font-medium leading-tight">
                                            <Highlighted text={displayName(p)} term={search} />
                                        </div>
                                        {(p.project_code || p.code) && (
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                <Highlighted text={p.project_code || p.code} term={search} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Sel = ({ value, onChange, disabled, placeholder, children, error, loading }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading}
            className={`w-full appearance-none bg-white border rounded-lg px-2 py-1.5 pr-7 text-xs
        focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
        >
            <option value="">{loading ? "Loading…" : placeholder}</option>
            {children}
        </select>
        {loading ? <Loader2 size={11} className="animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" /> : <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />}
    </div>
);

const TimeSel = ({ value, onChange, placeholder, error, disabled }) => (
    <div className="relative">
        <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full appearance-none bg-white border rounded-lg px-2 py-1.5 pr-6 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition 
            disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
        >
            <option value="">{placeholder}</option>
            {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
);

const PresetPills = ({ onApply, disabled }) => (
    <div className={`flex gap-1 flex-wrap ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
        {TIME_PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => onApply(p.start, p.end)} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition whitespace-nowrap">
                {p.label}
            </button>
        ))}
    </div>
);

const DurationBadge = ({ start, end }) => {
    const hrs = calcHours(start, end);
    const timeInvalid = start && end && end <= start;
    if (timeInvalid) return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500"><AlertCircle size={11} /> Invalid</span>;
    if (!hrs) return <span className="text-[10px] text-gray-300">—</span>;
    return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{formatHrs(hrs)}</span>;
};

// ─── Main Modal Component ─────────────────────────────────────────────────────

const UpdateGroupModal = ({ isOpen, onClose, onSave, onSaveWorklog, projects = [], isEdit, initialData = {} }) => {
    const dispatch = useDispatch();
    const [date, setDate] = useState("");
    const [rows, setRows] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [detailCache, setDetailCache] = useState({});
    const [loadingDetail, setLoadingDetail] = useState({});

    const [openDropdowns, setOpenDropdowns] = useState({});
    const isAnyDropdownOpen = Object.values(openDropdowns).some(Boolean);

    const ensureProjectDetail = useCallback(async (projectId) => {
        if (!projectId || detailCache[projectId] || loadingDetail[projectId]) return;
        // setLoadingDetail((prev) => ({ ...prev, [projectId]: true }));
        try {
            const result = await dispatch(fetchProjectDetails(projectId)).unwrap();
            setDetailCache((prev) => ({ ...prev, [projectId]: result }));
        } catch (err) {
        } finally {
            // setLoadingDetail((prev) => ({ ...prev, [projectId]: false }));
        }
    }, [dispatch, detailCache, loadingDetail]);

    // Initialize data when modal opens
    useEffect(() => {
        if (isOpen && initialData) {
            setDate(initialData.date && initialData.date !== "Unscheduled" ? initialData.date : todayStr());
            if (initialData.tasks && initialData.tasks.length > 0) {
                const mappedRows = initialData.tasks.map(task => ({
                    _id: crypto.randomUUID(),
                    taskId: task.id,
                    projectId: task.project_id || "",
                    activityId: task.activity_id || "",
                    subActivityId: task.subactivity_id || "",
                    startTime: extractTime(task.start_time),
                    endTime: extractTime(task.end_time),
                    workType: workTypeFromTask(task),
                    description: task.note || "",
                    isSelected: false, // ✅ Existing tasks are unchecked by default
                    status: task.status || "not_done",
                }));
                setRows(mappedRows);
                const uniquePids = [...new Set(mappedRows.map(r => r.projectId).filter(Boolean))];
                uniquePids.forEach(pid => ensureProjectDetail(pid));
            } else {
                setRows([emptyRow()]);
            }
            setErrors({});
        }
    }, [isOpen, initialData, ensureProjectDetail]);

    const detailFor = (pid) => detailCache[pid] || null;
    const activitiesFor = (pid) => [...(detailFor(pid)?.activities_detail || [])].sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0));
    const subActivitiesFor = (pid, aid) => {
        const act = activitiesFor(pid).find((a) => a.id === aid);
        return [...(act?.subactivities || [])].sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0));
    };
    const workTypesFor = (pid) => detailFor(pid)?.sector_detail?.stage_work_types || [];

    const updateRow = useCallback((id, field, value) => {
        setRows((prev) => prev.map((r) => {
            if (r._id !== id) return r;
            const u = { ...r, [field]: value };
            if (field === "projectId") { u.activityId = ""; u.subActivityId = ""; u.workType = ""; }
            if (field === "activityId") { u.subActivityId = ""; }

            // If they modify a row, automatically check the box so it gets saved
            if (field !== "isSelected") u.isSelected = true;

            return u;
        }));
        setErrors((prev) => { const n = { ...prev }; delete n[`${id}.${field}`]; return n; });
    }, []);

    const handleProjectChange = useCallback((rowId, pid) => {
        updateRow(rowId, "projectId", pid);
        if (pid) ensureProjectDetail(pid);
    }, [updateRow, ensureProjectDetail]);

    const applyPreset = useCallback((rowId, start, end) => {
        setRows((prev) => prev.map((r) => r._id === rowId ? { ...r, startTime: start, endTime: end, isSelected: true } : r));
        setErrors((prev) => {
            const n = { ...prev };
            delete n[`${rowId}.startTime`];
            delete n[`${rowId}.endTime`];
            return n;
        });
    }, []);

    const addRow = () => setRows((prev) => [...prev, emptyRow()]);
    const removeRow = (id) => setRows((prev) => prev.filter((r) => r._id !== id));

    // Only calculate hours for selected rows
    const totalHours = rows.reduce((sum, r) => sum + calcHours(r.startTime, r.endTime), 0);

    const validate = () => {
        const errs = {};
        const selectedRows = rows;

        // if (selectedRows.length === 0) {
        //     errs["global"] = "Please select at least one task to update.";
        //     setErrors(errs);
        //     return false;
        // }

        selectedRows?.forEach((r) => {
            if (!r.projectId) errs[`${r._id}.projectId`] = true;
            if (!r.activityId) errs[`${r._id}.activityId`] = true;
            if (!r.subActivityId) errs[`${r._id}.subActivityId`] = true;
            if (!r.startTime) errs[`${r._id}.startTime`] = true;
            if (!r.endTime) errs[`${r._id}.endTime`] = true;
            if (r.startTime && r.endTime && r.endTime <= r.startTime) errs[`${r._id}.endTime`] = true;
            if (!r.workType) errs[`${r._id}.workType`] = true;
        });

        if (!date) errs["date"] = "Date is required";

        if (totalHours > 9) {
            errs["totalHours"] = `Total work hours (${totalHours.toFixed(2)} hrs) cannot exceed 9 hrs`;
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            // ✅ ONLY Extract Selected Rows
            const selectedRows = rows
            const selectedRowsworklog = rows.filter(r => r.isSelected);
            // ✅ Format exactly as requested
            const payload = selectedRows.map(row => ({
                id: row.taskId,
                project: row.projectId,
                subactivity: row.subActivityId,
                date: date,
                start_time: row.startTime,
                end_time: row.endTime,
                work_type: resolveWorkTypeValue(row.workType, workTypesFor(row.projectId)),
                note: row.description,
            }));

            const worklogPayload = selectedRowsworklog.map(row => ({
                id: row.taskId,
                project: row.projectId,
                subactivity: row.subActivityId,
                date: date,
                start_time: row.startTime,
                end_time: row.endTime,
                work_type: resolveWorkTypeValue(row.workType, workTypesFor(row.projectId)),
                note: row.description,
            }));

            if (!isEdit) {
                await onSaveWorklog(date, worklogPayload);
            } else {
                await onSave(date, payload);
            }

            onClose();
        } catch (error) {
        } finally {
            setSaving(false);
        }
    };

    const toggleAllChecks = (e) => {
        const checked = e.target.checked;

        setRows(prev =>
            prev.map(r => ({
                ...r,
                isSelected:
                    r.status?.toUpperCase() === "COMPLETED"
                        ? false
                        : checked,
            }))
        );
    };
    // const areAllSelected = rows.length > 0 && rows.every(r => r.isSelected);
    const selectableRows = rows.filter(
        r => r.status?.toUpperCase() !== "COMPLETED"
    );

    const areAllSelected =
        selectableRows.length > 0 &&
        selectableRows.every(r => r.isSelected);
    const [editingRow, setEditingRow] = useState(null);
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
        if (!isOpen) return;

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
    }, [isOpen]);

    const maxSelectableDate = useMemo(() => {
        if (!serverDate) return null;
        const d = serverDate;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }, [serverDate]);

    // Agar already - selected date server - verified max se aage nikal jaaye, clamp kar do
    useEffect(() => {
        if (maxSelectableDate && date && date > maxSelectableDate) {
            console.log("Clamping date from", date, "to maxSelectableDate", maxSelectableDate);
            setDate(maxSelectableDate);
        }
    }, [maxSelectableDate]);
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 24 }} transition={{ type: "spring", damping: 22, stiffness: 260 }}
                        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full my-8"
                        style={{ maxWidth: "min(98vw, 1500px)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Edit size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Update Planned Tasks</h3>
                                    <p className="text-xs text-gray-400">Select the tasks you want to update</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={15} className="text-gray-400" />
                                    <label className="text-sm font-medium text-gray-600">Date *</label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={new Date(Date.now() - 86400000).toISOString().split("T")[0]}
                                        onChange={(e) => {
                                            setDate(e.target.value);

                                            setErrors((prev) => {
                                                const n = { ...prev };
                                                delete n.date;
                                                return n;
                                            });
                                        }}
                                        max={maxSelectableDate || new Date().toISOString().split("T")[0]}
                                        disabled={dateTampered || checkingClock}
                                        className={`border rounded-lg px-3 py-1.5 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${errors.date
                                                ? "border-red-400 bg-red-50"
                                                : "border-gray-200"
                                            }`}
                                    />

                                    {errors.date && (
                                        <span className="text-[10px] text-red-500 mt-1">
                                            {errors.date}
                                        </span>
                                    )}

                                    {dateTampered && (
                                        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 flex items-start gap-2">
                                            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-red-600 text-sm font-medium">
                                                Your device's date/time appears incorrect. Please correct your system date to continue.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className={`overflow-x-auto px-4 pt-4 transition-all duration-200 ${isAnyDropdownOpen ? "pb-42" : "pb-2"}`}>
                            <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                                        {!isEdit && (
                                            <th className="px-2 pb-1 text-center w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={areAllSelected}
                                                    onChange={toggleAllChecks}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </th>)}
                                        <th className="px-2 pb-1 text-left min-w-[170px]">Project <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-left min-w-[140px]">Activity <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-left min-w-[160px]">Sub-Activity <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[85px]">Start Time <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[85px]">End Time <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[165px]">Quick Presets</th>

                                        <th className="px-2 pb-1 text-center min-w-[68px]">Duration</th>
                                        <th className="px-2 pb-1 text-center min-w-[68px]">Work Type</th>
                                        <th className="px-2 pb-1 text-left min-w-[190px]">Description</th>
                                        {/* <th className="px-1 py-2 text-center">Edit</th> */}
                                        {isEdit && (
                                            <th className="px-1 py-2 text-center">Delete</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence initial={false}>
                                        {rows.map((row) => {
                                            const isLoadingThis = !!loadingDetail[row.projectId];
                                            const activities = activitiesFor(row.projectId);
                                            const subActivities = subActivitiesFor(row.projectId, row.activityId);
                                            const timeInvalid =
                                                row.startTime &&
                                                row.endTime &&
                                                row.endTime <= row.startTime;

                                            const e = (f) => !!errors[`${row._id}.${f}`];
                                            const workTypes = workTypesFor(row.projectId);
                                            const workTypeValue = resolveWorkTypeValue(row.workType, workTypes);
                                            const isEditing = editingRow === row._id;

                                            // Row is editable only when selected AND Edit button clicked
                                            const disabled = !isEdit;

                                            return (
                                                <motion.tr
                                                    key={row._id}
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -16 }}
                                                    transition={{ duration: 0.16 }}
                                                    className={`group transition-all ${disabled ? "opacity-60 bg-gray-50/50" : ""
                                                        }`}
                                                    style={{
                                                        position: "relative",
                                                        zIndex: openDropdowns[row._id] ? 50 : 1
                                                    }}
                                                >
                                                    {/* CHECKBOX */}

                                                    {!isEdit && (
                                                        <td className="px-1 py-2 align-top text-center">
                                                            <div className="mt-1.5 flex justify-center items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={row.isSelected}
                                                                    disabled={row.status?.toUpperCase() === "COMPLETED"}
                                                                    onChange={(e) =>
                                                                        updateRow(
                                                                            row._id,
                                                                            "isSelected",
                                                                            e.target.checked
                                                                        )
                                                                    }
                                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                />
                                                            </div>
                                                        </td>
                                                    )}

                                                    {/* PROJECT */}
                                                    <td className="px-1 py-2 align-top">
                                                        <ProjectSearchInput
                                                            projects={projects}
                                                            value={row.projectId}
                                                            onChange={(pid) =>
                                                                // updateRow(row._id, "projectId", pid)
                                                                handleProjectChange(row._id, pid)
                                                            }
                                                            error={e("projectId")}
                                                            disabled={disabled}
                                                            onToggle={(isOpen) => setOpenDropdowns((prev) => ({ ...prev, [row._id]: isOpen }))}
                                                        />
                                                    </td>

                                                    {/* ACTIVITY */}
                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={row.activityId}
                                                            onChange={(v) =>
                                                                updateRow(row._id, "activityId", v)
                                                            }
                                                            placeholder="Select activity"
                                                            disabled={
                                                                !row.projectId ||
                                                                isLoadingThis ||
                                                                disabled
                                                            }
                                                            loading={isLoadingThis}
                                                            error={e("activityId")}
                                                        >
                                                            {activities.map((a) => (
                                                                <option key={a.id} value={a.id}>
                                                                    {a.activity_name}
                                                                </option>
                                                            ))}
                                                        </Sel>
                                                    </td>

                                                    {/* SUB ACTIVITY */}
                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={row.subActivityId}
                                                            onChange={(v) =>
                                                                updateRow(row._id, "subActivityId", v)
                                                            }
                                                            placeholder="Select sub-activity"
                                                            disabled={
                                                                !row.activityId ||
                                                                isLoadingThis ||
                                                                disabled
                                                            }
                                                            error={e("subActivityId")}
                                                        >
                                                            {subActivities.map((s) => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.sorting_var
                                                                        ? `Stage ${s.sorting_var} – `
                                                                        : ""}
                                                                    {s.subactivity_name}
                                                                </option>
                                                            ))}
                                                        </Sel>
                                                    </td>

                                                    {/* START TIME */}
                                                    <td className="px-1 py-2 align-top">
                                                        <TimeSel
                                                            value={row.startTime}
                                                            onChange={(v) =>
                                                                updateRow(row._id, "startTime", v)
                                                            }
                                                            placeholder="In"
                                                            error={e("startTime")}
                                                            disabled={disabled}

                                                        />
                                                    </td>

                                                    {/* END TIME */}
                                                    <td className="px-1 py-2 align-top">
                                                        <TimeSel
                                                            value={row.endTime}
                                                            onChange={(v) =>
                                                                updateRow(row._id, "endTime", v)
                                                            }
                                                            placeholder="Out"
                                                            error={
                                                                e("endTime") ||
                                                                (!disabled && timeInvalid)
                                                            }
                                                            disabled={disabled}
                                                        />
                                                    </td>

                                                    {/* PRESET */}
                                                    <td className="px-1 py-2 align-top">
                                                        <PresetPills
                                                            onApply={(s, end) =>
                                                                applyPreset(row._id, s, end)
                                                            }
                                                            disabled={disabled}
                                                        />
                                                    </td>

                                                    {/* DURATION */}
                                                    <td className="px-2 py-2 align-top text-center">
                                                        <DurationBadge
                                                            start={row.startTime}
                                                            end={row.endTime}
                                                        />
                                                    </td>

                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={workTypeValue}
                                                            onChange={(v) => updateRow(row._id, "workType", v)}
                                                            placeholder={
                                                                !row.projectId ? "Work type" :
                                                                    isLoadingThis ? "Loading…" :
                                                                        workTypes.length === 0 ? "None defined" : "Select type"
                                                            }
                                                            disabled={disabled}
                                                            loading={isLoadingThis}
                                                            error={e("workType")}
                                                        >
                                                            {workTypes.map((wt) => (
                                                                <option key={workTypeOptionValue(wt)} value={workTypeOptionValue(wt)}>
                                                                    {workTypeOptionLabel(wt)}
                                                                </option>
                                                            ))}
                                                        </Sel>
                                                        {row.projectId && !isLoadingThis && workTypes.length === 0 && (
                                                            <p className="text-[9px] text-amber-500 mt-0.5 leading-tight">
                                                                No work types in this sector
                                                            </p>
                                                        )}
                                                    </td>


                                                    {/* DESCRIPTION */}
                                                    <td className="px-1 py-2 align-top">
                                                        <input
                                                            type="text"
                                                            value={row.description}
                                                            disabled={disabled}
                                                            onChange={(ev) =>
                                                                updateRow(
                                                                    row._id,
                                                                    "description",
                                                                    ev.target.value
                                                                )
                                                            }
                                                            placeholder="What did you work on?"
                                                            className={`w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${disabled
                                                                ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                                                : ""
                                                                }`}
                                                        />
                                                    </td>



                                                    {/* DELETE BUTTON */}
                                                    {isEdit && (
                                                        <td className="px-1 py-2 align-top text-center">
                                                            <button
                                                                onClick={() => removeRow(row._id)}
                                                                disabled={checkingClock ||
                                                                    dateTampered}

                                                                className="p-1.5 rounded-lg text-red-1000 hover:text-red-500 hover:bg-red-50 transition "
                                                                title="Remove row"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>)}
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {isEdit && (
                            <div className="px-6 py-2 flex items-center gap-4">
                                <button onClick={addRow} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition">
                                    <Plus size={15} /> Add More Tasks
                                </button>
                            </div>
                        )}

                        <AnimatePresence>
                            {Object.keys(errors).length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-6 mb-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
                                    <AlertCircle size={15} />
                                    {errors.global ? errors.global : errors.totalHours ? errors.totalHours : "Please fill in all required fields correctly for the selected rows."}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                // disabled={saving || !rows.some(r => r.isSelected)}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                {saving ? <><Loader2 size={15} className="animate-spin" /> Updating…</> : <><Save size={15} /> Update Selected </>}
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UpdateGroupModal;
