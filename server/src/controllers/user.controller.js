// server/src/controllers/user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/User.js"; // Corrected import path and named export
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"; // Import Cloudinary utilities
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; // Already imported
import mongoose from "mongoose"; // Already imported
import { z } from 'zod'; // For robust validation, will install later

// Helper function to clean up local files
import fs from 'fs/promises';
const cleanupLocalFiles = async (localFilePaths) => {
    if (localFilePaths && localFilePaths.length > 0) {
        for (const filePath of localFilePaths) {
            try {
                if (filePath) {
                    await fs.unlink(filePath); // Use fs.promises.unlink
                    // console.log(`Deleted local file: ${filePath}`); // Debug log
                }
            } catch (err) {
                console.error(`Failed to delete local file ${filePath}:`, err);
            }
        }
    }
};

// Schema for request body validation (using Zod)
const registerUserSchema = z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    username: z.string().trim().min(1, "Username is required").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    // profilePicture is handled via file upload, not in body for initial registration
});

const loginUserSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    username: z.string().trim().optional(),
    password: z.string().min(1, "Password is required"),
}).refine(data => data.email || data.username, {
    message: "Email or username is required for login",
    path: ["email", "username"],
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confPassword: z.string().min(1, "Confirm password is required"),
}).refine(data => data.newPassword === data.confPassword, {
    message: "New password and confirm password do not match",
    path: ["confPassword"],
});

const updateAccountDetailsSchema = z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
});


// Helper to generate both access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found for token generation");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Do not re-validate password on saving refresh token

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating tokens:", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens");
    }
};

// @desc    Register a new user (regular user)
// @route   POST /api/v1/users/register/user
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    // Validate request body using Zod
    const { success, data, error } = registerUserSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { fullName, username, email, password } = data;

    // Check for profile picture (avatar) upload
    const profilePictureLocalPath = req.files?.profilePicture?.[0]?.path; // Changed from avatar to profilePicture
    if (!profilePictureLocalPath) {
        throw new ApiError(400, 'Profile picture file is required');
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, 'User already exists with this username or email');
    }

    const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

    if (!profilePicture) {
        throw new ApiError(500, 'Failed to upload profile picture to Cloudinary');
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        profilePicture: profilePicture.url,
        role: 'user', // Default role
        status: 'user_active', // Default status for regular users
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // After successful registration, log them in immediately by generating tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(createdUser._id);

    const options = {
        httpOnly: true,
        secure: true // Should be true in production (HTTPS)
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                { user: createdUser, accessToken, refreshToken },
                "User registered and logged in successfully"
            )
        );
});

// @desc    Register a new admin (with verification fields)
// @route   POST /api/v1/users/register/admin
// @access  Public (initial registration)
// const registerAdmin = asyncHandler(async (req, res) => {
//     // Re-use registerUserSchema for basic fields, and add admin specific ones
//     const { fullName, username, email, password, organizationName, organizationType, bio, contactNumber } = req.body;

//     if ([fullName, username, email, password, organizationName, organizationType, bio, contactNumber].some(field => !field?.trim())) {
//         throw new ApiError(400, 'Please fill all required admin registration fields');
//     }

//     // Handle profile picture upload
//     const profilePictureLocalPath = req.files?.profilePicture?.[0]?.path;
//     if (!profilePictureLocalPath) {
//         throw new ApiError(400, 'Profile picture file is required for admin registration');
//     }
//     const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
//     if (!profilePicture) {
//         throw new ApiError(500, 'Failed to upload profile picture to Cloudinary for admin');
//     }

//     // Handle document uploads (assuming single file for each for simplicity, adjust multer if needed)
//     const addressProofLocalPath = req.files?.addressProof?.[0]?.path;
//     const idProofLocalPath = req.files?.idProof?.[0]?.path;
//     const organizationRegistrationProofLocalPath = req.files?.organizationRegistrationProof?.[0]?.path;

//     if (!addressProofLocalPath || !idProofLocalPath) {
//         throw new ApiError(400, 'Address proof and ID proof files are required for admin registration');
//     }
//     // Organization registration proof might be optional based on organizationType, let's make it optional for now
//     if (organizationType === 'Registered NGO' && !organizationRegistrationProofLocalPath) {
//         throw new ApiError(400, 'Organization registration proof is required for Registered NGO type');
//     }


