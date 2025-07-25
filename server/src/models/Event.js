// server/src/models/Event.js
import mongoose, { Schema } from 'mongoose';

const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date, // Store date as ISO Date object
    required: true,
  },
  startTime: { // Example: "10:00 AM" or just store as part of date/time
    type: String, // You could also use a Date object and format on frontend
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  locationName: { // Human-readable name (e.g., "Juhu Beach, Mumbai")
    type: String,
    required: true,
    trim: true,
  },
  locationCoordinates: { // GeoJSON Point for precise location
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: { // [longitude, latitude]
      type: [Number],
      required: true,
      index: '2dsphere' // Geospatial index for radius queries
    }
  },
  geoFenceRadiusKm: { // Radius around locationCoordinates for attendance (in kilometers)
    type: Number,
    required: true,
    default: 1, // Default to 1 km
    min: 0.1, // Minimum reasonable radius
    max: 10, // Maximum reasonable radius
  },
  attendanceQrCode: { // Data/URL for the QR code used for attendance
    type: String,
    default: '',
  },
  attendanceToken: { // A short-lived token embedded in QR for security against pre-scanning/sharing
    type: String,
    default: '',
  },
  attendanceTokenExpiresAt: { // When the current attendanceToken expires
    type: Date,
  },
  attendanceWindowStart: { // When QR scan becomes active (e.g., 30 mins before start)
    type: Date,
  },
  attendanceWindowEnd: { // When QR scan becomes inactive (e.g., 30 mins after end)
    type: Date,
  },
  createdBy: { // Reference to the Admin who created the event
    type: Schema.Types.ObjectId,
    ref: 'User', // Refers to the User model, where role='admin'
    required: true,
  },
  status: { // 'upcoming', 'active', 'completed', 'cancelled'
    type: String,
    enum: ['upcoming', 'active', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  // Fields for analytics (filled by admin after event completion)
  wetWasteCollectedKg: {
    type: Number,
    default: 0,
  },
  dryWasteCollectedKg: {
    type: Number,
    default: 0,
  },
  otherWasteDetails: { // Free text field for other details
    type: String,
    trim: true,
    default: '',
  },
  eventSummary: { // A brief summary of the event after completion
    type: String,
    trim: true,
    default: '',
  },
  enrolledUsers: [ // Array of users who have enrolled
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      enrolledAt: { // Timestamp of when the user enrolled
        type: Date,
        default: Date.now,
      },
      // You might add an 'attended: Boolean' field here later for attendance tracking
      // though our QR system creates a separate Attendance collection for confirmed attendance.
      // Keeping it here allows you to see who *planned* to come vs who *actually* came.
    }
  ],

}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for event date for efficient querying
EventSchema.index({ date: 1 });

export const Event = mongoose.model('Event', EventSchema);