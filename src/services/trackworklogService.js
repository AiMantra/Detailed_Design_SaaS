
import api from './api';
import { createAsyncThunk } from '@reduxjs/toolkit';

// --- SERVICE ---
export const trackWorkLogService = {
  getTrackWorkLog: async (filters = {}) => {
    try {
      // Build query parameters dynamically
      const params = new URLSearchParams();
      if (filters.project_id) params.append('project_id', filters.project_id);
      if (filters.activity_id) params.append('activity_id', filters.activity_id);
      if (filters.subactivity_id) params.append('subactivity_id', filters.subactivity_id);

      // Append params to the new endpoint
      const url = `/rework-summary/?${params.toString()}`;
      const response = await api.get(url);
      
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};