// server/src/controllers/event.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Event } from "../models/Event.js"; // Import Event model
import { User } from "../models/User.js";   // Import User model (for admin checks)
import { z } from 'zod'; // For validation
import QRCode from 'qrcode'; // For QR code generation
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises'; // For file system operations (saving QR codes)
import moment from 'moment-timezone'; // For timezone-aware date/time handling
import mongoose from 'mongoose'; // For ObjectId handling

// Zod Schemas for validation
const createEventSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters long"),
  description: z.string().trim().min(20, "Description must be at least 20 characters long"),
  date: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format (use YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"), // e.g., "10:00"
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),     // e.g., "13:00"
  locationName: z.string().trim().min(5, "Location name is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geoFenceRadiusKm: z.number().min(0.1, "Min radius 0.1km").max(10, "Max radius 10km").optional().default(1),
});

const updateEventSchema = z.object({
  title: z.string().trim().min(5).optional(),
  description: z.string().trim().min(20).optional(),
  date: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Invalid date format (use YYYY-MM-DD)").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  locationName: z.string().trim().min(5).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geoFenceRadiusKm: z.number().min(0.1).max(10).optional(),
});

const updateEventStatusSchema = z.object({
    status: z.enum(['upcoming', 'active', 'completed', 'cancelled']),
});

const submitEventDetailsSchema = z.object({
  wetWasteCollectedKg: z.number().min(0, "Waste collected cannot be negative"),
  dryWasteCollectedKg: z.number().min(0, "Waste collected cannot be negative"),
  otherWasteDetails: z.string().trim().optional(),
  eventSummary: z.string().trim().min(20, "Event summary is required").max(500, "Summary too long"),
});


// Helper to generate a unique QR code data string
// async function generateUniqueQrCodeData(eventId) {
//     // This token can be short-lived and refreshed periodically by admin
//     const uniqueToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//     const qrData = JSON.stringify({ eventId: eventId.toString(), token: uniqueToken, timestamp: Date.now() });

//     // For now, we'll store the data string directly. Later, if you save images:
//     // const __filename = fileURLToPath(import.meta.url);
//     // const __dirname = dirname(__filename);
//     // const qrCodeDir = join(__dirname, '../../public/qrcodes');
//     // await fs.mkdir(qrCodeDir, { recursive: true });
//     // const qrCodeFilePath = join(qrCodeDir, `${eventId}.png`);
//     // await QRCode.toFile(qrCodeFilePath, qrData);
//     // return `/public/qrcodes/${eventId}.png`; // Return a URL accessible from client

//     // For simplicity, just return the data string as base64 or a direct string
//     return QRCode.toDataURL(qrData); // Returns a base64 encoded image data URL
// }
async function generateUniqueQrCodeAndToken(eventId) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = moment().add(10, 'minutes').toDate(); // Token valid for 10 minutes from generation

    const qrData = JSON.stringify({
        eventId: eventId.toString(),
        token: token,
        // No timestamp needed in QR itself, just on backend token expiry
    });

    const qrCodeBase64 = await QRCode.toDataURL(qrData);

    return { qrCodeBase64, token, expiresAt };
}

// @desc    Admin creates a new event
// @route   POST /api/v1/events
// @access  Protected (admin only)
// const createEvent = asyncHandler(async (req, res) => {
//   const { success, data, error } = createEventSchema.safeParse(req.body);
//   if (!success) {
//     throw new ApiError(400, error.errors[0].message);
//   }

//   const { title, description, date, startTime, endTime, locationName, latitude, longitude, geoFenceRadiusKm } = data;

//   // Convert date and time strings to actual Date objects for window calculation
//   const eventDate = moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata'); // Specify timezone for consistency
//   const [startHour, startMinute] = startTime.split(':').map(Number);
//   const [endHour, endMinute] = endTime.split(':').map(Number);

//   const eventStartDateTime = eventDate.clone().set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 }).toDate();
//   const eventEndDateTime = eventDate.clone().set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 }).toDate();

