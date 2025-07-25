// This component provides the top navigation bar, 
// dynamically adjusting links based on authentication status and user roles retrieved from the Redux store.
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Redux hooks to access state and dispatch actions
import { logout } from '../../store/authSlice.js'; // Import the logout action creator
import authService from '../../api/auth.js'; // Import the authentication API service

const Header = () => {
  // Select authentication status and user data from the Redux store
  const authStatus = useSelector((state) => state.auth.authStatus);
  const user = useSelector((state) => state.auth.userData);
  
  const dispatch = useDispatch(); // Hook to dispatch Redux actions
  const navigate = useNavigate(); // Hook to navigate programmatically

  /**
   * Handles the logout process.
   * Calls the `authService` to log out from the backend and dispatches the Redux `logout` action.
   */
  const handleLogout = async () => {
    try {
      await authService.logout(); // Call the backend logout API
      dispatch(logout()); // Dispatch the Redux logout action to update local state
      navigate('/login'); // Redirect user to the login page after successful logout
    } catch (error) {
      console.error("Frontend Logout Error:", error);
      // In a production app, you might display a user-friendly error notification here.
    }
  };

  // Define navigation items. The 'active' property controls their visibility based on authentication status and user role.
  const navItems = [
    { name: 'Home', slug: '/', active: true }, // Always active
    // Links visible only if the user is authenticated
    { name: 'Events', slug: '/events', active: authStatus },
    { name: 'Shop', slug: '/shop', active: authStatus },
    { name: 'Groups', slug: '/groups', active: authStatus },
    // Links visible only if NOT authenticated
    { name: 'Login', slug: '/login', active: !authStatus },
    { name: 'Register', slug: '/signup', active: !authStatus },
    // Dashboard link always active if authenticated
    { name: 'Dashboard', slug: '/dashboard', active: authStatus },
    // Admin/NGO specific links visible only if authenticated AND has the correct role
    { name: 'Admin Panel', slug: '/admin/dashboard', active: authStatus && (user?.role === 'admin' || user?.role === 'ngo') },
    { name: 'NGO Panel', slug: '/ngo/dashboard', active: authStatus && user?.role === 'ngo' },
  ];

  return (
    <header className="bg-blue-700 text-white py-4 shadow-md"> {/* Tailwind classes for header styling */}
      <div className="container flex justify-between items-center"> {/* Layout classes using flexbox */}
        <Link to="/" className="text-2xl font-bold text-white"> {/* Logo link */}
          Clean Shores
        </Link>
        <nav>
          <ul className="flex space-x-5"> {/* Navigation list with spacing */}
            {navItems.map((item) =>
              item.active ? ( // Conditionally render navigation item if 'active'
                <li key={item.name}>
                  <Link to={item.slug} className="text-white font-medium hover:text-blue-200 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ) : null // Do not render if not active
            )}
            {authStatus && ( // Show logout button only if user is authenticated
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-transparent border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;