    // server/src/controllers/admin.controller.js
    //
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.js";   // Import User model
import { Event } from "../models/Event.js"; // Import Event model for event data
import { Attendance } from "../models/Attendance.js"; // Import Attendance model
import { Order } from "../models/Order.js"; // Import Order model for total items/revenue
import mongoose from 'mongoose'; // For ObjectId and aggregation pipeline
import { z } from 'zod'; 

// Zod Schemas for validation (for NGO actions)
const updateAdminStatusSchema = z.object({
  status: z.enum(['active', 'rejected']), // NGO can set admin to active or rejected
  reason: z.string().trim().optional(), // Reason for rejection
});

const updateUserRoleSchema = z.object({
    role: z.enum(['user', 'admin', 'ngo']),
});

const updateUserStatusSchema = z.object({
    status: z.enum(['user_active', 'deactivated']), // For all users: active or deactivated
    reason: z.string().trim().optional(),
});


// --- NGO/Admin Management APIs ---

// @desc    NGO gets all pending admin registrations
// @route   GET /api/v1/admin/pending-admins
// @access  Protected (NGO only)
const getPendingAdmins = asyncHandler(async (req, res) => {
    // Only NGO can view pending admins
    if (req.user.role !== 'ngo') {
        throw new ApiError(403, "Only NGO personnel can view pending admin registrations.");
    }

    const pendingAdmins = await User.find({ role: 'admin', status: 'pending_verification' })
        .select('-password -refreshToken') // Exclude sensitive data
        .sort({ createdAt: 1 }); // Oldest first for review

    return res
        .status(200)
        .json(new ApiResponse(200, pendingAdmins, "Pending admin registrations fetched successfully!"));
});

// @desc    NGO approves or rejects an admin registration
// @route   PATCH /api/v1/admin/approve-reject-admin/:id
// @access  Protected (NGO only)
const approveRejectAdmin = asyncHandler(async (req, res) => {
    const { success, data, error } = updateAdminStatusSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { status, reason } = data; // status will be 'active' or 'rejected'

    const adminId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
        throw new ApiError(400, "Invalid Admin ID format.");
    }

    const adminUser = await User.findById(adminId);

    if (!adminUser || adminUser.role !== 'admin' || adminUser.status !== 'pending_verification') {
        throw new ApiError(404, "Admin registration not found or not in pending state.");
    }

    adminUser.status = status;
    if (reason && status === 'rejected') {
        // You might want a dedicated field for rejection reasons in User model
        // For now, let's just log or store in a generic 'notes' field if you add one
        adminUser.notes = reason; // Assuming 'notes' field might exist for NGO. Add to User model if needed.
    }
    await adminUser.save();

    let message = `Admin registration ${adminUser.username} ${status} successfully.`;
    if (status === 'rejected') {
        message += ` Reason: ${reason || 'Not specified'}`;
    }

    return res
        .status(200)
        .json(new ApiResponse(200, adminUser, message));
});

// @desc    NGO gets all users (can filter by role/status)
// @route   GET /api/v1/admin/users
// @access  Protected (NGO only)
const getAllUsers = asyncHandler(async (req, res) => {
    if (req.user.role !== 'ngo') {
        throw new ApiError(403, "Only NGO personnel can view all user accounts.");
    }

    const { role, status, search } = req.query; // Filters
    const filter = {};

    if (role && ['user', 'admin', 'ngo'].includes(role)) {
        filter.role = role;
    }
    if (status && ['user_active', 'pending_verification', 'active', 'rejected', 'deactivated'].includes(status)) {
        filter.status = status;
    }
    if (search) { // Search by username or email
        filter.$or = [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(filter).select('-password -refreshToken').sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, users, "All users fetched successfully!"));
});

// @desc    NGO updates a user's role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Protected (NGO only)
// const updateUserRole = asyncHandler(async (req, res) => {
//     const { success, data, error } = updateUserRoleSchema.safeParse(req.body);
//     if (!success) {
//         throw new ApiError(400, error.errors[0].message);
//     }
//     const { role } = data;

//     const userId = req.params.id;
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//         throw new ApiError(400, "Invalid User ID format.");
//     }

//     const user = await User.findById(userId);

//     if (!user) {
//         throw new ApiError(404, "User not found.");
//     }