//   // Set attendance window (e.g., opens 30 mins before, closes 30 mins after)
//   const attendanceWindowStart = moment(eventStartDateTime).subtract(30, 'minutes').toDate();
//   const attendanceWindowEnd = moment(eventEndDateTime).add(30, 'minutes').toDate();


//   // Check if admin is active (a redundancy but good for clarity)
//   if (req.user.role !== 'admin' || req.user.status !== 'active') {
//     throw new ApiError(403, "Only active admins can create events.");
//   }

//   const event = await Event.create({
//     title,
//     description,
//     date: eventDate.toDate(),
//     startTime,
//     endTime,
//     locationName,
//     locationCoordinates: {
//       type: 'Point',
//       coordinates: [longitude, latitude] // GeoJSON is [longitude, latitude]
//     },
//     geoFenceRadiusKm,
//     createdBy: req.user._id,
//     attendanceWindowStart,
//     attendanceWindowEnd,
//     status: 'upcoming',
//   });

//   if (!event) {
//     throw new ApiError(500, "Failed to create event.");
//   }

//   // Generate QR code data after event is created (to get event._id)
//   const qrCodeData = await generateUniqueQrCodeData(event._id);
//   event.attendanceQrCode = qrCodeData;
//   await event.save(); // Save the QR code data back to the event

//   return res
//     .status(201)
//     .json(new ApiResponse(201, event, "Event created successfully!"));
// });
const createEvent = asyncHandler(async (req, res) => {
  const { success, data, error } = createEventSchema.safeParse(req.body);
  if (!success) {
    throw new ApiError(400, error.errors[0].message);
  }

  const { title, description, date, startTime, endTime, locationName, latitude, longitude, geoFenceRadiusKm } = data;

  // Convert date and time strings to actual Date objects for window calculation
  const eventDate = moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata');
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const eventStartDateTime = eventDate.clone().set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 }).toDate();
  const eventEndDateTime = eventDate.clone().set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 }).toDate();

  // Set attendance window (e.g., opens 30 mins before, closes 30 mins after)
  const attendanceWindowStart = moment(eventStartDateTime).subtract(30, 'minutes').toDate();
  const attendanceWindowEnd = moment(eventEndDateTime).add(30, 'minutes').toDate();

  if (req.user.role !== 'admin' || req.user.status !== 'active') {
    throw new ApiError(403, "Only active admins can create events.");
  }

  const event = await Event.create({
    title,
    description,
    date: eventDate.toDate(),
    startTime,
    endTime,
    locationName,
    locationCoordinates: {
      type: 'Point',
      coordinates: [longitude, latitude] // GeoJSON is [longitude, latitude]
    },
    geoFenceRadiusKm,
    createdBy: req.user._id,
    attendanceWindowStart,
    attendanceWindowEnd,
    status: 'upcoming',
  });

  if (!event) {
    throw new ApiError(500, "Failed to create event.");
  }

  // Generate QR code data and token after event is created (to get event._id)
  const { qrCodeBase64, token, expiresAt } = await generateUniqueQrCodeAndToken(event._id);
  event.attendanceQrCode = qrCodeBase64;
  event.attendanceToken = token;
  event.attendanceTokenExpiresAt = expiresAt;
  await event.save(); // Save the QR code data and token back to the event

  return res
    .status(201)
    .json(new ApiResponse(201, event, "Event created successfully!"));
});

// @desc    Get all events (filtered by status or for a specific admin)
// @route   GET /api/v1/events
// @access  Public (can be filtered by admin ID or status)
const getAllEvents = asyncHandler(async (req, res) => {
  const { status, adminId } = req.query; // Allow filtering by status and adminId

  const filter = {};
  if (status && ['upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
    filter.status = status;
  }
  if (adminId) {
    filter.createdBy = new mongoose.Types.ObjectId(adminId);
  }

  const events = await Event.find(filter)
    .populate('createdBy', 'fullName username email profilePicture organizationName'); // Populate admin details

  return res
    .status(200)
    .json(new ApiResponse(200, events, "Events fetched successfully!"));
});

// @desc    Get a single event by ID
// @route   GET /api/v1/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('createdBy', 'fullName username email profilePicture organizationName');

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event fetched successfully!"));
});

