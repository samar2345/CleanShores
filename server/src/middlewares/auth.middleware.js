// server/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        console.log("\n--- verifyJWT Middleware DEBUG ---");
        console.log("verifyJWT: req.cookies (from cookie-parser):", req.cookies);
        console.log("verifyJWT: req.header('Authorization'):", req.header("Authorization"));

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("verifyJWT: Extracted token:", token ? token.substring(0, 10) + '...' : "None");

        if (!token) {
            console.error("verifyJWT: No token found. Throwing 401.");
            throw new ApiError(401, "Unauthorized request: Token missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("verifyJWT: Decoded Token Payload (full):", decodedToken); // Log full payload
        // Access decoded ID using ._id (as stored in payload) instead of .id
        console.log("verifyJWT: Decoded Token ID (accessed as ._id):", decodedToken._id); // <-- THIS IS THE CORRECT ACCESS
        
        // Use decodedToken._id to find the user
        const user = await User.findById(decodedToken._id).select("-password -refreshToken"); // <-- USE decodedToken._id

        console.log("verifyJWT: User found by ID in DB:", user ? user.username : 'NULL');

        if (!user) {
            console.error("verifyJWT: User not found in DB for decoded token ID. Throwing 401.");
            throw new ApiError(401, "Invalid Access Token: User not found.");
        }

        req.user = user;
        console.log(`verifyJWT: User ${user.username} successfully authenticated.`);
        next();
    } catch (error) {
        console.error("\n--- verifyJWT Middleware ERROR (CAUGHT) ---");
        console.error("Error Message:", error.message);
        console.error("Error Name:", error.name);
        console.error("Error Stack:", error.stack);
        console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Access token expired");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid access token");
        }
        if (error instanceof ApiError) {
             throw error;
        }
        throw new ApiError(error.statusCode || 401, error.message || "Unauthorized: Token validation failed.");
    }
});

// ... (authorizeRoles remains unchanged) ...

// Middleware to authorize roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, `User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route`);
        }
        next();
    };
};