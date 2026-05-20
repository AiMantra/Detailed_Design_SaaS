// modals/TicketChatModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Paperclip, Loader2, AlertCircle } from 'lucide-react';
import { fetchTicketChat, addChatMessage } from '../../features/ticketsManagement/ticketslice';
// import { formatDateTime } from '../../../utils/dateUtils';
// import { IMAGE_URL } from '../../../config/axios';
// modals/TicketChatModal.jsx


export const TicketChatModal = ({ ticket, onClose }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    console.log(user, 'user ')
    const { ticketChat = [], loading } = useSelector((state) => state.tickets);
    const [message, setMessage] = useState('');
    const [document, setDocument] = useState(null);
    const [fileName, setFileName] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Create a sorted copy of the array
    const sortedMessages = React.useMemo(() => {
        if (!ticketChat || ticketChat.length === 0) return [];
        return [...ticketChat].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }, [ticketChat]);

    useEffect(() => {
        if (ticket?.id) {
            dispatch(fetchTicketChat(ticket.id));
        }
    }, [dispatch, ticket?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sortedMessages]);

    const handleSendMessage = async () => {
        if (!message.trim() && !document) {
            setError('Please enter a message or attach a file');
            return;
        }

        setSending(true);
        setError('');

        try {
            const formData = new FormData();

            // Required fields
            formData.append('ticket', ticket.id);
            formData.append('ticket_name', ticket.title);
            formData.append('sender', sessionStorage.getItem('userEmail') || sessionStorage.getItem('email'));
            formData.append('sender_name', user.name);
            formData.append('message', message);
            formData.append('timestamp', new Date().toISOString());
            formData.append('ticketaccepted_by_email', ticket.assigned_by || sessionStorage.getItem('userEmail') || sessionStorage.getItem('email'));
            formData.append('ticketaccepted_by_name', ticket.assigned_by_name || sessionStorage.getItem('name') || 'User');
            formData.append('ticket_for_productname', ticket.ticket_for || 'Aimantra Timesheet');
            formData.append('status', ticket.status || 'pending');
            formData.append('read_status', 'false');
            formData.append('ticket_link', window.location.origin || 'https://www.detaildesign.aimantra.co/');

            if (document) {
                formData.append('document', document);
            }

            await dispatch(addChatMessage(formData)).unwrap();

            setMessage('');
            setDocument(null);
            setFileName('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDocument(file);
            setFileName(file.name);
            setError('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearFile = () => {
        setDocument(null);
        setFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!ticket) return null;

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
                    className="bg-white rounded-2xl max-w-2xl w-full h-[600px] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200">
                        {/* Added 'min-w-0' and 'flex-1' to allow this container to shrink properly inside its parent flex row */}
                        <div className="min-w-0 flex-1 pr-4">
                            <h3 className="text-lg font-bold text-gray-800">Ticket Chat</h3>

                            {/* UPDATED LINE BELOW: Changed to standard Tailwind text wrap utilities */}
                            <p className="text-sm text-gray-500 break-words line-clamp">
                                {ticket.title}
                            </p>

                            <p className="text-xs text-gray-400">Ticket ID: {ticket.id}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-blue-600" size={32} />
                            </div>
                        ) : sortedMessages.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            sortedMessages.map((chat, index) => {
                                const currentUserEmail = sessionStorage.getItem('userEmail') || sessionStorage.getItem('email');
                                const isSender = chat.sender === currentUserEmail;

                                return (
                                    <div key={chat.id || index} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${isSender ? 'order-2' : 'order-1'}`}>
                                            <div className={`text-xs text-gray-500 mb-1 ${isSender ? 'text-right' : 'text-left'}`}>
                                                {chat.sender_name || chat.sender || 'Unknown User'}
                                            </div>
                                            <div
                                                className={`rounded-lg p-3 ${isSender
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {chat.message && (
                                                    <p className="text-sm whitespace-pre-wrap">{chat.message}</p>
                                                )}
                                                {chat.document && (
                                                    <a
                                                        href={chat.document}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`text-sm underline mt-1 inline-block ${isSender ? 'text-blue-100' : 'text-blue-600'
                                                            }`}
                                                    >
                                                        📎 View Attachment
                                                    </a>
                                                )}
                                            </div>
                                            <div className={`text-xs text-gray-400 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
                                                {/* {chat.timestamp && formatDateTime(chat.timestamp).time} */}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area - Only show if ticket is not completed */}
                    {ticket.status !== 'completed' && (
                        <div className="border-t border-gray-200 p-4">
                            {error && (
                                <div className="mb-2 text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type your message..."
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        disabled={sending}
                                    />

                                    {fileName && (
                                        <div className="mt-2 flex items-center gap-2 text-sm bg-gray-100 rounded-lg p-2">
                                            <Paperclip size={14} className="text-gray-500" />
                                            <span className="text-gray-600 truncate flex-1">{fileName}</span>
                                            <button
                                                onClick={clearFile}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <label className="cursor-pointer p-2 text-gray-500 hover:text-gray-700 transition-colors">
                                        <Paperclip size={20} />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                            className="hidden"
                                            disabled={sending}
                                        />
                                    </label>

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending || (!message.trim() && !document)}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show message when ticket is completed */}
                    {ticket.status === 'completed' && (
                        <div className="border-t border-gray-200 p-4 text-center text-gray-500">
                            This ticket is closed. No new messages can be sent.
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
