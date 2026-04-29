import { createSlice } from "@reduxjs/toolkit";
import { readStoredTheme, THEME_STORAGE_KEY } from "../../utils/theme";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: false,
    desktopCollapsed:
      sessionStorage.getItem("desktopCollapsed") === "false",
    theme: readStoredTheme(),
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },

    toggleDesktopCollapse: (state) => {
      state.desktopCollapsed = !state.desktopCollapsed;
      sessionStorage.setItem(
        "desktopCollapsed",
        state.desktopCollapsed
      );
    },

    setTheme: (state, action) => {
      const next = action.payload;
      if (next === "light" || next === "dark" || next === "system") {
        state.theme = next;
        sessionStorage.setItem(THEME_STORAGE_KEY, next);
      }
    },
  },
});

export const {
  toggleSidebar,
  closeSidebar,
  toggleDesktopCollapse,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;