// SetupDisplay.jsx
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ActivityTable, ClientsTable, CompaniesTable, SectorsTable } from "./SetupTables";
import { RefreshCw, Settings, Layers, Building2, TrendingUp, Users, Handshake } from "lucide-react";
import { useSelector } from "react-redux";
import LoadingModal from "../../components/modals/LoadingModal";

const SettingsComponentDisplay = () => {
    const { loading: apiLoading = false } = useSelector((state) => state.api || {});
    const [activeTab, setActiveTab] = useState("companies");
    const [refreshing, setRefreshing] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleRefreshBackup = () => {
        setRefreshing(true);
        // The refresh logic is now handled inside the ActivityTable component
        setTimeout(() => setRefreshing(false), 1000);
    };

    const handleRefreshBackup2 = () => {
        setRefreshing(true);

        // Call the appropriate table's refresh function based on active tab
        switch (activeTab) {
            case "activities":
                if (activityTableRef.current) {
                    activityTableRef.current();
                }
                break;
            case "companies":
                if (companiesTableRef.current) {
                    companiesTableRef.current();
                }
                break;
            case "sectors":
                if (sectorsTableRef.current) {
                    sectorsTableRef.current();
                }
                break;
            case "clients":
                if (clientsTableRef.current) {
                    clientsTableRef.current();
                }
                break;
            default:
                break;
        }

        // Stop the refreshing animation after 1 second
        setTimeout(() => setRefreshing(false), 1000);
    };


    // Tab configurations
    const tabs = [
        { id: "companies", label: "Companies", icon: Building2, comingSoon: false },
        { id: "sectors", label: "Sectors", icon: TrendingUp, comingSoon: false },
        { id: "clients", label: "Client Management", icon: Users, comingSoon: false },
        { id: "activities", label: "Activities & Sub-Activities Template", icon: Layers, comingSoon: false },
        // { id: "users", label: "User Management", icon: Users, comingSoon: true }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <div className="max-w-7xl mx-auto px-4 py-6">
                <LoadingModal isVisible={apiLoading || refreshing} />

                <div>
                    {/* Header */}
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <motion.h1
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                                >
                                    Settings
                                </motion.h1>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-purple-100 text-purple-600"
                                >
                                    <Settings size={14} />
                                    Admin Panel
                                </motion.div>
                            </div>
                            <motion.p
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-gray-500 text-lg"
                            >
                                Manage activities, sub-activities, and system configurations
                            </motion.p>
                        </div>
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => handleRefresh()}
                            disabled={refreshing}
                            className="p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200 flex items-center gap-2"
                        >
                            <RefreshCw size={20} className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`} />
                            <span className="text-sm font-medium text-gray-700">Refresh</span>
                        </motion.button>
                    </div>

                    {/* Tabs */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl mb-8 border border-gray-100"
                    >
                        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                                    className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2
                                ${activeTab === tab.id
                                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                            : "text-gray-600 hover:bg-gray-100"
                                        }
                                ${tab.comingSoon ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                            `}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                    {tab.comingSoon && (
                                        <span className="text-xs ml-1 px-1.5 py-0.5 bg-gray-200 rounded-full">Coming Soon</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tables Content Container */}
                        <div className="p-6 pb-8">
                            {activeTab !== "activities" && activeTab !== "companies" && activeTab !== "sectors" && activeTab !== "clients" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-20"
                                >
                                    <Settings size={64} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</p>
                                    <p className="text-gray-500">This section is under development</p>
                                </motion.div>
                            )}
                            {activeTab === "companies" && (
                                <CompaniesTable
                                    refreshKey={refreshKey}
                                />
                            )}
                            {activeTab === "sectors" && (
                                <SectorsTable
                                    refreshKey={refreshKey}
                                />
                            )}
                            {activeTab === "clients" && (
                                <ClientsTable
                                    refreshKey={refreshKey}
                                />
                            )}
                            {activeTab === "activities" && (
                                <ActivityTable
                                    refreshKey={refreshKey}
                                />
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default SettingsComponentDisplay;