// @desc    Admin updates an event
// @route   PUT /api/v1/events/:id
// @access  Protected (admin who created the event only)
// const updateEvent = asyncHandler(async (req, res) => {
//   const { success, data, error } = updateEventSchema.safeParse(req.body);
//   if (!success) {
//     throw new ApiError(400, error.errors[0].message);
//   }

//   const { title, description, date, startTime, endTime, locationName, latitude, longitude, geoFenceRadiusKm } = data;

//   const eventId = req.params.id;
//   const event = await Event.findById(eventId);

//   if (!event) {
//     throw new ApiError(404, "Event not found.");
//   }

//   // Ensure only the creator admin can update
//   if (event.createdBy.toString() !== req.user._id.toString()) {
//     throw new ApiError(403, "You are not authorized to update this event.");
//   }
  
//   // Prevent updates to completed/cancelled events unless status change is intended
//   if (event.status === 'completed' || event.status === 'cancelled') {
//     throw new ApiError(400, "Cannot update details of a completed or cancelled event.");
//   }

//   // Update fields
//   if (title) event.title = title;
//   if (description) event.description = description;
//   if (locationName) event.locationName = locationName;
//   if (geoFenceRadiusKm) event.geoFenceRadiusKm = geoFenceRadiusKm;

//   // If location coordinates or date/time change, recalculate attendance window
//   if (latitude !== undefined && longitude !== undefined) { // Check for explicit undefined
//     event.locationCoordinates = {
//       type: 'Point',
//       coordinates: [longitude, latitude]
//     };
//   }

//   let needsQrCodeRefresh = false;
//   let eventStartDateTime = moment(event.date).set({ hour: parseInt(event.startTime.split(':')[0]), minute: parseInt(event.startTime.split(':')[1]) }).toDate();
//   let eventEndDateTime = moment(event.date).set({ hour: parseInt(event.endTime.split(':')[0]), minute: parseInt(event.endTime.split(':')[1]) }).toDate();

//   if (date || startTime || endTime) {
//     const newDate = date ? moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata') : moment(event.date).tz('Asia/Kolkata');
//     const newStartHour = startTime ? parseInt(startTime.split(':')[0]) : parseInt(event.startTime.split(':')[0]);
//     const newStartMinute = startTime ? parseInt(startTime.split(':')[1]) : parseInt(event.startTime.split(':')[1]);
//     const newEndHour = endTime ? parseInt(endTime.split(':')[0]) : parseInt(event.endTime.split(':')[0]);
//     const newEndMinute = endTime ? parseInt(endTime.split(':')[1]) : parseInt(event.endTime.split(':')[1]);

//     event.date = newDate.toDate();
//     event.startTime = startTime || event.startTime;
//     event.endTime = endTime || event.endTime;

//     // Recalculate full date-time for window calculation
//     eventStartDateTime = newDate.clone().set({ hour: newStartHour, minute: newStartMinute, second: 0, millisecond: 0 }).toDate();
//     eventEndDateTime = newDate.clone().set({ hour: newEndHour, minute: newEndMinute, second: 0, millisecond: 0 }).toDate();

//     event.attendanceWindowStart = moment(eventStartDateTime).subtract(30, 'minutes').toDate();
//     event.attendanceWindowEnd = moment(eventEndDateTime).add(30, 'minutes').toDate();
//     needsQrCodeRefresh = true; // Date/time change should invalidate old QR for attendance
//   }

//   const updatedEvent = await event.save(); // Save the updated event

//   if (needsQrCodeRefresh) {
//       // Re-generate QR code data if date/time changed
//       updatedEvent.attendanceQrCode = await generateUniqueQrCodeData(updatedEvent._id);
//       await updatedEvent.save(); // Save event again with new QR code
//   }


