// server/src/routes/user.routes.js
import express from 'express';
import passport from 'passport';
import { User } from '../models/User.js'; // Ensure User model is imported
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
} from '../controllers/user.controller.js';
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes (no authentication needed)
router.post('/register/user',
    upload.fields([ { name: "profilePicture", maxCount: 1 } ]),
    registerUser
);

router.post('/register/admin',
    upload.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "addressProof", maxCount: 1 },
        { name: "idProof", maxCount: 1 },
        { name: "organizationRegistrationProof", maxCount: 1 },
    ]),
    registerAdmin
);

router.post('/login', loginUser);
router.post('/refresh-token', refreshAccessToken);

// --- Google OAuth Routes ---
// Route to initiate Google OAuth login
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
router.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: process.env.CORS_ORIGIN + '/login?oauthError=true',
        session: false // Crucial: We use JWTs, not sessions
    }),
    async (req, res) => {
        try {
            console.log("\n--- OAuth Callback Route Handler DEBUG (TRY BLOCK START) ---\n");
            console.log("DEBUG 1: req.user from Passport.authenticate:", req.user);
            console.log("DEBUG 2: req.user._id:", req.user?._id);

            if (!req.user || !req.user._id) {
                console.error("DEBUG ERROR: req.user or req.user._id missing after Passport authenticate. Redirecting.");
                return res.redirect(process.env.CORS_ORIGIN + '/login?oauthError=true&message=auth_data_missing');
            }

            // Fetch the user from the database by ID to ensure it's a full Mongoose document with methods
            const user = await User.findById(req.user._id);
            
            console.log("DEBUG 3: User object fetched from DB:", user ? user.username : 'NULL');
            console.log("DEBUG 4: Type of user.generateAccessToken:", typeof user?.generateAccessToken);

            if (!user) {
                console.error("DEBUG ERROR: User not found in DB after Passport authentication for ID:", req.user._id);
                return res.redirect(process.env.CORS_ORIGIN + '/login?oauthError=true&message=user_db_mismatch');
            }
            
            // Generate Access and Refresh Tokens
            const accessToken = user.generateAccessToken();
            const refreshToken = user.generateRefreshToken();
            console.log("DEBUG 5: Tokens generated. Access Token starts with:", accessToken.substring(0,10) + "...");
            console.log("DEBUG 6: Refresh Token starts with:", refreshToken.substring(0,10) + "...");

            // Update user's refresh token in DB
            user.refreshToken = refreshToken; // Set the new refresh token
            console.log("DEBUG 7: User.refreshToken set. Attempting save.");
            await user.save({ validateBeforeSave: false }); // <--- SUSPECTED FAILURE POINT
            console.log("DEBUG 8: User saved with new refreshToken successfully.");

            // Set cookies (secure HttpOnly for future requests like refresh token)
            const cookieOptions = { // Renamed to avoid confusion with redirect query param 'options'
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Lax',
                path: '/',
                domain: 'localhost' // Keep this for clarity, but the main token transfer is via URL param now
            };

            res.cookie('accessToken', accessToken, cookieOptions);
            res.cookie('refreshToken', refreshToken, cookieOptions);
            console.log("DEBUG 9: Cookies set.");
            
            // --- CRITICAL CHANGE: Redirect with accessToken in URL hash/query ---
            // This bypasses HttpOnly cookie sending issues for the initial load.
            // Frontend will read this token from URL and store in Redux.
            const redirectUrl = new URL(process.env.CORS_ORIGIN + '/dashboard');
            redirectUrl.searchParams.set('accessToken', accessToken); // Add token to query param
            redirectUrl.searchParams.set('userId', user._id.toString()); // Optionally add user ID
            redirectUrl.searchParams.set('userRole', user.role); // Optionally add user role

            console.log("DEBUG 10: Redirecting to:", redirectUrl.toString());
            res.redirect(redirectUrl.toString());

        } catch (error) {
            console.error("\n--- OAuth Callback JWT/Save Error (CAUGHT IN ROUTE HANDLER) ---\n");
            console.error("Error Message:", error.message);
            console.error("Error Name:", error.name);
            console.error("Error Code:", error.code);
            console.error("Error Stack:", error.stack);
            console.error("Full Error Object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            res.redirect(process.env.CORS_ORIGIN + '/login?oauthError=true&message=' + encodeURIComponent(error.message || 'unknown_oauth_error'));
        }
    }
);

// ... (rest of user.routes.js) ...

// ... (rest of user.routes.js) ...
// --- End Google OAuth Routes ---


// Secured routes (authentication needed using verifyJWT middleware)
router.use(verifyJWT); // All routes below this will use verifyJWT middleware

router.post('/logout', logoutUser);
router.post('/change-password', changeCurrentPassword);
router.get('/current-user', getCurrentUser);
router.patch('/update-account', updateAccountDetails);
router.patch('/profile-picture', upload.single("profilePicture"), updateUserProfilePicture);
router.get('/c/:username', getUserPublicProfile);

export default router;