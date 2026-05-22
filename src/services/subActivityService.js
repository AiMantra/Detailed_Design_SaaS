import api from './api';


const UNIT_MAPPING = {
  'Km': 'Kilometer',
  'Nos.': 'Numbers',
  'Percentage': 'Percentage',
  'status': 'Percentage'
};


export const REVERSE_UNIT_MAPPING = {
  'Kilometer': 'Km',
  'Numbers': 'Nos.',
  'Percentage': 'Percentage'
};

export const subActivityService = {

  getSubActivities: async () => {
    try {
      const response = await api.get('/subactivity/');
      return response.data;
    } catch (error) {
      console.error('Error fetching sub activities:', error);
      throw error;
    }
  },


  getSubActivity: async (subactivityId) => {
    try {
      const response = await api.get(`/subactivity/${subactivityId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sub activity:', error);
      throw error;
    }
  },


  createSubActivity: async (subActivityData) => {
    try {

      const mappedData = Array.isArray(subActivityData)
        ? subActivityData.map(item => ({
          ...item,
          unit: UNIT_MAPPING[item.unit] || item.unit
        }))
        : {
          ...subActivityData,
          unit: UNIT_MAPPING[subActivityData.unit] || subActivityData.unit
        };

      const payload = Array.isArray(mappedData) ? mappedData : [mappedData];
      const response = await api.post('/subactivity/', payload);
      return Array.isArray(response.data) ? response.data[0] : response.data;
    } catch (error) {
      console.error('Error creating sub activity:', error);
      throw error;
    }
  },


  createSubActivitiesBulk: async (subActivitiesData) => {
    try {

      const mappedData = subActivitiesData.map(item => ({
        ...item,
        unit: UNIT_MAPPING[item.unit] || item.unit
      }));

      const payload = Array.isArray(mappedData) ? mappedData : [mappedData];
      const response = await api.post('/subactivity/', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating bulk sub activities:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      throw error;
    }
  },


  updateSubActivityProgress: async (subActivityId, progressData) => {
    try {
      const response = await api.put(`/subactivity/${subActivityId}/`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error updating sub-activity progress:', error);
      throw error;
    }
  },


  updateSubActivityStatus: async (subActivityId, statusData) => {
    try {
      const response = await api.put(`/subactivity/${subActivityId}/`, statusData);
      return response.data;
    } catch (error) {
      console.error('Error updating sub-activity status:', error);
      throw error;
    }
  },


  // updateSubActivity: async (subActivityId, subActivityData) => {
  //   try {
  //     // subactivity-submission/
  //     const response = await api.post(`subactivity-submission/`, subActivityData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error updating sub activity:', error);
  //     throw error;
  //   }
  // },


  deleteSubActivity: async (subactivityId) => {
    try {
      const response = await api.delete(`/subactivity/${subactivityId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting sub activity:', error);
      throw error;
    }
  },
};