// src/services/authService.js
import { clearEncryptionKey } from '../utils/secureStorage';
import authApi from './authApi';

class AuthService {

  async login(email, password) {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      const response = await authApi.post('/user/login/', formData);
      return response.data;
    } catch (error) {
      console.error('Login service error:', error);
      throw error;
    }
  }


  async refreshToken(refreshToken) {
    try {
      const response = await authApi.post('/user/token/refresh/', {
        refresh: refreshToken
      });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      window.location.href = '/';
      sessionStorage.clear();
      clearEncryptionKey()
      throw error;
    }
  }


  logout() {
    clearEncryptionKey()
    // localStorage.clear();
    sessionStorage.clear();
  }


  getUserData() {
    return {
      token: sessionStorage.getItem('authToken'),
      refreshToken: sessionStorage.getItem('refreshToken'),
      email: sessionStorage.getItem('userEmail'),
      name: sessionStorage.getItem('userName'),
      role: sessionStorage.getItem('userRole'),
      empCode: sessionStorage.getItem('emp_code'),
      department: sessionStorage.getItem('department_name'),
      company: sessionStorage.getItem('company'),
    };
  }


  isAuthenticated() {
    return !!sessionStorage.getItem('authToken');
  }
}

export default new AuthService();