//     const addressProof = await uploadOnCloudinary(addressProofLocalPath);
//     const idProof = await uploadOnCloudinary(idProofLocalPath);
//     const organizationRegistrationProof = organizationRegistrationProofLocalPath ? await uploadOnCloudinary(organizationRegistrationProofLocalPath) : null;

//     if (!addressProof || !idProof || (organizationRegistrationProofLocalPath && !organizationRegistrationProof)) {
//         throw new ApiError(500, 'Failed to upload one or more required documents to Cloudinary');
//     }

//     const existedUser = await User.findOne({ $or: [{ username }, { email }] });
//     if (existedUser) {
//         throw new ApiError(409, 'User with this email or username already exists');
//     }

//     const user = await User.create({
//         fullName,
//         username: username.toLowerCase(),
//         email,
//         password,
//         profilePicture: profilePicture.url,
//         role: 'admin',
//         status: 'pending_verification', // Admin needs to be verified by NGO
//         organizationName,
//         organizationType,
//         bio,
//         contactNumber,
//         addressProofUrl: addressProof.url,
//         idProofUrl: idProof.url,
//         organizationRegistrationProofUrl: organizationRegistrationProof?.url || '',
//     });

//     const createdAdmin = await User.findById(user._id).select("-password -refreshToken");

//     if (!createdAdmin) {
//         throw new ApiError(500, "Something went wrong while registering the admin");
//     }

//     return res
//         .status(201)
//         .json(
//             new ApiResponse(
//                 201,
//                 createdAdmin,
//                 "Admin account created successfully, awaiting NGO verification."
//             )
//         );
// });
const registerAdmin = asyncHandler(async (req, res) => {
    // Zod schema validation and destructuring from req.body
    // You should validate req.body with a Zod schema for admin registration here (not shown for brevity)
    const {
        fullName,
        username,
        email,
        password,
        organizationName,
        organizationType,
        bio,
        contactNumber
    } = req.body;

    const localFilePathsToCleanup = []; // Array to store paths for cleanup

    try { // Wrap the main logic in a try block to ensure cleanup on any error
        // 1. Validate text fields (this part is already there)
        if ([fullName, username, email, password, organizationName, organizationType, bio, contactNumber].some(field => !field?.trim())) {
            throw new ApiError(400, 'Please fill all required admin registration fields');
        }

        // 2. Handle profile picture upload
        const profilePictureLocalPath = req.files?.profilePicture?.[0]?.path;
        if (!profilePictureLocalPath) {
            throw new ApiError(400, 'Profile picture file is required for admin registration');
        }
        localFilePathsToCleanup.push(profilePictureLocalPath); // Add to cleanup list

        const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
        if (!profilePicture || !profilePicture.url) {
            throw new ApiError(500, 'Failed to upload profile picture to Cloudinary');
        }

        // 3. Handle other document uploads
        const addressProofLocalPath = req.files?.addressProof?.[0]?.path;
        const idProofLocalPath = req.files?.idProof?.[0]?.path;
        const organizationRegistrationProofLocalPath = req.files?.organizationRegistrationProof?.[0]?.path;

        if (!addressProofLocalPath || !idProofLocalPath) {
            throw new ApiError(400, 'Address proof and ID proof files are required for admin registration');
        }

        localFilePathsToCleanup.push(addressProofLocalPath);
        localFilePathsToCleanup.push(idProofLocalPath);
        if (organizationRegistrationProofLocalPath) {
            localFilePathsToCleanup.push(organizationRegistrationProofLocalPath);
        }

        if (organizationType === 'Registered NGO' && !organizationRegistrationProofLocalPath) {
            throw new ApiError(400, 'Organization registration proof is required for Registered NGO type');
        }

        const addressProof = await uploadOnCloudinary(addressProofLocalPath);
        const idProof = await uploadOnCloudinary(idProofLocalPath);
        const organizationRegistrationProof = organizationRegistrationProofLocalPath ? await uploadOnCloudinary(organizationRegistrationProofLocalPath) : null;

        if (!addressProof || !idProof || (organizationRegistrationProofLocalPath && !organizationRegistrationProof)) {
            // If any cloud upload fails, throw error.
            // Note: Cloudinary helper already calls unlink for individual files, but
            // this top-level catch ensures it in case of other issues.
            throw new ApiError(500, 'Failed to upload one or more required documents to Cloudinary');
        }

        // 4. Check for existing user
        const existedUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existedUser) {
            throw new ApiError(409, 'User with this email or username already exists');
        }

        // 5. Create user in DB
        const user = await User.create({
            fullName,
            username: username.toLowerCase(),
            email,
            password,
            profilePicture: profilePicture.url,
            role: 'admin',
            status: 'pending_verification',
            organizationName,
            organizationType,
            bio,
            contactNumber,
            addressProofUrl: addressProof.url,
            idProofUrl: idProof.url,
            organizationRegistrationProofUrl: organizationRegistrationProof?.url || '',
        });

        const createdAdmin = await User.findById(user._id).select("-password -refreshToken");

        if (!createdAdmin) {
            throw new ApiError(500, "Something went wrong while registering the admin");
        }

        // If everything succeeds, files should already be deleted by uploadOnCloudinary
        // However, if there was an error prior to Cloudinary upload, these files would remain.
        // The outer catch block (from asyncHandler) will handle this cleanup.

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    createdAdmin,
                    "Admin account created successfully, awaiting NGO verification."
                )
            );

    } catch (error) {
        // This catch block inside the asyncHandler will ensure local files are cleaned up
        // if any error occurs within this try block, before the asyncHandler re-throws it.
        await cleanupLocalFiles(localFilePathsToCleanup);
        throw error; // Re-throw the error so asyncHandler can catch it and send APIError response
    }
});


