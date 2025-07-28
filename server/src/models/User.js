// // server/src/models/User.js
// import mongoose, { Schema } from 'mongoose'; // Destructuring Schema
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs'; // Using bcryptjs as it's typically faster than bcrypt in Node.js

// const UserSchema = new Schema({
//   username: { // Renamed from 'name' for consistency with your example's 'username'
//     type: String,
//     required: true,
//     lowercase: true,
//     unique: true,
//     trim: true,
//     index: true, // Used for making the field searchable
//   },
//   email: {
//     type: String,
//     required: true,
//     lowercase: true,
//     unique: true,
//     trim: true,
//   },
//   fullName: { // Renamed from 'name' to 'fullName' as per your example
//     type: String,
//     required: true,
//     trim: true,
//     index: true,
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, "Password must be at least 6 characters long"],
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin', 'ngo'],
//     default: 'user',
//   },
//   gamificationPoints: {
//     type: Number,
//     default: 0,
//   },
//   profilePicture: { // Analogous to your 'avatar' field
//     type: String, // Cloudinary URL
//     required: true // Making it required for all user types as a basic profile element
//   },
//   // We'll skip 'coverImage' and 'watchHistory' for Clean Shores for now,
//   // as they are more specific to video platforms.
//   // If you want to add a "banner" or "background" image for admin/NGO profiles later,
//   // we can add a 'bannerImage' field.

//   // Admin-specific fields for NGO verification
//   status: { // For admin verification: 'pending_verification', 'active', 'rejected', 'user_active'
//     type: String,
//     enum: ['pending_verification', 'active', 'rejected', 'user_active', 'deactivated'],
//     default: 'user_active',
//   },
//   organizationName: {
//     type: String,
//     trim: true,
//   },
//   organizationType: {
//     type: String,
//     trim: true,
//   },
//   addressProofUrl: { // URL to uploaded address proof
//     type: String,
//     trim: true,
//   },
//   idProofUrl: { // URL to uploaded ID proof
//     type: String,
//     trim: true,
//   },
//   organizationRegistrationProofUrl: { // URL to uploaded registration proof for orgs
//     type: String,
//     trim: true,
//   },
//   bio: {
//     type: String,
//     trim: true,
//   },
//   contactNumber: {
//     type: String,
//     trim: true,
//   },
//   refreshToken: { // For persistent login sessions
//     type: String,
//   },
// }, {
//   timestamps: true // Adds createdAt and updatedAt
// });

// // Hash password before saving
// UserSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // Custom method to compare passwords
// UserSchema.methods.isPasswordCorrect = async function (password) {
//   return await bcrypt.compare(password, this.password);
// };

// // Custom method to generate Access Token
// UserSchema.methods.generateAccessToken = function () {
//   return jwt.sign(
//     {
//       _id: this._id,
//       email: this.email,
//       username: this.username,
//       fullName: this.fullName,
//       role: this.role, // Include role in token for client-side checks
//       status: this.status, // Include status for admin/NGO login flow
//     },
//     process.env.ACCESS_TOKEN_SECRET,
//     {
//       expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
//     }
//   );
// };

// // Custom method to generate Refresh Token
// UserSchema.methods.generateRefreshToken = function () {
//   return jwt.sign(
//     {
//       _id: this._id,
//     },
//     process.env.REFRESH_TOKEN_SECRET,
//     {
//       expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
//     }
//   );
// };

// export const User = mongoose.model("User", UserSchema);
// server/src/models/User.js
// server/src/models/User.js
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Correctly imported at top

const UserSchema = new Schema({
  // ... (all your schema fields as current, including googleId, homeLocationCoordinates, deactivationReason) ...
  username: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    // required: [true, "Password is required"], // Make this conditional or remove if not storing local passwords for OAuth users
    minlength: [6, "Password must be at least 6 characters long"],
  },
  googleId: { // New field for Google OAuth
    type: String,
    unique: true,
    sparse: true, // Allows multiple documents to have a null value for this field
  },
  profilePicture: {
    type: String, // Cloudinary URL or direct URL from Google
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'ngo'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'rejected', 'user_active', 'deactivated'], // Added 'deactivated'
    default: 'user_active',
  },
  gamificationPoints: {
    type: Number,
    default: 0,
  },
  // Admin-specific fields
  organizationName: { type: String, trim: true },
  organizationType: { type: String, trim: true },
  addressProofUrl: { type: String, trim: true },
  idProofUrl: { type: String, trim: true },
  organizationRegistrationProofUrl: { type: String, trim: true },
  bio: { type: String, trim: true },
  contactNumber: { type: String, trim: true },
  // New field for notifications based on location
  homeLocationName: {
    type: String,
    trim: true,
  },
  homeLocationCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { // [longitude, latitude]
      type: [Number],
      default: [0, 0] // Default to 0,0 if not provided
    }
  },
  // New field for deactivation reason (mentioned in admin.controller.js)
  deactivationReason: { type: String, trim: true },
  refreshToken: {
    type: String,
  },
}, {
  timestamps: true
});

// Hash password before saving (only if it's a local password and is modified)
// UserSchema.pre('save', async function (next) {
//   if (this.isModified('password') && this.password) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// // Method to compare passwords
// UserSchema.methods.matchPassword = async function (enteredPassword) {
//   if (!this.password) return false;
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Custom method to compare passwords
UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
// Custom method to generate Access Token
// Make sure process.env is accessible, usually loaded globally by dotenv/config
UserSchema.methods.generateAccessToken = function () {
  if (!process.env.ACCESS_TOKEN_SECRET) {
      console.error("ACCESS_TOKEN_SECRET is not defined!");
      throw new Error("JWT secret not configured.");
  }
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      status: this.status,
    },
    process.env.ACCESS_TOKEN_SECRET, // Access environment variable
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Access environment variable
    }
  );
};

// Custom method to generate Refresh Token
UserSchema.methods.generateRefreshToken = function () {
  if (!process.env.REFRESH_TOKEN_SECRET) {
      console.error("REFRESH_TOKEN_SECRET is not defined!");
      throw new Error("JWT secret not configured.");
  }
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET, // Access environment variable
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Access environment variable
    }
  );
};

export const User = mongoose.model('User', UserSchema);