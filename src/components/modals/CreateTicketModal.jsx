// modals/CreateTicketModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, Loader2, Paperclip } from 'lucide-react';

import { addChatMessage, createTicket, fetchMyTickets } from '../../features/ticketsManagement/ticketslice';

export const CreateTicketModal = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileName, setFileName] = useState('');
    const { user } = useSelector((state) => state.auth);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        ticket_for: 'Time Sheet',
        priority: 2,
        status: 'pending'
    });

    const fileInputRef = useRef(null);

    const [document, setDocument] = useState(null);

    useEffect(() => {
        // Auto-detect product from URL
        const currentUrl = window.location.href;
        if (currentUrl.includes('ticket')) {
            setFormData(prev => ({ ...prev, ticket_for: 'Aimantra Timesheet' }));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setErrors(prev => ({
                    ...prev,
                    document: 'File size must be less than 5MB'
                }));
                setDocument(null);
                setFileName('');
                e.target.value = null;
                return;
            }

            setDocument(file);
            setFileName(file.name);
            if (errors.document) {
                setErrors(prev => ({ ...prev, document: '' }));
            }
        }
    };

    const handleRemoveFile = () => {
        setDocument(null);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Resets the actual input element
        }
        // Clear any lingering file error messages
        setErrors(prev => ({ ...prev, document: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const ticketData = {
                ...formData,
                assigned_by: sessionStorage.getItem('userEmail'),
                assigned_by_name: user.name,
                created_by: sessionStorage.getItem('emp_code'),
                assign_date: new Date().toISOString().split('T')[0]
            };

            let result;

            // const formDataToSend = new FormData();
            // Object.keys(ticketData).forEach(key => {
            //     formDataToSend.append(key, ticketData[key]);
            // });
            // formDataToSend.append('document', document);
            // result = await dispatch(createTicket(formDataToSend)).unwrap();

            result = await dispatch(createTicket(ticketData)).unwrap();
            console.log('Ticket created successfully:', result);
            if (result?.id && document) {
                const formData = new FormData();
                formData.append('ticket', result.id);
                formData.append('ticket_name', result.title);
                formData.append('sender', sessionStorage.getItem('userEmail') || sessionStorage.getItem('email'));
                formData.append('sender_name', user.name);
                // formData.append('message', document);
                formData.append('timestamp', new Date().toISOString());
                formData.append('ticketaccepted_by_email', sessionStorage.getItem('userEmail'));
                formData.append('ticketaccepted_by_name', sessionStorage.getItem('name'));
                formData.append('ticket_for_productname', 'Aimantra Timesheet');
                formData.append('status', 'pending');
                formData.append('read_status', 'false');
                formData.append('ticket_link', window.location.origin || 'https://www.detaildesign.aimantra.co/');

                formData.append('document', document);

                await dispatch(addChatMessage(formData)).unwrap();
            }

            await dispatch(fetchMyTickets('null'));
            onClose();
            resetForm();
        } catch (error) {
            console.error('Failed to create ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            ticket_for: formData.ticket_for,
            priority: 2,
            status: 'pending'
        });
        setDocument(null);
        setFileName('');
        setErrors({});
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={
                        () => {
                            onClose()
                            resetForm()
                        }
                    }
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9 }}
                        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Raise New Ticket</h2>
                            <button
                                onClick={
                                    () => {
                                        onClose()
                                        resetForm()
                                    }
                                }
                                className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Brief description of the issue"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Product */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product
                                </label>
                                <input
                                    type="text"
                                    name="ticket_for"
                                    value={formData.ticket_for}
                                    readOnly
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                                />
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Priority
                                </label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>High</option>
                                    <option value={2}>Medium</option>
                                    <option value={3}>Low</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={5}
                                    placeholder="Detailed description of the issue..."
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Attachment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Attachment (Optional)
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Paperclip size={16} />
                                        <span className="text-sm">Choose File</span>
                                        <input
                                            ref={fileInputRef} // Attach your reference here
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            className="hidden"
                                        />
                                    </label>

                                    {/* Document Status & Remove Button */}
                                    {fileName && (
                                        <div className="flex items-center gap-1.5 bg-gray-100 pl-3 pr-1.5 py-1.5 rounded-lg border border-gray-200 max-w-[250px]">
                                            <span className="text-sm text-gray-700 truncate">
                                                {fileName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded-md transition-colors"
                                                title="Remove file"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {errors.document ? (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} /> {errors.document}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 5MB)
                                    </p>
                                )}
                            </div>

                            {/* Note */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs text-yellow-800">
                                    <strong>Note:</strong> Ticket resolution typically requires a minimum of 2-3 working days.
                                    You will be notified via email about the status updates.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={
                                        () => {
                                            onClose()
                                            resetForm()
                                        }
                                    }
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                    {loading ? 'Creating...' : 'Raise Ticket'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};