// @desc    Login user/admin/ngo
// @route   POST /api/v1/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    // Validate request body
    const { success, data, error } = loginUserSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { email, username, password } = data;

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    // Admin-specific status check for login
    if (user.role === 'admin' && user.status === 'pending_verification') {
        throw new ApiError(403, 'Your admin account is pending verification by NGO. Please wait.');
    }
    if (user.role === 'admin' && user.status === 'rejected') {
        throw new ApiError(403, 'Your admin account has been rejected by NGO. Please contact support.');
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' // Set secure true only in production (HTTPS)
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged in successfully"
            )
        );
});

// @desc    Logout user
// @route   POST /api/v1/users/logout
// @access  Protected
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from the document
            }
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged out successfully")
        );
});

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/v1/users/refresh-token
// @access  Public (but requires refreshToken)
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: Refresh token missing");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token: User not found");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            // This case indicates token reuse or invalid token
            // Revoke all tokens for this user for security
            user.refreshToken = undefined;
            await user.save({ validateBeforeSave: false });
            throw new ApiError(401, "Refresh token is expired or used. Please log in again.");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken }, // Send new refresh token back as well
                    "Access Token refreshed successfully"
                )
            );
    } catch (error) {
        console.error("Refresh token error:", error);
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Refresh token expired. Please log in again.");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid refresh token.");
        }
        throw new ApiError(error.statusCode || 401, error.message || "Unauthorized: Could not refresh token");
    }
});

// @desc    Change current user's password
// @route   POST /api/v1/users/change-password
// @access  Protected
// const changeCurrentPassword = asyncHandler(async (req, res) => {
//     const { success, data, error } = changePasswordSchema.safeParse(req.body);
//     if (!success) {
//         throw new ApiError(400, error.errors[0].message);
//     }
//     const { oldPassword, newPassword } = data; // `data` comes from Zod safeParse

//     const user = req.user; // User object from verifyJWT middleware

//     console.log('--- Debugging changeCurrentPassword controller ---');
//     console.log('oldPassword from request:', oldPassword); // CHECK THIS!
//     console.log('user object from req.user (should have password hash):', user); // CHECK THIS!

