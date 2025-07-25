// server/src/routes/enrollment.routes.js
import { Router } from 'express';
import {
    enrollInEvent,
    leaveEvent,
    getEnrolledUsersForEvent,
} from '../controllers/enrollment.controller.js'; // Import enrollment controllers
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware

const router = Router();

// Apply JWT verification to all routes in this router
router.use(verifyJWT);

// Routes for enrollment/leaving
router.route('/:id/enroll')
    .post(enrollInEvent) // User enrolls
    .delete(leaveEvent); // User leaves

router.route('/:id/enrolled-users')
    .get(authorizeRoles('admin', 'ngo'), getEnrolledUsersForEvent); // Admin/NGO views enrolled users

export default router;