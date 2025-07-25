// Goal: Create an API service for event-related backend calls, and 
// implement the Events.jsx component to fetch and display a list of events.

// client/src/api/events.js
// client/src/api/events.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class EventService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    // Helper to get token for authenticated requests
    _getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * Fetches a list of events from the backend.
     * Can filter by status (upcoming, active, completed, cancelled) and adminId.
     * Requires authentication on backend.
     * @param {object} [filters={}] - Object containing filter properties like { status: 'upcoming', adminId: 'some_id' }.
     * @returns {Promise<object[]>} An array of event objects.
     */
    async getAllEvents(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await this.api.get(`/events?${params}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService getAllEvents error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches details for a single event by its ID.
     * Requires authentication on backend.
     * @param {string} eventId - The ID of the event to fetch.
     * @returns {Promise<object>} The event object.
     */
    async getEventById(eventId) {
        try {
            const response = await this.api.get(`/events/${eventId}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService getEventById error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Creates a new event.
     * Protected (Admin only).
     * @param {object} eventData - The data for the new event.
     * @returns {Promise<object>} The created event object.
     */
    async createEvent(eventData) {
        try {
            const response = await this.api.post('/events', eventData, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService createEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Updates an existing event by its ID.
     * Protected (Admin only, and only for events they created and are not completed/cancelled).
     * @param {string} eventId - The ID of the event to update.
     * @param {object} eventData - The data to update the event with.
     * @returns {Promise<object>} The updated event object.
     */
    async updateEvent(eventId, eventData) {
        try {
            const response = await this.api.put(`/events/${eventId}`, eventData, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService updateEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Deletes an event.
     * Protected (Admin or NGO).
     * @param {string} eventId - The ID of the event to delete.
     * @returns {Promise<boolean>} True if successful.
     */
    async deleteEvent(eventId) {
        try {
            await this.api.delete(`/events/${eventId}`, { headers: this._getAuthHeaders() });
            return true;
        } catch (error) {
            console.error("EventService deleteEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Allows a user to enroll in an event.
     * Protected (User or Admin).
     * @param {string} eventId - The ID of the event to enroll in.
     * @returns {Promise<object>} The updated event object.
     */
    async enrollInEvent(eventId) {
        try {
            const response = await this.api.post(`/events/${eventId}/enroll`, {}, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService enrollInEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Allows a user to leave an event.
     * Protected (User or Admin).
     * @param {string} eventId - The ID of the event to leave.
     * @returns {Promise<object>} The updated event object.
     */
    async leaveEvent(eventId) {
        try {
            const response = await this.api.delete(`/events/${eventId}/enroll`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService leaveEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Marks attendance for an event using QR code and location.
     * Protected (User or Admin).
     * @param {string} qrData - JSON string from QR code.
     * @param {number} userLatitude - User's current latitude.
     * @param {number} userLongitude - User's current longitude.
     * @returns {Promise<object>} Attendance record and updated user points.
     */
    async scanQrForAttendance(qrData, userLatitude, userLongitude) {
        try {
            const response = await this.api.post('/attendance/scan-qr', { qrData, userLatitude, userLongitude }, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService scanQrForAttendance error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches attendance records for a specific event.
     * Protected (Admin or NGO).
     * @param {string} eventId - The ID of the event.
     * @returns {Promise<object[]>} Array of attendance records.
     */
    async getEventAttendance(eventId) {
        try {
            const response = await this.api.get(`/attendance/events/${eventId}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService getEventAttendance error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches all attendance records platform-wide.
     * Protected (NGO only).
     * @param {object} [filters={}] - Optional filters.
     * @returns {Promise<object[]>} Array of all attendance records.
     */
    async getAllAttendance(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await this.api.get(`/attendance?${params}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService getAllAttendance error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Submits event completion details (waste collected, summary).
     * Protected (Admin only).
     * @param {string} eventId - The ID of the event.
     * @param {object} details - Waste metrics and summary.
     * @returns {Promise<object>} Updated event.
     */
    async submitEventCompletionDetails(eventId, details) {
        try {
            const response = await this.api.patch(`/events/${eventId}/complete-details`, details, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService submitEventCompletionDetails error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Refreshes the QR code for an event.
     * Protected (Admin only).
     * @param {string} eventId - The ID of the event.
     * @returns {Promise<object>} New QR code data.
     */
    async refreshEventQrCode(eventId) {
        try {
            const response = await this.api.patch(`/events/${eventId}/refresh-qr`, {}, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService refreshEventQrCode error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
}

const eventService = new EventService();
export default eventService;