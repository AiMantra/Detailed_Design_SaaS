import api from './api';

export const stagesTemplateService = {

  getStageTemplates: async () => {
    try {
      const response = await api.get('/activity-template/');
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },


  getStageTemplate: async (activityId) => {
    try {
      const response = await api.get(`/activity-template/${activityId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity:', error);
      throw error;
    }
  },


  createStageTemplate: async (stageTemplateData) => {
    try {
      const payload = Array.isArray(stageTemplateData) ? stageTemplateData : [stageTemplateData];
      const response = await api.post('/activity-template/', payload);
      return Array.isArray(response.data) ? response.data[0] : response.data; // Doubt : why 1st item of list 
    } catch (error) {
      console.error('Error creating activity template:', error);
      throw error;
    }
  },

  createOnlyStageTemplate: async (stageTemplateData) => {
    try {
      const payload = Array.isArray(stageTemplateData) ? stageTemplateData : [stageTemplateData];
      const response = await api.post('/activityonlycreatetemplate/', payload);
      return Array.isArray(response.data) ? response.data[0] : response.data; // Doubt : why 1st item of list 
    } catch (error) {
      console.error('Error creating activity template:', error);
      throw error;
    }
  },

  createStageTemplatesBulk: async (stageTemplateData) => {
    try {
      const payload = Array.isArray(stageTemplateData) ? stageTemplateData : [stageTemplateData];
      const response = await api.post('/activity-template/', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk activity templates:', error);
      throw error;
    }
  },

  updateStageTemplate: async (stageTemplateId, stageTemplateData) => {
    try {
      const response = await api.put(`/activity/${stageTemplateId}/`, stageTemplateData);
      return response.data;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },


  deleteStageTemplate: async (stageTemplateId) => {
    try {
      const response = await api.delete(`/activity/${stageTemplateId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  deleteStageTemplate: async (stageTemplateId) => {
    try {
      const response = await api.delete(`/activity/${stageTemplateId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  deleteStageTemplate: async (stageTemplateId) => {
    try {
      const response = await api.delete(`/activity/${stageTemplateId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },


};