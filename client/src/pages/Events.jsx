  

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1'; // Change if your backend URL is different


function EventCard({ event }) {
  const [joining, setJoining] = React.useState(false);
  const [joinMsg, setJoinMsg] = React.useState('');
  const [alreadyJoined, setAlreadyJoined] = React.useState(false);

  useEffect(() => {
    // Assume event.attendees is an array of user IDs who joined
    const userId = localStorage.getItem('userId'); // Store userId in localStorage after login
    if (event.attendees && userId && event.attendees.includes(userId)) {
      setAlreadyJoined(true);
      setJoinMsg('You have already joined this event.');
    }
  }, [event]);

  const handleJoin = async () => {
    setJoining(true);
    setJoinMsg('');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(`${API_BASE_URL}/events/${event._id}/join`, {}, { headers });
      if (res.data.success) {
        setJoinMsg('Successfully joined event!');
        setAlreadyJoined(true);
      } else {
        setJoinMsg(res.data.message || 'Could not join event.');
      }
    } catch (err) {
      setJoinMsg(err.response?.data?.message || 'Could not join event.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-2 text-blue-700">{event.title}</h3>
      <p className="text-gray-700 mb-2">{event.description}</p>
      <p className="text-gray-500 mb-1">Date: {new Date(event.date).toLocaleDateString()}</p>
      <p className="text-gray-500 mb-1">Location: {event.location}</p>
      <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleJoin}
        disabled={joining || alreadyJoined}
      >
        {alreadyJoined ? 'Already Joined' : (joining ? 'Joining...' : 'Join Event')}
      </button>
      {joinMsg && <p className="mt-2 text-green-600">{joinMsg}</p>}
    </div>
  );
}

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/events`, { headers });
        if (res.data.success) {
          setEvents(res.data.data);
        } else {
          setError(res.data.message || 'Failed to fetch events.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch events.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold mb-4">Events Page</h2>
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold mb-4">Events Page</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <h2 className="text-3xl font-semibold mb-4 text-center">Upcoming Cleanup Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-600 text-center">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;