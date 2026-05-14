import api from './api';

export const clientService = {

  getClients: async (is_deleted = false) => {
    try {
      const response = await api.get(`/client/?is_deleted=${is_deleted}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },


  getClient: async (clientId) => {
    try {
      const response = await api.get(`/client/${clientId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },


  createClient: async (clientData) => {
    try {
      const response = await api.post('/client/', clientData);
      return response.data;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },


  updateClient: async (clientId, clientData) => {
    try {
      const response = await api.put(`/client/${clientId}/`, clientData);
      return response.data;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },


  deleteClient: async (clientId, DeleteBY) => {
    const payload = {
      deleted_by: DeleteBY
    }
    try {
      const response = await api.delete(`/client/${clientId}/`, {
        data: payload
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },
};