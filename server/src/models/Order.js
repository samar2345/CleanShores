// server/src/models/Order.js
import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema({
  userId: { // User or Admin who placed the order
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [ // Array of products in the order
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
      },
      priceAtOrder: { // Price at the time of order to prevent discrepancies
        type: Number,
        required: true,
      },
    }
  ],
  totalAmount: { // Total cost of the order
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative'],
  },
  shippingAddress: { // Address for delivery
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true }, // Essential for manual fulfillment
  },
  orderStatus: { // 'pending_review', 'confirmed', 'awaiting_pickup/delivery', 'fulfilled', 'cancelled'
    type: String,
    enum: ['pending_review', 'confirmed', 'awaiting_pickup_delivery', 'fulfilled', 'cancelled'],
    default: 'pending_review',
  },
  orderedAt: { // Timestamp of order placement
    type: Date,
    default: Date.now,
  },
  notesFromNGO: { // Optional field for NGO to add notes for the user
    type: String,
    trim: true,
  },
}, {
  timestamps: true
});

export const Order = mongoose.model('Order', OrderSchema);