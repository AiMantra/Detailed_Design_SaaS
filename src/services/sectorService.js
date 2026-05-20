import api from './api';

export const sectorService = {

  getSectors: async (is_deleted = false) => {
    try {
      const response = await api.get(`/sector/?is_deleted=${is_deleted}`);
      // const response = await api.get('/sector/?is_deleted=null');
      return response.data;
    } catch (error) {
      console.error('Error fetching sectors:', error);
      throw error;
    }
  },


  getSector: async (sectorId) => {
    try {
      const response = await api.get(`/sector/${sectorId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sector:', error);
      throw error;
    }
  },


  createSector: async (sectorData) => {
    try {
      const response = await api.post('/sector/', sectorData);
      return response.data;
    } catch (error) {
      console.error('Error creating sector:', error);
      throw error;
    }
  },


  updateSector: async (sectorId, sectorData) => {
    try {
      const response = await api.put(`/sector/${sectorId}/`, sectorData);
      return response.data;
    } catch (error) {
      console.error('Error updating sector:', error);
      throw error;
    }
  },


  deleteSector: async (sectorId, DeleteBY) => {
    const payload = {
      deleted_by: DeleteBY
    }
    try {
      const response = await api.delete(`/sector/${sectorId}/`, {
        data: payload
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting sector:', error);
      throw error;
    }
  },
};