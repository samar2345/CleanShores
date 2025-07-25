// client/src/api/groups.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class GroupService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    _getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * Fetches all public groups from the backend.
     * Accessible by any logged-in user.
     * @param {object} [filters={}] - Optional filters like { search: 'community' }.
     * @returns {Promise<object[]>} An array of group objects.
     */
    async getAllGroups(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await this.api.get(`/groups?${params}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("GroupService getAllGroups error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches details for a single group by its ID.
     * Accessible by any logged-in user (if they are a member or group is public).
     * @param {string} groupId - The ID of the group to fetch.
     * @returns {Promise<object>} The group object.
     */
    async getGroupById(groupId) {
        try {
            const response = await this.api.get(`/groups/${groupId}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("GroupService getGroupById error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches historical messages for a specific group.
     * Accessible by group members only.
     * @param {string} groupId - The ID of the group.
     * @returns {Promise<object[]>} An array of message objects.
     */
    async getGroupMessages(groupId) {
        try {
            const response = await this.api.get(`/groups/${groupId}/messages`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("GroupService getGroupMessages error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Allows a user to join a specific group.
     * @param {string} groupId - The ID of the group to join.
     * @returns {Promise<object>} The updated group object.
     */
    async joinGroup(groupId) {
        try {
            const response = await this.api.post(`/groups/${groupId}/join`, {}, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("GroupService joinGroup error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Allows a user to leave a specific group.
     * @param {string} groupId - The ID of the group to leave.
     * @returns {Promise<object>} The updated group object.
     */
    async leaveGroup(groupId) {
        try {
            const response = await this.api.post(`/groups/${groupId}/leave`, {}, { headers: this._getAuthHeaders() }); // Using POST as per backend
            return response.data.data;
        } catch (error) {
            console.error("GroupService leaveGroup error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
}

const groupService = new GroupService();
export default groupService;