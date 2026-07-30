import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx"; // npm install xlsx  (sirf "Download Sample Template" button ke liye use hota hai)
import {
    UploadCloud,
    FileSpreadsheet,
    X,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    Loader2,
    Download,
    RotateCcw,
    Info,
    AlertTriangle,
    ListChecks,
    ArrowLeft,
    FileWarning,
} from "lucide-react";
import { showSnackbar } from "../notifications/notificationSlice";

// 👇 Apna API base url yaha set karo. Agar project me pehle se axios instance
// (jaise apiSlice.js ke andar) configured hai, to uski jagah wahi instance import
// karke use kar lena — auth token / interceptors automatically attach ho jayenge.

const BASE_URL = import.meta.env.VITE_BASE_URL;
const BULK_UPLOAD_ENDPOINT = `${BASE_URL}/detaildesign/new-project-bulk/`;

const REQUIRED_SHEETS = ["Projects", "Activities", "SubActivities", "Stages"];

// ---------------------------------------------------------------------
// DRF ke nested serializer.errors (dict/list ka mix) ko readable
// bullet-point list me flatten karta hai, path ke sath
// (e.g. "activities[0].subactivities[1].work_stages[0].payment_percent: ...")
// ---------------------------------------------------------------------
const flattenErrors = (errors, path = "") => {
    let messages = [];
    if (errors === null || errors === undefined) return messages;

    if (Array.isArray(errors)) {
        errors.forEach((item, idx) => {
            if (typeof item === "string") {
                messages.push(path ? `${path}[${idx}]: ${item}` : item);
            } else {
                messages = messages.concat(
                    flattenErrors(item, path ? `${path}[${idx}]` : `[${idx}]`)
                );
            }
        });
    } else if (typeof errors === "object") {
        Object.entries(errors).forEach(([key, val]) => {
            const newPath = path ? `${path}.${key}` : key;
            messages = messages.concat(flattenErrors(val, newPath));
        });
    } else {
        messages.push(path ? `${path}: ${String(errors)}` : String(errors));
    }
    return messages;
};

