// // client/src/pages/Auth/SignupUser.jsx
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
// import authService from '../../api/auth.js'; // Authentication API service
// import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action

// const SignupUser = () => {
//   const navigate = useNavigate(); // Hook for programmatic navigation
//   const dispatch = useDispatch(); // Hook to dispatch Redux actions
  
//   // State to manage form data, including files
//   const [formData, setFormData] = useState({
//     fullName: '',
//     username: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     profilePicture: null, // Stores the File object
//   });
  
//   // State for error messages and loading status
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   /**
//    * Handles changes for text input fields.
//    * @param {Event} e - The change event from the input.
//    */
//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   /**
//    * Handles changes for file input fields (specifically profile picture).
//    * @param {Event} e - The change event from the file input.
//    */
//   const handleFileChange = (e) => {
//     // Access the selected file from e.target.files[0]
//     setFormData({ ...formData, profilePicture: e.target.files[0] });
//   };

//   /**
//    * Handles the form submission for user registration.
//    * Performs client-side validation and calls the backend API.
//    */
//   const handleSubmit = async (e) => {
//     e.preventDefault(); // Prevent default form submission
//     setError(''); // Clear any previous errors
//     setLoading(true); // Set loading state to true during API call

//     // Client-side validation for password match
//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       setLoading(false);
//       return;
//     }
//     // Client-side validation for profile picture presence
//     if (!formData.profilePicture) {
//         setError('Profile picture is required.');
//         setLoading(false);
//         return;
//     }

//     // Create FormData object to send multipart/form-data (for files and text)
//     const dataToSend = new FormData();
//     for (const key in formData) {
//       // Exclude 'confirmPassword' as it's only for client-side validation
//       // Append only non-null values (for optional fields)
//       if (key !== 'confirmPassword' && formData[key] !== null) {
//         dataToSend.append(key, formData[key]);
//       }
//     }

//     try {
//       // Call the backend registration API for regular users
//       const response = await authService.registerUser(dataToSend);
      
//       // If registration is successful (backend returns success: true)
//       if (response && response.success) {
//         // Dispatch the login action to update Redux state (backend logs in user automatically)
//         dispatch(authLogin({ userData: response.data.user }));
//         navigate('/dashboard'); // Redirect to dashboard
//       } else {
//         // Handle backend-specific errors (e.g., duplicate email/username)
//         setError(response.message || 'User registration failed.');
//       }
//     } catch (err) {
//       // Catch and display general API errors
//       setError(err.message || 'User registration failed. Please try again.');
//       console.error("SignupUser API Error:", err); // Log full error for debugging
//     } finally {
//       setLoading(false); // Reset loading state
//     }
//   };

//   return (
//     <div className="container py-12 text-center">
//       <h2 className="text-3xl font-semibold mb-6">Register as a Regular User</h2>
//       <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
//         {/* Display error message */}
//         {error && <div className="alert alert-danger">{error}</div>}
        
//         {/* Full Name Input */}
//         <div className="form-group mb-4">
//           <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">Full Name:</label>
//           <input type="text" id="fullName" name="fullName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.fullName} onChange={handleChange} required disabled={loading} />
//         </div>
        
//         {/* Username Input */}
//         <div className="form-group mb-4">
//           <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
//           <input type="text" id="username" name="username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.username} onChange={handleChange} required disabled={loading} />
//         </div>
        
//         {/* Email Input */}
//         <div className="form-group mb-4">
//           <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
//           <input type="email" id="email" name="email" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.email} onChange={handleChange} required disabled={loading} />
//         </div>
        
//         {/* Password Input */}
//         <div className="form-group mb-4">
//           <label htmlFor="password">Password:</label>
//           <input type="password" id="password" name="password" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.password} onChange={handleChange} required disabled={loading} />
//         </div>
        
//         {/* Confirm Password Input */}
//         <div className="form-group mb-6">
//           <label htmlFor="confirmPassword">Confirm Password:</label>
//           <input type="password" id="confirmPassword" name="confirmPassword" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} />
//         </div>
        
//         {/* Profile Picture File Input */}
//         <div className="form-group mb-6">
//           <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">Profile Picture:</label>
//           <input type="file" id="profilePicture" name="profilePicture" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
//         </div>
        
//         {/* Submit Button */}
//         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" disabled={loading}>
//           {loading ? 'Registering...' : 'Register User'}
//         </button>
//       </form>

//       {/* Links for existing users or admin registration */}
//       <p className="mt-6 text-gray-700">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
//       <p className="mt-2 text-gray-700">Want to register as Admin? <Link to="/signup/admin" className="text-blue-600 hover:underline">Click here</Link></p>
//     </div>
//   );
// };

// export default SignupUser;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
import authService from '../../api/auth.js'; // Authentication API service
import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action

const SignupUser = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation
  const dispatch = useDispatch(); // Hook to dispatch Redux actions
  
  // State to manage form data, including files
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    profilePicture: null, // Stores the File object
  });
  
  // State for error messages and loading status
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles changes for text input fields.
   * @param {Event} e - The change event from the input.
   */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * Handles changes for file input fields (specifically profile picture).
   * @param {Event} e - The change event from the file input.
   */
  const handleFileChange = (e) => {
    // Access the selected file from e.target.files[0]
    setFormData({ ...formData, profilePicture: e.target.files[0] });
  };

  /**
   * Handles the form submission for user registration.
   * Performs client-side validation and calls the backend API.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear any previous errors
    setLoading(true); // Set loading state to true during API call

    // Client-side validation for password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    // Client-side validation for profile picture presence
    if (!formData.profilePicture) {
        setError('Profile picture is required.');
        setLoading(false);
        return;
    }

    // Create FormData object to send multipart/form-data (for files and text)
    const dataToSend = new FormData();
    for (const key in formData) {
      // Exclude 'confirmPassword' as it's only for client-side validation
      // Append only non-null values (for optional fields)
      if (key !== 'confirmPassword' && formData[key] !== null) {
        dataToSend.append(key, formData[key]);
      }
    }

    try {
      // Call the backend registration API for regular users
      const response = await authService.registerUser(dataToSend);
      
      // If registration is successful (backend returns success: true)
      if (response && response.success) {
        // Dispatch the login action to update Redux state (backend logs in user automatically)
        dispatch(authLogin(response.data.user)); // Pass user data directly as payload
        navigate('/dashboard'); // Redirect to dashboard
      } else {
        // Handle backend-specific errors (e.g., duplicate email/username)
        setError(response.message || 'User registration failed.');
      }
    } catch (err) {
      // Catch and display general API errors
      setError(err.message || 'User registration failed. Please try again.');
      console.error("SignupUser API Error:", err); // Log full error for debugging
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6">Register as a Regular User</h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {/* Display error message */}
        {error && <div className="alert alert-danger">{error}</div>}
        
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
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
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
        
        {/* Profile Picture File Input */}
        <div className="form-group mb-6">
          <label htmlFor="profilePicture" className="block text-gray-700 text-sm font-bold mb-2">Profile Picture:</label>
          <input type="file" id="profilePicture" name="profilePicture" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" onChange={handleFileChange} required disabled={loading} />
        </div>
        
        {/* Submit Button */}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" disabled={loading}>
          {loading ? 'Registering...' : 'Register User'}
        </button>
      </form>

      {/* Links for existing users or admin registration */}
      <p className="mt-6 text-gray-700">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link></p>
      <p className="mt-2 text-gray-700">Want to register as Admin? <Link to="/signup/admin" className="text-blue-600 hover:underline">Click here</Link></p>
    </div>
  );
};

export default SignupUser;