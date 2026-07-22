// src/features/auth/ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
// import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import TamperDetection from "../../utils/TamperDetection";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    // console.log("ProtectedRoute check:", { isAuthenticated, loading, user, allowedRoles });
  }, [isAuthenticated, loading, user, allowedRoles, location]);


  // Check for tampered data in session storage
  const checkForTampering = () => {
    const role = sessionStorage.getItem('userRole');
    const emp_code = sessionStorage.getItem('emp_code');
    // const user_uuid = sessionStorage.getItem('user_uuid');
    const userEmail = sessionStorage.getItem('userEmail');

    // Check for invalid modified data marker
    if (
      role === '[INVALID_MODIFIED_DATA]'
      || emp_code === '[INVALID_MODIFIED_DATA]'
      // || user_uuid === '[INVALID_MODIFIED_DATA]'
      || userEmail === '[INVALID_MODIFIED_DATA]'
    ) {
      console.warn('🚨 Tampering detected!...');

      

      return true;
    }

    return false;
  };

  // Check for tampering on every render
  if (checkForTampering()) {
    return <TamperDetection />;
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;