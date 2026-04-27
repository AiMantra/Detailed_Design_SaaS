// import "./App.css";
import "./style/Layout.css";
import "./style/Inputs.css";
import "./style/Modal.css";
import 'react-toastify/dist/ReactToastify.css';

import AppRoutes from "./app/routes";
import Snackbar from "./features/notifications/Snackbar";
import NotificationManager from "./components/NotificationManager";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { ToastContainer } from 'react-toastify';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  // Don't show NotificationManager on login page even if authenticated
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';
  const shouldShowNotifications = isAuthenticated && !isLoginPage;

  return (
    <>
      {/* // Then in your component render: */}
      <ToastContainer position="top-center" />
      {/* Only show NotificationManager when authenticated AND not on login page */}
      {shouldShowNotifications && <NotificationManager />}
      <AppRoutes />
      <Snackbar />
    </>
  );
}

export default App;