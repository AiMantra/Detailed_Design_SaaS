import api from './api';
// Note: Adjust these import paths to match exactly where your 
// API_BASE_URL and getAxiosConfig are located in your project.



// taskPlannerService.js

export const taskPlannerService = {
    getTaskPlanners: async (user, activeTab, date) => {
        try {
            let url = "";

            const empCode = user?.emp_code;

            if (user?.role === "ACCOUNT" || user?.role === "ADMIN") {
                if (activeTab === "My Tasks") {
                    url = `/tl-planner-report/?emp_code=${empCode}&date=${date}`;
                } else if (activeTab === "TL Tasks") {
                    url = `/tl-planner-report/?tl_code=null&emp_code=null&date=${date}`;
                } else {
                    url = `/tl-planner-report/?tl_code=null&emp_code=null&date=${date}`;
                }
            }

            else if (user?.role === "TL") {
                if (activeTab === "My Tasks") {
                    url = `/tl-planner-report/?emp_code=${empCode}&date=${date}`;
                } else {
                    url = `/tl-planner-report/?tl_code=${empCode}&date=${date}`;
                }
            }

            else {
                url = `/tl-planner-report/?emp_code=${empCode}&date=${date}`;
            }

            const response = await api.get(url);

            return response.data;

        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};

