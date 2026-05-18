// modals/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { deleteTicket, fetchMyTickets, fetchAllTickets } from '../../features/ticketsManagement/ticketslice';

export const DeleteConfirmModal = ({ item, itemName = 'ticket', onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            setError('Please type "DELETE" to confirm');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await dispatch(deleteTicket(item.id)).unwrap();

            // Refresh tickets after deletion
            await dispatch(fetchMyTickets('null'));
            await dispatch(fetchAllTickets({ status: 'pending' }));

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to delete ticket. Please try again.');
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
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="text-red-600" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">Delete {itemName}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        {/* Warning Icon */}
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={32} />
                            </div>
                        </div>

                        {/* Warning Message */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                Are you absolutely sure?
                            </h3>
                            <p className="text-sm text-gray-500">
                                This action cannot be undone. This will permanently delete the {itemName}
                                and remove all associated data.
                            </p>
                        </div>

                        {/* Ticket Info */}
                        {item.title && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-1">You are about to delete:</p>
                                <p className="text-sm font-semibold text-gray-800">"{item.title}"</p>
                                {item.id && (
                                    <p className="text-xs text-gray-500 mt-1">ID: {item.id}</p>
                                )}
                            </div>
                        )}

                        {/* Confirmation Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type <span className="font-bold text-red-600">DELETE</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => {
                                    setConfirmText(e.target.value);
                                    setError('');
                                }}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="DELETE"
                                disabled={loading}
                                autoCapitalize="characters"
                            />
                            {error && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Warning Note */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-xs text-red-800 flex items-start gap-2">
                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                <span>
                                    <strong>Warning:</strong> This will permanently delete the {itemName} and all
                                    associated chat history. This action cannot be undone.
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
                            type="button"
                            onClick={handleDelete}
                            disabled={loading || confirmText !== 'DELETE'}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                            {loading ? 'Deleting...' : `Delete ${itemName}`}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};