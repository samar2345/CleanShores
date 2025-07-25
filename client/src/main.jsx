// client/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Router imports
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

// Redux imports
import { Provider } from 'react-redux';
import store from './store/store.js';

// Page imports
import Home from './pages/Home.jsx';
import AuthLayout from './components/common/AuthLayout.jsx';
import Login from './pages/Auth/Login.jsx';
import Signup from './pages/Auth/Signup.jsx';
import SignupUser from './pages/Auth/SignupUser.jsx';
import SignupAdmin from './pages/Auth/SignupAdmin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Events from './pages/Events.jsx';
import Shop from './pages/Shop.jsx';
import Groups from './pages/Groups.jsx';
import NGODashboard from './pages/Ngo/NgoDashboard.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';

// Event specific imports
import EventDetails from './pages/Events/EventDetails.jsx';
import EventEdit from './pages/Events/EventEdit.jsx';

// NEW: Group specific imports
import GroupDetails from './pages/Groups/GroupDetails.jsx';
import GroupChatPage from './pages/Groups/GroupChatPage.jsx'; // <-- IMPORT NEW GROUP CHAT PAGE

// Define the router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
        { path: "/", element: <Home /> },
        { path: "/login", element: (<AuthLayout authentication={false}><Login /></AuthLayout>) },
        { path: "/signup", element: (<AuthLayout authentication={false}><Signup /></AuthLayout>) },
        { path: "/signup/user", element: (<AuthLayout authentication={false}><SignupUser /></AuthLayout>) },
        { path: "/signup/admin", element: (<AuthLayout authentication={false}><SignupAdmin /></AuthLayout>) },
        { path: "/dashboard", element: (<AuthLayout authentication={true}><Dashboard /></AuthLayout>) },
        {
            path: "/events",
            element: (
                <AuthLayout authentication={true}>
                    <Events />
                </AuthLayout>
            ),
        },
        { // Event Details Route
            path: "/events/:eventId",
            element: (
                <AuthLayout authentication={true}>
                    <EventDetails />
                </AuthLayout>
            ),
        },
        { // Event Edit Route
            path: "/events/edit/:eventId",
            element: (
                <AuthLayout authentication={true} allowedRoles={['admin']}>
                    <EventEdit />
                </AuthLayout>
            ),
        },
        { path: "/shop", element: (<AuthLayout authentication={false}><Shop /></AuthLayout>) },
        {
            path: "/groups",
            element: (
                <AuthLayout authentication={true}>
                    <Groups />
                </AuthLayout>
            ),
        },
        { // Group Details Route
            path: "/groups/:groupId",
            element: (
                <AuthLayout authentication={true}>
                    <GroupDetails />
                </AuthLayout>
            ),
        },
        { // NEW: Group Chat Page Route
            path: "/groups/:groupId/chat",
            element: (
                <AuthLayout authentication={true}> {/* Chat requires authentication and group membership */}
                    <GroupChatPage />
                </AuthLayout>
            ),
        },
        { 
            path: "/ngo/dashboard", 
            element: (
                <AuthLayout authentication={true} allowedRoles={['ngo']}>
                    <NGODashboard />
                </AuthLayout>
            ),
        },
        { 
            path: "/admin/dashboard", 
            element: (
                <AuthLayout authentication={true} allowedRoles={['admin', 'ngo']}>
                    <AdminDashboard />
                </AuthLayout>
            ),
        },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);