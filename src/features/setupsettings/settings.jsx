// Settings.jsx (Main Component)
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { useState } from "react";
import LoadingModal from "../../components/modals/LoadingModal";
import SettingsComponentDisplay from "./SetupDisplay";

const SettingsComponent = () => {
    const { loading: apiLoading = false } = useSelector((state) => state.api || {});

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = () => {
        setRefreshing(true);
        // The refresh logic is now handled inside the ActivityTable component
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <div className="max-w-7xl mx-auto px-4 py-6">
                <LoadingModal isVisible={apiLoading || refreshing} />

                <SettingsComponentDisplay />
            </div>
        </motion.div>
    );
};

export default SettingsComponent;