//     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
//     // ... rest of code
// });
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { success, data, error } = changePasswordSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { oldPassword, newPassword } = data;

    // The req.user from JWT has password excluded for security.
    // We need to fetch the user again specifically to get the password hash for comparison.
    const userToChangePassword = await User.findById(req.user._id).select('+password'); // <-- FETCH AGAIN, BUT INCLUDE PASSWORD!

    if (!userToChangePassword) {
        // This should theoretically not happen if verifyJWT passed, but good for robustness
        throw new ApiError(404, "User not found for password change.");
    }

    console.log('--- Debugging changeCurrentPassword controller ---');
    console.log('oldPassword from request:', oldPassword);
    // Now, log the user object that *should* have the password for comparison
    console.log('userToChangePassword object (should have password hash):', userToChangePassword);

    const isPasswordCorrect = await userToChangePassword.isPasswordCorrect(oldPassword); // <-- Use the newly fetched user

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    userToChangePassword.password = newPassword; // Hashing happens in pre-save hook
    await userToChangePassword.save(); // Mongoose will hash newPassword and validate

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        );
});
// @desc    Get current logged in user details
// @route   GET /api/v1/users/current-user
// @access  Protected
const getCurrentUser = asyncHandler(async (req, res) => {
    // req.user is populated by verifyJWT middleware
    return res.status(200).json(
        new ApiResponse(
            200,
            req.user, // The user object is already clean (password/refreshToken excluded)
            "Current user fetched successfully"
        )
    );
});

// @desc    Update user account details
// @route   PATCH /api/v1/users/update-account
// @access  Protected
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { success, data, error } = updateAccountDetailsSchema.safeParse(req.body);
    if (!success) {
        throw new ApiError(400, error.errors[0].message);
    }
    const { fullName, email } = data;

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email.toLowerCase()
            }
        },
        {
            new: true, // returns data after updation
            runValidators: true // Ensures Mongoose validators run on update (e.g., unique email)
        }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found for update"); // Should not happen if verifyJWT works
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account details successfully updated"
            )
        );
});

// @desc    Update user profile picture (avatar)
// @route   PATCH /api/v1/users/profile-picture
// @access  Protected (requires file upload middleware)
const updateUserProfilePicture = asyncHandler(async (req, res) => {
    const profilePictureLocalPath = req.file?.path; // Expecting single file upload named 'profilePicture'

    if (!profilePictureLocalPath) {
        throw new ApiError(400, "Profile picture file is required");
    }

    const oldUser = await User.findById(req.user._id); // Get old user for potentially deleting old image

    const newProfilePicture = await uploadOnCloudinary(profilePictureLocalPath);

    if (!newProfilePicture || !newProfilePicture.url) {
        throw new ApiError(500, "Error while uploading new profile picture");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                profilePicture: newProfilePicture.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Failed to update user's profile picture in DB");
    }

    // TODO: Implement logic to delete the old profile picture from Cloudinary
    // This requires storing the public_id of the old image.
    // Example: If oldUser.profilePictureUrl was "http://res.cloudinary.com/.../v12345/publicId.png"
    // you'd extract "publicId" and then call deleteFromCloudinary("publicId");
    // For now, we'll leave it as a TODO for when you implement this.
    // Example: if (oldUser.profilePicture) { extract publicId and call deleteFromCloudinary }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Profile picture updated successfully"
            )
        );
});

// Note: I'm adapting 'getUserChannelProfile' and 'getWatchHistory' slightly for 'Clean Shores' context.
// 'getUserChannelProfile' can become 'getUserPublicProfile' or 'getAdminPublicProfile'.
// 'getWatchHistory' is not directly relevant for Clean Shores unless we introduce "event history"
// I'll provide a 'getUserPublicProfile' adapting your example's aggregation logic.

// @desc    Get a user's (or admin's) public profile details
// @route   GET /api/v1/users/c/:username
// @access  Protected (can be public if you want to allow anyone to view profiles)
const getUserPublicProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const userProfile = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $project: { // Project only necessary public fields
                fullName: 1,
                username: 1,
                profilePicture: 1,
                email: 1, // Consider if email should be public
                role: 1,
                gamificationPoints: 1,
                bio: 1,
                organizationName: 1,
                organizationType: 1,
                // Do NOT include password, refreshToken, sensitive document URLs, etc.
            }
        }
    ]);

    if (!userProfile?.length) {
        throw new ApiError(404, "User profile not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userProfile[0],
                "User profile fetched successfully"
            )
        );
});

// We will not implement getWatchHistory directly as it's not relevant to Clean Shores.
// If you want to show a user's past events, we'd add an event history field to the user
// or query the 'Attendance' collection.

export {
    registerUser,
    registerAdmin,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture, // Renamed from updateUserAvatar
    getUserPublicProfile, // Renamed from getUserChannelProfile
};