// client/src/pages/Groups/GroupDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import groupService from '../../api/groups.js';
import { useSelector } from 'react-redux';

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.userData);
  const authStatus = useSelector(state => state.auth.authStatus);
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false); // New state for action buttons loading
  const [actionError, setActionError] = useState(''); // New state for action button errors

  useEffect(() => {
    if (!authStatus) { // AuthLayout should protect, but good defensive check
      navigate('/login');
      return;
    }

    const fetchGroupDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const fetchedGroup = await groupService.getGroupById(groupId);
        setGroup(fetchedGroup);
      } catch (err) {
        console.error("GroupDetails fetch error:", err.response?.data || err.message);
        setError(err.message || 'Failed to load group details.');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchGroupDetails();
    }

  }, [groupId, authStatus, navigate]);

  /**
   * Handles the action to join a group.
   */
  const handleJoinGroup = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updatedGroup = await groupService.joinGroup(groupId);
      setGroup(updatedGroup); // Update local state with new group data (including new member)
      // Optionally show a success notification
    } catch (err) {
      console.error("Join Group Error:", err);
      setActionError(err.message || 'Failed to join group.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handles the action to leave a group.
   */
  const handleLeaveGroup = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const updatedGroup = await groupService.leaveGroup(groupId);
      setGroup(updatedGroup); // Update local state with new group data (member removed)
      // Optionally show a success notification
    } catch (err) {
      console.error("Leave Group Error:", err);
      setActionError(err.message || 'Failed to leave group.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold">Loading Group Details...</h2>
        <p className="text-gray-600 mt-4">Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h2 className="text-3xl font-semibold text-red-600">Error: {error}</h2>
        <p className="text-gray-600 mt-4">Could not load group details. This might be a private group or you are not a member.</p>
        <Link to="/groups" className="text-blue-600 hover:underline mt-4 block">Back to Groups List</Link>
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
  
  // Determine if the current user is a member of this group
  // (Note: user?.id is from Redux, member.userId._id is from populated Mongoose object)
  const isCurrentUserMember = group.members.some(member => member.userId._id === user?._id);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">{group.name}</h1>
      
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">Group Information</h2>
        {actionError && <div className="alert alert-danger text-center mb-4">{actionError}</div>} {/* Display action errors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg mb-6">
          <p><strong>Description:</strong> {group.description || 'No description provided.'}</p>
          <p><strong>Status:</strong> {group.isPublic ? 'Public' : 'Private'}</p>
          <p><strong>Admin:</strong> {group.admin?.fullName} (@{group.admin?.username})</p>
          <p><strong>Created On:</strong> {new Date(group.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Members List */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-blue-600">Members ({group.members.length})</h3>
          {group.members.length === 0 ? (
            <p className="text-gray-600">No members in this group yet.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {group.members.map(member => (
                <li key={member.userId._id} className="flex items-center text-gray-700 bg-gray-50 p-2 rounded-md shadow-sm">
                  {member.userId.profilePicture && (
                    <img 
                      src={member.userId.profilePicture} 
                      alt={member.userId.username} 
                      className="w-8 h-8 rounded-full object-cover mr-2" 
                    />
                  )}
                  <span>{member.userId.fullName} (@{member.userId.username})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Buttons (Join/Leave/Chat) */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-4">
            {!isCurrentUserMember ? (
                // Only show Join if not a member and group is public
                group.isPublic && (
                    <button 
                        onClick={handleJoinGroup} // <-- ADD onClick handler
                        className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                        disabled={actionLoading} // Disable button when action is loading
                    >
                        {actionLoading ? 'Joining...' : 'Join Group'} {/* Dynamic text */}
                    </button>
                )
            ) : (
                // Show Leave and Chat buttons if already a member
                <>
                    {group.admin?._id !== user?._id && ( // Prevent admin from leaving their own group
                        <button 
                            onClick={handleLeaveGroup} // <-- ADD onClick handler
                            className="btn btn-secondary bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
                            disabled={actionLoading} // Disable button when action is loading
                        >
                            {actionLoading ? 'Leaving...' : 'Leave Group'} {/* Dynamic text */}
                        </button>
                    )}
                    <Link to={`/groups/${group._id}/chat`} className="btn btn-primary bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                        Go to Chat
                    </Link>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;