//This new API service will handle all calls to the backend's api/v1/admin and api/v1/analytics endpoints.

// client/src/api/admin.js
// client/src/api/admin.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class AdminService {
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
     * Fetches a list of all admin accounts that are currently pending verification.
     * Accessible by NGO roles.
     * @returns {Promise<object[]>} An array of pending admin user objects.
     */
    async getPendingAdmins() {
        try {
            const response = await this.api.get('/admin/pending-admins', { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService getPendingAdmins error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Approves or rejects a pending admin registration.
     * Accessible by NGO roles.
     * @param {string} adminId - The ID of the admin to approve/reject.
     * @param {string} status - 'active' to approve, 'rejected' to reject.
     * @param {string} [reason] - Optional reason for rejection.
     * @returns {Promise<object>} The updated admin user object.
     */
    async approveRejectAdmin(adminId, status, reason = '') {
        try {
            const response = await this.api.patch(`/admin/approve-reject-admin/${adminId}`, { status, reason }, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService approveRejectAdmin error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches all user accounts (users, admins, NGOs) on the platform.
     * Accessible by NGO roles.
     * @param {object} [filters={}] - Optional filters like { role: 'user', status: 'active', search: 'john' }.
     * @returns {Promise<object[]>} An array of user objects.
     */
    async getAllUsers(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await this.api.get(`/admin/users?${params}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService getAllUsers error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Updates a user's role.
     * Accessible by NGO roles.
     * @param {string} userId - The ID of the user to update.
     * @param {string} role - The new role ('user', 'admin', 'ngo').
     * @returns {Promise<object>} The updated user object.
     */
    async updateUserRole(userId, role) {
        try {
            const response = await this.api.patch(`/admin/users/${userId}/role`, { role }, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService updateUserRole error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Updates a user's account status (deactivate/reactivate).
     * Accessible by NGO roles.
     * @param {string} userId - The ID of the user to update.
     * @param {string} status - 'user_active' to reactivate, 'deactivated' to deactivate.
     * @param {string} [reason] - Optional reason for deactivation.
     * @returns {Promise<object>} The updated user object.
     */
    async updateUserAccountStatus(userId, status, reason = '') {
        try {
            const response = await this.api.patch(`/admin/users/${userId}/status`, { status, reason }, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService updateUserAccountStatus error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches overall platform statistics.
     * Accessible by Admin or NGO roles.
     * @returns {Promise<object>} An object with platform overview statistics.
     */
    async getPlatformOverview() {
        try {
            const response = await this.api.get('/admin/analytics/overview', { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService getPlatformOverview error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches the leaderboard of users by gamification points.
     * Accessible by any logged-in user.
     * @returns {Promise<object[]>} An array of top user objects.
     */
    async getUserLeaderboard() {
        try {
            const response = await this.api.get('/admin/analytics/leaderboard/users', { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService getUserLeaderboard error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches the leaderboard of admins by their calculated trust score.
     * Accessible by Admin or NGO roles.
     * @returns {Promise<object[]>} An array of admin performance objects.
     */
    async getAdminLeaderboard() {
        try {
            const response = await this.api.get('/admin/analytics/leaderboard/admins', { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("AdminService getAdminLeaderboard error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }
}

const adminService = new AdminService();
export default adminService;