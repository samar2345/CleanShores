// client/src/pages/Dashboard.jsx
import React from 'react';
import { useSelector } from 'react-redux'; // Hook to access Redux state
import { Link } from 'react-router-dom'; // For navigation links

const Dashboard = () => {
  // Select user data from the Redux store
  const user = useSelector((state) => state.auth.userData);

  // If user data is not yet available (e.g., still loading or not logged in)
  if (!user) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Dashboard</h2>
        <p className="text-gray-600 mt-4">User data not available. Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link>.</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Welcome to Your Dashboard, {user.fullName}!</h2>
      
      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8 flex flex-col md:flex-row gap-8">
        {/* Profile Picture and Basic Info Section */}
        <div className="text-center pb-6 mb-6 border-b md:border-b-0 md:border-r border-gray-200 md:pr-8 md:pb-0 md:mb-0 md:w-1/3">
          {user.profilePicture && (
            <img src={user.profilePicture} alt={user.username} className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-blue-600 shadow-md" />
          )}
          <h3 className="text-2xl font-semibold text-gray-800">{user.fullName}</h3>
          <p className="text-gray-600 text-lg">@{user.username}</p>
          <p className="mt-4 text-gray-700"><strong>Email:</strong> {user.email}</p>
          <p className="text-gray-700">
            <strong>Role:</strong> 
            <span className={`font-bold ${user.role === 'admin' ? 'text-blue-600' : (user.role === 'ngo' ? 'text-green-600' : 'text-gray-600')}`}>
              {user.role}
            </span>
          </p>
          {/* Display Admin Status if user is an admin */}
          {user.role === 'admin' && (
            <p className="text-gray-700">
              <strong>Admin Status:</strong> 
              <span className={`font-bold ${user.status === 'active' ? 'text-green-600' : (user.status === 'pending_verification' ? 'text-orange-500' : 'text-red-600')}`}>
                {user.status.replace(/_/g, ' ')} {/* Replaces underscores with spaces for readability */}
              </span>
            </p>
          )}
        </div>

        {/* Impact and Stats Section */}
        <div className="text-left w-full md:w-2/3">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800">Your Impact & Stats</h3>
          <p className="text-lg mb-3">
            <strong>Gamification Points:</strong> 
            <span className="font-bold text-green-600 text-xl ml-2">{user.gamificationPoints}</span>
          </p>
          {/* TODO: Add more user-specific statistics here (e.g., events attended, waste contributed) 
                   These would typically come from specific API calls to your analytics backend. */}
          <p className="text-gray-700 mt-6">More personalized stats and event history coming soon!</p>
        </div>
      </div>
      
      {/* Admin Tools Section (Visible only to active admins) */}
      {user.role === 'admin' && user.status === 'active' && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8 text-center">
          <h3 className="text-2xl font-semibold mb-3 text-blue-800">Admin Tools</h3>
          <p className="text-blue-700 mb-4">Manage your events, view attendance, and track your group's performance.</p>
          <Link to="/admin/events" className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">Manage Events</Link> {/* TODO: Create this page later */}
        </div>
      )}

      {user.role === 'ngo' && (
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg text-center">
          <h3 className="text-2xl font-semibold mb-3 text-green-800">NGO Management</h3>
          <p className="text-green-700 mb-4">Access platform-wide analytics, manage user accounts, and approve new admins.</p>
          <Link to="/ngo/dashboard" className="btn btn-primary bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">Go to NGO Panel</Link> {/* TODO: Create this page later */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;