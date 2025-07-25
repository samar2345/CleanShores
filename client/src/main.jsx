// We wrap the entire application with the Provider component from react-redux 
// to make the Redux store available to all components.

// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // The main App component
import './styles/index.css'; // Global styles for the application

// Router imports from react-router-dom v6.4+ for modern routing
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// Redux imports to provide the store to the entire application
import { Provider } from 'react-redux';
import store from './store/store.js'; // Your Redux store

// Page imports - components representing different routes/views of the application
import Home from './pages/Home.jsx';
import AuthLayout from './components/common/AuthLayout.jsx'; // Corrected default import for AuthLayout
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import SignupUser from './pages/Auth/SignupUser.jsx';
import SignupAdmin from './pages/Auth/SignupAdmin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Events from './pages/Events.jsx';
import Shop from './pages/Shop.jsx';
import Groups from './pages/Groups.jsx';
import NGODashboard from './pages/Ngo/NgoDashboard.jsx'; // Import the new NGO Dashboard page
// TODO: Import AdminDashboard.jsx when created
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';

// Define the router configuration using createBrowserRouter.
// This is an array of route objects, where each object defines a path and its corresponding element.
const router = createBrowserRouter([
  {
    path: "/", // Base path for the application
    element: <App />, // The App component acts as the main layout, rendering children via <Outlet />
    children: [ // Nested routes that will render within the <Outlet /> in App.jsx
        {
            path: "/", // Matches the root path '/'
            element: <Home />,
        },
        {
            path: "/login", // Route for the login page
            element: (
                // AuthLayout with authentication={false} means this route should NOT be accessed if logged in.
                <AuthLayout authentication={false}>
                    <Login />
                </AuthLayout>
            ),
        },
        {
            path: "/signup", // Route for the general signup page (choice between user/admin)
            element: (
                <AuthLayout authentication={false}>
                    <Signup />
                </AuthLayout>
            ),
        },
        {
            path: "/signup/user", // Specific route for regular user registration
            element: (
                <AuthLayout authentication={false}>
                    <SignupUser />
                </AuthLayout>
            ),
        },
        {
            path: "/signup/admin", // Specific route for admin registration
            element: (
                <AuthLayout authentication={false}>
                    <SignupAdmin />
                </AuthLayout>
            ),
        },
        {
            path: "/dashboard", // Route for the user dashboard
            element: (
                // AuthLayout with authentication={true} means this route requires login.
                <AuthLayout authentication={true}>
                    <Dashboard />
                </AuthLayout>
            ),
        },
        {
            path: "/events", // Route for events listing
            element: (
                // Authentication set to false, meaning it's publicly viewable even if not logged in.
                // Change to true if events should only be seen by logged-in users.
                <AuthLayout authentication={false}>
                    <Events />
                </AuthLayout>
            ),
        },
        {
            path: "/shop", // Route for the e-commerce shop
            element: (
                // Authentication set to false, meaning it's publicly viewable.
                <AuthLayout authentication={false}>
                    <Shop />
                </AuthLayout>
            ),
        },
        {
            path: "/groups", // Route for community groups
            element: (
                // Groups generally require authentication to view.
                <AuthLayout authentication={true}>
                    <Groups />
                </AuthLayout>
            ),
        },
        {
            path: "/ngo/dashboard", // Route for the NGO-specific dashboard
            element: (
                // Requires authentication AND specifically the 'ngo' role.
                <AuthLayout authentication={true} allowedRoles={['ngo']}>
                    <NGODashboard />
                </AuthLayout>
            ),
        },
        {
            path: "/admin/dashboard",
            element: (
                // Requires authentication AND either 'admin' or 'ngo' role.
                <AuthLayout authentication={true} allowedRoles={['admin', 'ngo']}>
                    <AdminDashboard />
                </AuthLayout>
            ),
        },
        // Add more routes here as your application grows (e.g., event details, user profiles).
    ],
  },
]);

// Render the React application into the DOM.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Provide the Redux store to the entire application */}
    <Provider store={store}>
      {/* Provide the router configuration to the application */}
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);