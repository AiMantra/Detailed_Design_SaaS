import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Plus, Trash2, Clock, Save, Loader2,
    Calendar, ChevronDown, AlertCircle, Zap, FolderOpen,
} from "lucide-react";
import { fetchProjectDetails } from "../api/apiSlice"; // ← adjust path
import { showSnackbar } from "../notifications/notificationSlice";
// ─── constants ────────────────────────────────────────────────────────────────

const TIME_PRESETS = [
    { label: "Full Day", start: "09:00", end: "18:00" },
    { label: "Half Day", start: "09:00", end: "13:00" },
    { label: "Afternoon", start: "14:00", end: "18:00" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split("T")[0];
const yesterdayStr = () => new Date(Date.now() - 86400000).toISOString().split("T")[0];

const calcHours = (start, end) => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    return mins > 0 ? mins / 60 : 0;
};

const formatHrs = (h) => (h > 0 ? `${h.toFixed(2)} hrs` : "—");

const timeOptions = Array.from({ length: 24 }, (_, hour) =>
    ["00", "30"].map((min) => `${String(hour).padStart(2, "0")}:${min}`)
).flat();

const emptyRow = () => ({
    _id: crypto.randomUUID(),
    projectId: "",
    activityId: "",
    subActivityId: "",
    startTime: "",
    endTime: "",
    workType: "",
    note: "",
});

// highlight matching text
const Highlighted = ({ text = "", term = "" }) => {
    if (!term || !text.toLowerCase().includes(term.toLowerCase())) return <>{text}</>;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
                    : part
            )}
        </>
    );
};

// ─── ProjectSearchInput ───────────────────────────────────────────────────────
// Searchable typeahead that mirrors the Company input style from the reference.
// Props:
//   projects   – full list
//   value      – currently selected project id
//   onChange   – (id, project) => void
//   error      – boolean

