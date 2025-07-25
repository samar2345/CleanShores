// App.jsx : authService.getCurrentUser(): We'll create this API service next. 
// It will call your backend's /api/v1/users/current-user endpoint.

// This file will encapsulate API calls related to authentication.

// client/src/api/auth.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL for /api/v1 endpoints

class AuthService {
    constructor() {
        // Create an Axios instance with a base URL for cleaner API calls
        this.api = axios.create({
            baseURL: API_BASE_URL,
            // You might add default headers here if needed, e.g., 'Content-Type': 'application/json'
        });
    }

    /**
     * Helper method to retrieve the JWT token from local storage and format it for Authorization header.
     * @returns {object} An object containing the Authorization header, or an empty object if no token.
     */
    _getAuthHeaders() {
        const token = localStorage.getItem('token'); // Retrieve token from local storage
        return token ? { Authorization: `Bearer ${token}` } : {}; // Format as Bearer token for API requests
    }

    /**
     * Registers a new regular user by sending user data and a profile picture file to the backend.
     * @param {FormData} userData - A FormData object containing user details (fullName, username, email, password) and the profile picture file.
     * @returns {Promise<object>} The response data from the backend. On success, it contains user data and tokens.
     */
    async registerUser(userData) {
        try {
            // Send POST request with FormData (Axios automatically sets Content-Type for FormData)
            const response = await this.api.post('/users/register/user', userData);
            
            // On successful registration, the backend immediately logs in the user and returns tokens/user data.
            // Store these credentials in local storage for session management.
            if (response.data.success) {
                localStorage.setItem('token', response.data.data.accessToken);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
            return response.data; // Return the full API response data
        } catch (error) {
            // Log the error details for debugging
            console.error("AuthService registerUser error:", error.response?.data || error.message);
            // Re-throw the backend's error message or a generic error for frontend display
            throw error.response?.data || error;
        }
    }

    /**
     * Registers a new admin by sending admin details and required document files to the backend.
     * Admin registration typically requires verification, so no token is returned immediately.
     * @param {FormData} adminData - A FormData object containing admin details and document files.
     * @returns {Promise<object>} The response data from the backend.
     */
    async registerAdmin(adminData) {
        try {
            const response = await this.api.post('/users/register/admin', adminData);
            return response.data; // Return the full API response data (e.g., success message, pending status)
        } catch (error) {
            console.error("AuthService registerAdmin error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Logs in an existing user with their email/username and password.
     * @param {string} email - The user's email or username.
     * @param {string} password - The user's password.
     * @returns {Promise<object>} On successful login, returns user data and authentication tokens.
     */
    async login(email, password) {
        try {
            const response = await this.api.post('/users/login', { email, password });
            // On successful login, store the received token and user data in local storage.
            if (response.data.success) {
                localStorage.setItem('token', response.data.data.accessToken);
                localStorage.setItem('user', JSON.stringify(response.data.data.user));
            }
            return response.data.data; // Return the data part of the API response (user and tokens)
        } catch (error) {
            console.error("AuthService login error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Logs out the current user by invalidating their session on the backend.
     * Clears authentication data from local storage.
     * @returns {Promise<boolean>} Resolves to true if logout process is successful.
     */
    async logout() {
        try {
            // Send POST request to the backend's logout endpoint with authorization header.
            await this.api.post('/users/logout', {}, { headers: this._getAuthHeaders() });
            // Clear all authentication-related data from local storage, regardless of backend response.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return true;
        } catch (error) {
            console.error("AuthService logout error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches the current authenticated user's data from the backend.
     * This is typically called on application load to validate an existing session (e.g., from stored token).
     * @returns {Promise<object|null>} Returns the user object if authenticated and data is found, otherwise returns null.
     */
    async getCurrentUser() {
        try {
            const token = localStorage.getItem('token');
            // If no token is found in local storage, assume no user is logged in.
            if (!token) return null;

            // Send GET request to fetch current user's profile with authorization header.
            const response = await this.api.get('/users/current-user', { headers: this._getAuthHeaders() });
            
            // If the API call is successful and returns valid user data.
            if (response.data.success && response.data.data) {
                // Update local storage in case user data (e.g., points, status) has changed on the backend.
                localStorage.setItem('user', JSON.stringify(response.data.data));
                return response.data.data; // Return the user object.
            }
            return null; // Return null if user data is not present in a successful response.
        } catch (error) {
            console.error("AuthService getCurrentUser error:", error.response?.data || error.message);
            // On API error (e.g., token expired, invalid, or server error),
            // clear local storage to ensure the client is in a logged-out state.
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null; // Return null to indicate failure to get current user.
        }
    }

    // You can add more authentication-related API calls here, such as changePassword, updateProfile, or refreshToken.
}

const authService = new AuthService(); // Create a singleton instance of the AuthService.
export default authService;