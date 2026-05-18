// modals/CloseTicketModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { closeTicket, fetchMyTickets, fetchAllTickets } from '../../features/ticketsManagement/ticketslice';

export const CloseTicketModal = ({ ticket, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const [remark, setRemark] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!remark.trim()) {
            setError('Please provide a closing remark');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await dispatch(closeTicket({ id: ticket.id, remark: remark.trim() })).unwrap();

            // Refresh tickets after closing
            await dispatch(fetchMyTickets('null'));
            await dispatch(fetchAllTickets({ status: 'pending' }));

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to close ticket. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9 }}
                    className="bg-white rounded-2xl max-w-md w-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Close Ticket</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            {/* Ticket Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-500 mb-1">Ticket ID</p>
                                <p className="text-sm font-medium text-gray-800">{ticket.id}</p>
                                <p className="text-sm text-gray-500 mt-2 mb-1">Title</p>
                                <p className="text-sm font-medium text-gray-800">{ticket.title}</p>
                                <p className="text-sm text-gray-500 mt-2 mb-1">Current Status</p>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {ticket.status}
                                </span>
                            </div>

                            {/* Remark Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Closing Remark <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={remark}
                                    onChange={(e) => {
                                        setRemark(e.target.value);
                                        setError('');
                                    }}
                                    rows={4}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none ${error ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Please provide details about how this ticket was resolved..."
                                    disabled={loading}
                                />
                                {error && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={14} />
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Warning Note */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs text-yellow-800 flex items-start gap-2">
                                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        <strong>Note:</strong> Once closed, this ticket will be marked as completed.
                                        No further messages can be sent to this ticket.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                {loading ? 'Closing...' : 'Close Ticket'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};