import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Calendar,
    Search,
    Filter,
    Loader2,
    RefreshCw,
    Briefcase,
    Building2,
    Users,
    TrendingUp,
    Timer,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    FileText,
    Download,
    ThumbsDown,
    MessageCircle
} from 'lucide-react';
import { fetchUserSubmittedTask, updateSubmissionStatus } from './taskSlice';
import { useNavigate } from 'react-router-dom';
import LoadingModal from '../../components/modals/LoadingModal';
// import RejectModal from '../../components/modals/RejectModal';

const SubmittedTasks = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const { userWorkSummary = null, userSubmittedTask, loading = false } = useSelector((state) => state.tasks || {});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedTasks, setExpandedTasks] = useState({});
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectDocuments, setRejectDocuments] = useState([]);

    useEffect(() => {
        if (user?.id) {
            fetchSubmissions();
        }
    }, [dispatch, user?.id]);

    const fetchSubmissions = async () => {
        await dispatch(fetchUserSubmittedTask(user?.id));
    };

    const toggleTaskExpand = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const formatDuration = (timeString) => {
        if (!timeString || timeString === '00:00:00') return '0h';
        const parts = timeString.split(':');
        const hours = parseInt(parts[0]);
        const minutes = parseInt(parts[1]);
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'Submitted': 'bg-blue-100 text-blue-800',
            'Inprogress': 'bg-yellow-100 text-yellow-800',
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800',
            'Waiting': 'bg-gray-100 text-gray-800',
            'Pending': 'bg-orange-100 text-orange-800'
        };

        const color = statusColors[status] || statusColors['Waiting'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                {status}
            </span>
        );
    };

    const getApprovalStatusBadge = (status) => {
        const statusColors = {
            'Approved': 'bg-green-100 text-green-800',
            'Rejected': 'bg-red-100 text-red-800',
            'Waiting': 'bg-yellow-100 text-yellow-800'
        };

        const color = statusColors[status] || statusColors['Waiting'];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                {status}
            </span>
        );
    };

    const handleReject = (submission) => {
        setSelectedSubmission(submission);
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        const formData = new FormData();
        formData.append('submission_id', selectedSubmission.id);
        formData.append('status', 'Rejected');
        formData.append('remarks', rejectReason);

        rejectDocuments.forEach(doc => {
            formData.append('documents', doc);
        });

        await dispatch(updateSubmissionStatus(formData));

        // Reset state
        setRejectModalOpen(false);
        setSelectedSubmission(null);
        setRejectReason('');
        setRejectDocuments([]);

        // Refresh the list
        fetchSubmissions();
    };

    const handleApprove = async (submission) => {
        if (window.confirm('Are you sure you want to approve this submission?')) {
            const formData = new FormData();
            formData.append('submission_id', submission.id);
            formData.append('status', 'Approved');
            formData.append('remarks', 'Submission approved');

            await dispatch(updateSubmissionStatus(formData));
            fetchSubmissions();
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setRejectDocuments(prev => [...prev, ...files]);
    };

    const removeDocument = (index) => {
        setRejectDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDownloadDocument = (doc) => {
        // Implement document download logic
        window.open(doc.document, '_blank');
    };

    // Transform your JSON data to a more usable format
    const submissions = userSubmittedTask || [];

    let filteredSubmissions = submissions;

    if (searchTerm) {
        filteredSubmissions = filteredSubmissions.filter(submission =>
            submission.subactivity_detail?.subactivity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            submission.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filterStatus !== 'all') {
        filteredSubmissions = filteredSubmissions.filter(submission =>
            submission.to_status === filterStatus ||
            submission.subactivity_detail?.approval_status === filterStatus
        );
    }

    const uniqueStatuses = [...new Set([
        ...submissions.map(s => s.to_status),
        ...submissions.map(s => s.subactivity_detail?.approval_status)
    ])];

    const totalSubmissions = submissions.length;
    const approvedCount = submissions.filter(s => s.subactivity_detail?.approval_status === 'Approved').length;
    const rejectedCount = submissions.filter(s => s.subactivity_detail?.approval_status === 'Rejected').length;
    const pendingCount = submissions.filter(s => s.subactivity_detail?.approval_status === 'Waiting').length;
    const totalHours = submissions.reduce((sum, s) => {
        const hours = s.subactivity_detail?.work_summary?.total_hours || '00:00:00';
        const parts = hours.split(':');
        return sum + parseInt(parts[0]);
    }, 0);

    if (loading && !submissions.length) {
        return <LoadingModal isVisible={true} />;
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-7xl mx-auto px-4 py-6"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Submitted Tasks</h1>
                        <p className="text-gray-500">Track and manage your task submissions</p>
                    </div>
                    <button
                        onClick={fetchSubmissions}
                        disabled={loading}
                        className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-200 flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span className="text-sm">Refresh</span>
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText size={18} className="text-blue-600" />
                            <p className="text-sm text-gray-500">Total Submissions</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800">{totalSubmissions}</p>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-green-50 rounded-xl p-4 shadow-md border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-green-600" />
                            <p className="text-sm text-green-600">Approved</p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-red-50 rounded-xl p-4 shadow-md border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                            <XCircle size={18} className="text-red-600" />
                            <p className="text-sm text-red-600">Rejected</p>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-yellow-50 rounded-xl p-4 shadow-md border border-yellow-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock size={18} className="text-yellow-600" />
                            <p className="text-sm text-yellow-600">Pending</p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="bg-purple-50 rounded-xl p-4 shadow-md border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Timer size={18} className="text-purple-600" />
                            <p className="text-sm text-purple-600">Total Hours</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{totalHours} hrs</p>
                    </motion.div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by task name or remarks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
                            >
                                <option value="all">All Status</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>
                </div>

                {/* Submissions List */}
                {filteredSubmissions.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
                        <FileText size={64} className="mx-auto mb-4 text-gray-300" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Submissions Found</h2>
                        <p className="text-gray-500">
                            {searchTerm || filterStatus !== 'all'
                                ? 'No submissions match your filters'
                                : "You haven't submitted any tasks yet."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredSubmissions.map((submission) => {
                            const isExpanded = expandedTasks[submission.id];
                            const subactivity = submission.subactivity_detail;
                            const workSummary = subactivity?.work_summary;

                            return (
                                <div key={submission.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                    {/* Submission Header */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div
                                                className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => toggleTaskExpand(submission.id)}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Briefcase size={20} className="text-blue-600" />
                                                    <h3 className="font-semibold text-gray-800">
                                                        {subactivity?.subactivity_name || 'Unknown Task'}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ml-8">
                                                    {getStatusBadge(submission.to_status)}
                                                    {getApprovalStatusBadge(subactivity?.approval_status)}
                                                    <span className="text-xs text-gray-500">
                                                        Changed by: {submission.changed_by}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Total Hours</p>
                                                    <p className="text-sm font-semibold text-blue-600">
                                                        {formatDuration(workSummary?.total_hours)}
                                                    </p>
                                                </div>

                                                

                                                <button
                                                    onClick={() => toggleTaskExpand(submission.id)}
                                                    className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="divide-y divide-gray-100"
                                            >
                                                {/* Task Details */}
                                                <div className="p-4">
                                                    <h4 className="font-semibold text-gray-800 mb-3">Task Details</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Description</p>
                                                            <p className="text-sm text-gray-700">{subactivity?.description || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Unit</p>
                                                            <p className="text-sm text-gray-700">{subactivity?.unit || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Submission Payment</p>
                                                            <p className="text-sm font-medium text-green-600">{subactivity?.submission_payment}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Approval Payment</p>
                                                            <p className="text-sm font-medium text-blue-600">{subactivity?.approval_payment}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Status Change</p>
                                                            <p className="text-sm text-gray-700">
                                                                From: {submission.from_status} → To: {submission.to_status}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Created At</p>
                                                            <p className="text-sm text-gray-700">{formatDate(submission.created_at)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Work Summary */}
                                                {workSummary && workSummary.users && workSummary.users.length > 0 && (
                                                    <div className="p-4 bg-gray-50">
                                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                            <Users size={16} />
                                                            Work Summary
                                                        </h4>
                                                        <div className="space-y-3">
                                                            {workSummary.users.map((user, idx) => (
                                                                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className="font-medium text-gray-800">{user.name}</p>
                                                                            <p className="text-xs text-gray-500">Emp Code: {user.emp_code}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-blue-600">
                                                                                {formatDuration(user.total_time_spent)}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">{user.days_worked} days worked</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Remarks */}
                                                {submission.remarks && (
                                                    <div className="p-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                            <MessageCircle size={16} />
                                                            Remarks
                                                        </h4>
                                                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                                            {submission.remarks}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Client Remarks */}
                                                {submission.client_remarks && (
                                                    <div className="p-4 bg-yellow-50">
                                                        <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                                                            <AlertCircle size={16} />
                                                            Client Remarks
                                                        </h4>
                                                        <p className="text-sm text-yellow-700">
                                                            {submission.client_remarks}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Documents */}
                                                {submission.documents && submission.documents.length > 0 && (
                                                    <div className="p-4">
                                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                            <Download size={16} />
                                                            Attached Documents ({submission.documents.length})
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {submission.documents.map((doc, idx) => (
                                                                <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                                    <div className="flex items-center gap-2">
                                                                        <FileText size={16} className="text-blue-600" />
                                                                        <span className="text-sm text-gray-700">{doc.name || `Document ${idx + 1}`}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDownloadDocument(doc)}
                                                                        className="text-blue-600 hover:text-blue-700"
                                                                    >
                                                                        <Download size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

           
        </>
    );
};

export default SubmittedTasks;