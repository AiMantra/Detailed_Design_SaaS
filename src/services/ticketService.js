import api from "../../services/api";

const ticketService = {
    // Get all tickets with filters
    getAllTickets: async (params = {}) => {
        const { status, priority, page, limit } = params;
        let url = "/ticket/";

        if (status && status !== "null") {
            url = `/ticket_by_status/${status}/`;
        }

        const response = await api.get(url);
        return response.data;
    },

    // Get tickets assigned to specific user
    getMyTickets: async (email, status = "null") => {
        const response = await api.get(`/ticket-assigned-by/${email}/${status}/`);
        return response.data;
    },

    // Get single ticket details
    getTicketById: async (id) => {
        const response = await api.get(`/ticket/${id}/`);
        return response.data;
    },

    // Get ticket chat history
    getTicketChat: async (ticketId) => {
        const response = await api.get(`/ticketChat-by-ticket/${ticketId}/`);
        return response.data;
    },

    // Create new ticket
    createTicket: async (ticketData) => {
        const response = await api.post("/ticket/", ticketData);
        return response.data;
    },

    // Create ticket with document
    createTicketWithDocument: async (formData) => {
        const response = await api.post("/ticket/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // Update ticket
    updateTicket: async (id, ticketData) => {
        const response = await api.put(`/ticket/${id}/`, ticketData);
        return response.data;
    },

    // Delete ticket
    deleteTicket: async (id) => {
        const response = await api.delete(`/ticket/${id}/`);
        return response.data;
    },

    // Close ticket
    closeTicket: async (id, remark) => {
        const today = new Date().toISOString().split("T")[0];
        const response = await api.put(`/ticket/${id}/`, {
            is_resolved: true,
            close_by: sessionStorage.getItem("email"),
            close_datetime: today,
            status: "completed",
            remark: remark,
        });
        return response.data;
    },

    // Add chat message
    addChatMessage: async (chatData) => {
        const response = await api.post("/ticketChat/", chatData);
        return response.data;
    },
};

export default ticketService;