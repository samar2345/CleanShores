// App.jsx : authService.getCurrentUser(): We'll create this API service next. 
// It will call your backend's /api/v1/users/current-user endpoint.

// This file will encapsulate API calls related to authentication.

// client/src/api/auth.js
// client/src/api/auth.js
// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

// class AuthService {
//     constructor() {
//         // Create an Axios instance.
//         this.api = axios.create({
//             baseURL: API_BASE_URL,
//             // CRITICAL: This ensures cookies (including HttpOnly ones) are sent with every cross-origin request.
//             withCredentials: true, 
//         });

//         // OPTIONAL: Add an interceptor to log out users automatically on 401 errors.
//         // This is a good practice for maintaining consistent auth state.
//         this.api.interceptors.response.use(
//             response => response, // Just return response normally
//             error => {
//                 // If the response is a 401 (Unauthorized), clear auth state client-side
//                 if (error.response && error.response.status === 401) {
//                     // Note: We don't dispatch Redux actions here because this is a service file.
//                     // The component calling this service will handle Redux dispatch (e.g., App.jsx).
//                     // We just clear local storage as a fallback.
//                     localStorage.removeItem('token'); // Clear any legacy tokens (if any were stored from non-HttpOnly methods)
//                     localStorage.removeItem('user'); // Clear user data
//                 }
//                 return Promise.reject(error); // Re-throw the error
//             }
//         );
//     }

//     // _getAuthHeaders() is now less relevant for HttpOnly cookie strategy:
//     // It's still here for completeness, but `withCredentials: true` is doing the work for cookies.
//     // If you had *other* tokens (e.g., API keys, non-HttpOnly JWTs in localStorage), you'd use this.
//     _getAuthHeaders() {
//         // For pure HttpOnly cookie strategy, this will always return an empty object or a legacy token if present.
//         // The Authorization header via JS is primarily for non-cookie token storage.
//         const token = localStorage.getItem('token'); 
//         return token ? { Authorization: `Bearer ${token}` } : {};
//     }

//     /**
//      * Registers a new regular user.
//      * Backend sets HttpOnly cookies upon successful registration (which includes auto-login).
//      * @param {FormData} userData - Form data including user details and profile picture.
//      * @returns {Promise<object>} Backend response.
//      */
//     async registerUser(userData) {
//         try {
//             const response = await this.api.post('/users/register/user', userData);
//             // Frontend components using this will update Redux state (via App.jsx's getCurrentUser call after redirect/load)
//             // No need to manually set localStorage.setItem('token') or 'user' here, as cookies handle it.
//             return response.data;
//         } catch (error) {
//             console.error("AuthService registerUser error:", error.response?.data || error.message);
//             throw error.response?.data || error;
//         }
//     }

//     /**
//      * Registers a new admin.
//      * Admin registration doesn't immediately log in or set tokens.
//      * @param {FormData} adminData - Form data including admin details and documents.
//      * @returns {Promise<object>} Backend response.
//      */
//     async registerAdmin(adminData) {
//         try {
//             const response = await this.api.post('/users/register/admin', adminData);
//             return response.data;
//         } catch (error) {
//             console.error("AuthService registerAdmin error:", error.response?.data || error.message);
//             throw error.response?.data || error;
//         }
//     }

//     /**
//      * Logs in a user. Backend sets HttpOnly cookies.
//      * @param {string} email - User's email or username.
//      * @param {string} password - User's password.
//      * @returns {Promise<object>} User data from backend.
//      */
//     async login(email, password) {
//         try {
//             const response = await this.api.post('/users/login', { email, password });
//             // Backend sets HttpOnly cookies. Frontend will rely on browser sending these automatically.
//             // We do NOT store token/user in localStorage here, as that's handled by cookies.
//             return response.data.data; // Return user data (NOT tokens, as they are in cookies)
//         } catch (error)
//             {console.error("AuthService login error:", error.response?.data || error.message);
//             throw error.response?.data || error;
//         }
//     }

//     /**
//      * Logs out the current user. Backend clears HttpOnly cookies.
//      * @returns {Promise<boolean>} True if logout successful.
//      */
//     async logout() {
//         try {
//             // Browser automatically sends HttpOnly cookies with this request due to `withCredentials: true`.
//             // Backend clears the cookies.
//             await this.api.post('/users/logout', {}); 
//             localStorage.removeItem('token'); // Clear any legacy/stale token from localStorage
//             localStorage.removeItem('user'); // Clear user data from localStorage
//             return true;
//         } catch (error) {
//             console.error("AuthService logout error:", error.response?.data || error.message);
//             throw error.response?.data || error;
//         }
//     }

