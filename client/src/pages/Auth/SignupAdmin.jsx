// client/src/pages/Auth/SignupAdmin.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../api/auth.js'; // Authentication API service

const SignupAdmin = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  
  // State to manage all form data, including File objects for uploads.
  // Initialize with empty strings or null for fields.
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: '', // e.g., 'Local Community Group', 'Registered NGO'
    bio: '',
    contactNumber: '',
    profilePicture: null,
    addressProof: null,
    idProof: null,
    organizationRegistrationProof: null, // Optional file
  });
  
  // State for displaying error messages to the user.
  const [error, setError] = useState('');
  // State to indicate loading status during API calls, useful for disabling forms/buttons.
  const [loading, setLoading] = useState(false);

  /**
   * Handles changes for text input fields.
   * Updates the corresponding state property based on the input's 'name' attribute.
   * @param {Event} e - The change event from the input element.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles changes for file input fields.
   * Extracts the selected File object and updates state for the corresponding field name.
   * @param {Event} e - The change event from the file input element.
   */
  const handleFileChange = (e) => {
    // Access the selected file from e.target.files[0]
    setFormData({ ...formData, [e.target.name]: e.target.files[0] });
  };

  /**
   * Handles the form submission for admin registration.
   * Performs client-side validation, constructs FormData, and calls the backend API.
   * @param {Event} e - The form submission event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser form submission (page reload)
    setError(''); // Clear any previous error messages
    setLoading(true); // Set loading state to true during API call

    // --- Client-side Validations ---
    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false); // Reset loading and return if validation fails
      return;
    }
    // 2. Required Document Files Validation
    if (!formData.profilePicture || !formData.addressProof || !formData.idProof) {
        setError('Profile picture, Address Proof, and ID Proof are required.');
        setLoading(false);
        return;
    }
    // 3. Conditional Required Field for 'Registered NGO' Type
    if (formData.organizationType === 'Registered NGO' && !formData.organizationRegistrationProof) {
        setError('Organization Registration Proof is required for Registered NGO type.');
        setLoading(false);
        return;
    }
    // --- End Client-side Validations ---

    // Create a FormData object to send multipart/form-data.
    // This is required when sending files along with text data to the backend.
    const dataToSend = new FormData();
    for (const key in formData) {
      // Exclude 'confirmPassword' as it's only for client-side validation.
      // Append only non-null values (for optional fields like organizationRegistrationProof if not selected).
      if (key !== 'confirmPassword' && formData[key] !== null) {
        dataToSend.append(key, formData[key]); // Append key-value pair to FormData
      }
    }

    try {
      // Call the backend registration API for admins.
      // Admins are registered with 'pending_verification' status on the backend.
      const response = await authService.registerAdmin(dataToSend);
      
      // If registration is successful (backend returns success: true)
      if (response && response.success) {
        // Redirect to login page, informing the user that their account is pending verification.
        navigate('/login'); 
      } else {
        // Handle backend-specific errors (e.g., duplicate email/username)
        setError(response.message || 'Admin registration failed.');
      }
    } catch (err) {
      // Catch and display general API errors.
      setError(err.message || 'Admin registration failed. Please try again.');
      console.error("SignupAdmin API Error:", err); // Log the full error for debugging.
    } finally {
      setLoading(false); // Reset loading state.
    }
  };

  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6">Register as an Admin</h2>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {/* Display error message */}
        {error && <div className="alert alert-danger text-center mb-4">{error}</div>}
        
        {/* Full Name Input */}
        <div className="form-group mb-4">
          <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name:</label>
          <input type="text" id="fullName" name="fullName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.fullName} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Username Input */}
        <div className="form-group mb-4">
          <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
          <input type="text" id="username" name="username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.username} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Email Input */}
        <div className="form-group mb-4">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.email} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Password Input */}
        <div className="form-group mb-4">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.password} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Confirm Password Input */}
        <div className="form-group mb-6">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Organization Name Input */}
        <div className="form-group mb-4">
          <label htmlFor="organizationName">Organization/Group Name:</label>
          <input type="text" id="organizationName" name="organizationName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.organizationName} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Organization Type Input */}
        <div className="form-group mb-4">
          <label htmlFor="organizationType">Organization Type:</label>
          <input type="text" id="organizationType" name="organizationType" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.organizationType} onChange={handleChange} placeholder="e.g., Local Community Group, Registered NGO" required disabled={loading} />
        </div>
        
        {/* Brief Bio/Introduction Textarea */}
        <div className="form-group mb-4">
          <label htmlFor="bio">Brief Bio/Introduction:</label>
          <textarea id="bio" name="bio" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.bio} onChange={handleChange} required rows="3" disabled={loading}></textarea>
        </div>
        
        {/* Contact Number Input */}
        <div className="form-group mb-6">
          <label htmlFor="contactNumber">Contact Number:</label>
          <input type="text" id="contactNumber" name="contactNumber" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.contactNumber} onChange={handleChange} required disabled={loading} />
        </div>
        
        {/* Profile Picture File Input */}
        <div className="form-group mb-4">
          <label htmlFor="profilePicture">Profile Picture:</label>
          <input type="file" id="profilePicture" name="profilePicture" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
        </div>
        
        {/* Address Proof File Input */}
        <div className="form-group mb-4">
          <label htmlFor="addressProof">Address Proof:</label>
          <input type="file" id="addressProof" name="addressProof" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
        </div>
        
        {/* ID Proof File Input */}
        <div className="form-group mb-4">
          <label htmlFor="idProof">ID Proof:</label>
          <input type="file" id="idProof" name="idProof" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
        </div>
        
        {/* Organization Registration Proof File Input (Optional) */}
        <div className="form-group mb-6">
          <label htmlFor="organizationRegistrationProof">Organization Reg. Proof (Optional):</label>
          <input type="file" id="organizationRegistrationProof" name="organizationRegistrationProof" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} disabled={loading} />
        </div>

        {/* Submit Button */}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" disabled={loading}>
          {loading ? 'Registering...' : 'Register Admin'} {/* Change text based on loading state */}
        </button>
      </form>

      {/* Links for existing users or user registration */}
      <p className="mt-6 text-gray-700">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
      <p className="mt-2 text-gray-700">Want to register as User? <Link to="/signup/user" className="text-blue-600 hover:underline">Click here</Link></p>
    </div>
  );
};

export default SignupAdmin;