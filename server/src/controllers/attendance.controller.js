// server/src/controllers/attendance.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Event } from "../models/Event.js";
import { Attendance } from "../models/Attendance.js"; // Import Attendance model
import { User } from "../models/User.js";
import mongoose from 'mongoose';
import { z } from 'zod';
import * as geolib from 'geolib'; // Import geolib for distance calculation
import QRCode from 'qrcode'; // For QR code data parsing (if needed, though not directly used for parsing here)
import moment from 'moment-timezone';

// Zod Schema for QR scan request
const scanQrSchema = z.object({
  qrData: z.string().min(1, "QR data is required"),
  userLatitude: z.number().min(-90).max(90),
  userLongitude: z.number().min(-180).max(180),
});

// @desc    User scans QR code to mark attendance
// @route   POST /api/v1/attendance/scan-qr
// @access  Protected (User or Admin acting as user)
// const scanQrForAttendance = asyncHandler(async (req, res) => {
//   const { success, data, error } = scanQrSchema.safeParse(req.body);
//   if (!success) {
//     throw new ApiError(400, error.errors[0].message);
//   }

//   const { qrData, userLatitude, userLongitude } = data;
//   const userId = req.user._id;

//   // 1. Parse QR Data
//   let parsedQrData;
//   try {
//     parsedQrData = JSON.parse(qrData);
//     if (!parsedQrData.eventId || !parsedQrData.token) {
//       throw new Error("Invalid QR data format: Missing eventId or token.");
//     }
//   } catch (parseError) {
//     throw new ApiError(400, "Invalid QR code data. Please scan a valid event QR code.");
//   }

//   const { eventId, token: scannedToken } = parsedQrData;

//   if (!mongoose.Types.ObjectId.isValid(eventId)) {
//     throw new ApiError(400, "Invalid Event ID from QR code.");
//   }

//   // 2. Fetch Event and User
//   const event = await Event.findById(eventId);
//   const user = await User.findById(userId); // Fetch user to confirm status/role if needed, though verifyJWT covers basic auth

//   if (!event) {
//     throw new ApiError(404, "Event not found from QR code.");
//   }
//   if (!user) { // Should ideally not happen if verifyJWT passed
//     throw new ApiError(401, "Authenticated user not found.");
//   }

//   // 3. Check Enrollment Status
//   const isEnrolled = event.enrolledUsers.some(
//     (enrollment) => enrollment.userId.equals(userId)
//   );

//   if (!isEnrolled) {
//     throw new ApiError(403, "You must be enrolled in this event to mark attendance.");
//   }

//   // 4. Check Event Attendance Window
//   const currentTime = moment().toDate();
//   if (currentTime < event.attendanceWindowStart || currentTime > event.attendanceWindowEnd) {
//     throw new ApiError(400, "Attendance can only be marked within the designated window for this event.");
//   }

//   // 5. Validate QR Code Token
//   if (!event.attendanceToken || event.attendanceToken !== scannedToken) {
//     throw new ApiError(401, "Invalid or expired QR code token. Please scan the current code.");
//   }
//   if (event.attendanceTokenExpiresAt < currentTime) {
//     throw new ApiError(401, "QR code has expired. Please ask the admin for a new one.");
//   }

//   // 6. Perform Geo-fencing Check
//   const eventLat = event.locationCoordinates.coordinates[1]; // Latitude
//   const eventLng = event.locationCoordinates.coordinates[0]; // Longitude

//   const distanceMeters = geolib.getDistance(
//     { latitude: userLatitude, longitude: userLongitude },
//     { latitude: eventLat, longitude: eventLng }
//   );
//   const isWithinGeofence = distanceMeters <= (event.geoFenceRadiusKm * 1000); // Convert km to meters

//   if (!isWithinGeofence) {
//     throw new ApiError(403, `You are outside the attendance zone (${event.geoFenceRadiusKm} km radius). Current distance: ${Math.round(distanceMeters / 1000)} km.`);
//   }

//   // 7. Check if attendance already marked for this event/user (unique index handles this on DB level, but check proactively)
//   const existingAttendance = await Attendance.findOne({ eventId, userId });
//   if (existingAttendance) {
//     throw new ApiError(409, "You have already marked attendance for this event.");
//   }

//   // 8. Record Attendance
//   const gamificationPoints = 10; // Example: Award 10 points for attendance
//   const attendance = await Attendance.create({
//     eventId,
//     userId,
//     attendedAt: currentTime,
//     scannedLocation: {
//       type: 'Point',
//       coordinates: [userLongitude, userLatitude] // GeoJSON [longitude, latitude]
//     },
//     isWithinGeofence,
//     gamificationPointsAwarded: gamificationPoints,
//     qrCodeTokenUsed: scannedToken,
//     verificationStatus: 'verified',
//   });

//   if (!attendance) {
//     throw new ApiError(500, "Failed to record attendance.");
//   }

//   // 9. Update User's Gamification Points
//   await User.findByIdAndUpdate(userId, { $inc: { gamificationPoints: gamificationPoints } }, { new: true });

