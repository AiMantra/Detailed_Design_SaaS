// TicketsManagement.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Plus, MessageCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { MyTickets } from './Myticket';
import { RaisedTickets } from './RaisedTicket';
import { CreateTicketModal } from '../../components/modals/CreateTicketModal';
import { fetchMyTickets, fetchAllTickets, clearTicketError, setCurrentView } from './ticketslice';
// import usePermission from '../../config/permissions';

const TicketsManagement = () => {
    const dispatch = useDispatch();
    const {
        myTicketsStats,
        raisedTicketsStats,
        loading,
        error,
        currentView,
        selectedStatus
    } = useSelector((state) => state.tickets);

    // const { SUPER_ADMIN } = usePermission();
    const [activeTab, setActiveTab] = useState('my-tickets');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Get current stats based on active tab
    const currentStats = activeTab === 'my-tickets' ? myTicketsStats : raisedTicketsStats;

    useEffect(() => {
        dispatch(setCurrentView(activeTab));
    }, [dispatch, activeTab]);

    useEffect(() => {
        dispatch(fetchMyTickets(selectedStatus !== 'null' ? selectedStatus : 'null'));

        dispatch(fetchAllTickets({ status: selectedStatus !== 'null' ? selectedStatus : null }));
    }, [dispatch, selectedStatus]);


    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => dispatch(clearTicketError()), 3000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);
    const { user } = useSelector((state) => state.auth);
    const tabs = [
        { id: 'my-tickets', label: 'My Tickets', icon: Ticket },

        // Hide "Raised Tickets" for Civilmantra users
        ...(user?.company !== 'Civilmantra'
            ? [{ id: 'raised-tickets', label: 'Raised Tickets', icon: MessageCircle }]
            : [])
    ];


    const getTabCount = (tabId) => {
        if (tabId === 'my-tickets') {
            console.log("My Tickets Stats:", myTicketsStats);
            return myTicketsStats?.total || 0;
        }
        return raisedTicketsStats?.total || 0;
    };

    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 px-4">
                <StatCard
                    title="Total Tickets"
                    value={currentStats?.total || 0}
                    icon={Ticket}
                    color="blue"
                />
                <StatCard
                    title="Pending"
                    value={currentStats?.pending || 0}
                    icon={Clock}
                    color="yellow"
                />
                <StatCard
                    title="Completed"
                    value={currentStats?.completed || 0}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    title="High Priority"
                    value={currentStats?.byPriority?.high || 0}
                    icon={AlertCircle}
                    color="red"
                />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6 px-4">
                <nav className="flex gap-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}

                            {getTabCount(tab.id) > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                                    {getTabCount(tab.id)}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Loading Indicator */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading...</span>
                </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="px-4"
                >
                    {activeTab === 'my-tickets' ? (
                        <MyTickets onRaiseTicket={() => setShowCreateModal(true)} />
                    ) : (
                        <RaisedTickets />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Create Ticket Modal */}
            <CreateTicketModal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    // Refresh current view after creating ticket
                    if (activeTab === 'my-tickets') {
                        dispatch(fetchMyTickets(selectedStatus !== 'null' ? selectedStatus : 'null'));
                    } else {
                        dispatch(fetchAllTickets({ status: selectedStatus !== 'null' ? selectedStatus : null }));
                    }
                }}
            />
        </>
    );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{value || 0}</p>
                </div>
                <div className={`p-3 rounded-full ${colors[color]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default TicketsManagement;
