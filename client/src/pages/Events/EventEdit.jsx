// client/src/pages/Events/EventEdit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import eventService from '../../api/events.js'; // Import event service

const EventEdit = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.userData); // Current logged-in user
  const authStatus = useSelector(state => state.auth.authStatus);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '', // Format as YYYY-MM-DD for input type="date"
    startTime: '',
    endTime: '',
    locationName: '',
    latitude: '',
    longitude: '',
    geoFenceRadiusKm: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authStatus || !user) {
      navigate('/login');
      return;
    }

    const fetchEventData = async () => {
      setLoading(true);
      setError('');
      try {
        const eventData = await eventService.getEventById(eventId);
        
        // Ensure only creator admin can edit and event is not completed/cancelled
        if (eventData.createdBy._id !== user._id) { // Assuming createdBy is populated
            setError('You are not authorized to edit this event.');
            // Optionally redirect to event details or dashboard
            navigate(`/events/${eventId}`); 
            return;
        }
        if (eventData.status === 'completed' || eventData.status === 'cancelled') {
            setError('Cannot edit details of a completed or cancelled event.');
            navigate(`/events/${eventId}`); 
            return;
        }

        // Format date for input type="date"
        const formattedDate = eventData.date ? new Date(eventData.date).toISOString().split('T')[0] : '';

        setFormData({
          title: eventData.title,
          description: eventData.description,
          date: formattedDate,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          locationName: eventData.locationName,
          latitude: eventData.locationCoordinates.coordinates[1],
          longitude: eventData.locationCoordinates.coordinates[0],
          geoFenceRadiusKm: eventData.geoFenceRadiusKm,
        });
      } catch (err) {
        console.error("EventEdit fetch error:", err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load event for editing.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, authStatus, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      // Ensure numbers are sent as numbers, not strings from form
      const dataToSend = {
          ...formData,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          geoFenceRadiusKm: Number(formData.geoFenceRadiusKm),
      };

      const response = await eventService.updateEvent(eventId, dataToSend); 

      if (response) { // Assuming updateEvent returns true or the updated event object on success
        navigate(`/events/${eventId}`); // Redirect back to event details page
      } else {
        setSubmitError('Failed to update event (no response from service).');
      }
    } catch (err) {
      console.error("EventEdit submit error:", err.response?.data || err.message);
      setSubmitError(err.response?.data?.message || 'Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Event for Editing...</h2>
        <p className="text-gray-600 mt-4">Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load event for editing. It might be completed/cancelled or you are not authorized.</p>
        <Link to={`/events/${eventId}`} className="text-blue-600 hover:underline mt-4 block">Back to Event Details</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Edit Event: {formData.title}</h1>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg text-left">
        {submitError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{submitError}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
            <input type="text" id="title" name="title" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.title} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="locationName" className="block text-gray-700 text-sm font-bold mb-2">Location Name:</label>
            <input type="text" id="locationName" name="locationName" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.locationName} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group col-span-1 md:col-span-2">
            <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
            <textarea id="description" name="description" rows="4" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.description} onChange={handleChange} required disabled={isSubmitting}></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
            <input type="date" id="date" name="date" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.date} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="startTime" className="block text-gray-700 text-sm font-bold mb-2">Start Time:</label>
            <input type="time" id="startTime" name="startTime" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.startTime} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="endTime" className="block text-gray-700 text-sm font-bold mb-2">End Time:</label>
            <input type="time" id="endTime" name="endTime" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.endTime} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="latitude" className="block text-gray-700 text-sm font-bold mb-2">Latitude:</label>
            <input type="number" step="any" id="latitude" name="latitude" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.latitude} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="longitude">Longitude:</label>
            <input type="number" step="any" id="longitude" name="longitude" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.longitude} onChange={handleChange} required disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="geoFenceRadiusKm" className="block text-gray-700 text-sm font-bold mb-2">Geofence Radius (km):</label>
            <input type="number" step="0.1" min="0.1" max="10" id="geoFenceRadiusKm" name="geoFenceRadiusKm" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formData.geoFenceRadiusKm} onChange={handleChange} required disabled={isSubmitting} />
          </div>
        </div>

        <div className="flex justify-end mt-8 space-x-4">
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Event'}
          </button>
          <Link to={`/events/${eventId}`} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EventEdit;