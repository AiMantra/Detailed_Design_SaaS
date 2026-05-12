// SetupComponents.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showSnackbar } from "../notifications/notificationSlice";
import { AlertTriangle, Layers, X, Loader2, Save, Edit, Trash2, Plus, Settings, Building2, TrendingUp, Handshake, Users, UserPlus, UserX, UserCheck, Clock, Mail } from "lucide-react";

import {
    inputMinLimit,
    inputMaxLimit,
    validateName,
    validatePhoneNumber,
    validateDOB,
    validateMarriageDate,
    validateAadhaar,
    validatePAN,
    validateGST,
    validateESI,
    validateUAN,
    // Restriction functions
    restrictToNumbers,
    restrictToDigits,
    restrictToAlphanumeric,
    restrictToLetters,
    restrictToUppercase,
    restrictGST,
    restrictPAN,
    restrictAadhaar,
    restrictIFSC,
    restrictUAN,
    restrictESI,
    restrictPhoneNumber,
    restrictPinCode,
} from "../../utils/HelperValidations";

import {
    createCompany,
    updateCompany,
    deleteCompany,
    createSector,
    updateSector,
    deleteSector,
    createStageTemplate,
    updateStageTemplate,
    deleteStageTemplate,
    createSubActivity,
    updateSubActivity,
    deleteSubActivity,
    createClient,
    updateClient,
    deleteClient,
} from "../api/apiSlice";
import { CustomImageModal } from "../../utils/CustomFunctions";

// Custom Confirm Modal Function
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel" }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 30 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-lg transition"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle size={24} className="text-red-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                        </div>

                        <p className="text-gray-600 mb-6">{message}</p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// Reusable Metadata Viewer Component
