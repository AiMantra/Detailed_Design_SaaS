import api from './api';
// Note: Adjust these import paths to match exactly where your 
// API_BASE_URL and getAxiosConfig are located in your project.



export const taskPlannerService = {

    // GET: Fetch all task planners
    getTaskPlanners: async () => {
        try {
            // Note: Replace '/detaildesign/planner/' with your exact backend endpoint path
            const response = await api.get('/time-planer/');

            return response.data;
        } catch (error) {
            console.error('Error fetching task planners:', error);
            throw error; // Re-throw the error so the Redux thunk's rejectWithValue can catch it
        }
    },

    // GET: Fetch planners for a specific user (Optional, if your API supports it)
    // getUserTaskPlanners: async (userId) => {
    //   try {
    //     const response = await axios.get(
    //       `${API_BASE_URL}/detaildesign/planner/?user=${userId}`, 
    //       getAxiosConfig()
    //     );
    //     return response.data;
    //   } catch (error) {
    //     throw error;
    //   }
    // }

};