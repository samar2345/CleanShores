// server/src/routes/event.routes.js
import { Router } from 'express';
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    submitEventCompletionDetails,
    refreshEventQrCode,
} from '../controllers/event.controller.js'; // Import event controllers
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware

const router = Router();

// Routes requiring authentication
router.use(verifyJWT); // All routes below this will use verifyJWT middleware

// Admin-specific routes
router.route('/')
    .post(authorizeRoles('admin'), createEvent) // Only admins can create events
    .get(getAllEvents); // Anyone (logged in) can get all events, or filter by adminId in query

router.route('/:id')
    .get(getEventById) // Anyone (logged in) can get a single event
    .put(authorizeRoles('admin'), updateEvent) // Only admin can update their event
    .delete(authorizeRoles('admin', 'ngo'), deleteEvent); // Admin or NGO can delete

router.route('/:id/status')
    .patch(authorizeRoles('admin', 'ngo'), updateEventStatus); // Admin or NGO can change status

router.route('/:id/complete-details')
    .patch(authorizeRoles('admin'), submitEventCompletionDetails); // Only admin can submit completion details

router.route('/:id/refresh-qr')
    .patch(authorizeRoles('admin'), refreshEventQrCode); // Only admin can refresh QR

export default router;