// RaisedTickets.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
    Eye,
    Search,
    X,
    Loader2,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    Clock,
    Trash2,
    Plus,
    MessageCircle,
} from 'lucide-react';
import { fetchAllTickets, fetchMyTickets, filterRaisedTickets, resetFilters, setSelectedStatus } from './ticketslice';
import { CreateTicketModal } from '../../components/modals/CreateTicketModal';
import { DeleteConfirmModal } from '../../components/modals/DeleteTicketModal';
import { TicketChatModal } from '../../components/modals/TicketChatModal';
import { CloseTicketModal } from '../../components/modals/CloseTicketModal';

const StatusBadge = ({ status }) => {
    const config = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
        completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
        inprocess: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Loader2 }
    };
    const { bg, text, icon: Icon } = config[status] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
            <Icon size={12} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};

export const RaisedTickets = () => {
    const dispatch = useDispatch();
    const { filteredRaisedTickets, loading, raisedTicketsStats, selectedStatus } = useSelector((state) => state.tickets);

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch tickets when status changes
    useEffect(() => {
        dispatch(fetchAllTickets({ status: selectedStatus !== 'null' ? selectedStatus : null }));
    }, [dispatch, selectedStatus]);

    // Apply filters when search or date range changes
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(filterRaisedTickets({ searchTerm, startDate, endDate }));
        }, 500);
        return () => clearTimeout(timer);
    }, [dispatch, searchTerm, startDate, endDate]);

    const handleStatusFilter = (status) => {
        dispatch(setSelectedStatus(status));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        dispatch(resetFilters());
    };

    const paginatedTickets = filteredRaisedTickets.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredRaisedTickets.length / itemsPerPage);

    // Status tabs with counts
    const statusTabs = [
        { value: 'null', label: 'All', count: raisedTicketsStats.total },
        { value: 'pending', label: 'Pending', count: raisedTicketsStats.pending },
        { value: 'completed', label: 'Completed', count: raisedTicketsStats.completed }
    ];

    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
    };

    const canClose = (ticket) => {
        const isSupport = typeof TICKET_SUPPORT !== 'undefined' ? TICKET_SUPPORT : false;
        return ticket.status !== 'completed' && (isSupport || localStorage.getItem('tech_support') === 'true');
    };

    return (
        <div className="space-y-4">
            {/* Header with Create Button */}
            <div className="flex justify-between items-center">
                <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleStatusFilter(tab.value)}
                            className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${selectedStatus === tab.value
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} />
                    New Ticket
                </button>
            </div>

            {/* Search and Date Filters */}
            <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by title, description, or requester..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {(searchTerm || startDate || endDate) && (
                        <button
                            onClick={handleClearFilters}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                            <X size={14} />
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-[5%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                                <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                                <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed Date</th>
                                <th className="w-[10%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="w-[15%] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chat History</th>
                                <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-blue-600" size={32} />
                                        <p className="mt-2 text-gray-500">Loading tickets...</p>
                                    </td>
                                </tr>
                            ) : paginatedTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No tickets found
                                    </td>
                                </tr>
                            ) : (
                                paginatedTickets.map((ticket, index) => (
                                    <motion.tr
                                        key={ticket.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="w-[5%] px-6 py-4 text-sm text-gray-500">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="w-[20%] px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{ticket.assigned_by_name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{ticket.assigned_by || 'N/A'}</div>
                                        </td>
                                        <td className="w-[15%] px-6 py-4">
                                            <div
                                                className="text-sm text-gray-500 max-w-md line-clamp wrap-break-word"
                                                dangerouslySetInnerHTML={{ __html: ticket.title }}
                                            />
                                        </td>
                                        <td className="w-[30%] px-6 py-4">
                                            <div
                                                className="text-sm text-gray-500 max-w-md line-clamp wrap-break-word"
                                                dangerouslySetInnerHTML={{ __html: ticket.description }}
                                            />
                                        </td>
                                        <td className="w-[15%] px-6 py-4 text-sm text-gray-500">
                                            {formatDate(ticket.created_at || ticket.assign_date)}
                                        </td>
                                        <td className="w-[15%] px-6 py-4 text-sm text-gray-500">
                                            {formatDate(ticket.close_datetime)}
                                        </td>
                                        <td className="w-[15%] px-6 py-4">
                                            <StatusBadge status={ticket.status} />
                                        </td>
                                        <td className="w-[15%] px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowChatModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="View Chat"
                                                >
                                                    <MessageCircle size={18} />
                                                </button>


                                            </div>
                                        </td>
                                        <td className="w-[15%] px-6 py-4">
                                            <div className="flex gap-2">


                                                {/* 3. OPTIONAL IMPROVEMENT: Only show check/close action if ticket is eligible */}
                                                {ticket.status !== 'completed' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTicket(ticket);
                                                            setShowCloseModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-700"
                                                        title="Close Ticket"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedTicket(ticket);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete Ticket"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center px-6 py-3 border-t border-gray-200">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateTicketModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            {showCloseModal && selectedTicket && (
                <CloseTicketModal
                    ticket={selectedTicket}
                    onClose={() => {
                        setShowCloseModal(false);
                        setSelectedTicket(null);
                    }}
                    onSuccess={() => {
                        const statusParam = selectedStatus !== 'null' ? selectedStatus : 'null';
                        // Executing this dispatch will no longer crash because fetchMyTickets is explicitly imported now
                        dispatch(fetchMyTickets(statusParam));
                        dispatch(fetchAllTickets({ status: selectedStatus !== 'null' ? selectedStatus : null }));
                    }}
                    isRaisedTicket={true}
                />
            )}

            {showDeleteModal && selectedTicket && (
                <DeleteConfirmModal
                    item={selectedTicket}
                    itemName="ticket"
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedTicket(null);
                    }}
                    isRaisedTicket={true}
                />
            )}

            {showChatModal && selectedTicket && (
                <TicketChatModal
                    ticket={selectedTicket}
                    onClose={() => {
                        setShowChatModal(false);
                        setSelectedTicket(null);
                    }}
                />
            )}
        </div>
    );
};
