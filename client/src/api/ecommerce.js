// client/src/api/ecommerce.js

// Authentication: getAllProducts and getProductById are marked as public (no _getAuthHeaders()) 
// based on your backend route setup. Order-related methods require authentication.
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

class EcommerceService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
        });
    }

    // Helper to get token for authenticated requests (re-used from auth.js)
    _getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    /**
     * Fetches a list of all products from the backend.
     * Accessible publicly (backend route GET /ecommerce/products is public).
     * @param {object} [filters={}] - Optional filters like { category: 'Gloves', search: 'reusable' }.
     * @returns {Promise<object[]>} An array of product objects.
     */
    async getAllProducts(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            // Backend's getAllProducts is PUBLIC, so no auth headers needed here for the product list
            // However, if your backend for GET /ecommerce/products became protected, you'd add headers: this._getAuthHeaders()
            const response = await this.api.get(`/ecommerce/products?${params}`);
            return response.data.data;
        } catch (error) {
            console.error("EcommerceService getAllProducts error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches details for a single product by its ID.
     * Accessible publicly.
     * @param {string} productId - The ID of the product to fetch.
     * @returns {Promise<object>} The product object.
     */
    async getProductById(productId) {
        try {
            const response = await this.api.get(`/ecommerce/products/${productId}`);
            return response.data.data;
        } catch (error) {
            console.error("EcommerceService getProductById error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    // --- Order-related methods (will be used later, adding placeholders) ---

    /**
     * Places a new order.
     * Protected (User or Admin).
     * @param {object} orderData - Object with items (array of {productId, quantity}) and shippingAddress.
     * @returns {Promise<object>} The created order object.
     */
    async placeOrder(orderData) {
        try {
            const response = await this.api.post('/ecommerce/orders', orderData, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EcommerceService placeOrder error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches all orders placed by the current user.
     * Protected (User or Admin).
     * @returns {Promise<object[]>} An array of order objects.
     */
    async getMyOrders() {
        try {
            const response = await this.api.get('/ecommerce/orders/my-orders', { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EcommerceService getMyOrders error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    /**
     * Fetches all orders on the platform (for NGO).
     * Protected (NGO Only).
     * @param {object} [filters={}] - Optional filters like { status: 'pending_review', userId: 'some_id' }.
     * @returns {Promise<object[]>} An array of all order objects.
     */
    async getAllOrders(filters = {}) {
        try {
            const params = new URLSearchParams(filters).toString();
            const response = await this.api.get(`/ecommerce/orders?${params}`, { headers: this._getAuthHeaders() });
            return response.data.data;
        } catch (error) {
            console.error("EcommerceService getAllOrders error:", error.response?.data || error.message);
            throw error.response?.data || error;
        }
    }

    // --- Product management for NGO (placeholders for now) ---
    // async addProduct(productData) { ... }
    // async updateProduct(productId, productData) { ... }
    // async deleteProduct(productId) { ... }
}

const ecommerceService = new EcommerceService();
export default ecommerceService;