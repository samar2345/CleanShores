// This new model will record who actually checked in for an event, where, and when.

// server/src/models/Attendance.js
import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  attendedAt: { // Timestamp of actual check-in
    type: Date,
    default: Date.now,
  },
  scannedLocation: { // Actual location from user's device at time of scan
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: { // [longitude, latitude] from user's device
      type: [Number],
      required: true
    }
  },
  isWithinGeofence: { // Boolean result of the geo-fencing check
    type: Boolean,
    required: true,
  },
  gamificationPointsAwarded: { // Points given for successful attendance
    type: Number,
    default: 0,
  },
  qrCodeTokenUsed: { // The specific token from the QR code that was scanned
    type: String,
    required: true,
  },
  verificationStatus: { // Can be 'verified', 'flagged_location', 'flagged_token_expired' etc.
    type: String,
    enum: ['verified', 'pending_review', 'rejected'],
    default: 'verified', // Default to verified if all checks pass
  },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for quick lookups of a user's attendance for a specific event
AttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', AttendanceSchema);