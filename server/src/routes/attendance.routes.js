// server/src/routes/attendance.routes.js
import { Router } from 'express';
import {
    scanQrForAttendance,
    getEventAttendance,
    getAllAttendance,
} from '../controllers/attendance.controller.js'; // Import attendance controllers
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware

const router = Router();

// All routes in this router require JWT verification
router.use(verifyJWT);

// Route for scanning QR code (user/admin)
router.route('/scan-qr')
    .post(scanQrForAttendance);

// Routes for viewing attendance records
router.route('/events/:id')
    .get(authorizeRoles('admin', 'ngo'), getEventAttendance); // Admin/NGO view for a specific event

router.route('/')
    .get(authorizeRoles('ngo'), getAllAttendance); // NGO view all attendance

export default router;  