//   return res
//     .status(200)
//     .json(new ApiResponse(200, { attendance, userGamificationPoints: user.gamificationPoints + gamificationPoints }, "Attendance marked successfully!"));
// });
const scanQrForAttendance = asyncHandler(async (req, res) => {
  // ... (success, data, error parsing) ...

  const { qrData, userLatitude, userLongitude } = data;
  const userId = req.user._id;

  // 1. Parse QR Data (as before)
  let parsedQrData;
  try {
    parsedQrData = JSON.parse(qrData);
    if (!parsedQrData.eventId || !parsedQrData.token) {
      throw new Error("Invalid QR data format: Missing eventId or token.");
    }
  } catch (parseError) {
    throw new ApiError(400, "Invalid QR code data. Please scan a valid event QR code.");
  }

  const { eventId, token: scannedToken } = parsedQrData;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new ApiError(400, "Invalid Event ID from QR code.");
  }

  // 2. Fetch Event and User (as before)
  const event = await Event.findById(eventId);
  const user = await User.findById(userId);

  if (!event) {
    throw new ApiError(404, "Event not found from QR code.");
  }
  if (!user) {
    throw new ApiError(401, "Authenticated user not found.");
  }

  // --- ADDED EXPLICIT STATUS CHECK ---
  if (event.status !== 'upcoming' && event.status !== 'active') {
    throw new ApiError(400, `Attendance cannot be marked for an event with status: ${event.status}.`);
  }
  // --- END ADDED CHECK ---

  // 3. Check Enrollment Status (as before)
  const isEnrolled = event.enrolledUsers.some(
    (enrollment) => enrollment.userId.equals(userId)
  );

  if (!isEnrolled) {
    throw new ApiError(403, "You must be enrolled in this event to mark attendance.");
  }

  // 4. Check Event Attendance Window (as before)
  const currentTime = moment().toDate();
  if (currentTime < event.attendanceWindowStart || currentTime > event.attendanceWindowEnd) {
    throw new ApiError(400, "Attendance can only be marked within the designated window for this event.");
  }

  // 5. Validate QR Code Token (as before)
  if (!event.attendanceToken || event.attendanceToken !== scannedToken) {
    throw new ApiError(401, "Invalid or expired QR code token. Please scan the current code.");
  }
  if (event.attendanceTokenExpiresAt < currentTime) {
    throw new ApiError(401, "QR code has expired. Please ask the admin for a new one.");
  }

  // 6. Perform Geo-fencing Check (as before)
  const eventLat = event.locationCoordinates.coordinates[1];
  const eventLng = event.locationCoordinates.coordinates[0];

  const distanceMeters = geolib.getDistance(
    { latitude: userLatitude, longitude: userLongitude },
    { latitude: eventLat, longitude: eventLng }
  );
  const isWithinGeofence = distanceMeters <= (event.geoFenceRadiusKm * 1000);

  if (!isWithinGeofence) {
    throw new ApiError(403, `You are outside the attendance zone (${event.geoFenceRadiusKm} km radius). Current distance: ${Math.round(distanceMeters / 1000)} km.`);
  }

  // 7. Check if attendance already marked (as before)
  const existingAttendance = await Attendance.findOne({ eventId, userId });
  if (existingAttendance) {
    throw new ApiError(409, "You have already marked attendance for this event.");
  }

  // 8. Record Attendance (as before)
  const gamificationPoints = 10;
  const attendance = await Attendance.create({
    eventId,
    userId,
    attendedAt: currentTime,
    scannedLocation: {
      type: 'Point',
      coordinates: [userLongitude, userLatitude]
    },
    isWithinGeofence,
    gamificationPointsAwarded: gamificationPoints,
    qrCodeTokenUsed: scannedToken,
    verificationStatus: 'verified',
  });

  if (!attendance) {
    throw new ApiError(500, "Failed to record attendance.");
  }

  // 9. Update User's Gamification Points (as before)
  await User.findByIdAndUpdate(userId, { $inc: { gamificationPoints: gamificationPoints } }, { new: true });

  return res
    .status(200)
    .json(new ApiResponse(200, { attendance, userGamificationPoints: user.gamificationPoints + gamificationPoints }, "Attendance marked successfully!"));
});

// @desc    Admin/NGO views attendance records for an event
// @route   GET /api/v1/attendance/events/:id
// @access  Protected (Admin/NGO)
const getEventAttendance = asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new ApiError(400, "Invalid Event ID format.");
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new ApiError(404, "Event not found.");
    }

    // Authorization: Only admin who created event or NGO can view attendance
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'ngo') {
        throw new ApiError(403, "You are not authorized to view attendance for this event.");
    }

    const attendanceRecords = await Attendance.find({ eventId })
        .populate('userId', 'fullName username email profilePicture gamificationPoints') // Populate user details
        .populate('eventId', 'title date locationName'); // Populate event details

    return res
        .status(200)
        .json(new ApiResponse(200, attendanceRecords, "Attendance records fetched successfully!"));
});

// @desc    Admin/NGO views all attendance records (platform-wide)
// @route   GET /api/v1/attendance
// @access  Protected (NGO only)
const getAllAttendance = asyncHandler(async (req, res) => {
    // Only NGO can view all attendance across the platform
    if (req.user.role !== 'ngo') {
        throw new ApiError(403, "Only NGO personnel can view all attendance records.");
    }

    const { userId, eventId, verificationStatus } = req.query;
    const filter = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = new mongoose.Types.ObjectId(userId);
    }
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        filter.eventId = new mongoose.Types.ObjectId(eventId);
    }
    if (verificationStatus) {
        filter.verificationStatus = verificationStatus;
    }

    const attendanceRecords = await Attendance.find(filter)
        .populate('userId', 'fullName username email profilePicture')
        .populate('eventId', 'title date locationName createdBy');

    return res
        .status(200)
        .json(new ApiResponse(200, attendanceRecords, "All attendance records fetched successfully!"));
});


export {
  scanQrForAttendance,
  getEventAttendance,
  getAllAttendance,
};