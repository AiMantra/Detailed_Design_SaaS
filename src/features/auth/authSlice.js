// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "../../services/authService";
import { showSuccess, showError, showLoading, dismissToast } from "../../utils/toast";

// Role mapping function - converts HRMS roles to app roles
const mapHRMSRoleToAppRole = (hrmsRole, additionalData = {}) => {
  if (!hrmsRole) {
    return 'USER';
  }

  const roleLower = hrmsRole.toLowerCase().trim();

  if (roleLower === 'account') {
    return 'ACCOUNT';
  }

  if (roleLower === 'reportinghead' || roleLower === "hod") {
    return 'TL';
  }

  if (roleLower.includes('user') || roleLower.includes('employee')) {
    return 'USER';
  }

  if (additionalData.sitemanagement_role) {
    const siteRole = additionalData.sitemanagement_role.toLowerCase();
    if (siteRole.includes('account')) return 'ACCOUNT';
    if (siteRole.includes('admin')) return 'ADMIN';
  }

  return 'USER';
};

// Async thunk for login 
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    const loadingToast = showLoading('Logging in...');

    try {
      const response = await authService.login(email, password);
      dismissToast(loadingToast);

      if (!response || !response.access) {
        throw new Error('Invalid response from server');
      }

      const { access, refresh, payload, employeecode, payload_a } = response;

      // Map the role from HRMS to app role
      const appRole = mapHRMSRoleToAppRole(payload?.role, payload_a);

      // Get user UUID - critical for time logs
      const userUUID = payload?.user_id || payload_a?.user_id || payload?.id || payload_a?.id || null;

      // Store in localStorage (persistent)
      localStorage.setItem('authToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userEmail', payload?.email || '');
      localStorage.setItem('userName', payload?.name || payload_a?.name || 'User');
      localStorage.setItem('userRole', appRole);
      localStorage.setItem('userOriginalRole', payload?.role || '');
      localStorage.setItem('emp_code', employeecode || payload_a?.emp_code || '');
      localStorage.setItem('user_uuid', userUUID || employeecode || payload_a?.emp_code || '');

      // Store session data in sessionStorage
      if (payload_a) {
        Object.entries({
          emp_code: employeecode || payload_a?.emp_code || '',
          department: payload_a?.department_name || '',
          department_id: payload_a?.department || '',
          rh: payload_a?.rh_name || payload_a?.reporting_head || '',
          is_rh: payload_a?.is_reporthead || false,
          profilepic: payload_a?.profilepic || '',
          company: payload_a?.division_name || '',
          company_id: payload_a?.sub_company_id || '',
          designation: payload_a?.designation_name || '',
          hrms_role: payload?.role || '',
          user_uuid: userUUID || payload_a?.user_id || '',
        }).forEach(([key, value]) => {
          if (value) {
            sessionStorage.setItem(key, String(value));
          }
        });
      }

      showSuccess(`Login successful! Welcome ${appRole}!`);

      return {
        user: {
          id: userUUID || employeecode || payload_a?.emp_code || '',
          user_uuid: userUUID,
          emp_code: employeecode || payload_a?.emp_code || '',
          email: payload?.email || '',
          name: payload?.name || payload_a?.name || 'User',
          role: appRole,
          originalRole: payload?.role || '',
          department: payload_a?.department_name || '',
          company: payload_a?.division_name || '',
          profilePic: payload_a?.profilepic || '',
          isReportingHead: payload_a?.is_reporthead || false,
          designation: payload_a?.designation_name || '',
        },
        token: access,
        refreshToken: refresh,
      };
    } catch (error) {
      dismissToast(loadingToast);

      let errorMessage = 'Login failed. Please check your credentials.';

      if (error.response) {
        errorMessage = error.response.data?.message ||
          error.response.data?.detail ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      } else {
        errorMessage = error.message || errorMessage;
      }

      console.error('Login error:', error);
      showError(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Check if user is already logged in (for page refresh)
const loadUserFromStorage = () => {
  try {
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');

    if (!token || !email) return null;

    return {
      user: {
        id: localStorage.getItem('user_uuid') || localStorage.getItem('emp_code') || '',
        user_uuid: localStorage.getItem('user_uuid') || '',
        emp_code: localStorage.getItem('emp_code') || '',
        email: email,
        name: localStorage.getItem('userName') || 'User',
        role: localStorage.getItem('userRole') || 'USER',
        originalRole: localStorage.getItem('userOriginalRole') || '',
        department: sessionStorage.getItem('department') || '',
        company: sessionStorage.getItem('company') || '',
        profilePic: sessionStorage.getItem('profilepic') || '',
        isReportingHead: sessionStorage.getItem('is_rh') === 'true',
        designation: sessionStorage.getItem('designation') || '',
      },
      token: token,
      refreshToken: localStorage.getItem('refreshToken'),
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Error loading user from storage:', error);
    localStorage.clear();
    sessionStorage.clear();
    return null;
  }
};

const initialState = loadUserFromStorage() || {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.clear();
      sessionStorage.clear();

      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    clearError: (state) => {
      state.error = null;
    },

    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };

        if (action.payload.name) localStorage.setItem('userName', action.payload.name);
        if (action.payload.profilePic) sessionStorage.setItem('profilepic', action.payload.profilePic);
        if (action.payload.role) localStorage.setItem('userRole', action.payload.role);
      }
    },

    refreshTokenSuccess: (state, action) => {
      state.token = action.payload.token;
      localStorage.setItem('authToken', action.payload.token);
    },

    setUserRole: (state, action) => {
      if (state.user) {
        state.user.role = action.payload.role;
        localStorage.setItem('userRole', action.payload.role);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });
  },
});

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;
export const selectUserUUID = (state) => state.auth.user?.user_uuid || localStorage.getItem('user_uuid');

export const { logout, clearError, updateUserProfile, refreshTokenSuccess, setUserRole } = authSlice.actions;
export default authSlice.reducer;