//   return res
//     .status(200)
//     .json(new ApiResponse(200, updatedEvent, "Event updated successfully!"));
// });
const updateEvent = asyncHandler(async (req, res) => {
  const { success, data, error } = updateEventSchema.safeParse(req.body);
  if (!success) {
    throw new ApiError(400, error.errors[0].message);
  }

  const { title, description, date, startTime, endTime, locationName, latitude, longitude, geoFenceRadiusKm } = data;

  const eventId = req.params.id;
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Ensure only the creator admin can update
  if (event.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this event.");
  }
  
  // Prevent updates to completed/cancelled events unless status change is intended
  if (event.status === 'completed' || event.status === 'cancelled') {
    throw new ApiError(400, "Cannot update details of a completed or cancelled event.");
  }

  // Update fields
  if (title) event.title = title;
  if (description) event.description = description;
  if (locationName) event.locationName = locationName;
  if (geoFenceRadiusKm) event.geoFenceRadiusKm = geoFenceRadiusKm;

  // If location coordinates or date/time change, recalculate attendance window and refresh QR
  let needsQrCodeRefresh = false;

  if (latitude !== undefined && longitude !== undefined) {
    event.locationCoordinates = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };
    needsQrCodeRefresh = true;
  }

  let eventStartDateTime = moment(event.date).set({ hour: parseInt(event.startTime.split(':')[0]), minute: parseInt(event.startTime.split(':')[1]) }).toDate();
  let eventEndDateTime = moment(event.date).set({ hour: parseInt(event.endTime.split(':')[0]), minute: parseInt(event.endTime.split(':')[1]) }).toDate();

  if (date || startTime || endTime) {
    const newDate = date ? moment.tz(date, 'YYYY-MM-DD', 'Asia/Kolkata') : moment(event.date).tz('Asia/Kolkata');
    const newStartHour = startTime ? parseInt(startTime.split(':')[0]) : parseInt(event.startTime.split(':')[0]);
    const newStartMinute = startTime ? parseInt(startTime.split(':')[1]) : parseInt(event.startTime.split(':')[1]);
    const newEndHour = endTime ? parseInt(endTime.split(':')[0]) : parseInt(event.endTime.split(':')[0]);
    const newEndMinute = endTime ? parseInt(endTime.split(':')[1]) : parseInt(event.endTime.split(':')[1]);

    event.date = newDate.toDate();
    event.startTime = startTime || event.startTime;
    event.endTime = endTime || event.endTime;

    eventStartDateTime = newDate.clone().set({ hour: newStartHour, minute: newStartMinute, second: 0, millisecond: 0 }).toDate();
    eventEndDateTime = newDate.clone().set({ hour: newEndHour, minute: newEndMinute, second: 0, millisecond: 0 }).toDate();

    event.attendanceWindowStart = moment(eventStartDateTime).subtract(30, 'minutes').toDate();
    event.attendanceWindowEnd = moment(eventEndDateTime).add(30, 'minutes').toDate();
    needsQrCodeRefresh = true;
  }

  await event.save(); // Save the updated event

  if (needsQrCodeRefresh) {
      // Re-generate QR code data and token if relevant fields changed
      const { qrCodeBase64, token, expiresAt } = await generateUniqueQrCodeAndToken(updatedEvent._id);
      event.attendanceQrCode = qrCodeBase64;
      event.attendanceToken = token;
      event.attendanceTokenExpiresAt = expiresAt;
      await event.save(); // Save event again with new QR code and token
  }

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event updated successfully!"));
});


// @desc    Admin deletes an event
// @route   DELETE /api/v1/events/:id
// @access  Protected (admin who created the event or NGO only)
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Only creator admin OR NGO can delete
  if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'ngo') {
    throw new ApiError(403, "You are not authorized to delete this event.");
  }

  // Prevent deletion of active/completed events directly without prior cancellation
  if (event.status === 'active' || event.status === 'completed') {
      throw new ApiError(400, "Cannot delete an active or completed event. Please cancel it first if necessary.");
  }

  await event.deleteOne(); // Using deleteOne() for Mongoose document deletion

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Event deleted successfully!"));
});

