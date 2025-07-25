// Data Fetching: Uses useEffect to fetch events via eventService.getAllEvents().
// Conditional Fetching: Only fetches if authStatus is true, as the backend getAllEvents is protected.

// client/src/pages/Events.jsx
import React, { useEffect, useState } from 'react';
import eventService from '../api/events.js'; // Import the new event service
import { useSelector } from 'react-redux'; // For auth status (to conditionally display)
import { Link } from 'react-router-dom'; // For "View Details" link

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authStatus = useSelector(state => state.auth.authStatus); // Get auth status from Redux

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        // Assuming events require authentication to view for now based on backend setup.
        // If your main.jsx route for /events has authentication={false}, it means public view is intended,
        // but backend still requires a token. Adjust AuthLayout or backend if truly public.
        // For now, if not logged in, this call will likely fail (handled by error state).
        
        const allEvents = await eventService.getAllEvents({ status: 'upcoming' }); // Fetch only upcoming events by default
        setEvents(allEvents);
      } catch (err) {
        console.error("Events fetch error:", err.response?.data || err.message);
        setError(err.message || 'Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if authenticated. If events are public, AuthLayout should not protect,
    // and this component should handle case where no token is present, or backend allows unauthenticated.
    // Given backend `getAllEvents` has `verifyJWT` in route, we need auth.
    if (authStatus) { // Only fetch events if user is authenticated
        fetchEvents();
    } else {
        setLoading(false); // If not authenticated, stop loading without fetching
        setError("Please log in to view events."); // Display message
    }
  }, [authStatus]); // Re-run when auth status changes

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Events...</h2>
        <p className="text-gray-600 mt-4">Fetching upcoming cleanup drives.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        {/* Suggest login if error is auth-related */}
        {!authStatus && <p className="text-gray-600 mt-4">You need to be logged in to view events. Please <Link to="/login" className="text-blue-600 hover:underline">login</Link>.</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Upcoming Cleanup Events</h2>
      {events.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No upcoming events found. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">{event.title}</h3>
              <p className="text-gray-600 text-sm mb-2"><strong>Date:</strong> {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-gray-600 text-sm mb-4"><strong>Time:</strong> {event.startTime} - {event.endTime} | <strong>Location:</strong> {event.locationName}</p>
              <p className="text-gray-700 text-base line-clamp-3">{event.description}</p>
              <div className="mt-4 flex justify-end">
                <Link to={`/events/${event._id}`} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm">
                  View Details
                </Link>
                {/* TODO: Add Enroll/Leave buttons here based on user enrollment status */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;