const BulkProjectUpload = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [apiResult, setApiResult] = useState(null); // { message, created, errors }
    const [topLevelError, setTopLevelError] = useState(""); // file missing / bad excel / server down

    const [activeTab, setActiveTab] = useState("all"); // all | success | failed
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [showInstructions, setShowInstructions] = useState(false);

    const fileInputRef = useRef(null);

    // -------------------------------------------------------------- helpers
    const resetAll = () => {
        setFile(null);
        setApiResult(null);
        setTopLevelError("");
        setExpandedRows(new Set());
        setActiveTab("all");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const toggleRow = (row) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            next.has(row) ? next.delete(row) : next.add(row);
            return next;
        });
    };

    const validateAndSetFile = (selected) => {
        if (!selected) return;
        const validExt = /\.(xlsx|xls)$/i.test(selected.name);
        if (!validExt) {
            dispatch(
                showSnackbar({
                    message: "Please upload only .xlsx or .xls files.",
                    type: "error",
                })
            );
            return;
        }
        if (selected.size > 15 * 1024 * 1024) {
            dispatch(
                showSnackbar({
                    message: "File size exceeds 15MB. Please upload a smaller file.",
                    type: "error",
                })
            );
            return;
        }
        setApiResult(null);
        setTopLevelError("");
        setFile(selected);
    };

    const handleFileChange = (e) => validateAndSetFile(e.target.files?.[0]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        validateAndSetFile(e.dataTransfer.files?.[0]);
    }, []);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    // ------------------------------------------------------- sample template
    const downloadSampleTemplate = () => {
        const wb = XLSX.utils.book_new();

        // const instructions = [
        //     ["Bulk Project Upload — Instructions"],
        //     [],
        //     ["Excel me EXACT ye 4 sheets honi chahiyessss: Projects, Activities, SubActivities, Stages"],
        //     [],
        //     ["LINKING (naam se match hota hai, sorting_var sirf ordering ke liye hai):"],
        //     ["Activities sheet    -> project_code"],
        //     ["SubActivities sheet -> project_code + activity_name (parent activity ka naam)"],
        //     ["Stages sheet        -> project_code + activity_name + subactivity_name"],
        //     [],
        //     ["Ek project ke andar activity_name aur uske andar subactivity_name UNIQUE hona chahiye."],
        //     ["Ek row fail hone se baaki projects par asar nahi padta."],
        // ];
        const instructions = [
            ["Bulk Project Upload — Instructions"],
            [],
            ["The Excel file must contain exactly these 4 sheets: Projects, Activities, SubActivities, Stages"],
            [],
            ["LINKING (matches by name, sorting_var is only for ordering):"],
            ["Activities sheet    -> project_code"],
            ["SubActivities sheet -> project_code + activity_name (parent activity name)"],
            ["Stages sheet        -> project_code + activity_name + subactivity_name"],
            [],
            ["Activity names within a project, and subactivity names within an activity, must be UNIQUE."],
            ["The failure of one row does not affect the processing of other projects."],
        ];
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet(instructions),
            "Instructions"
        );

        const projects = [
            [
                "project_code", "project_name", "short_name", "location", "company_name",
                "sector_name", "sector_unit", "client_code", "client_name", "client_pan_no",
                "client_address", "client_phone", "total_length", "workorder_cost", "loa_date",
                "completion_date", "director_proposal_date", "project_confirmation_date",
                "gst_type", "igst", "cgst", "clientbranch", "assigned_to", "created_by",
            ],
            [
                "PRJ-001", "NH-44 Widening Package 3", "NH44-P3", "Ranchi, Jharkhand",
                "ABC Infra Pvt Ltd", "Highway", "Km", "CL-1001", "", "", "", "",
                42.5, 1250000000, "2025-04-01", "2027-03-31", "2025-03-20", "2025-03-25",
                "exclude", 6, 6, "Main Branch", "EMP001, EMP002", "EMP001",
            ],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(projects), "Projects");

        const activities = [
            ["project_code", "activity_name", "sorting_var", "start_date", "end_date", "weightage"],
            ["PRJ-001", "Earthwork & Embankment", 1, "2025-04-01", "2025-08-29", 33.33],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(activities), "Activities");

        const subactivities = [
            [
                "project_code", "activity_name", "subactivity_name", "sorting_var", "description",
                "start_date", "end_date", "total_quantity", "unit", "chainage_start",
                "chainage_end", "covered_area",
            ],
            [
                "PRJ-001", "Earthwork & Embankment", "Earthwork & Embankment Ch 0.0-4.2km", 1,
                "Earthwork for chainage 0.0 to 4.2 km", "2025-04-01", "2025-04-13", 2500,
                "Cum", 0, 4.2, 0,
            ],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(subactivities), "SubActivities");

        const stages = [
            ["project_code", "activity_name", "subactivity_name", "stage_name", "sorting_var", "payment_percent"],
            ["PRJ-001", "Earthwork & Embankment", "Earthwork & Embankment Ch 0.0-4.2km", "Stage 1", 0, 5],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stages), "Stages");

        XLSX.writeFile(wb, "bulk_project_upload_template.xlsx");
    };

    // ---------------------------------------------------- download errors csv
    const downloadErrorReport = () => {
        if (!apiResult?.errors?.length) return;
        const lines = [["Row", "Project Code", "Error"]];
        apiResult.errors.forEach((err) => {
            const flat = flattenErrors(err.error).join(" | ");
            lines.push([err.row, err.project_code || "", flat]);
        });
        const csv = lines
            .map((row) =>
                row
                    .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bulk_upload_errors.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // --------------------------------------------------------------- submit
    const handleUpload = async () => {
        if (!file) {
            dispatch(showSnackbar({ message: "Pehle Excel file select karo", type: "error" }));
            return;
        }

        setIsUploading(true);
        setApiResult(null);
        setTopLevelError("");

        dispatch(
            showSnackbar({
                message: "Processing Excel file... This may take a moment.",
                type: "info",
            })
        );

        try {
            const formData = new FormData();
            formData.append("file", file);

            const token = sessionStorage.getItem("token"); // apne auth scheme ke hisaab se adjust karo

            const { data } = await axios.post(BULK_UPLOAD_ENDPOINT, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            setApiResult(data);

            const createdCount = data?.created?.length || 0;
            const errorCount = data?.errors?.length || 0;

            dispatch(
                showSnackbar({
                    message:
                        errorCount === 0
                            ? `${createdCount} project(s) created successfully!`
                            : `${createdCount} created, ${errorCount} failed. Please see the details below.`,
                    type: errorCount === 0 ? "success" : "warning",
                })
            );
        } catch (error) {
            const serverError =
                error?.response?.data?.error ||
                error?.response?.data?.message ||
                error?.message ||
                "Upload failed. Please try again.";
            setTopLevelError(
                typeof serverError === "string" ? serverError : JSON.stringify(serverError)
            );
            dispatch(showSnackbar({ message: "Bulk upload failed.", type: "error" }));
        } finally {
            setIsUploading(false);
        }
    };

    // ------------------------------------------------------------- derived
    const createdRows = apiResult?.created || [];
    const errorRows = apiResult?.errors || [];
    const totalRows = createdRows.length + errorRows.length;

    const combinedRows = [
        ...createdRows.map((r) => ({ ...r, status: "success" })),
        ...errorRows.map((r) => ({ ...r, status: "failed" })),
    ].sort((a, b) => a.row - b.row);

    const visibleRows =
        activeTab === "all"
            ? combinedRows
            : combinedRows.filter((r) => r.status === activeTab);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto space-y-6 px-3 md:px-4 py-4 md:py-6"
        >
            {/* Loading overlay */}
            {isUploading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                        <p className="text-gray-700">Processing Excel file...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/all-projects")}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
                    >
                        <ArrowLeft size={14} />
                        All Projects
                    </button>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Bulk Project Upload
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Enable bulk creation of multiple projects from a single Excel file, including their Activities, Sub-Activities, and Stages.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={downloadSampleTemplate}
                    className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                >
                    <Download size={16} />
                    Sample Template
                </button>
            </div>

            {/* Instructions card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 md:p-5">
                <button
                    type="button"
                    onClick={() => setShowInstructions((p) => !p)}
                    className="w-full flex items-center justify-between gap-2 text-left"
                >
                    <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm">
                        <Info size={16} />
                        Required Excel Format for Bulk Upload of Projects, Activities, Sub-Activities, and Stages
                    </div>
                    {showInstructions ? <ChevronUp size={16} className="text-blue-700" /> : <ChevronDown size={16} className="text-blue-700" />}
                </button>

                <AnimatePresence>
                    {showInstructions && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 text-sm text-blue-900 space-y-2">
                                <p>The Excel file must contain exactly these <strong>4 sheets</strong>:</p>
                                <div className="flex flex-wrap gap-2">
                                    {REQUIRED_SHEETS.map((s) => (
                                        <span key={s} className="px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                                {/* <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li><strong>Activities</strong> sheet link hoti hai <code>project_code</code> se</li>
                                    <li><strong>SubActivities</strong> sheet link hoti hai <code>project_code + activity_name</code> se</li>
                                    <li><strong>Stages</strong> sheet link hoti hai <code>project_code + activity_name + subactivity_name</code> se</li>
                                    <li>Har project ke andar <code>activity_name</code>, aur har activity ke andar <code>subactivity_name</code> <strong>unique</strong> hona chahiye</li>
                                    <li>Ek project fail ho jaye to baaki projects par koi asar nahi padta — har ek apni row me report hoga</li>
                                </ul> */}
                                <ul className="list-disc list-inside space-y-1 mt-2">
                                    <li><strong>Activities</strong> sheet links via <code>project_code</code></li>
                                    <li><strong>SubActivities</strong> sheet links via <code>project_code + activity_name</code></li>
                                    <li><strong>Stages</strong> sheet links via <code>project_code + activity_name + subactivity_name</code></li>
                                    <li>Each <code>activity_name</code> within a project, and <code>subactivity_name</code> within an activity, must be <strong>unique</strong></li>
                                    <li>If one project fails, it does not affect others — each failure is reported in its respective row</li>
                                </ul>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Upload dropzone */}
            {!apiResult && (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`bg-white rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="bulk-excel-input"
                    />

                    {!file ? (
                        <label htmlFor="bulk-excel-input" className="cursor-pointer flex flex-col items-center gap-3">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                                <UploadCloud className="text-blue-600" size={32} />
                            </div>
                            <p className="text-gray-700 font-medium">Drag and drop your Excel file here, or click to browse and select a file.
                            </p>
                            <p className="text-gray-400 text-xs">.xlsx or .xls, max 15MB</p>
                        </label>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="p-4 bg-green-50 rounded-2xl">
                                <FileSpreadsheet className="text-green-600" size={32} />
                            </div>
                            <div>
                                <p className="text-gray-800 font-medium">{file.name}</p>
                                <p className="text-gray-400 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={resetAll}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm"
                                >
                                    <X size={14} />
                                    Remove
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg text-sm font-semibold disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={14} />
                                            Upload &amp; Process
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top-level error (bad file / missing sheets / server error) */}
            {topLevelError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                    <FileWarning className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                        <p className="text-red-800 font-semibold text-sm">Upload failed</p>
                        <p className="text-red-700 text-sm mt-1">{topLevelError}</p>
                    </div>
                    <button
                        type="button"
                        onClick={resetAll}
                        className="text-red-700 hover:text-red-900 text-sm font-medium flex items-center gap-1"
                    >
                        <RotateCcw size={14} />
                        Retry
                    </button>
                </div>
            )}

            {/* Results */}
            {apiResult && (
                <div className="space-y-5">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-gray-100 rounded-xl">
                                <ListChecks className="text-gray-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{totalRows}</p>
                                <p className="text-xs text-gray-500">Total Rows Processed</p>
                            </div>
                        </div>
                        <div className="bg-white border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-green-50 rounded-xl">
                                <CheckCircle2 className="text-green-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">{createdRows.length}</p>
                                <p className="text-xs text-gray-500">Projects Created</p>
                            </div>
                        </div>
                        <div className="bg-white border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-2.5 bg-red-50 rounded-xl">
                                <XCircle className="text-red-600" size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-700">{errorRows.length}</p>
                                <p className="text-xs text-gray-500">Failed Rows</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs + actions */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex gap-2">
                            {[
                                { key: "all", label: `All (${totalRows})` },
                                { key: "success", label: `Created (${createdRows.length})` },
                                { key: "failed", label: `Failed (${errorRows.length})` },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.key
                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            {errorRows.length > 0 && (
                                <button
                                    type="button"
                                    onClick={downloadErrorReport}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                                >
                                    <Download size={14} />
                                    Error Report (CSV)
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={resetAll}
                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium"
                            >
                                <RotateCcw size={14} />
                                Upload Another File
                            </button>
                        </div>
                    </div>

                    {/* Row-wise result list */}
                    <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 overflow-hidden">
                        {visibleRows.length === 0 && (
                            <div className="p-8 text-center text-gray-400 text-sm">No rows found for this filter.</div>
                        )}

                        {visibleRows.map((r) => {
                            const isFailed = r.status === "failed";
                            const isExpanded = expandedRows.has(r.row);
                            const flatErrors = isFailed ? flattenErrors(r.error) : [];

                            return (
                                <div key={`${r.status}-${r.row}`}>
                                    <button
                                        type="button"
                                        onClick={() => isFailed && toggleRow(r.row)}
                                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${isFailed ? "hover:bg-red-50/50 cursor-pointer" : "cursor-default"
                                            }`}
                                    >
                                        <div
                                            className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 text-xs font-bold ${isFailed ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                                }`}
                                        >
                                            {r.row}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {r.project_code || <span className="text-gray-400 italic">project_code missing</span>}
                                            </p>
                                            {!isFailed && (
                                                <p className="text-xs text-gray-400 truncate">project_id: {r.project_id}</p>
                                            )}
                                            {isFailed && !isExpanded && (
                                                <p className="text-xs text-red-500 truncate">{flatErrors[0]}{flatErrors.length > 1 ? ` (+${flatErrors.length - 1} more)` : ""}</p>
                                            )}
                                        </div>

                                        {isFailed ? (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                                <XCircle size={12} />
                                                Failed
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full flex-shrink-0">
                                                <CheckCircle2 size={12} />
                                                Created
                                            </span>
                                        )}

                                        {isFailed && (
                                            isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isFailed && isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-red-50/40"
                                            >
                                                <div className="px-4 pb-4 pl-14">
                                                    <div className="bg-white border border-red-100 rounded-xl p-3">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-2">
                                                            <AlertTriangle size={12} />
                                                            {flatErrors.length} error{flatErrors.length > 1 ? "s" : ""} in this row
                                                        </div>
                                                        <ul className="space-y-1.5">
                                                            {flatErrors.map((msg, i) => (
                                                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                                                    <span className="text-red-400 mt-0.5">•</span>
                                                                    <span className="break-words">{msg}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => navigate("/all-projects")}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg font-semibold text-sm flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} />
                            Go to All Projects
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default BulkProjectUpload;