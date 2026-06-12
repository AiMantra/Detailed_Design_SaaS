import api from './api';

export const trackWorkLogService = {
  getTrackWorkLog: async (subactivityId) => {
    try {
      const url = `/subactivity-detail/${subactivityId}/`;
      const response = await api.get(url);
      
      return response.data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};