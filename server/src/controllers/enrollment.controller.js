// We'll create a new controller file to handle enrollment-specific logic. 
// This helps keep event.controller.js focused solely on event CRUD and main event properties.

// server/src/controllers/enrollment.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Event } from "../models/Event.js"; // Import Event model
import { User } from "../models/User.js";   // Import User model (optional, for future checks)
import mongoose from 'mongoose'; // For ObjectId


// @desc    User enrolls in an event
// @route   POST /api/v1/events/:id/enroll
// @access  Protected (User or Admin acting as User)
const enrollInEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user._id; // User ID from the authenticated request

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid Event ID format.");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Check if the event is still 'upcoming' or 'active' for enrollment
  if (event.status !== 'upcoming' && event.status !== 'active') {
    throw new ApiError(400, "Cannot enroll in an event that is not upcoming or active.");
  }

  // Check if user is already enrolled
  const isAlreadyEnrolled = event.enrolledUsers.some(
    (enrollment) => enrollment.userId.equals(userId)
  );

  if (isAlreadyEnrolled) {
    throw new ApiError(400, "You are already enrolled in this event.");
  }

  // Add user to enrolledUsers array
  event.enrolledUsers.push({ userId, enrolledAt: Date.now() });
  await event.save();

  // You might want to update user's gamification points for enrolling here (optional)
  // Or send a confirmation email/notification (future feature)

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Successfully enrolled in the event!"));
});


// @desc    User leaves an event
// @route   DELETE /api/v1/events/:id/enroll
// @access  Protected (User or Admin acting as User)
const leaveEvent = asyncHandler(async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user._id; // User ID from the authenticated request

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid Event ID format.");
  }

  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Optional: Prevent leaving events that are already completed or cancelled
  if (event.status === 'completed' || event.status === 'cancelled') {
    throw new ApiError(400, "Cannot leave an event that is already completed or cancelled.");
  }

  // Check if user is actually enrolled
  const initialEnrollmentCount = event.enrolledUsers.length;
  event.enrolledUsers = event.enrolledUsers.filter(
    (enrollment) => !enrollment.userId.equals(userId)
  );

  if (event.enrolledUsers.length === initialEnrollmentCount) {
    throw new ApiError(400, "You are not currently enrolled in this event.");
  }

  await event.save();

  // You might want to deduct gamification points here if previously awarded (optional)

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Successfully left the event!"));
});

// @desc    Get enrolled users for a specific event
// @route   GET /api/v1/events/:id/enrolled-users
// @access  Protected (Admin only, or admin who created the event)
const getEnrolledUsersForEvent = asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid Event ID format.");
    }

    const event = await Event.findById(eventId)
        .populate('enrolledUsers.userId', 'fullName username email profilePicture gamificationPoints'); // Populate enrolled user details

    if (!event) {
        throw new ApiError(404, "Event not found.");
    }

    // Authorization check: Only admin who created the event or NGO can view enrolled users
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'ngo') {
        throw new ApiError(403, "You are not authorized to view enrolled users for this event.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, event.enrolledUsers, "Enrolled users fetched successfully!"));
});


export {
  enrollInEvent,
  leaveEvent,
  getEnrolledUsersForEvent,
};