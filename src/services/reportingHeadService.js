import api from './api';

export const reportingHeadService = {

    getReportingHeads: async () => {
        try {
            // const response = await api.get('https://cipl.aimantra.info/wfm/ourcompanyuserlessdetail/null/null/');
            const response = await api.get('https://hrms.aimantra.info/wfm/rhlistactive/null/active/');
            return response.data;
        } catch (error) {
            console.error('Error fetching clients:', error);
            throw error;
        }
    },

    getCompanyEmployeesActive: async () => {
        try {
            const response = await api.get('https://hrms.aimantra.info/wfm/ourcompanyempdetailsactive/');
            const data = response.data;
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.results)
                    ? data.results
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];
            return list.map((e) => ({
                ...e,
                emp_code: e.emp_code || e.employeecode || e.employee_code,
                name: e.name || e.emp_name || e.employee_name,
                profilepic: e.profilepic || e.profile_pic,
                id: e.id || e.emp_code || e.employeecode || e.employee_code,
            }));
        } catch (error) {
            console.error('Error fetching company employees:', error);
            throw error;
        }
    },

};