// This component will be the actual chat interface. 
// It will fetch historical messages on load and integrate the Socket.IO client for real-time communication.

// client/src/pages/Groups/GroupChatPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
// import { io } from 'socket.io-client'; // Import Socket.IO client library
import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js'; // <-- Change to CDN import

import groupService from '../../api/groups.js'; // Import group service

const API_BASE_URL = 'http://localhost:5000'; // Your backend base URL for Socket.IO connection

const GroupChatPage = () => {
  const { groupId } = useParams(); // Get groupId from URL
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.userData); // Current logged-in user
  const authStatus = useSelector(state => state.auth.authStatus);

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);

  // Ref for the socket instance (persists across renders)
  const socketRef = useRef(null);
  // Ref for messages container to enable auto-scrolling
  const messagesEndRef = useRef(null);

  // Effect to scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Main useEffect for fetching data and setting up Socket.IO
  useEffect(() => {
    if (!authStatus || !user) { // Ensure user is logged in
      navigate('/login');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    const initializeChat = async () => {
      setLoading(true);
      setError('');

      try {
        // 1. Fetch Group Details (to verify membership and get group name)
        const fetchedGroup = await groupService.getGroupById(groupId);
        setGroup(fetchedGroup);

        // Check if user is a member of this group (backend also checks, but frontend validation is good)
        const isMember = fetchedGroup.members.some(member => member.userId._id === user._id);
        if (!isMember) {
          setError('You are not a member of this group. You cannot access its chat.');
          setLoading(false);
          // navigate(`/groups/${groupId}`); // Redirect to group details page if not a member
          return;
        }

        // 2. Fetch Historical Messages
        const historicalMessages = await groupService.getGroupMessages(groupId);
        setMessages(historicalMessages);

        // 3. Initialize Socket.IO connection
        socketRef.current = io(API_BASE_URL, {
          auth: {
            token: token // Send token for Socket.IO authentication
          },
          transports: ['websocket', 'polling'] // Prioritize WebSocket
        });

        // --- Socket.IO Event Listeners ---
        socketRef.current.on('connect', () => {
          console.log('Socket.IO Connected!', socketRef.current.id);
          setSocketConnected(true);
          // Emit joinGroup event to server (server will validate and add to room)
          socketRef.current.emit('joinGroup', groupId);
        });

        socketRef.current.on('disconnect', () => {
          console.log('Socket.IO Disconnected.');
          setSocketConnected(false);
        });

        socketRef.current.on('connect_error', (err) => {
          console.error('Socket.IO Connection Error:', err.message);
          setError(`Chat connection error: ${err.message}.`);
          setSocketConnected(false);
        });

        socketRef.current.on('groupError', (msg) => {
          console.error('Socket.IO Group Error:', msg);
          setError(`Group chat error: ${msg}.`);
        });

        socketRef.current.on('messageError', (msg) => {
          console.error('Socket.IO Message Error:', msg);
          setError(`Message sending error: ${msg}.`);
        });

        socketRef.current.on('receiveMessage', (message) => {
          console.log('New message received:', message);
          setMessages(prevMessages => [...prevMessages, message]); // Add new message to state
        });

        socketRef.current.on('userJoined', (msg) => {
          console.log('User Joined Event:', msg);
          setMessages(prevMessages => [...prevMessages, { _id: Date.now(), sender: { username: 'System' }, content: msg, createdAt: new Date() }]);
        });

        socketRef.current.on('userLeft', (msg) => {
          console.log('User Left Event:', msg);
          setMessages(prevMessages => [...prevMessages, { _id: Date.now(), sender: { username: 'System' }, content: msg, createdAt: new Date() }]);
        });

      } catch (err) {
        console.error("Error initializing chat:", err.response?.data || err.message);
        setError(err.message || 'Failed to initialize chat.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      initializeChat();
    }

    // Cleanup function for useEffect: disconnect socket when component unmounts
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting Socket.IO on component unmount.');
        socketRef.current.disconnect();
      }
    };

  }, [groupId, user, authStatus, navigate]); // Dependencies: Re-run if group ID or user/auth status changes

  /**
   * Handles sending a new message via Socket.IO.
   * @param {Event} e - The form submission event.
   */
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageContent.trim() || !socketRef.current || !socketConnected) {
      setError('Cannot send empty message or not connected to chat.');
      return;
    }
    setError(''); // Clear previous errors

    // Emit 'sendMessage' event to the server
    socketRef.current.emit('sendMessage', { 
        groupId: groupId, 
        content: newMessageContent.trim() 
    });
    setNewMessageContent(''); // Clear input field
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Chat...</h2>
        <p className="text-gray-600 mt-4">Connecting to group chat.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Please ensure you are a member of this group and logged in.</p>
        <Link to={`/groups/${groupId}`} className="text-blue-600 hover:underline mt-4 block">Back to Group Details</Link>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Group Not Found</h2>
        <p className="text-gray-600 mt-4">The group you are looking for does not exist.</p>
        <Link to="/groups" className="text-blue-600 hover:underline mt-4 block">Back to Groups List</Link>
      </div>
    );
  }
  
  // Render chat interface
  return (
    <div className="container mx-auto py-10 max-w-xl">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Chat: {group.name}</h1>
      <div className="bg-white rounded-lg shadow-lg flex flex-col h-[600px]"> {/* Fixed height for chat window */}
        {/* Messages Display Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg._id} className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start max-w-[80%] ${msg.sender._id === user._id ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Sender Profile Picture */}
                {msg.sender.profilePicture && msg.sender.username !== 'System' && (
                  <img 
                    src={msg.sender.profilePicture} 
                    alt={msg.sender.username} 
                    className={`w-8 h-8 rounded-full object-cover ${msg.sender._id === user._id ? 'ml-2' : 'mr-2'}`}
                  />
                )}
                {/* Message Bubble */}
                <div 
                  className={`p-3 rounded-lg shadow-sm ${msg.sender._id === user._id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} ${msg.sender.username === 'System' ? 'bg-yellow-100 text-gray-700 italic' : ''}`}
                >
                  {/* Sender Name */}
                  {msg.sender.username !== 'System' && (
                    <div className="font-semibold text-sm mb-1">
                      {msg.sender.fullName} (@{msg.sender.username})
                    </div>
                  )}
                  {/* Message Content */}
                  <p className="text-base break-words">{msg.content}</p>
                  {/* Timestamp */}
                  <span className={`text-xs mt-1 block ${msg.sender._id === user._id ? 'text-blue-200' : 'text-gray-500'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> {/* Element to scroll into view */}
        </div>

        {/* Message Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex items-center">
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 mr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!socketConnected || loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!socketConnected || loading}
          >
            Send
          </button>
        </form>
      </div>
      <div className="mt-4 text-center">
        <Link to={`/groups/${groupId}`} className="text-blue-600 hover:underline">Back to Group Details</Link>
      </div>
    </div>
  );
};

export default GroupChatPage;