//     /**
//      * Fetches current authenticated user's data. Relies on HttpOnly cookie being sent by browser.
//      * @returns {Promise<object|null>} User data if authenticated, null otherwise.
//      */
//     async getCurrentUser() {
//         try {
//             // Browser automatically sends HttpOnly cookies due to `withCredentials: true`.
//             // No need to manually add Authorization header from localStorage.
//             const response = await this.api.get('/users/current-user'); 

//             if (response.data.success && response.data.data) {
//                 // For consistency and Redux state population, store user data (excluding token) in localStorage.
//                 // This `user` object will be used by App.jsx to populate Redux.
//                 localStorage.setItem('user', JSON.stringify(response.data.data));
//                 return response.data.data;
//             }
//             // If API returns success but no user data (e.g., token invalid/expired, cleared by backend)
//             console.log("AuthService: getCurrentUser API no user data in successful response. Clearing localStorage.");
//             localStorage.removeItem('token');
//             localStorage.removeItem('user');
//             return null;
//         } catch (error) {
//             console.error("AuthService: getCurrentUser API error:", error.response?.data || error.message);
//             // On any error (network, 401 from server etc.), ensure local storage is cleared.
//             localStorage.removeItem('token');
//             localStorage.removeItem('user');
//             return null;
//         }
//     }
// }

// const authService = new AuthService();
// export default authService;

// client/src/api/auth.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            // CRITICAL: This ensures cookies (including HttpOnly ones) are sent with every cross-origin request.
            withCredentials: true, 
        });

        // Interceptor to automatically clear local storage on 401 errors.
        this.api.interceptors.response.use(
            response => response, 
            error => {
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token'); // Clear any legacy token
                    localStorage.removeItem('user'); // Clear user data
                }
                return Promise.reject(error);
            }
        );
    }

    // This helper now explicitly returns an empty object because we are relying solely on HttpOnly cookies.
    // The browser will automatically attach the cookies due to `withCredentials: true`.
    // We do NOT want to send an Authorization header from localStorage if the token is in HttpOnly cookie.
    _getAuthHeaders() {
        return {}; // Return empty object, let browser handle cookies
    }

    async registerUser(userData) {
        try {
            const response = await this.api.post('/users/register/user', userData);
            // After registerUser, backend will set HttpOnly cookies.
            return response.data;
        } catch (error) {
            console.error("AuthService registerUser error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    async registerAdmin(adminData) {
        try {
            const response = await this.api.post('/users/register/admin', adminData);
            return response.data;
        } catch (error) {
            console.error("AuthService registerAdmin error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    async login(email, password) {
        try {
            const response = await this.api.post('/users/login', { email, password });
            // Backend sets HttpOnly cookies. Frontend now solely relies on browser sending these.
            // Remove manual localStorage sets as they contradict HttpOnly strategy.
            // localStorage.setItem('token', response.data.data.accessToken); // REMOVE THIS LINE
            // localStorage.setItem('user', JSON.stringify(response.data.data.user)); // REMOVE THIS LINE
            return response.data.data;
        } catch (error) {
            console.error("AuthService login error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    async logout() {
        try {
            // Browser automatically sends HttpOnly cookies. Backend clears them.
            await this.api.post('/users/logout', {}); // No headers needed if relying on cookies
            // localStorage.removeItem('token'); // Keep this to clear any stale tokens from previous manual sets
            localStorage.removeItem('user'); // Keep this to clear user data from local storage
            return true;
        } catch (error) {
            console.error("AuthService logout error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    async getCurrentUser() {
        try {
            // Browser automatically sends HttpOnly cookies due to `withCredentials: true`.
            // We do NOT need to read token from localStorage or add Authorization header here.
            const response = await this.api.get('/users/current-user'); // No headers object passed

            if (response.data.success && response.data.data) {
                // Store user data (non-token parts) in localStorage for Redux hydration.
                localStorage.setItem('user', JSON.stringify(response.data.data));
                return response.data.data;
            }
            // If API returns success but no user data (e.g., token invalid/expired)
            console.log("AuthService: getCurrentUser API no user data in successful response. Clearing localStorage.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        } catch (error) {
            console.error("AuthService: getCurrentUser API error:", error.response?.data || error.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        }
    }
}

const authService = new AuthService();
export default authService;