// client/src/pages/Groups.jsx
import React, { useEffect, useState } from 'react';
import groupService from '../api/groups.js';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authStatus = useSelector(state => state.auth.authStatus);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      setError('');
      try {
        const allGroups = await groupService.getAllGroups(); 
        setGroups(allGroups);
      } catch (err) {
        console.error("Groups fetch error:", err.response?.data || err.message);
        setError(err.message || 'Failed to load groups. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (authStatus) {
        fetchGroups();
    } else {
        setLoading(false);
        setError("Please log in to view groups.");
    }
  }, [authStatus]);

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Groups...</h2>
        <p className="text-gray-600 mt-4">Connecting you with cleanup communities.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        {!authStatus && <p className="text-gray-600 mt-4">You need to be logged in to view groups. Please <Link to="/login" className="text-blue-600 hover:underline">login</Link>.</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">Cleanup Community Groups</h2>
      {groups.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No groups available yet. Create one or check back later!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <div key={group._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow flex flex-col">
              <h3 className="text-xl font-semibold mb-2 text-blue-700">{group.name}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{group.description || 'No description provided.'}</p>
              <p className="text-gray-600 text-sm mb-2"><strong>Admin:</strong> {group.admin?.fullName} (@{group.admin?.username})</p>
              <p className="text-gray-600 text-sm mb-4"><strong>Members:</strong> {group.members.length}</p>
              <div className="mt-auto flex justify-end">
                <Link 
                  to={`/groups/${group._id}`} // <--- Fixed "View Details" link
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  View Details
                </Link>
                {/* TODO: Add Join/Leave Group buttons here based on user membership */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;