export const TimeStampDataViewer = ({ isOpen, onClose, data, title = "Record Details" }) => {
    if (!data) return null;

    const {
        // Common fields
        id,
        name,

        // Creator info
        created_at,
        created_by,
        created_by_details,

        // Updater info
        updated_at,
        updated_by,
        updated_by_details,

        // Deleter info (soft delete)
        deleted_at,
        deleted_by,
        deleted_by_details,

        // Custom sections
        customSections = []
    } = data;

    const getDisplayName = (details, fallback) => {
        if (details?.name) return details.name;
        if (details?.email) return details.email.split('@')[0];
        return fallback || 'System';
    };

    const getProfilePic = (details) => {
        return details?.profilepic || null;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return null;
        try {
            return new Date(dateString).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const TimeLineItem = ({ icon: Icon, title, date, userDetails, userId, color = "blue", isLatest = false }) => {
        if (!date) return null;

        const user = userDetails || (userId ? { name: userId } : null);
        if (!user) return null;

        const colorClasses = {
            blue: "bg-blue-100 text-blue-600 border-blue-200",
            green: "bg-green-100 text-green-600 border-green-200",
            red: "bg-red-100 text-red-600 border-red-200",
            purple: "bg-purple-100 text-purple-600 border-purple-200"
        };

        return (
            <div className={`relative pl-8 pb-6 ${!isLatest ? 'border-l-2 border-gray-200' : ''}`}>
                <div className={`absolute left-0 -translate-x-1/2 w-8 h-8 rounded-full ${colorClasses[color]} flex items-center justify-center border-2`}>
                    <Icon size={14} />
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>{formatDateTime(date)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getProfilePic(user) ? (
                            <CustomImageModal customStyle>
                                <img
                                    src={getProfilePic(user)}
                                    alt={getDisplayName(user)}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                            </CustomImageModal>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                    {getDisplayName(user).charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">
                                {getDisplayName(user)}
                            </div>
                            {user.email && (
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Mail size={10} />
                                    {user.email}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 30 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div className="flex flex-row gap-2">
                                <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                                {name && <p className="text-sm text-gray-500 mt-1">{name}</p>}
                                {/* {code && <p className="text-xs text-gray-400 mt-0.5">ID: {code}</p>} */}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Timeline Content */}
                        <div className="p-6">
                            <div className="space-y-2">
                                {/* Creation Timeline */}
                                <TimeLineItem
                                    icon={UserPlus}
                                    title="Created"
                                    date={created_at}
                                    userDetails={created_by_details}
                                    userId={created_by}
                                    color="blue"
                                    isLatest={!updated_at && !deleted_at}
                                />

                                {/* Update Timeline */}
                                <TimeLineItem
                                    icon={UserCheck}
                                    title="Last Updated"
                                    date={updated_at}
                                    userDetails={updated_by_details}
                                    userId={updated_by}
                                    color="green"
                                    isLatest={!deleted_at}
                                />

                                {/* Deletion Timeline */}
                                <TimeLineItem
                                    icon={UserX}
                                    title="Deleted"
                                    date={deleted_at}
                                    userDetails={deleted_by_details}
                                    userId={deleted_by}
                                    color="red"
                                    isLatest={true}
                                />

                                {/* Custom Sections */}
                                {customSections.map((section, idx) => (
                                    <div key={idx} className="mt-4 pt-4 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            {section.icon && <section.icon size={16} className="text-purple-500" />}
                                            {section.title}
                                        </h4>
                                        <div className="space-y-2">
                                            {section.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Reusable View TimeStamp Details Button Component
export const ViewTimeStampDetailsButton = ({ data, title, children, className = "" }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={className}
                title="View Details"
            >
                {children || <Eye size={18} />}
            </button>
            <TimeStampDataViewer
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                data={data}
                title={title}
            />
        </>
    );
};

// Company Modal Content
const CompanyModalContent = ({
    isOpen,
    onClose,
    onSubmit,
    editingCompany,
    formData,
    onFormChange,
    loading,
    title,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 30 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border relative z-[10000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Building2 size={20} className="text-blue-600" />
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => onFormChange("name", restrictToLetters(e.target.value))}
                                    placeholder="Enter Company Name"
                                    maxLength={50}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.gst_no}
                                    onChange={(e) => onFormChange("gst_no", restrictGST(e.target.value))}
                                    placeholder="Enter GST Number"
                                    maxLength={15}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none "
                                />
                                <p className="text-xs text-gray-400 mt-1 text-left">Format: 22AAAAA0000A1Z5</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                                    PAN Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.pan_no}
                                    onChange={(e) => onFormChange("pan_no", restrictPAN(e.target.value))}
                                    placeholder="Enter PAN Number"
                                    maxLength={10}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-left">Format: AAAAA0000A</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={loading || !formData.name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {editingCompany ? "Update" : "Create"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Add Company Button
export const AddCompanyButton = ({ onSuccess, loadData, companies }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        gst_no: "",
        pan_no: "",
        created_by: sessionStorage.getItem('emp_code')
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: "",
            gst_no: "",
            pan_no: "",
        });
    };

    const handleSubmit = async () => {
        const trimmedName = formData?.name.trim();
        const trimmedgst = formData?.gst_no.trim();
        const trimpancard = formData?.pan_no?.trim();


        // Using imported validation functions
        if (!trimmedName) {
            dispatch(showSnackbar({ message: "Company name is required", type: "error" }));
            return;
        }

        if (!validateName(trimmedName)) {
            dispatch(showSnackbar({
                message: "Company name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        if (!trimpancard) {
            dispatch(showSnackbar({ message: "PAN number is required", type: "error" }));
            return;
        }

        if (!validatePAN(trimpancard)) {
            dispatch(showSnackbar({
                message: "Invalid PAN number format. Format: AAAAA0000A (5 letters, 4 digits, 1 letter)",
                type: "error",
            }));
            return;
        }

        if (!trimmedgst) {
            dispatch(showSnackbar({ message: "GST number is required", type: "error" }));
            return;
        }

        if (!validateGST(trimmedgst)) {
            dispatch(showSnackbar({
                message: "Invalid GST number format. Format: 22AAAAA0000A1Z5",
                type: "error",
            }));
            return;
        }

        // Check for duplicate in existing companies list (case-insensitive)
        const isDuplicate = companies.some(
            (company) =>
                company.name?.toLowerCase() === trimmedName.toLowerCase() ||
                company.gst_no?.toLowerCase() === trimmedgst.toLowerCase(),
        );

        if (isDuplicate) {
            dispatch(
                showSnackbar({
                    message: `Company "${trimmedName}" or "${trimmedgst}"already exists!`,
                    type: "error",
                }),
            );
            return;
        }

        setLoading(true);
        try {
            await dispatch(createCompany(formData)).unwrap();
            dispatch(
                showSnackbar({
                    message: "Company created successfully",
                    type: "success",
                }),
            );
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to create company",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                New Company
            </motion.button>

            <CompanyModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingCompany={null}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Create New Company"
            />
        </>
    );
};

// Edit Company Button
export const EditCompanyButton = ({ company, onSuccess, loadData, companies }) => {

    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: company?.name || "",
        gst_no: company?.gst_no || "",
        pan_no: company?.pan_no || "",
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            name: company?.name || "",
            gst_no: company?.gst_no || "",
            pan_no: company?.pan_no || "",
        });
    };

    const handleSubmit = async () => {
        const trimmedName = formData?.name?.trim();
        const trimmedgst = formData?.gst_no?.trim();
        const trimpancard = formData?.pan_no?.trim();

        // Using imported validation functions
        if (!trimmedName) {
            dispatch(showSnackbar({ message: "Company name is required", type: "error" }));
            return;
        }

        if (!validateName(trimmedName)) {
            dispatch(showSnackbar({
                message: "Company name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        if (!trimpancard) {
            dispatch(showSnackbar({ message: "PAN number is required", type: "error" }));
            return;
        }

        if (!validatePAN(trimpancard)) {
            dispatch(showSnackbar({
                message: "Invalid PAN number format. Format: AAAAA0000A (5 letters, 4 digits, 1 letter)",
                type: "error",
            }));
            return;
        }

        if (!trimmedgst) {
            dispatch(showSnackbar({ message: "GST number is required", type: "error" }));
            return;
        }

        if (!validateGST(trimmedgst)) {
            dispatch(showSnackbar({
                message: "Invalid GST number format. Format: 22AAAAA0000A1Z5",
                type: "error",
            }));
            return;
        }

        setLoading(true);
        try {
            await dispatch(updateCompany({
                companyId: company.id,
                companyData: formData,
                updated_by: sessionStorage.getItem('emp_code')
            })).unwrap();
            dispatch(
                showSnackbar({
                    message: "Company updated successfully",
                    type: "success",
                }),
            );
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to update company",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                title="Edit Company"
            >
                <Edit size={18} />
            </button>

            <CompanyModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingCompany={company}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Edit Company"
            />
        </>
    );
};

// Delete Company Button
export const DeleteCompanyButton = ({ company, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteCompany(company.id)).unwrap();
            dispatch(
                showSnackbar({
                    message: "Company deleted successfully",
                    type: "success",
                }),
            );
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to delete company",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete Company"
            >
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Trash2 size={18} />
                )}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Company"
                message={`Are you sure you want to delete company "${company.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};


// ============================================
// WORK TYPE MODAL COMPONENT
// ============================================

const WorkTypeModal = ({ isOpen, onClose, workType, onSave, index }) => {
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (workType) {
            setName(workType.name || "");
        } else {
            setName("");
        }
        setError("");
    }, [workType, isOpen]);

    const handleSubmit = () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Work type name is required");
            return;
        }

        if (!validateName(trimmedName)) {
            setError("Work type name should only contain letters, spaces, hyphens, and apostrophes (max 100 characters)");
            return;
        }

        onSave({ name: trimmedName }, index);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
                    onClick={onClose}
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
                                <Settings size={20} className="text-blue-600" />
                                {workType ? "Edit Work Type" : "Add Work Type"}
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Work Type Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(restrictToLetters(e.target.value));
                                    setError("");
                                }}
                                placeholder="Enter work type (e.g., Development, Testing)"
                                maxLength={100}
                                autoFocus
                                className={`w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                            />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                {workType ? "Update" : "Add"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ============================================
// SECTOR MODAL CONTENT (UPDATED)
// ============================================

const SectorModalContent = ({
    isOpen,
    onClose,
    onSubmit,
    editingSector,
    formData,
    onFormChange,
    workTypes,
    onWorkTypesChange,
    loading,
    title,
}) => {
    const unitOptions = [
        { value: 'length', label: 'Length' },
        { value: 'area', label: 'Area' },
        { value: 'quantity', label: 'Quantity' },
        // { value: 'numbers', label: 'Numbers' }
    ];

    const [showWorkTypeModal, setShowWorkTypeModal] = useState(false);
    const [editingWorkType, setEditingWorkType] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const handleAddWorkType = () => {
        setEditingWorkType(null);
        setEditingIndex(null);
        setShowWorkTypeModal(true);
    };

    const handleEditWorkType = (index) => {
        setEditingWorkType(workTypes[index]);
        setEditingIndex(index);
        setShowWorkTypeModal(true);
    };

    const handleSaveWorkType = (workType, index) => {
        if (index !== undefined && index !== null) {
            // Update existing
            const updated = [...workTypes];
            updated[index] = workType;
            onWorkTypesChange(updated);
        } else {
            // Add new
            onWorkTypesChange([...workTypes, workType]);
        }
    };

    const handleRemoveWorkType = (index) => {
        const updated = workTypes.filter((_, i) => i !== index);
        onWorkTypesChange(updated);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border relative z-[10000] max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white pb-3">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-blue-600" />
                                    {title}
                                </h3>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                                            Sector Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => onFormChange("name", restrictToLetters(e.target.value))}
                                            placeholder="Enter sector name (e.g., Highway, Bridge, Building)"
                                            maxLength={50}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block text-left">
                                            Unit Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.unit}
                                            onChange={(e) => onFormChange("unit", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        >
                                            <option value="">Select unit type</option>
                                            {unitOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Unit type determines the measurement system for this sector
                                        </p>
                                    </div>
                                </div>

                                {/* Work Types Section */}
                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-sm font-medium text-gray-700">
                                            Work Types
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddWorkType}
                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm flex items-center gap-1 transition"
                                        >
                                            <Plus size={14} />
                                            Add Work Type
                                        </button>
                                    </div>

                                    {workTypes.length === 0 ? (
                                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                                            <p className="text-gray-400 text-sm">No work types added yet</p>
                                            <p className="text-xs text-gray-400 mt-1">Click "Add Work Type" to add work types for this sector</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {workTypes.map((workType, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <span className="text-gray-700">{workType.name}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditWorkType(index)}
                                                            className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
                                                            title="Edit Work Type"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveWorkType(index)}
                                                            className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600"
                                                            title="Remove Work Type"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 sticky bottom-0 bg-white pt-3">
                                <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                                    Cancel
                                </button>
                                <button
                                    onClick={onSubmit}
                                    disabled={loading || !formData.name.trim() || !formData.unit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {editingSector ? "Update" : "Add Sector"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <WorkTypeModal
                isOpen={showWorkTypeModal}
                onClose={() => setShowWorkTypeModal(false)}
                workType={editingWorkType}
                onSave={handleSaveWorkType}
                index={editingIndex}
            />
        </>
    );
};

// ============================================
// ADD SECTOR BUTTON (UPDATED)
// ============================================

export const AddSectorButton = ({ onSuccess, loadData, sectors, BasicButtonView = false }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        unit: "",
        created_by: sessionStorage.getItem('emp_code')
    });
    const [workTypes, setWorkTypes] = useState([]);

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();  // Only call if event exists and has preventDefault
        }
        if (e && e.stopPropagation) {
            e.stopPropagation(); // Only call if event exists and has stopPropagation
        }

        setFormData({ name: "", unit: "", created_by: sessionStorage.getItem('emp_code') });
        setWorkTypes([]);
    };

    const handleSubmit = async (e) => {
        // e.preventDefault();  // Prevent default button behavior
        // e.stopPropagation(); // Stop event from bubbling up to parent elements

        const name = formData.name.trim();
        const unit = formData.unit;
        const created_by = formData.created_by;

        if (!name) {
            dispatch(showSnackbar({ message: "Sector name is required", type: "error" }));
            return;
        }

        if (!validateName(name)) {
            dispatch(showSnackbar({
                message: "Sector name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        if (!unit) {
            dispatch(showSnackbar({ message: "Please select a unit type", type: "error" }));
            return;
        }

        const duplicate = sectors.some(
            (s) => s.name?.toLowerCase() === name.toLowerCase(),
        );

        if (duplicate) {
            dispatch(showSnackbar({ message: "This sector already exists.", type: "error" }));
            return;
        }

        // Validate work types
        const validWorkTypes = workTypes.filter(wt => wt.name?.trim());
        // if (validWorkTypes.length === 0) {
        //     dispatch(showSnackbar({ message: "At least one work type is required", type: "error" }));
        //     return;
        // }

        setLoading(true);
        try {
            await dispatch(createSector({
                name: formData.name,
                unit: formData.unit,
                created_by: formData.created_by,
                stage_work_types: validWorkTypes
            })).unwrap();

            dispatch(showSnackbar({ message: "Sector created successfully", type: "success" }));
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to create sector", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    // Add this function to handle button click and prevent event bubbling
    const handleButtonClick = (e) => {
        e.preventDefault();  // Prevent default button behavior
        e.stopPropagation(); // Stop event from bubbling up to parent elements
        setShowModal(true);
    };

    const handleButtonCLose = (e) => {
        // e.preventDefault();  // Prevent default button behavior
        e.stopPropagation(); // Stop event from bubbling up to parent elements
        setShowModal(false);
    };


    return (
        <>
            {
                !BasicButtonView ?
                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleButtonClick}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Sector
                    </motion.button>
                    :
                    <motion.button
                        type="button"
                        onClick={handleButtonClick}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={14} />
                    </motion.button>

            }

            <SectorModalContent
                isOpen={showModal}
                // onClose={() => { setShowModal(false); resetForm(); }}
                onClose={(e) => { setShowModal(false); resetForm(e); }}
                onSubmit={handleSubmit}
                editingSector={null}
                formData={formData}
                onFormChange={handleFormChange}
                workTypes={workTypes}
                onWorkTypesChange={setWorkTypes}
                loading={loading}
                title="Add New Sector"
            />
        </>
    );
};

// ============================================
// EDIT SECTOR BUTTON (UPDATED)
// ============================================

export const EditSectorButton = ({ sector, onSuccess, loadData, sectors }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: sector?.id || "",
        name: sector?.name || "",
        unit: sector?.unit || "",
        updated_by: sessionStorage.getItem('emp_code')
    });
    const [workTypes, setWorkTypes] = useState(() => {
        // Initialize from existing stage_work_types
        if (sector?.stage_work_types && Array.isArray(sector.stage_work_types)) {
            return sector.stage_work_types.map(wt => ({ id: wt.id, name: wt.name, updated_by: sessionStorage.getItem('emp_code') }));
        }
        return [];
    });

    const handleClose = () => {
        resetForm();
        setShowModal(false)
    };

    const handleShow = (e) => {
        e.preventDefault();

        if (sector?.stage_work_types) {
            setWorkTypes(sector.stage_work_types.map(wt => ({ id: wt.id, name: wt.name, updated_by: sessionStorage.getItem('emp_code') })));
        } else {
            setWorkTypes([]);
        }
        setShowModal(true);
    }

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            id: sector?.id || "",
            name: sector?.name || "",
            unit: sector?.unit || "",
            updated_by: sessionStorage.getItem('emp_code')
        });
        if (sector?.stage_work_types) {
            setWorkTypes(sector.stage_work_types.map(wt => ({ id: wt.id, name: wt.name, updated_by: sessionStorage.getItem('emp_code') })));
        } else {
            setWorkTypes([]);
        }
    };

    const handleSubmit = async () => {
        const name = formData.name.trim();
        const unit = formData.unit;
        const updated_by = formData.updated_by;

        if (!name || !unit) {
            dispatch(showSnackbar({ message: "Please enter sector name and unit", type: "error" }));
            return;
        }

        // Validate work types
        // const validWorkTypes = workTypes.filter(wt => wt.name?.trim());
        const validWorkTypes = workTypes
            .filter(wt => wt.name?.trim())
            .map(wt => ({
                ...wt,
                created_by: sessionStorage.getItem('emp_code'),

            }));
        // if (validWorkTypes.length0 === 0) {
        //     dispatch(showSnackbar({ message: "At least one work type is required", type: "error" }));
        //     return;
        // }

        setLoading(true);
        try {
            await dispatch(updateSector({
                sectorId: sector.id,
                sectorData: {
                    name: formData.name,
                    unit: formData.unit,
                    updated_by: formData.updated_by,
                    stage_work_types: validWorkTypes
                }
            })).unwrap();

            dispatch(showSnackbar({ message: "Sector updated successfully", type: "success" }));
            handleClose();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to update sector", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleShow}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                title="Edit Sector"
            >
                <Edit size={18} />
            </button>

            <SectorModalContent
                isOpen={showModal}
                onClose={handleClose}
                onSubmit={handleSubmit}
                editingSector={sector}
                formData={formData}
                onFormChange={handleFormChange}
                workTypes={workTypes}
                onWorkTypesChange={setWorkTypes}
                loading={loading}
                title="Edit Sector"
            />
        </>
    );
};


// ============================================
// DELETE SECTOR BUTTON (UPDATED)
// ============================================

export const DeleteSectorButton = ({ sector, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        console.log('sectorId', sector.id)
        // console.log(sector.id)
        setLoading(true);
        try {
            await dispatch(deleteSector(sector.id)).unwrap();
            dispatch(
                showSnackbar({
                    message: "Sector deleted successfully",
                    type: "success",
                }),
            );
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to delete sector",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete Sector"
            >
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Trash2 size={18} />
                )}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Sector"
                message={`Are you sure you want to delete sector "${sector.name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};


const ClientModal = ({ isOpen, onClose, clientToEdit = null, existingClients = [], onSuccess }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [branches, setBranches] = useState([]);
    const [errors, setErrors] = useState({});

    // Form data state
    const [formData, setFormData] = useState({
        client_name: "",
        client_code: "",
        pan_no: "",
        phone: "",
        address: "",
        status: "active"
    });

    // Initialize form data when editing
    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                client_name: clientToEdit.client_name || "",
                client_code: clientToEdit.client_code || "",
                pan_no: clientToEdit.pan_no || "",
                phone: clientToEdit.phone || "",
                address: clientToEdit.address || "",
                status: clientToEdit.status || "active"
            });

            // Ensure branches have the correct structure
            const existingBranches = clientToEdit.branches || [];
            if (existingBranches.length > 0) {
                // setBranches(existingBranches);
                const mutableBranches = existingBranches.map(branch => ({
                    name: branch.name || "",
                    gst: branch.gst || "",
                    state: branch.state || "",
                    status: branch.status || "Active"
                }));
                setBranches(mutableBranches);
            } else {
                setBranches([{ name: "", gst: "", state: "", status: "Active" }]);
            }
            // setBranches(clientToEdit.branches || []);

        } else {
            resetForm();
        }
    }, [clientToEdit, isOpen]);

    const resetForm = () => {
        setFormData({
            client_name: "",
            client_code: "",
            pan_no: "",
            phone: "",
            address: "",
            status: "active"
        });
        // setBranches([]);
        setBranches([{ name: "", gst: "", state: "", status: "Active" }]);
        setErrors({});
    };

    const handleFormChangeBackup = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Real-time input handlers with restrictions
    const handleFormChange = (field, value) => {
        let processedValue = value;
        let fieldError = "";

        switch (field) {
            case "client_name":
                processedValue = restrictToLetters(value);
                break;
            case "client_code":
                processedValue = restrictToAlphanumeric(value).toUpperCase();
                break;
            case "pan_no":
                processedValue = restrictPAN(value);
                break;
            case "phone":
                processedValue = restrictPhoneNumber(value);
                break;
            case "address":
                // Allow letters, numbers, spaces, commas, periods, hyphens
                processedValue = value.replace(/[^A-Za-z0-9\s,\.\-]/g, '');
                break;
            default:
                break;
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));

        // Clear error for this field when user types
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };


    // Branch management functions
    const addBranch = () => {
        setBranches([...branches, { name: "", gst: "", state: "", status: "Active" }]);
    };

    const removeBranch = (index) => {
        if (branches.length <= 1) {
            dispatch(showSnackbar({ message: "At least one branch is required", type: "error" }));
            return;
        }
        setBranches(branches.filter((_, i) => i !== index));
    };

    const handleBranchChange = (index, field, value) => {
        console.log(`Changing branch ${index} field ${field} to:`, value); // Debug log
        let processedValue = value;

        switch (field) {
            case "name":
                processedValue = restrictToLetters(value);
                break;
            case "gst":
                processedValue = restrictGST(value);
                break;
            case "state":
                processedValue = restrictToLetters(value);
                break;
            default:
                break;
        }

        // updatedBranches[index][field] = processedValue;
        // console.log('Updated branches:', updatedBranches); // Debug log

        // Create new array with updated branch (immutable update)
        const updatedBranches = branches.map((branch, i) => {
            if (i === index) {
                return { ...branch, [field]: processedValue };
            }
            return branch;
        });

        setBranches(updatedBranches);

        // Clear error for this specific branch field
        const errorKey = `branch_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    // Validation functions
    const validateField = (field, value) => {
        switch (field) {
            case "client_name":
                if (!value?.trim()) return "Client name is required";
                if (!validateName(value)) return "Client name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)";
                return "";

            case "pan_no":
                if (!value?.trim()) return "PAN number is required";
                if (!validatePAN(value)) return "Invalid PAN number format. Format: AAAAA0000A";
                return "";

            case "phone":
                if (value && value.trim() && !validatePhoneNumber(value)) {
                    return "Invalid phone number. Must be 10 digits starting with 6-9";
                }
                return "";

            default:
                return "";
        }
    };

    const handleSubmit = async () => {
        const newErrors = {};

        // Client validations using centralized functions
        if (!formData.client_name?.trim()) {
            newErrors.client_name = "Client name is required";
        } else if (!validateName(formData.client_name)) {
            newErrors.client_name = "Client name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)";
        }

        // Client validations using centralized functions
        if (!formData.client_code?.trim()) {
            newErrors.client_code = "Client Code is required";
        }
        // else Code (!validateName(formData.client_code)) {
        //     newErrors.client_code = "Client Code should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)";
        // }

        if (!formData.pan_no?.trim()) {
            newErrors.pan_no = "PAN number is required";
        } else if (!validatePAN(formData.pan_no)) {
            newErrors.pan_no = "Invalid PAN number format. Format: AAAAA0000A";
        }

        if (formData.phone && formData.phone.trim() && !validatePhoneNumber(formData.phone)) {
            newErrors.phone = "Invalid phone number. Must be 10 digits starting with 6-9";
        }

        // Compare existing for unique client_code 
        if (formData.client_code && formData.client_code.trim()) {
            // Check if client code is unique (you'd need to pass existing clients as prop)
            const isCodeDuplicate = existingClients?.some(
                client => client.client_code?.toLowerCase() === formData.client_code.toLowerCase()
                    && client.id !== clientToEdit?.id
            );
            if (isCodeDuplicate) {
                newErrors.client_code = "Client code already exists";
            }
        }

        // Branch validations using centralized functions
        for (let i = 0; i < branches.length; i++) {
            const branch = branches[i];
            if (!branch.name?.trim()) {
                newErrors[`branch_${i}_name`] = `Branch ${i + 1} name is required`;
            } else if (!validateName(branch.name.trim())) {
                newErrors[`branch_${i}_name`] = `Branch ${i + 1} name should only contain letters, spaces, hyphens, and apostrophes`;
            }

            if (!branch.gst?.trim()) {
                newErrors[`branch_${i}_gst`] = `GST number for branch ${i + 1} is required`;
            } else if (!validateGST(branch.gst)) {
                newErrors[`branch_${i}_gst`] = `Invalid GST number format for branch ${i + 1}`;
            }

            if (!branch.state?.trim()) {
                newErrors[`branch_${i}_state`] = `State for branch ${i + 1} is required`;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Show first error as snackbar
            const firstError = Object.values(newErrors)[0];
            dispatch(showSnackbar({ message: firstError, type: "error" }));
            return;
        }


        setLoading(true);
        try {
            const submitData = {
                ...formData,
                branches: branches
            };

            if (clientToEdit) {
                await dispatch(updateClient({ clientId: clientToEdit.id, clientData: submitData })).unwrap();
                dispatch(showSnackbar({ message: "Client updated successfully", type: "success" }));
            } else {
                await dispatch(createClient(submitData)).unwrap();
                dispatch(showSnackbar({ message: "Client created successfully", type: "success" }));
            }

            resetForm();
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to save client", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    // Add this useEffect to reset when modal opens for new client
    useEffect(() => {
        if (isOpen && !clientToEdit) {
            resetForm();
        }
    }, [isOpen, clientToEdit]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 40 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 40 }}
                        className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Building2 size={24} className="text-blue-600" />
                                {clientToEdit ? "Edit Client" : "Add New Client"}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Client Information */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-3">Client Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>
                                    <div className="flex flex-row gap-1">
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Client Code<span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1">Unique identifier</p>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Unique Client Code (e.g., P0001)"
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={formData.client_code}
                                        onChange={(e) => handleFormChange("client_code", e.target.value)}
                                        maxLength={20}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Client Name<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Client Name"
                                        className={`w-full p-3 border ${errors.client_name ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                                        value={formData.client_name}
                                        onChange={(e) => handleFormChange("client_name", e.target.value)}
                                        maxLength={50}
                                    />
                                    {errors.client_name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.client_name}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex flex-row gap-1">
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            PAN Number<span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1">Format: AAAAA0000A</p>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Enter PAN number"
                                        className={`w-full p-3 border ${errors.pan_no ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                                        value={formData.pan_no}
                                        onChange={(e) => handleFormChange("pan_no", e.target.value)}
                                        maxLength={10}
                                    />
                                    {errors.pan_no && (
                                        <p className="text-red-500 text-xs mt-1">{errors.pan_no}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex flex-row gap-1">
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                                            Contact Number
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1">10-digit mobile number</p>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Enter Contant Number"
                                        className={`w-full p-3 border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                                        value={formData.phone}
                                        onChange={(e) => handleFormChange("phone", e.target.value)}
                                        maxLength={10}
                                    />
                                    {errors.phone && (
                                        <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                                    )}
                                </div>

                                {/* <div className="md:col-span-2"> */}
                                <div >
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Address
                                    </label>
                                    <textarea
                                        placeholder="Enter complete address"
                                        rows={2}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={formData.address}
                                        onChange={(e) => handleFormChange("address", e.target.value)}
                                        maxLength={500}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Status
                                    </label>
                                    <select
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        value={formData.status}
                                        onChange={(e) => handleFormChange("status", e.target.value)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Branches Section */}
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-3">Branches</h4>

                            {branches.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <p className="text-gray-400">No Branches Added Yet</p>
                                </div>
                            ) : (
                                <ol className="space-y-4 list-decimal ">
                                    {branches.map((branch, index) => (
                                        // <li key={`branch_${index}_${branch.name}_${branch.gst}`} className="border border-gray-200 rounded-xl px-4 pb-3 bg-gray-50">
                                        <li key={index} className="border border-gray-200 rounded-xl px-4 pb-3 bg-gray-50">
                                            <div className="relative flex justify-between items-center mb-3  ">
                                                {/* <div></div> */}
                                                {/* <h5 className="font-medium text-gray-700">Branch {index + 1}</h5> */}
                                                {branches.length > 1 && (
                                                    <button
                                                        onClick={() => removeBranch(index)}
                                                        className="absolute right-0 top-3 text-red-500 hover:text-red-700 transition"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                        Branch Name<span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Branch Name"
                                                        className={`p-2 border ${errors[`branch_${index}_name`] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full`}
                                                        value={branch.name}
                                                        onChange={(e) => handleBranchChange(index, "name", e.target.value)}
                                                        maxLength={50}
                                                    />
                                                    {errors[`branch_${index}_name`] && (
                                                        <p className="text-red-500 text-xs mt-1">{errors[`branch_${index}_name`]}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex flex-row gap-1">
                                                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                            GST Number<span className="text-red-500">*</span>
                                                        </label>
                                                        <p className="text-xs text-gray-400 ">Format: 22AAAAA0000A1Z5</p>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter GST Number"
                                                        className={`p-2 border ${errors[`branch_${index}_gst`] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full`}
                                                        value={branch.gst}
                                                        onChange={(e) => handleBranchChange(index, "gst", e.target.value)}
                                                        maxLength={15}
                                                    />

                                                    {errors[`branch_${index}_gst`] && (
                                                        <p className="text-red-500 text-xs mt-1">{errors[`branch_${index}_gst`]}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                        State<span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter State of Branch"
                                                        className={`p-2 border ${errors[`branch_${index}_state`] ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full`}
                                                        value={branch.state}
                                                        onChange={(e) => handleBranchChange(index, "state", e.target.value)}
                                                        maxLength={50}
                                                    />
                                                    {errors[`branch_${index}_state`] && (
                                                        <p className="text-red-500 text-xs mt-1">{errors[`branch_${index}_state`]}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                                                        Status<span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full"
                                                        value={branch.status}
                                                        onChange={(e) => handleBranchChange(index, "status", e.target.value)}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}

                            <button
                                onClick={addBranch}
                                className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition flex items-center gap-2 text-sm"
                            // className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition flex items-center gap-1 text-sm"
                            >
                                <Plus size={16} />
                                Add Branch
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                                {clientToEdit ? "Update Client" : "Save Client"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// Add Client Button (Simplified)
export const AddClientButton = ({ onSuccess, loadData }) => {
    const [showModal, setShowModal] = useState(false);

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        if (loadData) loadData();
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                New Client
            </motion.button>

            <ClientModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
};


// Edit Client Button (Simplified)
export const EditClientButton = ({ client, onSuccess, loadData }) => {
    const [showModal, setShowModal] = useState(false);

    const handleSuccess = () => {
        if (onSuccess) onSuccess();
        if (loadData) loadData();
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                title="Edit Client"
            >
                <Edit size={18} />
            </button>

            <ClientModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                clientToEdit={client}
                onSuccess={handleSuccess}
            />
        </>
    );
};


// Delete Client Button
export const DeleteClientButton = ({ client, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteClient(client.id)).unwrap();
            dispatch(showSnackbar({ message: "Client deleted successfully", type: "success" }));
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to delete client", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete Client"
            >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Client"
                message={`Are you sure you want to delete client "${client.client_name}"? This will also delete all associated branches.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};


// Activity Modal Content (Internal Component)
const ActivityModalContent = ({
    isOpen,
    onClose,
    onSubmit,
    editingActivity,
    formData,
    onFormChange,
    loading,
    title,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 30 }}
                        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border relative z-[10000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Layers size={20} className="text-blue-600" />
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
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
                                    value={formData.activity_name}
                                    // onChange={(e) =>
                                    //     onFormChange("activity_name", e.target.value)
                                    // }
                                    onChange={(e) => onFormChange("activity_name", restrictToLetters(e.target.value))}
                                    placeholder="Enter Activity Name"
                                    maxLength={50}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* <div className="grid grid-cols-2 gap-4"> */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Sequence Position
                                </label>
                                <input
                                    type="text"
                                    value={formData.sorting_var}
                                    min={0}
                                    onChange={(e) => onFormChange("sorting_var", restrictToNumbers(e.target.value))}
                                    placeholder="1, 2, 3..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            {/* <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Weightage (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.weightage}
                                        onChange={(e) => onFormChange("weightage", e.target.value)}
                                        placeholder="0-100"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div> */}
                            {/* </div> */}

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Description
                                </label>
                                <textarea
                                    value={formData.template_description}
                                    onChange={(e) => onFormChange("template_description", e.target.value)}
                                    placeholder="Activity description..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => onFormChange("start_date", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => onFormChange("end_date", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div> */}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={loading || !formData.activity_name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {editingActivity ? "Update" : "Create"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Add Activity Button Component
export const AddActivityButton = ({ onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        activity_name: "",
        sorting_var: "",
        template_description: "",
        // start_date: "",
        // end_date: "",
        // weightage: "",
        // company: "",
        // sector: "",
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            activity_name: "",
            sorting_var: "",
            template_description: "",
            // start_date: "",
            // end_date: "",
            // weightage: "",
            // company: "",
            // sector: "",
        });
    };

    const handleSubmit = async () => {
        const activityName = formData.activity_name?.trim();

        if (!activityName) {
            dispatch(showSnackbar({ message: "Activity name is required", type: "error" }));
            return;
        }

        if (!validateName(activityName)) {
            dispatch(showSnackbar({
                message: "Activity name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        // Validate sorting_var if provided
        if (formData.sorting_var && formData.sorting_var.trim()) {
            const sortingNum = parseInt(formData.sorting_var);
            if (isNaN(sortingNum) || sortingNum < 0) {
                dispatch(showSnackbar({ message: "Sequence position must be a positive number", type: "error" }));
                return;
            }
        }

        setLoading(true);
        try {
            await dispatch(
                createStageTemplate({
                    activity_name: activityName,
                    sorting_var: formData.sorting_var || "1",
                    template_description: formData.template_description,
                    // start_date: formData.start_date || null,
                    // end_date: formData.end_date || null,
                    // weightage: formData.weightage || null,
                    // company: formData.company || null,
                    // sector: formData.sector || null,
                }),
            ).unwrap();

            dispatch(showSnackbar({ message: "Activity created successfully", type: "success" }));
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to create activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all flex items-center gap-2"
            >
                <Plus size={20} />
                New Activity
            </motion.button>

            <ActivityModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingActivity={null}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Create New Activity"
            />
        </>
    );
};

// Edit Activity Button Component
export const EditActivityButton = ({ activity, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        activity_name: activity?.activity_name || "",
        sorting_var: activity?.sorting_var || "",
        template_description: activity?.template_description || "",
        // start_date: activity?.start_date || "",
        // end_date: activity?.end_date || "",
        // weightage: activity?.weightage || "",
        // company: activity?.company || "",
        // sector: activity?.sector || "",
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            activity_name: activity?.activity_name || "",
            sorting_var: activity?.sorting_var || "",
            template_description: activity?.template_description || "",
            // start_date: activity?.start_date || "",
            // end_date: activity?.end_date || "",
            // weightage: activity?.weightage || "",
            // company: activity?.company || "",
            // sector: activity?.sector || "",
        });
    };

    const handleSubmit = async () => {
        const activityName = formData.activity_name?.trim();

        if (!activityName) {
            dispatch(showSnackbar({ message: "Activity name is required", type: "error" }));
            return;
        }

        if (!validateName(activityName)) {
            dispatch(showSnackbar({
                message: "Activity name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        if (!formData.sorting_var?.trim()) {
            dispatch(showSnackbar({ message: "Sequence Position is required", type: "error" }));
            return;
        }

        const sortingNum = parseInt(formData.sorting_var);
        if (isNaN(sortingNum) || sortingNum < 0) {
            dispatch(showSnackbar({ message: "Sequence position must be a positive number", type: "error" }));
            return;
        }

        if (!formData.template_description?.trim()) {
            dispatch(showSnackbar({ message: "Template Description is required", type: "error" }));
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                activity_name: formData.activity_name,
                sorting_var: formData.sorting_var || "1",
                template_description: formData.template_description,
                // start_date: formData.start_date || null,
                // end_date: formData.end_date || null,
                // weightage: formData.weightage || null,
                // company: formData.company || null,
                // sector: formData.sector || null,
                // subactivities: currentSubActivities.map((sub) => ({
                //     id: sub.id,
                //     subactivity_name: sub.subactivity_name,
                //     sorting_var: sub.sorting_var,
                //     description: sub.description,
                //     unit: sub.unit,
                //     submission_payment: sub.submission_payment,
                //     approval_payment: sub.approval_payment,
                //     chainage_start: sub.chainage_start,
                //     chainage_end: sub.chainage_end,
                //     covered_area: sub.covered_area,
                //     total_quantity: sub.total_quantity,
                //     chainage_exist: sub.chainage_exist,
                //     planned_quantity_exist: sub.planned_quantity_exist,
                //     length_exist: sub.length_exist,
                //     submission_exist: sub.submission_exist,
                //     approval_exist: sub.approval_exist,
                //     range: sub.range,
                //     range_no: sub.range_no,
                // })),
            };

            await dispatch(
                updateStageTemplate({
                    id: activity.id,
                    // data: updateData,
                    data: {
                        activity_name: formData.activity_name,
                        sorting_var: formData.sorting_var || "1",
                        template_description: formData.template_description,
                    },
                }),
            ).unwrap();

            dispatch(showSnackbar({ message: "Activity updated successfully", type: "success" }));
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            console.log(error, 'error')
            dispatch(showSnackbar({ message: error.message || "Failed to update activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                }}
                className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                title="Edit Activity"
            >
                <Edit size={18} />
            </button>

            <ActivityModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingActivity={activity}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Edit Activity"
            />
        </>
    );
};

// Delete Activity Button Component
export const DeleteActivityButton = ({ activity, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteStageTemplate(activity.id)).unwrap();
            dispatch(
                showSnackbar({
                    message: "Activity deleted successfully",
                    type: "success",
                }),
            );
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to delete activity",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();
        setShowConfirm(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600 disabled:opacity-50"
                title="Delete Activity"
            >
                {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Trash2 size={18} />
                )}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Activity"
                message={`Are you sure you want to delete Activity "${activity.activity_name}"? This will also delete all associated sub-activities.`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};


// Sub-Activity Modal Content
const SubActivityModalContent = ({
    isOpen,
    onClose,
    onSubmit,
    editingSubActivity,
    selectedActivity,
    formData,
    onFormChange,
    loading,
    title,
}) => {
    const unitOptions = [
        "Kilometer",
        "Meter",
        "Square Meter",
        "Cubic Meter",
        "Numbers",
        "Lump Sum",
        "Percentage",
        "Status",
        "Hour",
        "Day",
    ];

    return (
        <AnimatePresence>
            {isOpen && selectedActivity && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 30 }}
                        className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border max-h-[90vh] overflow-y-auto relative z-[10000]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <Layers size={20} className="text-blue-600" />
                                {title}
                                <span className="text-sm font-normal text-gray-500">
                                    for {selectedActivity.activity_name}
                                </span>
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Sub-activity Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subactivity_name}
                                        onChange={(e) => onFormChange("subactivity_name", restrictToLetters(e.target.value))}
                                        placeholder="Enter sub-activity name"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Sort Order
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sorting_var}
                                        onChange={(e) => onFormChange("sorting_var", restrictToNumbers(e.target.value))}
                                        placeholder="1, 2, 3..."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => onFormChange("description", e.target.value)}
                                    placeholder="Sub-activity description..."
                                    rows={2}
                                    maxLength={500}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Unit Selection */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Unit of Measurement
                                </label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => onFormChange("unit", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="">Select Unit</option>
                                    {unitOptions.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Template Configuration Section - Only Checkboxes */}
                            <div className="border-t border-gray-200 pt-4 mt-2">
                                <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Settings size={16} />
                                    Template Configuration
                                </h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Enable the fields that will be available for this sub-activity in the actual data entry
                                </p>

                                <div className="space-y-3">
                                    {[
                                        { id: "planned_quantity_exist", label: "Planned Quantity", desc: "Enable planned quantity tracking for this sub-activity" },
                                        { id: "chainage_exist", label: "Chainage Range", desc: "Enable chainage start and end range tracking" },
                                        { id: "length_exist", label: "Length / Area", desc: "Enable length or covered area tracking" },
                                        { id: "submission_exist", label: "Submission Payment", desc: "Enable submission payment tracking" },
                                        { id: "approval_exist", label: "Approval Payment", desc: "Enable approval payment tracking" },
                                    ].map(({ id, label, desc }) => (
                                        <div key={id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                id={id}
                                                checked={formData[id]}
                                                onChange={(e) => onFormChange(id, e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor={id} className="ml-3 flex-1">
                                                <div className="font-medium text-gray-700">{label}</div>
                                                <div className="text-xs text-gray-500">{desc}</div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onSubmit}
                                disabled={loading || !formData.subactivity_name.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                            >
                                {loading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {editingSubActivity ? "Update" : "Create"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Add Sub-Activity Button Component
export const AddSubActivityButton = ({
    activity,
    onSuccess,
    loadData,
}) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subactivity_name: "",
        sorting_var: "",
        description: "",
        unit: "",
        // submission_payment: "0",
        // approval_payment: "0",
        // chainage_start: "0",
        // chainage_end: "0",
        // covered_area: "0",
        // total_quantity: "",
        chainage_exist: true,
        planned_quantity_exist: true,
        length_exist: true,
        submission_exist: true,
        approval_exist: true,
        // range: "",
        // range_no: "",
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            subactivity_name: "",
            sorting_var: "",
            description: "",
            unit: "",
            // submission_payment: "0",
            // approval_payment: "0",
            // chainage_start: "0",
            // chainage_end: "0",
            // covered_area: "0",
            // total_quantity: "",
            // range: "",
            // range_no: "",
            chainage_exist: true,
            planned_quantity_exist: true,
            length_exist: true,
            submission_exist: true,
            approval_exist: true,
        });
    };

    const handleSubmit = async () => {
        const subActivityName = formData.subactivity_name?.trim();

        if (!subActivityName) {
            dispatch(showSnackbar({ message: "Sub-activity name is required", type: "error" }));
            return;
        }

        if (!validateName(subActivityName)) {
            dispatch(showSnackbar({
                message: "Sub-activity name should only contain letters, spaces, hyphens, and apostrophes (max 50 characters)",
                type: "error"
            }));
            return;
        }

        if (!formData.unit) {
            dispatch(showSnackbar({ message: "Please select a unit of measurement", type: "error" }));
            return;
        }

        if (formData.sorting_var && formData.sorting_var.trim()) {
            const sortingNum = parseInt(formData.sorting_var);
            if (isNaN(sortingNum) || sortingNum < 0) {
                dispatch(showSnackbar({ message: "Sort order must be a positive number", type: "error" }));
                return;
            }
        }

        setLoading(true);
        try {
            await dispatch(
                createSubActivity({
                    activity_template: activity.id,
                    ...formData,
                    // submission_payment: parseFloat(formData.submission_payment) || 0,
                    // approval_payment: parseFloat(formData.approval_payment) || 0,
                    // chainage_start: parseFloat(formData.chainage_start) || 0,
                    // chainage_end: parseFloat(formData.chainage_end) || 0,
                    // covered_area: parseFloat(formData.covered_area) || 0,
                    // total_quantity: formData.total_quantity || null,
                }),
            ).unwrap();

            dispatch(showSnackbar({ message: "Sub-activity created successfully", type: "success" }));
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(showSnackbar({ message: error.message || "Failed to create sub-activity", type: "error" }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
            >
                <Plus size={14} />
                Add Sub-activity
            </motion.button>

            <SubActivityModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingSubActivity={null}
                selectedActivity={activity}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Create New Sub-activity"
            />
        </>
    );
};

// Edit Sub-Activity Button Component
export const EditSubActivityButton = ({
    subActivity,
    activity,
    onSuccess,
    loadData,
}) => {
    const dispatch = useDispatch();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subactivity_name: subActivity?.subactivity_name || "",
        sorting_var: subActivity?.sorting_var || "",
        description: subActivity?.description || "",
        unit: subActivity?.unit || "",
        chainage_exist: subActivity?.chainage_exist !== false,
        planned_quantity_exist: subActivity?.planned_quantity_exist !== false,
        length_exist: subActivity?.length_exist !== false,
        submission_exist: subActivity?.submission_exist !== false,
        approval_exist: subActivity?.approval_exist !== false,
        // submission_payment: subActivity?.submission_payment || "0",
        // approval_payment: subActivity?.approval_payment || "0",
        // chainage_start: subActivity?.chainage_start || "0",
        // chainage_end: subActivity?.chainage_end || "0",
        // covered_area: subActivity?.covered_area || "0",
        // total_quantity: subActivity?.total_quantity || "",
        // range: subActivity?.range || "",
        // range_no: subActivity?.range_no || "",
    });

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
        setFormData({
            subactivity_name: subActivity?.subactivity_name || "",
            sorting_var: subActivity?.sorting_var || "",
            description: subActivity?.description || "",
            unit: subActivity?.unit || "",
            chainage_exist: subActivity?.chainage_exist !== false,
            planned_quantity_exist: subActivity?.planned_quantity_exist !== false,
            length_exist: subActivity?.length_exist !== false,
            submission_exist: subActivity?.submission_exist !== false,
            approval_exist: subActivity?.approval_exist !== false,
            // submission_payment: subActivity?.submission_payment || "0",
            // approval_payment: subActivity?.approval_payment || "0",
            // chainage_start: subActivity?.chainage_start || "0",
            // chainage_end: subActivity?.chainage_end || "0",
            // covered_area: subActivity?.covered_area || "0",
            // total_quantity: subActivity?.total_quantity || "",
            // range: subActivity?.range || "",
            // range_no: subActivity?.range_no || "",
        });
    };

    const handleSubmit = async () => {
        if (!formData.subactivity_name.trim()) {
            dispatch(
                showSnackbar({
                    message: "Sub-activity name is required",
                    type: "error",
                }),
            );
            return;
        }

        setLoading(true);
        try {
            await dispatch(
                updateSubActivity({
                    id: subActivity.id,
                    data: {
                        ...formData,
                        // submission_payment: parseFloat(formData.submission_payment) || 0,
                        // approval_payment: parseFloat(formData.approval_payment) || 0,
                        // chainage_start: parseFloat(formData.chainage_start) || 0,
                        // chainage_end: parseFloat(formData.chainage_end) || 0,
                        // covered_area: parseFloat(formData.covered_area) || 0,
                        // total_quantity: formData.total_quantity || null,
                    },
                }),
            ).unwrap();

            dispatch(
                showSnackbar({
                    message: "Sub-activity updated successfully",
                    type: "success",
                }),
            );
            setShowModal(false);
            resetForm();
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to update sub-activity",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="p-1.5 hover:bg-blue-100 rounded-lg transition text-blue-600"
                title="Edit Sub-activity"
            >
                <Edit size={14} />
            </button>

            <SubActivityModalContent
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                onSubmit={handleSubmit}
                editingSubActivity={subActivity}
                selectedActivity={activity}
                formData={formData}
                onFormChange={handleFormChange}
                loading={loading}
                title="Edit Sub-activity"
            />
        </>
    );
};

// Similarly update DeleteSubActivityButton
export const DeleteSubActivityButton = ({ subActivity, onSuccess, loadData }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await dispatch(deleteSubActivity(subActivity.id)).unwrap();
            dispatch(
                showSnackbar({
                    message: "Sub-activity deleted successfully",
                    type: "success",
                }),
            );
            if (onSuccess) onSuccess();
            if (loadData) loadData();
        } catch (error) {
            dispatch(
                showSnackbar({
                    message: error.message || "Failed to delete sub-activity",
                    type: "error",
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-600 disabled:opacity-50"
                title="Delete Sub-activity"
            >
                {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                ) : (
                    <Trash2 size={14} />
                )}
            </button>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Sub-activity"
                message={`Are you sure you want to delete Sub-Activity "${subActivity.subactivity_name}"?`}
                confirmText="Delete"
                cancelText="Cancel"
            />
        </>
    );
};

