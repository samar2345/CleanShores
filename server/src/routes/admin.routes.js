// server/src/routes/admin.routes.js
import { Router } from 'express';
import {
    getPendingAdmins,
    approveRejectAdmin,
    getAllUsers,
    updateUserRole,
    updateUserAccountStatus,
    getPlatformOverview,
    getUserLeaderboard,
    getAdminLeaderboard,
} from '../controllers/admin.controller.js'; // Import admin controllers
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware
import { z } from 'zod'; // Import Zod (needed for controller schemas)

const router = Router();

// Apply JWT verification to all routes in this router
router.use(verifyJWT);

// --- NGO/Admin Management ---
router.route('/pending-admins')
    .get(authorizeRoles('ngo'), getPendingAdmins); // NGO to review pending admins

router.route('/approve-reject-admin/:id')
    .patch(authorizeRoles('ngo'), approveRejectAdmin); // NGO approves/rejects an admin

router.route('/users')
    .get(authorizeRoles('ngo'), getAllUsers); // NGO views all users

router.route('/users/:id/role')
    .patch(authorizeRoles('ngo'), updateUserRole); // NGO changes user's role

router.route('/users/:id/status')
    .patch(authorizeRoles('ngo'), updateUserAccountStatus); // NGO deactivates/reactivates user

// --- Analytics & Leaderboards ---
router.route('/analytics/overview')
    .get(authorizeRoles('admin', 'ngo'), getPlatformOverview); // Admin/NGO view

router.route('/analytics/leaderboard/users')
    .get(getUserLeaderboard); // Any logged-in user can view user leaderboard

router.route('/analytics/leaderboard/admins')
    .get(authorizeRoles('admin', 'ngo'), getAdminLeaderboard); // Admin/NGO view admin leaderboard (can be public if desired)


export default router;