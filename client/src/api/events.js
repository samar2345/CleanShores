// Goal: Create an API service for event-related backend calls, and 
// implement the Events.jsx component to fetch and display a list of events.

// client/src/api/events.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class EventService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    _getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

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

    // Add createEvent method as we will need it soon for Admins
    async createEvent(eventData) {
        try {
            const response = await this.api.post('/events', eventData, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EventService createEvent error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
}

const eventService = new EventService();
export default eventService;