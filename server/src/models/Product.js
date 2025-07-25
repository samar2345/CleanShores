// server/src/models/Product.js
import mongoose, { Schema } from 'mongoose';

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Product names should likely be unique
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  imageUrl: { // Cloudinary URL for product image
    type: String,
    required: true, // Product must have an image
  },
  stock: { // Current quantity available
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  category: { // E.g., "Gloves", "Bags", "Tools", "Merchandise"
    type: String,
    trim: true,
    default: 'General',
  },
  isAvailable: { // Easily toggle product visibility/purchasability
    type: Boolean,
    default: true,
  },
  createdBy: { // Reference to the User (NGO role) who added the product
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

export const Product = mongoose.model('Product', ProductSchema);