// server/src/models/Message.js
import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema({
  group: { // The group this message belongs to
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  sender: { // The user who sent the message
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  // You can add 'type: String' for 'text', 'image', 'file' if you want file sharing later
  // type: {
  //     type: String,
  //     enum: ['text', 'image', 'file'],
  //     default: 'text'
  // },
  // imageUrl: { // If message type is image
  //     type: String
  // },
}, {
  timestamps: true // Adds createdAt and updatedAt (for message time)
});

// Compound index for efficient retrieval of messages by group, sorted by time
MessageSchema.index({ group: 1, createdAt: 1 });

export const Message = mongoose.model('Message', MessageSchema);