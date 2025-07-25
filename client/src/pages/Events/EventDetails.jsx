// client/src/pages/Events/EventDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // useParams to get ID from URL
import eventService from '../../api/events.js'; // Import the event service
import { useSelector } from 'react-redux'; // For auth token and user info

const EventDetails = () => {
  const { eventId } = useParams(); // Get eventId from the URL
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.userData); // Get current user for authorization checks
  const authStatus = useSelector(state => state.auth.authStatus); // Check if user is logged in
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated (AuthLayout should catch this, but good defensive check)
    if (!authStatus) {
      navigate('/login');
      return;
    }

    const fetchEventDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchedEvent = await eventService.getEventById(eventId);
        setEvent(fetchedEvent);
      } catch (err) {
        console.error("EventDetails fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) { // Only fetch if eventId is available
      fetchEventDetails();
    }

  }, [eventId, authStatus, navigate]); // Rerun if eventId or authStatus changes

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Event Details...</h2>
        <p className="text-gray-600 mt-4">Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load event details. Please check the ID or try again.</p>
        <Link to="/events" className="text-blue-600 hover:underline mt-4 block">Back to Events List</Link>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Event Not Found</h2>
        <p className="text-gray-600 mt-4">The event you are looking for does not exist.</p>
        <Link to="/events" className="text-blue-600 hover:underline mt-4 block">Back to Events List</Link>
      </div>
    );
  }

  // Helper to display QR code image
  const renderQrCode = () => {
    if (!event.attendanceQrCode) return <p className="text-gray-600">QR Code not available.</p>;
    return (
      <div className="text-center">
        <img 
          src={event.attendanceQrCode} 
          alt="Event QR Code" 
          className="w-48 h-48 mx-auto border border-gray-300 p-2 bg-white rounded-lg shadow-md" 
        />
        <p className="text-sm text-gray-500 mt-2">Scan this QR code for attendance.</p>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">{event.title}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Event Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> {event.startTime} - {event.endTime}</p>
          <p><strong>Location:</strong> {event.locationName}</p>
          <p><strong>Coordinates:</strong> Lat {event.locationCoordinates.coordinates[1]}, Lng {event.locationCoordinates.coordinates[0]}</p>
          <p><strong>Geofence Radius:</strong> {event.geoFenceRadiusKm} km</p>
          <p><strong>Status:</strong> <span className={`font-semibold ${event.status === 'upcoming' ? 'text-blue-500' : event.status === 'active' ? 'text-green-500' : event.status === 'completed' ? 'text-gray-500' : 'text-red-500'}`}>{event.status}</span></p>
          <p><strong>Created By:</strong> {event.createdBy?.fullName} (@{event.createdBy?.username})</p>
          <p><strong>Created On:</strong> {new Date(event.createdAt).toLocaleDateString()}</p>
        </div>
        
        {/* Attendance QR Code Section (Only if Admin/NGO and creator) */}
        {user && (user.role === 'admin' || user.role === 'ngo') && event.createdBy?._id === user._id && (
          <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Attendance QR Code</h3>
              {renderQrCode()}
              {event.attendanceToken && (
                <p className="text-sm text-gray-500 mt-2">Token expires: {new Date(event.attendanceTokenExpiresAt).toLocaleTimeString()} ({new Date(event.attendanceTokenExpiresAt).toLocaleDateString()})</p>
              )}
              {/* TODO: Add Refresh QR button (Admin only) */}
          </div>
        )}

        {/* Waste Collected (if event is completed) */}
        {event.status === 'completed' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">Completion Details</h3>
            <p className="text-lg"><strong>Wet Waste:</strong> {event.wetWasteCollectedKg || 0} kg</p>
            <p className="text-lg"><strong>Dry Waste:</strong> {event.dryWasteCollectedKg || 0} kg</p>
            {event.otherWasteDetails && <p className="text-lg"><strong>Other Details:</strong> {event.otherWasteDetails}</p>}
            {event.eventSummary && <p className="text-lg"><strong>Summary:</strong> {event.eventSummary}</p>}
            {/* TODO: Add Edit Completion Details button (Admin only) */}
          </div>
        )}

        {/* Action Buttons (e.g., Enroll, Leave, Manage - based on user role/event status) */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            {/* Link to Edit Event for creator admin */}
            {user && user.role === 'admin' && event.createdBy?._id === user._id && (
                <>
                    {(event.status === 'upcoming' || event.status === 'active') && (
                        <Link to={`/events/edit/${event._id}`} className="btn btn-secondary bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md transition-colors">
                            Edit Event Details
                        </Link>
                    )}
                    {event.status === 'active' && ( // Allow submitting details while active or completed
                        <Link to={`/events/complete/${event._id}`} className="btn btn-secondary bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                            Submit Completion Details
                        </Link>
                    )}
                </>
            )}
            {/* TODO: Add Enroll/Leave Event buttons (Users) */}
            {/* TODO: Add Admin-specific actions (change status, delete) */}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;