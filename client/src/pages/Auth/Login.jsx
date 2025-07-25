// client/src/pages/Auth/Login.jsx
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
// import authService from '../../api/auth.js'; // Authentication API service
// import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action to avoid conflict

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
import authService from '../../api/auth.js'; // Authentication API service
import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action to avoid conflict

const Login = () => { // Corrected: This is the start of the functional component
  const navigate = useNavigate(); // Hook for programmatic navigation
  const dispatch = useDispatch(); // Hook to dispatch Redux actions
  
  // State for form inputs (email can also accept username as per backend)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for error messages and loading status during form submission
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles the form submission for user login.
   * Calls the authentication service, dispatches Redux login action on success, and redirects.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission (page reload)
    setError(''); // Clear any previous error messages
    setLoading(true); // Set loading state to true to disable form and show indicator

    try {
      // Call the backend login API via authService
      const response = await authService.login(email, password);
      
      // If the API call is successful and returns user data (response.user)
      if (response && response.user) {
        // Dispatch the Redux login action to update the global authentication state.
        // `response.user` is passed directly as the payload to match authSlice.js reducer.
        dispatch(authLogin(response.user)); // Corrected: pass user object directly
        
        // Redirect the user based on their authenticated role
        if (response.user.role === 'ngo') {
          navigate('/ngo/dashboard'); // Redirect NGO users to their specific dashboard
        } else if (response.user.role === 'admin' && response.user.status === 'active') { 
          navigate('/admin/dashboard'); // Redirect active admins to their specific dashboard
        } else {
          navigate('/dashboard'); // Default redirect for regular users or pending/rejected admins
        }
      } else {
        // If login API doesn't return success or user data, display a generic error
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Catch and display API errors (e.g., invalid credentials, server errors)
      // Access error message from backend response if available, otherwise use generic message
      setError(err.message || 'Login failed. Please try again.');
      console.error("Login API Error:", err); // Log the full error for debugging purposes
    } finally {
      // Always reset loading state after the API call completes (success or failure)
      setLoading(false); 
    }
  };

  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Login to Clean Shores</h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {/* Display error message if 'error' state is not empty */}
        {error && <div className="alert alert-danger text-center mb-4">{error}</div>}
        
        {/* Email or Username Input Field */}
        <div className="form-group mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email or Username:</label>
          <input
            type="text" // Allows input of both email or username
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required // HTML5 validation: field is required
            disabled={loading} // Disable input while form is submitting
          />
        </div>
        
        {/* Password Input Field */}
        <div className="form-group mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required // HTML5 validation: field is required
            disabled={loading} // Disable input while form is submitting
          />
        </div>
        
        {/* Submit Button */}
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors"
          disabled={loading} // Disable button while form is submitting
        >
          {loading ? 'Logging in...' : 'Login'} {/* Change button text based on loading state */}
        </button>
      </form>

      {/* Link to registration page */}
      <p className="mt-6 text-gray-700">Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Register here</Link></p>
    </div>
  );
};

export default Login;