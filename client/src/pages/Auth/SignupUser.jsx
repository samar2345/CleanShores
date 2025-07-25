// // client/src/pages/Auth/SignupUser.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
import authService from '../../api/auth.js'; // Authentication API service
import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action

const SignupUser = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const dispatch = useDispatch(); // Hook to dispatch Redux actions
  
  // State to manage all form data, including the File object for profilePicture.
  // Initialize with empty strings or null for fields.
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePicture: null, // Stores the actual File object
  });
  
  // State for displaying error messages to the user.
  const [error, setError] = useState('');
  // State to indicate loading status during API calls, useful for disabling forms/buttons.
  const [loading, setLoading] = useState(false);

  /**
   * Handles changes for all text input fields in the form.
   * Updates the corresponding state property based on the input's 'name' attribute.
   * @param {Event} e - The change event from the input element.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles changes for file input fields (specifically profile picture).
   * Extracts the selected File object and updates the 'profilePicture' state.
   * @param {Event} e - The change event from the file input element.
   */
  const handleFileChange = (e) => {
    // e.target.files is a FileList, [0] gets the first selected file.
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  /**
   * Handles the form submission for user registration.
   * Performs client-side validation, constructs FormData, and calls the backend API.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission
    setError(''); // Clear any previous error messages
    setLoading(true); // Set loading state to true during API call

    // --- Client-side Validations ---
    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false); // Reset loading and return if validation fails
      return;
    }
    // 2. Profile Picture Presence Validation
    if (!formData.profilePicture) {
        setError('Profile picture is required.');
        setLoading(false);
        return;
    }
    // --- End Client-side Validations ---

    // Create a FormData object to send multipart/form-data.
    // This is required when sending files along with text data to the backend.
    const dataToSend = new FormData();
    for (const key in formData) {
      // Exclude 'confirmPassword' as it's only for client-side validation.
      // Append only non-null values (for optional fields)
      if (key !== 'confirmPassword' && formData[key] !== null) {
        dataToSend.append(key, formData[key]); // Append key-value pair to FormData
      }
    }

    try {
      // Call the backend registration API for regular users via authService.
      // The backend will automatically log in the user upon successful registration.
      const response = await authService.registerUser(dataToSend);
      
      // If registration is successful (backend returns success: true)
      if (response && response.success) {
        // Dispatch the Redux login action to update the global auth state.
        // The backend's response.data.user directly contains the user's data.
        dispatch(authLogin(response.data.user)); // Pass user data directly as payload
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        // If backend returns success:false, display the error message from the backend.
        setError(response.message || 'User registration failed.');
      }
    } catch (err) {
      // Catch and display any API errors (e.g., network issues, server errors)
      setError(err.message || 'User registration failed. Please try again.');
      console.error("SignupUser API Error:", err); // Log the full error for debugging
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Register as a Regular User</h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {/* Display error message */}
        {error && <div className="alert alert-danger text-center mb-4">{error}</div>}
        
        {/* Full Name Input Field */}
        <div className="form-group mb-4">
          <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name:</label>
          <input type="text" id="fullName" name="fullName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.fullName} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Username Input Field */}
        <div className="form-group mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
          <input type="text" id="username" name="username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.username} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Email Input Field */}
        <div className="form-group mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
          <input type="email" id="email" name="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.email} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Password Input Field */}
        <div className="form-group mb-4">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.password} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Confirm Password Input Field */}
        <div className="form-group mb-6">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Profile Picture File Input Field */}
        <div className="form-group mb-6">
          <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">Profile Picture:</label>
          <input type="file" id="profilePicture" name="profilePicture" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
        </div>
        
        {/* Submit Button */}
        <button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-colors" 
          disabled={loading} // Disable button while form is submitting
        >
          {loading ? 'Registering...' : 'Register User'} {/* Change button text based on loading state */}
        </button>
      </form>

      {/* Links for existing users or admin registration */}
      <p className="mt-6 text-gray-700">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
      <p className="mt-2 text-gray-700">Want to register as Admin? <Link to="/signup/admin" className="text-blue-600 hover:underline">Click here</Link></p>
    </div>
  );
};

export default SignupUser;