const ProjectSearchInput = ({ projects, value, onChange, error, onToggle }) => {
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

    // sync display text when value changes externally (e.g. row reset)
    useEffect(() => {
        setSearch(selectedProject ? displayName(selectedProject) : "");
    }, [value]); // eslint-disable-line

    // close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                // if typed but no selection, revert
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
        // if user edits after a selection, clear the selection
        if (value) onChange("", null);
        setOpen(true);
    };

    const handleFocus = () => {
        if (!value) setOpen(true);
    };

    const handleBlur = () => {
        setTimeout(() => {
            // if nothing matched / not selected, revert text
            if (!value) setSearch("");
            setOpen(false);
        }, 180);
    };

    return (
        <div className="relative" ref={containerRef}>
            {/* icon */}
            <FolderOpen
                size={11}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
            />

            <input
                type="text"
                value={search}
                placeholder="Search project…"
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleInputChange}
                className={`w-full pl-6 pr-6 py-1.5 text-xs border rounded-lg bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 transition
          ${error ? "border-red-400 bg-red-50" : "border-gray-200"}
          ${value ? "font-medium text-gray-800" : "text-gray-500"}`}
            />

            {/* clear button – only when a project is selected */}
            {value && (
                <button
                    type="button"
                    onMouseDown={handleClear}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2
            text-gray-400 hover:text-red-500 hover:bg-red-50
            w-4 h-4 rounded flex items-center justify-center transition-colors"
                    title="Clear"
                >
                    <X size={10} />
                </button>
            )}

            {/* dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute z-[9999] mt-1 w-56 bg-white border border-gray-200
              rounded-lg shadow-xl max-h-52 overflow-y-auto"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    >


                        {/* count hint */}
                        {search && sortedFiltered.length > 0 && (
                            <div className="px-2 py-1.5 border-b border-gray-100 text-[9px] text-gray-400 bg-gray-50">
                                {sortedFiltered.length} of {projects.length} projects
                            </div>
                        )}

                        {sortedFiltered.length === 0 ? (
                            <div className="px-3 py-3 text-[11px] text-gray-400 text-center">
                                No matching projects
                            </div>
                        ) : (
                            sortedFiltered.map((p) => {
                                const pid = p.id || p.project_id;
                                const name = displayName(p);
                                const code = p.project_code || p.code || "";
                                const isActive = pid === value;

                                return (
                                    <div
                                        key={pid}
                                        onMouseDown={() => handleSelect(p)}
                                        className={`px-2.5 py-2 cursor-pointer transition-colors text-xs
                      ${isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "hover:bg-blue-50/60 text-gray-700"
                                            }`}
                                    >
                                        <div className="font-medium leading-tight">
                                            <Highlighted text={name} term={search} />
                                        </div>
                                        {code && (
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                <Highlighted text={code} term={search} />
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

// ─── plain select ─────────────────────────────────────────────────────────────

const Sel = ({ value, onChange, disabled, placeholder, children, error, loading }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading}
            className={`w-full appearance-none bg-white border rounded-lg px-2 py-1.5 pr-7 text-xs
        focus:outline-none focus:ring-2 focus:ring-blue-500 transition
        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
        ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
        >
            <option value="">{loading ? "Loading…" : placeholder}</option>
            {children}
        </select>
        {loading
            ? <Loader2 size={11} className="animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
            : <ChevronDown size={11} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
        }
    </div>
);

const TimeSel = ({ value, onChange, placeholder, error }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full appearance-none bg-white border rounded-lg px-2 py-1.5 pr-6 text-xs
        focus:outline-none focus:ring-2 focus:ring-blue-500 transition
        ${error ? "border-red-400 bg-red-50" : "border-gray-200"}`}
        >
            <option value="">{placeholder}</option>
            {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
);

// ─── preset pills ─────────────────────────────────────────────────────────────

const PresetPills = ({ onApply }) => (
    <div className="flex gap-1 flex-wrap">
        {TIME_PRESETS.map((p) => (
            <button
                key={p.label}
                type="button"
                onClick={() => onApply(p.start, p.end)}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full
          bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200
          transition whitespace-nowrap"
            >
                {p.label}
            </button>
        ))}
    </div>
);

// ─── duration badge ───────────────────────────────────────────────────────────

const DurationBadge = ({ start, end }) => {
    const hrs = calcHours(start, end);
    const timeInvalid = start && end && end <= start;
    if (timeInvalid)
        return <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500"><AlertCircle size={11} /> Invalid</span>;
    if (!hrs) return <span className="text-[10px] text-gray-300">—</span>;
    return <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{formatHrs(hrs)}</span>;
};

// ─── main component ───────────────────────────────────────────────────────────

/**
 * MultiWorkLogModal
 *
 * Props
 *   isOpen      {boolean}
 *   onClose     {() => void}
 *   onSave      {(date: string, rows: WorkLogRow[]) => Promise<void>}
 *   projects    {Array}  – lightweight list: id, project_name/name, short_name, project_code
 *   defaultDate {string} optional YYYY-MM-DD
 */
const MultiWorkLogModal = ({ isOpen, onClose, onSave, projects = [], defaultDate }) => {
    const dispatch = useDispatch();

    const [date, setDate] = useState(defaultDate || todayStr());
    const [rows, setRows] = useState([emptyRow()]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [openDropdowns, setOpenDropdowns] = useState({});
    const isAnyDropdownOpen = Object.values(openDropdowns).some(Boolean);
    const [detailCache, setDetailCache] = useState({});
    const [loadingDetail, setLoadingDetail] = useState({});

    useEffect(() => {
        if (isOpen) {
            setDate(defaultDate || todayStr());
            setRows([emptyRow()]);
            setErrors({});
        }
    }, [isOpen, defaultDate]);

    // ── fetch detail (cached) ──────────────────────────────────────────────────

    const ensureProjectDetail = useCallback(async (projectId) => {
        if (!projectId || detailCache[projectId] || loadingDetail[projectId]) return;
        setLoadingDetail((prev) => ({ ...prev, [projectId]: true }));
        try {
            const result = await dispatch(fetchProjectDetails(projectId)).unwrap();
            setDetailCache((prev) => ({ ...prev, [projectId]: result }));
        } catch (err) {
            console.error("Failed to fetch project details:", err);
        } finally {
            setLoadingDetail((prev) => ({ ...prev, [projectId]: false }));
        }
    }, [dispatch, detailCache, loadingDetail]);

    // ── derived ────────────────────────────────────────────────────────────────

    const detailFor = (pid) => detailCache[pid] || null;

    const activitiesFor = (pid) =>
        [...(detailFor(pid)?.activities_detail || [])]
            .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0));

    const subActivitiesFor = (pid, aid) => {
        const act = activitiesFor(pid).find((a) => a.id === aid);
        return [...(act?.subactivities || [])]
            .sort((a, b) => (Number(a.sorting_var) || 0) - (Number(b.sorting_var) || 0));
    };

    const workTypesFor = (pid) =>
        detailFor(pid)?.sector_detail?.stage_work_types || [];
// console.log(workTypesFor,)
    // ── row helpers ────────────────────────────────────────────────────────────

    const updateRow = useCallback((id, field, value) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r._id !== id) return r;
                const u = { ...r, [field]: value };
                if (field === "projectId") { u.activityId = ""; u.subActivityId = ""; u.workType = ""; }
                if (field === "activityId") { u.subActivityId = ""; }
                return u;
            })
        );
        setErrors((prev) => { const n = { ...prev }; delete n[`${id}.${field}`]; return n; });
    }, []);

    const handleProjectChange = useCallback((rowId, pid) => {
        updateRow(rowId, "projectId", pid);
        if (pid) ensureProjectDetail(pid);
    }, [updateRow, ensureProjectDetail]);

    const applyPreset = useCallback((rowId, start, end) => {
        setRows((prev) => prev.map((r) => r._id === rowId ? { ...r, startTime: start, endTime: end } : r));
        setErrors((prev) => {
            const n = { ...prev };
            delete n[`${rowId}.startTime`];
            delete n[`${rowId}.endTime`];
            return n;
        });
    }, []);

    const addRow = () => setRows((prev) => [...prev, emptyRow()]);
    const removeRow = (id) => setRows((prev) => prev.length > 1 ? prev.filter((r) => r._id !== id) : prev);

    const totalHours = rows.reduce((sum, r) => sum + calcHours(r.startTime, r.endTime), 0);

    // ── validation ─────────────────────────────────────────────────────────────

    const validate = () => {
        const errs = {};

        rows.forEach((r) => {
            if (!r.projectId) errs[`${r._id}.projectId`] = true;
            if (!r.activityId) errs[`${r._id}.activityId`] = true;
            if (!r.subActivityId) errs[`${r._id}.subActivityId`] = true;
            if (!r.startTime) errs[`${r._id}.startTime`] = true;
            if (!r.endTime) errs[`${r._id}.endTime`] = true;

            if (
                r.startTime &&
                r.endTime &&
                r.endTime <= r.startTime
            ) {
                errs[`${r._id}.endTime`] = true;
            }

            if (!r.workType) errs[`${r._id}.workType`] = true;
        });

        // ✅ Date validation
        const today = todayStr();
        const yesterday = yesterdayStr();

        if (!date) {
            errs["date"] = "Date is required";
        } else if (date > today) {
            errs["date"] = "Future date is not allowed";
        } else if (date < yesterday) {
            errs["date"] = "Only yesterday or today allowed";
        }

        // ✅ Total hours validation
        const totalWorkedHours = rows.reduce(
            (sum, r) => sum + calcHours(r.startTime, r.endTime),
            0
        );

        if (totalWorkedHours > 9) {
            errs["totalHours"] =
                `Total work hours (${totalWorkedHours.toFixed(2)} hrs) cannot exceed 9 hrs`;
        }

        setErrors(errs);

        return Object.keys(errs).length === 0;
    };
    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload = rows.map(({ _id, ...rest }) => rest);
            console.log("Saving work logs:", { date, payload });
            await onSave(date, payload);

            onClose();
        } catch (error) {

        } finally {
            setSaving(false);
        }
    };

    // ── render ─────────────────────────────────────────────────────────────────

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.96, y: 24 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 24 }}
                        transition={{ type: "spring", damping: 22, stiffness: 260 }}
                        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full my-8"
                        style={{ maxWidth: "min(98vw, 1500px)" }}
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <Clock size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Log Work Hours</h3>
                                    <p className="text-xs text-gray-400">Multiple entries — one row per task</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={15} className="text-gray-400" />
                                    <label className="text-sm font-medium text-gray-600">Date *</label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={yesterdayStr()}
                                        max={todayStr()}
                                        onChange={(e) => {
                                            setDate(e.target.value);

                                            setErrors((prev) => {
                                                const n = { ...prev };
                                                delete n.date;
                                                return n;
                                            });
                                        }}
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
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* table */}
                        <div className={`overflow-x-auto px-4 pt-4 transition-all duration-200 ${isAnyDropdownOpen ? "pb-42" : "pb-2"}`}>
                            <table className="w-full text-xs" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                                <thead>
                                    <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                                        <th className="px-2 pb-1 text-center w-7">#</th>
                                        <th className="px-2 pb-1 text-left min-w-[170px]">Project <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-left min-w-[140px]">Activity <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-left min-w-[160px]">Sub-Activity <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[85px]">Start Time <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[85px]">End Time <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-center min-w-[165px]">Quick Presets</th>
                                        <th className="px-2 pb-1 text-center min-w-[68px]">Duration</th>
                                        <th className="px-2 pb-1 text-left min-w-[130px]">Work Type <span className="text-red-400">*</span></th>
                                        <th className="px-2 pb-1 text-left min-w-[190px]">note</th>
                                        <th className="px-2 pb-1 w-7"></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <AnimatePresence initial={false}>
                                        {rows.map((row, idx) => {
                                            const isLoadingThis = !!loadingDetail[row.projectId];
                                            const activities = activitiesFor(row.projectId);
                                            const subActivities = subActivitiesFor(row.projectId, row.activityId);
                                            const workTypes = workTypesFor(row.projectId);
                                            const timeInvalid = row.startTime && row.endTime && row.endTime <= row.startTime;
                                            const e = (f) => !!errors[`${row._id}.${f}`];

                                            return (
                                                <motion.tr
                                                    key={row._id}
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -16 }}
                                                    transition={{ duration: 0.16 }}
                                                    className="group"
                                                    style={{
                                                        position: "relative",
                                                        zIndex: openDropdowns[row._id] ? 50 : 1
                                                    }}

                                                >
                                                    {/* # */}
                                                    <td className="px-1 py-2 align-top text-center">
                                                        <span className="w-6 h-6 mt-0.5 inline-flex items-center justify-center
                              rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
                                                            {idx + 1}
                                                        </span>
                                                    </td>

                                                    {/* ✅ Project – searchable typeahead */}
                                                    <td className="px-1 py-2 align-top">
                                                        <ProjectSearchInput
                                                            projects={projects}
                                                            value={row.projectId}
                                                            onChange={(pid) => handleProjectChange(row._id, pid)}
                                                            error={e("projectId")}
                                                            onToggle={(isOpen) =>
                                                                setOpenDropdowns((prev) => ({ ...prev, [row._id]: isOpen }))
                                                            }
                                                        />
                                                    </td>

                                                    {/* Activity */}
                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={row.activityId}
                                                            onChange={(v) => updateRow(row._id, "activityId", v)}
                                                            placeholder="Select activity"
                                                            disabled={!row.projectId || isLoadingThis}
                                                            loading={isLoadingThis}
                                                            error={e("activityId")}
                                                        >
                                                            {activities.map((a) => (
                                                                <option key={a.id} value={a.id}>{a.activity_name}</option>
                                                            ))}
                                                        </Sel>
                                                    </td>

                                                    {/* Sub-Activity */}
                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={row.subActivityId}
                                                            onChange={(v) => updateRow(row._id, "subActivityId", v)}
                                                            placeholder="Select sub-activity"
                                                            disabled={!row.activityId || isLoadingThis}
                                                            error={e("subActivityId")}
                                                        >
                                                            {subActivities.map((s) => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.sorting_var ? `Stage ${s.sorting_var} – ` : ""}{s.subactivity_name}
                                                                </option>
                                                            ))}
                                                        </Sel>
                                                    </td>

                                                    {/* Start */}
                                                    <td className="px-1 py-2 align-top">
                                                        <TimeSel
                                                            value={row.startTime}
                                                            onChange={(v) => updateRow(row._id, "startTime", v)}
                                                            placeholder="In"
                                                            error={e("startTime")}
                                                        />
                                                    </td>

                                                    {/* End */}
                                                    <td className="px-1 py-2 align-top">
                                                        <TimeSel
                                                            value={row.endTime}
                                                            onChange={(v) => updateRow(row._id, "endTime", v)}
                                                            placeholder="Out"
                                                            error={e("endTime") || timeInvalid}
                                                        />
                                                    </td>

                                                    {/* Quick Presets */}
                                                    <td className="px-1 py-2 align-top">
                                                        <PresetPills onApply={(s, end) => applyPreset(row._id, s, end)} />
                                                    </td>

                                                    {/* Duration */}
                                                    <td className="px-2 py-2 align-top text-center">
                                                        <DurationBadge start={row.startTime} end={row.endTime} />
                                                    </td>

                                                    {/* Work Type */}
                                                    <td className="px-1 py-2 align-top">
                                                        <Sel
                                                            value={row.workType}
                                                            onChange={(v) => updateRow(row._id, "workType", v)}
                                                            placeholder={
                                                                !row.projectId ? "Work type" :
                                                                    isLoadingThis ? "Loading…" :
                                                                        workTypes.length === 0 ? "None defined" : "Select type"
                                                            }
                                                            disabled={!row.projectId || isLoadingThis || workTypes.length === 0}
                                                            loading={isLoadingThis}
                                                            error={e("workType")}
                                                        >
                                                            {workTypes.map((wt) => (
                                                                <option key={wt.id} value={wt.id}>{wt.name}</option>
                                                            ))}
                                                        </Sel>
                                                        {row.projectId && !isLoadingThis && workTypes.length === 0 && (
                                                            <p className="text-[9px] text-amber-500 mt-0.5 leading-tight">
                                                                No work types in this sector
                                                            </p>
                                                        )}
                                                    </td>

                                                    {/* note */}
                                                    <td className="px-1 py-2 align-top">
                                                        <input
                                                            type="text"
                                                            value={row.note}
                                                            onChange={(ev) => updateRow(row._id, "note", ev.target.value)}
                                                            placeholder="What did you work on?"
                                                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs
                                focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                        />
                                                    </td>

                                                    {/* Remove */}
                                                    <td className="px-1 py-2 align-top text-center">
                                                        <button
                                                            onClick={() => removeRow(row._id)}
                                                            // disabled={rows.length === 1}
                                                            className="p-1.5 rounded-lg text-red-300 group-hover:text-gray-400
                                hover:!text-red-500 hover:bg-red-50 transition
                                disabled:opacity-20 disabled:cursor-not-allowed"
                                                            title="Remove row"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>

                                    {/* totals */}
                                    <tr>
                                        <td colSpan={7} className="px-4 pt-2 pb-1 text-right">
                                            <span className="text-xs font-semibold text-gray-500">Total Duration:</span>
                                        </td>
                                        <td className="px-2 pt-2 pb-1 text-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full
