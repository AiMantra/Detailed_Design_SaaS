
import { Routes, Route } from "react-router-dom";
import Login from "../features/auth/Login";
import Layout from "../components/layout/Layout";
import DashboardWrapper from "../features/dashboard/DashboardWrapper";
import ProtectedRoute from "../features/auth/ProtectedRoute";
import Unauthorized from "../pages/Unauthorized";
import ProjectList from "../features/projects/ProjectList";
import ProjectDetails from "../features/projects/ProjectDetails";
import UserProjectDetails from "../features/projects/UserProjectDetails";
import UserProjectList from "../features/projects/UserProjectList";
import ExtensionRequestPage from "../features/extensions/ExtensionRequestPage";
import ProjectLogs from "../features/dailyLogs/ProjectLogs";
import DailyLogs from "../features/dailyLogs/DailyLogs";
import ContractorList from "../features/contractors/ContractorList";
import ExtensionApproval from "../features/extensions/ExtensionApproval";
import CreateProject from "../features/projects/CreateProject";
import MyTasks from "../features/tasks/MyTasks";
import UserPickedProjectDetails from "../features/projects/UserPickedProjectDetails";
import UserWorkLogs from "../features/tasks/UserWorkLogs";
import ErrorBoundary from "../components/ErrorBoundary";
import TlProjectList from "../features/projects/Tlprojects";
import SubmittedTasks from "../features/tasks/SubmittedTask";
import EmployeeReport from "../features/projects/empreport";
import SettingsComponent from "../features/setupsettings/settings";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN", "USER", "TL"]}>
            <Layout />
          </ProtectedRoute>
        }
      >

        <Route path="/dashboard" element={<DashboardWrapper />} />
        <Route path="/all-projects" element={<ProjectList />} />
        {/*Common*/}
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/projects/:id/extend" element={<ExtensionRequestPage />} />
        <Route path="/projects/:id/logs" element={<ProjectLogs />} />

        {/*For Users */}
        <Route
          path="/my-tasks"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <ErrorBoundary
                title="Tasks Error"
                message="We couldn't load your tasks. Please try again."
              >
                <MyTasks />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/*For Users (only their own logs) */}
        <Route
          path="/my-work-logs"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <ErrorBoundary
                title="Work Logs Error"
                message="We couldn't load your work logs. Please try again."
              >
                <UserWorkLogs />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        />

        {/* <Route
          path="/my-work-logs"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <ErrorBoundary
                title="Work Logs Error"
                message="We couldn't load your work logs. Please try again."
              >
                <UserWorkLogs />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        /> */}
        {/* User-specific routes */}
        <Route path="/my-projects" element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <UserProjectList />
          </ProtectedRoute>
        } />
        <Route path="/my-projects/:id" element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <UserProjectDetails />
          </ProtectedRoute>
        } />
        {/* <Route path="/my-picked-projects/:id" element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <UserPickedProjectDetails />
            </ProtectedRoute>
          } /> */}

        {/* "ACCOUNT", "ADMIN" */}

        <Route path="/projects/create" element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN"]}>
            <CreateProject />
          </ProtectedRoute>
        } />
        {/* Common routes*/}
        <Route path="/daily-logs" element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN"]}>
            <DailyLogs />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN"]}>
            <SettingsComponent />
          </ProtectedRoute>
        } />

        {/* Admin only routes */}
        {/* <Route path="/contractors" element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN"]}>
            <ContractorList />
          </ProtectedRoute>
        } />
        <Route path="/extensions" element={
          <ProtectedRoute allowedRoles={["ACCOUNT", "ADMIN"]}>
            <ExtensionApproval />
          </ProtectedRoute>
        } /> */}



        {/* {tl routes} */}
        <Route path="/tl-projects" element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <TlProjectList />
          </ProtectedRoute>
        } />

        {/* <Route path="/settings" element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <SettingsComponent />
          </ProtectedRoute>
        } /> */}

        <Route path="/submitted-task" element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <SubmittedTasks />
          </ProtectedRoute>
        } />

        <Route path="/employee-report" element={
          <ProtectedRoute allowedRoles={["TL"]}>
            <EmployeeReport />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}