// server/src/routes/group.routes.js
import { Router } from 'express';
import {
    createGroup,
    getAllGroups,
    getGroupById,
    joinGroup,
    leaveGroup,
    updateGroup,
    deleteGroup,
    getGroupMessages,
} from '../controllers/group.controller.js'; // Import group controllers
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js'; // Auth middleware

const router = Router();

// Apply JWT verification to all routes in this router
router.use(verifyJWT);

// Group CRUD
router.route('/')
    .post(authorizeRoles('admin', 'ngo'), createGroup) // Admins/NGOs create groups
    .get(getAllGroups); // Any logged-in user can get all public groups

router.route('/:id')
    .get(getGroupById) // Any logged-in user can get group details (if public/member)
    .put(authorizeRoles('admin', 'ngo'), updateGroup) // Group admin/NGO updates
    .delete(authorizeRoles('admin', 'ngo'), deleteGroup); // Group admin/NGO deletes

// Group Membership
router.route('/:id/join')
    .post(joinGroup); // Any logged-in user joins

router.route('/:id/leave')
    .post(leaveGroup); // Any logged-in user leaves (using POST for simplicity as DELETE body is tricky with some clients)

// Messages
router.route('/:id/messages')
    .get(getGroupMessages); // Get historical messages (only for members)

export default router;