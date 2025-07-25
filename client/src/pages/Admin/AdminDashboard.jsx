
// This component will fetch and display an admin's specific metrics, 
// such as events they've created, and their position on the admin leaderboard
// Data Fetching: Uses useEffect to call adminService.getAdminLeaderboard() and 
// directly axios.get for the current admin's createdEvents.


// client/src/pages/Admin/AdminDashboard.jsx
// client/src/pages/Admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import adminService from '../../api/admin.js';
import eventService from '../../api/events.js'; // Import eventService to fetch events

const API_BASE_URL = 'http://localhost:5000/api/v1'; // This is only needed if using axios directly, but eventService encapsulates it.

const AdminDashboard = () => {
  const user = useSelector((state) => state.auth.userData);
  const navigate = useNavigate();

  const [adminOverview, setAdminOverview] = useState(null);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [adminLeaderboard, setAdminLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin' || user.status !== 'active') {
      navigate('/dashboard');
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      setError('');

      try {
        const adminLeaderboardData = await adminService.getAdminLeaderboard();
        setAdminLeaderboard(adminLeaderboardData);

        // Use eventService to fetch events created by this admin
        const createdEventsData = await eventService.getAllEvents({ adminId: user._id });
        setCreatedEvents(createdEventsData);

      } catch (err) {
        console.error("Error fetching Admin Dashboard data:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load Admin Dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  const currentAdminPerformance = adminLeaderboard.find(admin => admin._id === user._id);


  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Admin Dashboard...</h2>
        <p className="text-gray-600 mt-4">Fetching your performance data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load dashboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-blue-700 mb-8">Admin Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Your Performance Overview</h2>
        {currentAdminPerformance ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-800">{currentAdminPerformance.gamificationPoints}</p>
              <p className="text-gray-600">Your Gamification Points</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-xl font-bold text-blue-800">{currentAdminPerformance.eventsCreatedCount}</p>
              <p className="text-gray-600">Events Created</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-800">{currentAdminPerformance.totalAttendeesManaged}</p>
              <p className="text-gray-600">Total Unique Attendees</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-xl font-bold text-yellow-800">{currentAdminPerformance.totalWetWasteManagedKg || 0}kg</p>
              <p className="text-gray-600">Total Wet Waste Managed</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-800">{currentAdminPerformance.totalDryWasteManagedKg || 0}kg</p>
              <p className="text-gray-600">Total Dry Waste Managed</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-xl font-bold text-gray-800">{currentAdminPerformance.trustScore?.toFixed(2) || 'N/A'}</p>
              <p className="text-gray-600">Your Trust Score</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No performance data available yet. Create some events!</p>
        )}
      </div>

      {/* Events Created by Admin */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Your Created Events ({createdEvents.length})</h2>
        {createdEvents.length === 0 ? (
          <p className="text-gray-600">You haven't created any events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Location</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Waste (kg)</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {createdEvents.map(event => (
                  <tr key={event._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{event.title}</td>
                    <td className="py-3 px-4">{new Date(event.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{event.locationName}</td>
                    <td className="py-3 px-4">{event.status}</td>
                    <td className="py-3 px-4">{event.wetWasteCollectedKg || 0}W / {event.dryWasteCollectedKg || 0}D</td>
                    <td className="py-3 px-4">
                      <Link 
                        to={`/events/${event._id}`} 
                        className="text-blue-600 hover:underline text-sm mr-2"
                      >
                        View
                      </Link>
                      {/* Edit button: Only if event is upcoming or active */}
                      {(event.status === 'upcoming' || event.status === 'active') && (
                        <Link 
                            to={`/events/edit/${event._id}`} 
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                        >
                            Edit
                        </Link> 
                      )}
                      {/* Submit Completion Details button: if event is active, allow submitting details */}
                      {event.status === 'active' && (
                        <Link 
                            to={`/events/complete/${event._id}`} // TODO: Create this page
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm ml-2 hover:bg-green-600 transition-colors"
                        >
                            Complete
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Leaderboard (Full Platform View) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Top Admins Leaderboard</h2>
        {adminLeaderboard.length === 0 ? (
          <p className="text-gray-600">No admin leaderboard data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Admin</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Events</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Attendees</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Waste (kg)</th>
                  <th className="py-3 px-4 border-b text-left text-sm font-semibold text-gray-700">Trust Score</th>
                </tr>
              </thead>
              <tbody>
                {adminLeaderboard.map((admin, index) => (
                  <tr key={admin._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {admin.profilePicture && (
                          <img src={admin.profilePicture} alt={admin.username} className="w-8 h-8 rounded-full mr-2 object-cover" />
                        )}
                        <span>{admin.fullName} (@{admin.username})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{admin.eventsCreatedCount}</td>
                    <td className="py-3 px-4">{admin.totalAttendeesManaged}</td>
                    <td className="py-3 px-4">{admin.totalWetWasteManagedKg || 0}W / {admin.totalDryWasteManagedKg || 0}D</td>
                    <td className="py-3 px-4 font-bold text-green-700">{admin.trustScore?.toFixed(2)}</td>
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

export default AdminDashboard;