//     // Prevent NGO from changing their own role, or other NGOs' roles directly (can adjust logic)
//     if (user._id.equals(req.user._id)) {
//         throw new ApiError(400, "You cannot change your own role through this endpoint.");
//     }
//     if (user.role === 'ngo' && req.user.role === 'ngo') {
//         throw new ApiError(403, "NGO personnel cannot change other NGO personnel's roles directly.");
//     }

//     user.role = role;
//     // If setting to admin, set status to pending_verification
//     if (role === 'admin' && user.status === 'user_active') {
//         user.status = 'pending_verification';
//     } else if (role === 'user' && user.status === 'active') { // If admin becomes user
//         user.status = 'user_active';
//     }

//     await user.save();

//     return res
//         .status(200)
//         .json(new ApiResponse(200, user, `User ${user.username} role updated to ${role} successfully!`));
// });
const updateUserRole = asyncHandler(async (req, res) => {
    // Validate request body
    const { success, data, error } = updateUserRoleSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { role } = data;

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID format.");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Prevent NGO from changing their own role, or other NGOs' roles directly
    if (user._id.equals(req.user._id)) {
        throw new ApiError(400, "You cannot change your own role through this endpoint.");
    }
    if (user.role === 'ngo' && req.user.role === 'ngo') {
        throw new ApiError(403, "NGO personnel cannot change other NGO personnel's roles directly.");
    }

    user.role = role;
    // If setting to admin, set status to pending_verification
    if (role === 'admin' && user.status === 'user_active') {
        user.status = 'pending_verification';
    } else if (role === 'user' && (user.status === 'active' || user.status === 'pending_verification')) {
        // If admin is active or pending_verification and becomes user, set to user_active
        user.status = 'user_active';
    }

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, user, `User ${user.username} role updated to ${role} successfully!`));
});


// @desc    NGO deactivates/reactivates a user account
// @route   PATCH /api/v1/admin/users/:id/status
// @access  Protected (NGO only)
const updateUserAccountStatus = asyncHandler(async (req, res) => {
    const { success, data, error } = updateUserStatusSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { status, reason } = data; // status is 'user_active' or 'deactivated'

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID format.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Prevent NGO from deactivating their own account or other NGOs'
    if (user._id.equals(req.user._id)) {
        throw new ApiError(400, "You cannot change your own account status through this endpoint.");
    }
    if (user.role === 'ngo' && req.user.role === 'ngo') {
        throw new ApiError(403, "NGO personnel cannot change other NGO personnel's account status directly.");
    }

    user.status = status;
    // You might add a field like 'deactivationReason' to the User model
    if (status === 'deactivated' && reason) {
        user.deactivationReason = reason; // Add 'deactivationReason' field to User model if needed
    } else if (status === 'user_active') {
        user.deactivationReason = undefined; // Clear reason if reactivated
    }

    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, user, `User ${user.username} account status updated to ${status} successfully!`));
});

// --- Analytics / Leaderboard APIs ---

// @desc    Get overall platform statistics (total events, total waste, total users, etc.)
// @route   GET /api/v1/analytics/overview
// @access  Protected (Admin/NGO only)
const getPlatformOverview = asyncHandler(async (req, res) => {
    // if (req.user.role !== 'admin' && req.user.role !== 'ngo') {
    //     throw new ApiError(403, "Only admins or NGO personnel can view platform overview.");
    // }
    if (req.user.role !== 'ngo') { // <--- CHANGE THIS LINE
        throw new ApiError(403, "Only NGO personnel can view platform overview.");
    }

    const totalEvents = await Event.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user', status: 'user_active' });
    const totalAdmins = await User.countDocuments({ role: 'admin', status: 'active' });
    const totalNGOs = await User.countDocuments({ role: 'ngo', status: 'active' });
    
    // Aggregation for total waste collected across ALL completed events
    const wasteSummary = await Event.aggregate([
        { $match: { status: 'completed' } }, // Only count from completed events
        {
            $group: {
                _id: null, // Group all documents into one
                totalWetWasteKg: { $sum: "$wetWasteCollectedKg" },
                totalDryWasteKg: { $sum: "$dryWasteCollectedKg" },
            }
        },
        {
            $project: {
                _id: 0, // Exclude _id
                totalWetWasteKg: 1,
                totalDryWasteKg: 1,
            }
        }
    ]);

    // Aggregation for total unique attendees across ALL events
    const totalUniqueAttendeesResult = await Attendance.aggregate([
        { $group: { _id: "$userId" } }, // Group by userId to get unique attendees
        { $count: "totalUniqueAttendees" } // Count the unique user IDs
    ]);
    const totalUniqueAttendees = totalUniqueAttendeesResult[0]?.totalUniqueAttendees || 0;


    const overview = {
        totalEvents,
        totalUsers, // Active users only
        totalAdmins, // Active admins only
        totalNGOs,
        totalUniqueAttendees,
        wasteCollected: wasteSummary[0] || { totalWetWasteKg: 0, totalDryWasteKg: 0 },
        // Add more stats as needed (e.g., total orders placed, total products sold)
    };

    return res
        .status(200)
        .json(new ApiResponse(200, overview, "Platform overview statistics fetched successfully!"));
});

