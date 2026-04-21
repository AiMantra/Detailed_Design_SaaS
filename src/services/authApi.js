
import axios from 'axios';


let AUTH_BASE_URL = import.meta.env.VITE_BASE_URL;


const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});


authApi.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Auth API Error:', error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

export default authApi;