${totalHours > 9
                                                    ? "bg-red-50 text-red-700"
                                                    : totalHours > 0
                                                        ? "bg-green-50 text-green-700"
                                                        : "text-gray-300"
                                                }`}>
                                                {totalHours > 0 ? `${totalHours.toFixed(2)} hrs` : "—"}
                                            </span>
                                        </td>
                                        <td colSpan={3} />
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* add row */}
                        <div className="px-6 py-2 flex items-center gap-4">
                            <button
                                onClick={addRow}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600
                  hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                            >
                                <Plus size={15} />
                                Add More Log
                            </button>

                        </div>

                        {/* validation banner */}
                        <AnimatePresence>
                            {Object.keys(errors).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="mx-6 mb-3 flex items-center gap-2 text-sm text-red-600
                    bg-red-50 border border-red-100 px-4 py-2 rounded-xl"
                                >
                                    <>
                                        <AlertCircle size={15} />

                                        {errors.totalHours
                                            ? errors.totalHours
                                            : "Please fill in all required fields and ensure end time is after start time."
                                        }
                                    </>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* footer */}
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl
                  hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl
                  hover:bg-blue-700 disabled:opacity-50 transition flex items-center
                  justify-center gap-2 text-sm font-medium"
                            >
                                {saving
                                    ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                                    : <><Save size={15} /> Save {rows.length} Log{rows.length !== 1 ? "s" : ""}</>
                                }
                            </button>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MultiWorkLogModal;