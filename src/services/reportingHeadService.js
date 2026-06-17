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

};