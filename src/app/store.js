// import { configureStore } from "@reduxjs/toolkit";
// import uiReducer from "../features/ui/uiSlice";
// import authReducer from "../features/auth/authSlice";
// import notificationReducer from "../features/notifications/notificationSlice";
// import projectReducer from "../features/projects/projectSlice";

// export const store = configureStore({
//   reducer: {
//     ui: uiReducer,
//     auth: authReducer,
//     notification: notificationReducer,
//     projects: projectReducer
//   },
// });

import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "../features/ui/uiSlice";
import authReducer from "../features/auth/authSlice";
import notificationReducer from "../features/notifications/notificationSlice";
import projectReducer from "../features/projects/projectSlice";
import apiReducer from "../features/api/apiSlice";
import logReducer from '../features/dailyLogs/logSlice';
import tasksReducer from '../features/tasks/taskSlice';
import ticketReducer from "../features/ticketsManagement/ticketslice"
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    notification: notificationReducer,
    projects: projectReducer,
    api: apiReducer,
    logs: logReducer,
    tasks: tasksReducer,
    tickets: ticketReducer,
  },
});