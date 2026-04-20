import axios from 'axios';

// const BASE_URL = 'https://ksncfd6v-8007.inc1.devtunnels.ms';
// const BASE_URL = 'https://139.59.23.48';

// const BASE_URL = 'https://staging.aimantra.info';

// Prod server
const BASE_URL = 'https://dd.aimantra.info';
const API_PREFIX = '/detaildesign';

const api = axios.create({
  baseURL: BASE_URL + API_PREFIX,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    
    
    const token = localStorage.getItem('authToken');
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
        
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          window.location.href = '/';
          return Promise.reject(error);
        }
        
  
        const authApi = (await import('./authApi')).default;
        const response = await authApi.post('/user/token/refresh/', {
          refresh: refreshToken
        });
        
        if (response.data.access) {
          
          localStorage.setItem('authToken', response.data.access);
          
          
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;