// @desc    Get leaderboard of users by gamification points
// @route   GET /api/v1/analytics/leaderboard/users
// @access  Protected (Any logged-in user can view)
const getUserLeaderboard = asyncHandler(async (req, res) => {
    const topUsers = await User.find({ role: 'user', status: 'user_active' }) // Only active regular users
        .select('fullName username profilePicture gamificationPoints')
        .sort({ gamificationPoints: -1 }) // Sort by points descending
        .limit(100); // Top 100 users

    return res
        .status(200)
        .json(new ApiResponse(200, topUsers, "User leaderboard fetched successfully!"));
});

// @desc    Get leaderboard of admins by a 'trust score' (event performance metrics)
// @route   GET /api/v1/analytics/leaderboard/admins
// @access  Protected (Admin/NGO can view, or public if desired)
const getAdminLeaderboard = asyncHandler(async (req, res) => {
    // Only active admins are considered
    const adminPerformance = await User.aggregate([
        { $match: { role: 'admin', status: 'active' } },
        {
            $lookup: { 
                from: 'events',
                localField: '_id',
                foreignField: 'createdBy',
                as: 'createdEvents'
            }
        },
        {
            $unwind: { path: '$createdEvents', preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: 'attendances',
                localField: 'createdEvents._id',
                foreignField: 'eventId',
                as: 'eventAttendances'
            }
        },
        {
            $group: {
                _id: '$_id',
                fullName: { $first: '$fullName' },
                username: { $first: '$username' },
                profilePicture: { $first: '$profilePicture' },
                gamificationPoints: { $first: '$gamificationPoints' },
                eventsCreatedCount: {
                    $sum: { $cond: [{ $ne: ['$createdEvents', null] }, 1, 0] } // Count actual events
                },
                totalUniqueAttendeesManaged: { $addToSet: '$eventAttendances.userId' }, // Get unique attendees
                totalWetWasteManagedKg: {
                    $sum: { $cond: [{ $eq: ['$createdEvents.status', 'completed'] }, '$createdEvents.wetWasteCollectedKg', 0] }
                },
                totalDryWasteManagedKg: {
                    $sum: { $cond: [{ $eq: ['$createdEvents.status', 'completed'] }, '$createdEvents.dryWasteCollectedKg', 0] }
                },
            }
        },
        {
            $addFields: {
                totalAttendeesManaged: { $size: '$totalUniqueAttendeesManaged' },
                // Calculate a simple 'trustScore' - customize this logic heavily!
                // Example: 50% from gamification points, 30% from events created, 20% from attendees
                // You'd need to normalize these if values vary wildly (e.g., div by max possible)
                trustScore: {
                    $add: [
                        { $divide: ['$gamificationPoints', 10] }, // Scale down points
                        { $multiply: ['$eventsCreatedCount', 50] }, // Events created worth 50 points each
                        { $multiply: ['$totalAttendeesManaged', 10] }, // Each attendee worth 10 points
                        { $divide: ['$totalWetWasteManagedKg', 1] }, // 1 point per kg wet waste
                        { $divide: ['$totalDryWasteManagedKg', 1] } // 1 point per kg dry waste
                    ]
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                profilePicture: 1,
                gamificationPoints: 1,
                eventsCreatedCount: 1,
                totalAttendeesManaged: 1,
                totalWetWasteManagedKg: 1,
                totalDryWasteManagedKg: 1,
                trustScore: 1,
            }
        },
        { $sort: { trustScore: -1 } }, // Sort by trust score descending
        { $limit: 100 } // Top 100 admins
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, adminPerformance, "Admin leaderboard fetched successfully!"));
});


export {
  getPendingAdmins,
  approveRejectAdmin,
  getAllUsers,
  updateUserRole,
  updateUserAccountStatus,
  getPlatformOverview,
  getUserLeaderboard,
  getAdminLeaderboard,
};