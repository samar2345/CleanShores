// server/src/models/Group.js
import mongoose, { Schema } from 'mongoose';

const GroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Group names should be unique
    trim: true,
    minlength: [3, 'Group name must be at least 3 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: '',
  },
  admin: { // The user (admin or NGO) who created and manages the group
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [ // Array of user IDs who are part of the group
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      }
    }
  ],
  isPublic: { // Can anyone join, or is it invite-only (future feature)?
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient lookup by admin
GroupSchema.index({ admin: 1 });

export const Group = mongoose.model('Group', GroupSchema);