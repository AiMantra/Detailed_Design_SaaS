import axios from 'axios';

// Prod server
const BASE_URL = import.meta.env.VITE_BASE_URL;
const BASE_URL2 = import.meta.env.VITE_BASE_URL2;
export const IMAGE_URL = "https://cipl-aimantra.s3.ap-south-1.amazonaws.com/";
// const IMAGE_URL = import.meta.env.VITE_IMAGE_URL;
const API_PREFIX = '/detaildesign';
const API_PREFIX_HRMS = '/wfm';
const API_PREFIX_TICKET = '/ticket'

// Function to get dynamic base URL based on current path
const getDynamicBaseURL = () => {
  const currentPath = window.location.pathname;

  // If URL contains '/ticket', use BASE_URL2
  if (currentPath.includes('/ticket')) {
    return BASE_URL2 + API_PREFIX_TICKET;
  }

  // Otherwise use BASE_URL with API_PREFIX
  return BASE_URL + API_PREFIX;
};

const api = axios.create({
  baseURL: getDynamicBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Update baseURL dynamically before each request
    config.baseURL = getDynamicBaseURL();

    const token = sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found for API request');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.response?.data);

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = sessionStorage.getItem('refreshToken');

        if (!refreshToken) {
          window.location.href = '/';
          return Promise.reject(error);
        }

        const authApi = (await import('./authApi')).default;
        const response = await authApi.post('/user/token/refresh/', {
          refresh: refreshToken
        });

        if (response.data.access) {
          sessionStorage.setItem('authToken', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/';
        sessionStorage.clear();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;