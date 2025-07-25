// server/src/routes/user.routes.js
import { Router } from 'express';
import {
    registerUser,
    registerAdmin,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserProfilePicture,
    getUserPublicProfile,
} from '../controllers/user.controller.js'; // Corrected import path and named exports
import { upload } from "../middlewares/multer.middleware.js"; // Corrected import path and named export
import { verifyJWT } from '../middlewares/auth.middleware.js'; // Corrected import path and named export

const router = Router();

// Public routes (no authentication needed)
router.route("/register/user").post(
    upload.fields([ // Expecting a single 'profilePicture' file for user registration
        { name: "profilePicture", maxCount: 1 }
    ]),
    registerUser
);

router.route("/register/admin").post(
    upload.fields([ // Expecting multiple files for admin registration
        { name: "profilePicture", maxCount: 1 },
        { name: "addressProof", maxCount: 1 },
        { name: "idProof", maxCount: 1 },
        { name: "organizationRegistrationProof", maxCount: 1 }, // Optional
    ]),
    registerAdmin
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Secured routes (authentication needed using verifyJWT middleware)
// These routes will apply verifyJWT before the controller logic
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);

// File upload routes
router.route("/profile-picture").patch(verifyJWT, upload.single("profilePicture"), updateUserProfilePicture);

// Public profile route (viewable by others)
router.route("/c/:username").get(verifyJWT, getUserPublicProfile); // Assuming protected view for now

export default router;