// @desc    Admin/NGO updates event status (e.g., upcoming to active, active to completed)
// @route   PATCH /api/v1/events/:id/status
// @access  Protected (admin who created event OR NGO)
const updateEventStatus = asyncHandler(async (req, res) => {
    const { success, data, error } = updateEventStatusSchema.safeParse(req.body);
    if (!success) {
      throw new ApiError(400, error.errors[0].message);
    }
    const { status } = data;

    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not found.");
    }

    // Only creator admin OR NGO can change status
    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'ngo') {
        throw new ApiError(403, "You are not authorized to change the status of this event.");
    }

    // Basic state transition validation (can be more complex based on rules)
    if (event.status === 'completed' && status !== 'completed') {
        throw new ApiError(400, "Cannot change status of a completed event.");
    }
    if (event.status === 'cancelled' && status !== 'cancelled') {
        throw new ApiError(400, "Cannot change status of a cancelled event.");
    }

    event.status = status;
    await event.save();

    return res
        .status(200)
        .json(new ApiResponse(200, event, `Event status updated to ${status} successfully!`));
});

// @desc    Admin submits event completion details (waste collected, summary)
// @route   PATCH /api/v1/events/:id/complete-details
// @access  Protected (admin who created event ONLY)
const submitEventCompletionDetails = asyncHandler(async (req, res) => {
  const { success, data, error } = submitEventDetailsSchema.safeParse(req.body);
  if (!success) {
    throw new ApiError(400, error.errors[0].message);
  }

  const { wetWasteCollectedKg, dryWasteCollectedKg, otherWasteDetails, eventSummary } = data;

  const eventId = req.params.id;
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, "Event not found.");
  }

  // Ensure only the creator admin can submit details
  if (event.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to submit details for this event.");
  }

  // Only allow details to be submitted if event is completed (or nearing end)
  if (event.status !== 'completed' && event.status !== 'active') { // Allow active for interim reporting too
    throw new ApiError(400, "Event must be active or completed to submit details.");
  }

  event.wetWasteCollectedKg = wetWasteCollectedKg;
  event.dryWasteCollectedKg = dryWasteCollectedKg;
  event.otherWasteDetails = otherWasteDetails || '';
  event.eventSummary = eventSummary;
  event.status = 'completed'; // Ensure status is set to completed if details are submitted

  await event.save();

  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event completion details submitted successfully!"));
});

// @desc    Admin triggers QR code refresh (e.g., if current one expires or compromised)
// @route   PATCH /api/v1/events/:id/refresh-qr
// @access  Protected (admin who created event ONLY)
// const refreshEventQrCode = asyncHandler(async (req, res) => {
//     const eventId = req.params.id;
//     const event = await Event.findById(eventId);

//     if (!event) {
//         throw new ApiError(404, "Event not found.");
//     }

//     if (event.createdBy.toString() !== req.user._id.toString()) {
//         throw new ApiError(403, "You are not authorized to refresh QR code for this event.");
//     }

//     // Only allow refresh for upcoming or active events
//     if (event.status !== 'upcoming' && event.status !== 'active') {
//         throw new ApiError(400, "QR code can only be refreshed for upcoming or active events.");
//     }

//     const newQrCodeData = await generateUniqueQrCodeData(event._id);
//     event.attendanceQrCode = newQrCodeData;
//     await event.save();

//     return res
//         .status(200)
//         .json(new ApiResponse(200, { qrCode: newQrCodeData }, "Event QR code refreshed successfully!"));
// });
const refreshEventQrCode = asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
        throw new ApiError(404, "Event not found.");
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to refresh QR code for this event.");
    }

    // Only allow refresh for upcoming or active events
    if (event.status !== 'upcoming' && event.status !== 'active') {
        throw new ApiError(400, "QR code can only be refreshed for upcoming or active events.");
    }

    const { qrCodeBase64, token, expiresAt } = await generateUniqueQrCodeAndToken(event._id);
    event.attendanceQrCode = qrCodeBase64;
    event.attendanceToken = token;
    event.attendanceTokenExpiresAt = expiresAt;
    await event.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { qrCode: qrCodeBase64, attendanceToken: token, attendanceTokenExpiresAt: expiresAt }, "Event QR code refreshed successfully!"));
});

// ... (getAllEvents, getEventById, deleteEvent, updateEventStatus, submitEventCompletionDetails - remain unchanged) ...

export {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  submitEventCompletionDetails,
  refreshEventQrCode,
};