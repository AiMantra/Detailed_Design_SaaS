// store/ticketSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";
import { showSuccess, showError } from "../../utils/toast";

// Helper functions
const getEmpCode = () => sessionStorage.getItem('emp_code') || null;
const getEmail = () => sessionStorage.getItem('userEmail') || null;

// ==================== ASYNC THUNKS ====================

// Fetch all tickets (Raised Tickets - Admin view)
export const fetchAllTickets = createAsyncThunk(
    'tickets/fetchAll',
    async ({ status = null, priority = null, page = 1, limit = 10 } = {}, { rejectWithValue }) => {
        try {
            let url = '/ticket/';
            if (status && status !== 'null') {
                url = `/ticket_by_status/${status}/`;
            }
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to fetch tickets');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch my tickets (User view)
export const fetchMyTickets = createAsyncThunk(
    'tickets/fetchMy',
    async (status = 'null', { rejectWithValue }) => {
        try {
            const email = getEmail();
            if (!email) {
                throw new Error('User not authenticated');
            }
            const response = await api.get(`/ticket-assigned-by/${email}/${status}/`);
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to fetch your tickets');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch single ticket
export const fetchTicketById = createAsyncThunk(
    'tickets/fetchOne',
    async (ticketId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/ticket/${ticketId}/`);
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to fetch ticket details');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Fetch ticket chat
export const fetchTicketChat = createAsyncThunk(
    'tickets/fetchChat',
    async (ticketId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/ticketChat-by-ticket/${ticketId}/`);
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to fetch chat history');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Create ticket
export const createTicket = createAsyncThunk(
    'tickets/create',
    async (ticketData, { rejectWithValue }) => {
        try {
            let response;
            if (ticketData instanceof FormData) {
                response = await api.post('/ticket/', ticketData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await api.post('/ticket/', ticketData);
            }
            showSuccess('Ticket created successfully!');
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to create ticket');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Close ticket
export const closeTicket = createAsyncThunk(
    'tickets/close',
    async ({ id, remark, isRaisedTicket = false }, { rejectWithValue }) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.put(`/ticket/${id}/`, {
                is_resolved: true,
                close_by: getEmail(),
                close_datetime: today,
                status: 'completed',
                remark: remark
            });
            showSuccess('Ticket closed successfully!');
            return { data: response.data, isRaisedTicket };
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to close ticket');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Delete ticket
export const deleteTicket = createAsyncThunk(
    'tickets/delete',
    async ({ id, isRaisedTicket = false }, { rejectWithValue }) => {
        try {
            await api.delete(`/ticket/${id}/`);
            showSuccess('Ticket deleted successfully!');
            return { id, isRaisedTicket };
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to delete ticket');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// Add chat message
export const addChatMessage = createAsyncThunk(
    'tickets/addChat',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('/ticketChat/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showSuccess('Message sent!');
            return response.data;
        } catch (error) {
            showError(error.response?.data?.message || 'Failed to send message');
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ==================== INITIAL STATE ====================

const initialState = {
    // My Tickets state
    myTickets: [],
    filteredMyTickets: [],
    myTicketsStats: {
        total: 0,
        pending: 0,
        completed: 0,
        byPriority: {
            high: 0,
            medium: 0,
            low: 0
        }
    },

    // Raised Tickets state (Admin view)
    raisedTickets: [],
    filteredRaisedTickets: [],
    raisedTicketsStats: {
        total: 0,
        pending: 0,
        completed: 0,
        byPriority: {
            high: 0,
            medium: 0,
            low: 0
        }
    },

    // Common state
    currentTicket: null,
    ticketChat: [],
    statusList: [],
    priorityList: [],
    loading: false,
    updating: false,
    error: null,

    // Pagination for raised tickets
    pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    },

    // Current view ( 'my' or 'raised' )
    currentView: 'my',

    // Selected status filter
    selectedStatus: 'null'
};

// ==================== SLICE ====================

const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {
        clearTicketError: (state) => {
            state.error = null;
        },

        setCurrentView: (state, action) => {
            state.currentView = action.payload;
        },

        setSelectedStatus: (state, action) => {
            state.selectedStatus = action.payload;
        },

        clearSelectedStatus: (state) => {
            state.selectedStatus = 'null';
        },

        calculateMyTicketsStats: (state) => {
            const tickets = state.filteredMyTickets;
            state.myTicketsStats = {
                total: tickets.length,
                pending: tickets.filter(t => t.status === 'pending').length,
                completed: tickets.filter(t => t.status === 'completed').length,
                byPriority: {
                    high: tickets.filter(t => t.priority === 1).length,
                    medium: tickets.filter(t => t.priority === 2).length,
                    low: tickets.filter(t => t.priority === 3).length
                }
            };
        },

        calculateRaisedTicketsStats: (state) => {
            const tickets = state.filteredRaisedTickets;
            state.raisedTicketsStats = {
                total: tickets.length,
                pending: tickets.filter(t => t.status === 'pending').length,
                completed: tickets.filter(t => t.status === 'completed').length,
                byPriority: {
                    high: tickets.filter(t => t.priority === 1).length,
                    medium: tickets.filter(t => t.priority === 2).length,
                    low: tickets.filter(t => t.priority === 3).length
                }
            };
        },

        filterMyTickets: (state, action) => {
            const { searchTerm, startDate, endDate } = action.payload;
            let filtered = [...state.myTickets];

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(ticket =>
                    ticket.title?.toLowerCase().includes(term) ||
                    ticket.description?.toLowerCase().includes(term)
                );
            }

            if (startDate) {
                filtered = filtered.filter(ticket =>
                    new Date(ticket.assign_date) >= new Date(startDate)
                );
            }

            if (endDate) {
                filtered = filtered.filter(ticket =>
                    new Date(ticket.assign_date) <= new Date(endDate)
                );
            }

            state.filteredMyTickets = filtered;
            ticketSlice.caseReducers.calculateMyTicketsStats(state);
        },

        filterRaisedTickets: (state, action) => {
            const { searchTerm, startDate, endDate } = action.payload;
            let filtered = [...state.raisedTickets];

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(ticket =>
                    ticket.title?.toLowerCase().includes(term) ||
                    ticket.description?.toLowerCase().includes(term) ||
                    ticket.assigned_by_name?.toLowerCase().includes(term) ||
                    ticket.assigned_by?.toLowerCase().includes(term)
                );
            }

            if (startDate) {
                filtered = filtered.filter(ticket =>
                    new Date(ticket.assign_date) >= new Date(startDate)
                );
            }

            if (endDate) {
                filtered = filtered.filter(ticket =>
                    new Date(ticket.assign_date) <= new Date(endDate)
                );
            }

            state.filteredRaisedTickets = filtered;
            ticketSlice.caseReducers.calculateRaisedTicketsStats(state);
        },

        resetFilters: (state) => {
            state.filteredMyTickets = [...state.myTickets];
            state.filteredRaisedTickets = [...state.raisedTickets];
            ticketSlice.caseReducers.calculateMyTicketsStats(state);
            ticketSlice.caseReducers.calculateRaisedTicketsStats(state);
        }
    },

    extraReducers: (builder) => {
        builder
            // Fetch All Tickets (Raised Tickets)
            .addCase(fetchAllTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.raisedTickets = action.payload || [];
                state.filteredRaisedTickets = action.payload || [];
                ticketSlice.caseReducers.calculateRaisedTicketsStats(state);

                // Extract unique statuses and priorities
                const uniqueStatuses = [...new Set(action.payload.map(ticket => ticket.status))];
                const uniquePriorities = [...new Set(action.payload.map(ticket => ticket.priority))];
                state.statusList = uniqueStatuses;
                state.priorityList = uniquePriorities;
            })
            .addCase(fetchAllTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch My Tickets
            .addCase(fetchMyTickets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyTickets.fulfilled, (state, action) => {
                state.loading = false;
                state.myTickets = action.payload || [];
                state.filteredMyTickets = action.payload || [];
                ticketSlice.caseReducers.calculateMyTicketsStats(state);
            })
            .addCase(fetchMyTickets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Ticket Chat
            .addCase(fetchTicketChat.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTicketChat.fulfilled, (state, action) => {
                state.loading = false;
                state.ticketChat = action.payload || [];
            })
            .addCase(fetchTicketChat.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Ticket
            .addCase(createTicket.pending, (state) => {
                state.updating = true;
            })
            .addCase(createTicket.fulfilled, (state, action) => {
                state.updating = false;
                // Add to my tickets (since user created it)
                state.myTickets.unshift(action.payload);
                state.filteredMyTickets.unshift(action.payload);
                ticketSlice.caseReducers.calculateMyTicketsStats(state);
            })
            .addCase(createTicket.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
            })

            // Close Ticket
            .addCase(closeTicket.pending, (state) => {
                state.updating = true;
            })
            .addCase(closeTicket.fulfilled, (state, action) => {
                state.updating = false;
                const { data, isRaisedTicket } = action.payload;

                if (isRaisedTicket) {
                    const index = state.raisedTickets.findIndex(t => t.id === data.id);
                    if (index !== -1) {
                        state.raisedTickets[index] = data;
                        const filteredIndex = state.filteredRaisedTickets.findIndex(t => t.id === data.id);
                        if (filteredIndex !== -1) {
                            state.filteredRaisedTickets[filteredIndex] = data;
                        }
                    }
                    ticketSlice.caseReducers.calculateRaisedTicketsStats(state);
                } else {
                    const index = state.myTickets.findIndex(t => t.id === data.id);
                    if (index !== -1) {
                        state.myTickets[index] = data;
                        const filteredIndex = state.filteredMyTickets.findIndex(t => t.id === data.id);
                        if (filteredIndex !== -1) {
                            state.filteredMyTickets[filteredIndex] = data;
                        }
                    }
                    ticketSlice.caseReducers.calculateMyTicketsStats(state);
                }
            })
            .addCase(closeTicket.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
            })

            // Delete Ticket
            .addCase(deleteTicket.pending, (state) => {
                state.updating = true;
            })
            .addCase(deleteTicket.fulfilled, (state, action) => {
                state.updating = false;
                const { id, isRaisedTicket } = action.payload;

                if (isRaisedTicket) {
                    state.raisedTickets = state.raisedTickets.filter(t => t.id !== id);
                    state.filteredRaisedTickets = state.filteredRaisedTickets.filter(t => t.id !== id);
                    ticketSlice.caseReducers.calculateRaisedTicketsStats(state);
                } else {
                    state.myTickets = state.myTickets.filter(t => t.id !== id);
                    state.filteredMyTickets = state.filteredMyTickets.filter(t => t.id !== id);
                    ticketSlice.caseReducers.calculateMyTicketsStats(state);
                }
            })
            .addCase(deleteTicket.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
            })

            // Add Chat Message
            .addCase(addChatMessage.fulfilled, (state, action) => {
                state.ticketChat.push(action.payload);
            });
    }
});

// ==================== EXPORTS ====================

export const {
    clearTicketError,
    setCurrentView,
    setSelectedStatus,
    clearSelectedStatus,
    calculateMyTicketsStats,
    calculateRaisedTicketsStats,
    filterMyTickets,
    filterRaisedTickets,
    resetFilters
} = ticketSlice.actions;

export default ticketSlice.reducer;