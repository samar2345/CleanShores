import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux'; // Hook to access Redux state
import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation
import axios from 'axios'; // For API calls (can be wrapped in a service later)

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Your backend API base URL

const NGODashboard = () => {
  const user = useSelector((state) => state.auth.userData); // Get current user from Redux state
  const navigate = useNavigate(); // For redirection

  // State to hold data fetched for the NGO dashboard
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [platformOverview, setPlatformOverview] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Effect hook to fetch data when component mounts or user/token changes
  useEffect(() => {
    // Redirect if user is not NGO or not authenticated (AuthLayout also handles this, but good to double-check)
    if (!user || user.role !== 'ngo') {
      navigate('/login'); // Redirect to login if not authorized
      return;
    }

    const fetchNgoData = async () => {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token'); // Get the JWT token from local storage
      if (!token) {
        setError('Authentication token not found. Please log in.');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Fetch Pending Admins
        const pendingAdminsRes = await axios.get(`${API_BASE_URL}/admin/pending-admins`, { headers });
        if (pendingAdminsRes.data.success) {
          setPendingAdmins(pendingAdminsRes.data.data);
        } else {
          setError(pendingAdminsRes.data.message);
        }

        // Fetch Platform Overview Analytics
        const platformOverviewRes = await axios.get(`${API_BASE_URL}/admin/analytics/overview`, { headers });
        if (platformOverviewRes.data.success) {
          setPlatformOverview(platformOverviewRes.data.data);
        } else {
          setError(platformOverviewRes.data.message);
        }

        // Fetch All Users
        const allUsersRes = await axios.get(`${API_BASE_URL}/admin/users`, { headers });
        if (allUsersRes.data.success) {
          setAllUsers(allUsersRes.data.data);
        } else {
          setError(allUsersRes.data.message);
        }

      } catch (err) {
        console.error("Error fetching NGO Dashboard data:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load NGO Dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchNgoData(); // Call the data fetching function
  }, [user, navigate]); // Re-run if user object changes

  // Render loading state
  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading NGO Dashboard...</h2>
        <p className="text-gray-600 mt-4">Fetching data.</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load dashboard data. Please try again later.</p>
      </div>
    );
  }

  // Main NGO Dashboard content
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-blue-700 mb-8">NGO Dashboard</h1>

      {/* Analytics Overview Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Platform Overview</h2>
        {platformOverview ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-xl font-bold text-blue-800">{platformOverview.totalEvents}</p>
              <p className="text-gray-600">Total Events</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-xl font-bold text-green-800">{platformOverview.totalUsers}</p>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-xl font-bold text-yellow-800">{platformOverview.totalAdmins}</p>
              <p className="text-gray-600">Active Admins</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-xl font-bold text-red-800">{platformOverview.totalUniqueAttendees}</p>
              <p className="text-gray-600">Unique Attendees</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center col-span-1 md:col-span-2">
              <p className="text-xl font-bold text-purple-800">
                {platformOverview.wasteCollected.totalWetWasteKg || 0}kg Wet, {platformOverview.wasteCollected.totalDryWasteKg || 0}kg Dry
              </p>
              <p className="text-gray-600">Total Waste Collected (Completed Events)</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No analytics data available or still loading.</p>
        )}
      </div>

      {/* Pending Admin Verifications Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Pending Admin Verifications ({pendingAdmins.length})</h2>
        {pendingAdmins.length === 0 ? (
          <p className="text-gray-600">No pending admin requests at the moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Username</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Org Type</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{admin.fullName}</td>
                    <td className="py-2 px-4 border-b">{admin.username}</td>
                    <td className="py-2 px-4 border-b">{admin.email}</td>
                    <td className="py-2 px-4 border-b">{admin.organizationType}</td>
                    <td className="py-2 px-4 border-b">
                      {/* TODO: Implement approve/reject functionality */}
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-green-600">Approve</button>
                      <button className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Users Section (Simplified - for actual implementation, use pagination/filters) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">All Users on Platform ({allUsers.length})</h2>
        {allUsers.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Username</th>
                  <th className="py-2 px-4 border-b text-left">Role</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Points</th>
                  {/* TODO: Add actions like change role, deactivate */}
                </tr>
              </thead>
              <tbody>
                {allUsers.map((userItem) => ( // Renamed user to userItem to avoid conflict with `user` from useSelector
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{userItem.fullName}</td>
                    <td className="py-2 px-4 border-b">{userItem.username}</td>
                    <td className="py-2 px-4 border-b">{userItem.role}</td>
                    <td className="py-2 px-4 border-b">{userItem.status}</td>
                    <td className="py-2 px-4 border-b">{userItem.gamificationPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;