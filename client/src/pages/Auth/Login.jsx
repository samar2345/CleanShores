// client/src/pages/Auth/Login.jsx
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useDispatch } from 'react-redux'; // Hook to dispatch Redux actions
// import authService from '../../api/auth.js'; // Authentication API service
// import { login as authLogin } from '../../store/authSlice.js'; // Import and rename login action to avoid conflict

// const Login = () => {
//   const navigate = useNavigate(); // Hook for programmatic navigation
//   const dispatch = useDispatch(); // Hook to dispatch Redux actions
  
//   // State for form inputs
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
  
//   // State for error messages and loading status
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   /**
//    * Handles the form submission for user login.
//    * Calls the authentication service and dispatches Redux login action on success.
//    */
//   const handleSubmit = async (e) => {
//     e.preventDefault(); // Prevent default form submission behavior
//     setError(''); // Clear any previous errors
//     setLoading(true); // Set loading state to true during API call

//     try {
//       // Call the backend login API
//       const response = await authService.login(email, password);
//       // If login is successful and user data is returned
//       if (response && response.user) {
//         dispatch(authLogin(response.user)); // Pass user object directly
//         // Route based on user role
//         if (response.user.role === 'ngo') {
//           navigate('/ngo/dashboard');
//         } else if (response.user.role === 'admin') {
//           navigate('/admin/dashboard');
//         } else {
//           navigate('/dashboard');
//         }
//       } else {
//         setError('Login failed. Please check your credentials.');
//       }
//     } catch (err) {
//       // Catch and display API errors (e.g., invalid credentials, server errors)
//       setError(err.message || 'Login failed. Please try again.');
//       console.error("Login API Error:", err); // Log full error for debugging
//     } finally {
//       setLoading(false); // Reset loading state
//     }
//   };

//   return (
//     <div className="container py-12 text-center">
//       <h2 className="text-3xl font-semibold mb-6">Login</h2>
//       <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
//         {/* Display error message if present */}
//         {error && <div className="alert alert-danger">{error}</div>}
        
//         {/* Email or Username Input */}
//         <div className="form-group mb-4">
//           <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email or Username:</label>
//           <input
//             type="text" // Allows input of both email or username
//             id="email"
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//             disabled={loading} // Disable input while loading
//           />
//         </div>
        
//         {/* Password Input */}
//         <div className="form-group mb-6">
//           <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
//           <input
//             type="password"
//             id="password"
//             className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//             disabled={loading} // Disable input while loading
//           />
//         </div>
        
//         {/* Submit Button */}
//         <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" disabled={loading}>
//           {loading ? 'Logging in...' : 'Login'} {/* Change text based on loading state */}
//         </button>
//       </form>

//       {/* Links for registration */}
//       <p className="mt-6 text-gray-700">Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Register here</Link></p>
//     </div>
//   );
// };

// export default Login;


// client/src/pages/Auth/Login.jsx
import React, { useState } from 'react'; // Corrected line
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import authService from '../../api/auth.js';
import { login as authLogin } from '../../store/authSlice.js';

const Login = () => { // <--- The functional component definition starts here
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      if (response && response.user) {
        dispatch(authLogin(response.user));
        
        if (response.user.role === 'ngo') {
          navigate('/ngo/dashboard');
        } else if (response.user.role === 'admin' && response.user.status === 'active') {
          navigate('/admin/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error("Login API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 text-center">
      <h2 className="text-3xl font-semibold mb-6">Login</h2>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="form-group mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email or Username:</label>
          <input
            type="text"
            id="email"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password:</label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-6 text-gray-700">Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline">Register here</Link></p>
    </div>
  );
};

export default Login;