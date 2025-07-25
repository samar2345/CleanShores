// server/src/middlewares/auth.middleware.js
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js'; // Import ApiError
import { asyncHandler } from '../utils/asyncHandler.js'; // Import asyncHandler
import { User } from '../models/User.js'; // Corrected import path and named export

// Middleware to verify JWT and attach user to request
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // Access token can come from cookies or Authorization header
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request: Token missing");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            // This case might happen if token is valid but user no longer exists in DB
            throw new ApiError(401, "Invalid Access Token: User not found");
        }

        // Attach the user object to the request
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification error:", error.message);
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Access token expired");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid access token");
        }
        throw new ApiError(error.statusCode || 401, error.message || "Unauthorized: Token failed");
    }
});

// Middleware to authorize roles
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new ApiError(403, `User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route`);
        }
        next();
    };
};