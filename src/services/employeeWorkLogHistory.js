import api from './api';
// Note: Adjust this import path to match exactly where your 
// api instance is located in your project.

export const employeeWorklogHistoryService = {
    getEmployeeWorklogs: async (filters = {}) => {
        try {
            let url = '/employee-worklogs/';
            const queryParams = new URLSearchParams();

            // Dynamically append filters if they exist
            if (filters.user_id) {
                queryParams.append('user_id', filters.user_id);
            }
            if (filters.start_date) {
                queryParams.append('start_date', filters.start_date);
            }
            if (filters.end_date) {
                queryParams.append('end_date', filters.end_date);
            }

            const queryString = queryParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await api.get(url);
            
            return response.data;

        } catch (error) {
            console.error("Error fetching employee worklog history:", error);
            throw error;
        }
    }
};