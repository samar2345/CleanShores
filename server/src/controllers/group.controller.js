// This controller will handle group CRUD and historical message retrieval. 
// Real-time message sending/receiving will primarily be handled by Socket.IO, but database persistence occurs here.

// server/src/controllers/group.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Group } from "../models/Group.js"; // Import Group model
import { Message } from "../models/Message.js"; // Import Message model
import { User } from "../models/User.js";   // Import User model
import mongoose from 'mongoose'; // For ObjectId
import { z } from 'zod'; // For validation

// Zod Schemas for validation
const createGroupSchema = z.object({
  name: z.string().trim().min(3, "Group name must be at least 3 characters").max(50, "Group name cannot exceed 50 characters"),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional().default(''),
  isPublic: z.boolean().optional().default(true),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(3).max(50).optional(),
  description: z.string().trim().max(500).optional(),
  isPublic: z.boolean().optional(),
});

// @desc    Admin/NGO creates a new group
// @route   POST /api/v1/groups
// @access  Protected (Admin or NGO)
const createGroup = asyncHandler(async (req, res) => {
  const { success, data, error } = createGroupSchema.safeParse(req.body);
  if (!success) {
    throw new ApiError(400, error.errors[0].message);
  }

  const { name, description, isPublic } = data;
  const adminId = req.user._id;

  // Ensure only admins or NGOs can create groups
  if (req.user.role !== 'admin' && req.user.role !== 'ngo') {
    throw new ApiError(403, "Only admins or NGO personnel can create groups.");
  }

  const existingGroup = await Group.findOne({ name });
  if (existingGroup) {
    throw new ApiError(409, "Group with this name already exists.");
  }

  const group = await Group.create({
    name,
    description,
    isPublic,
    admin: adminId,
    members: [{ userId: adminId, joinedAt: Date.now() }], // Admin is automatically a member
  });

  if (!group) {
    throw new ApiError(500, "Failed to create group.");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, group, "Group created successfully!"));
});

// @desc    Get all public groups
// @route   GET /api/v1/groups
// @access  Protected (Any logged-in user can browse public groups)
const getAllGroups = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { isPublic: true }; // Only show public groups by default

  if (search) {
    filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search by name
  }

  const groups = await Group.find(filter)
    .populate('admin', 'fullName username email profilePicture'); // Populate admin details

  return res
    .status(200)
    .json(new ApiResponse(200, groups, "Groups fetched successfully!"));
});

// @desc    Get a single group by ID (with member details)
// @route   GET /api/v1/groups/:id
// @access  Protected (Any logged-in user)
const getGroupById = asyncHandler(async (req, res) => {
  const groupId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid Group ID format.");
  }

  const group = await Group.findById(groupId)
    .populate('admin', 'fullName username email profilePicture')
    .populate('members.userId', 'fullName username email profilePicture'); // Populate member user details

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Ensure user is authorized to view (e.g., if group is private, only members can view)
  // For now, all fetched groups are public, so anyone who can fetch can view.
  // Add logic here if you implement private groups.

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Group fetched successfully!"));
});

// @desc    User joins a group
// @route   POST /api/v1/groups/:id/join
// @access  Protected (Any logged-in user)
const joinGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid Group ID format.");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Check if user is already a member
  const isAlreadyMember = group.members.some(
    (member) => member.userId.equals(userId)
  );

  if (isAlreadyMember) {
    throw new ApiError(400, "You are already a member of this group.");
  }

  // Only public groups can be joined directly (can add invite logic later)
  if (!group.isPublic) {
      throw new ApiError(403, "This is a private group. You cannot join directly.");
  }

  group.members.push({ userId, joinedAt: Date.now() });
  await group.save();

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Successfully joined the group!"));
});

// @desc    User leaves a group
// @route   POST /api/v1/groups/:id/leave
// @access  Protected (Any logged-in user)
const leaveGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid Group ID format.");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Prevent admin from leaving their own group unless they transfer ownership (future feature)
  if (group.admin.equals(userId)) {
      throw new ApiError(400, "Group admin cannot leave their own group directly.");
  }

  const initialMemberCount = group.members.length;
  group.members = group.members.filter(
    (member) => !member.userId.equals(userId)
  );

  if (group.members.length === initialMemberCount) {
    throw new ApiError(400, "You are not a member of this group.");
  }

  await group.save();

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Successfully left the group!"));
});

// @desc    Admin/NGO updates group details
// @route   PUT /api/v1/groups/:id
// @access  Protected (Admin/NGO who created the group)
const updateGroup = asyncHandler(async (req, res) => {
  const { success, data, error } = updateGroupSchema.safeParse(req.body);
  if (!success) {
    throw new ApiError(400, error.errors[0].message);
  }

  const groupId = req.params.id;
  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Only the group admin/creator can update
  if (!group.admin.equals(req.user._id)) {
    throw new new ApiError(403, "You are not authorized to update this group.");
  }

  // Check for duplicate name if name is being updated
  if (data.name && data.name !== group.name) {
    const existingGroupWithName = await Group.findOne({ name: data.name });
    if (existingGroupWithName) {
      throw new ApiError(409, "Another group with this name already exists.");
    }
  }

  Object.assign(group, data);
  await group.save();

  return res
    .status(200)
    .json(new ApiResponse(200, group, "Group updated successfully!"));
});

// @desc    Admin/NGO deletes a group
// @route   DELETE /api/v1/groups/:id
// @access  Protected (Admin/NGO who created the group)
const deleteGroup = asyncHandler(async (req, res) => {
  const groupId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid Group ID format.");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Only the group admin/creator can delete
  if (!group.admin.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this group.");
  }

  // Delete all messages associated with this group first
  await Message.deleteMany({ group: groupId });

  await group.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Group and its messages deleted successfully!"));
});

// @desc    Get messages for a specific group
// @route   GET /api/v1/groups/:id/messages
// @access  Protected (Only group members can view messages)
const getGroupMessages = asyncHandler(async (req, res) => {
  const groupId = req.params.id;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new ApiError(400, "Invalid Group ID format.");
  }

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found.");
  }

  // Check if user is a member of the group
  const isMember = group.members.some(
    (member) => member.userId.equals(userId)
  );

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this group and cannot view its messages.");
  }

  const messages = await Message.find({ group: groupId })
    .populate('sender', 'fullName username profilePicture') // Populate sender details
    .sort({ createdAt: 1 }); // Sort by creation time (oldest first)

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "Group messages fetched successfully!"));
});


export {
  createGroup,
  getAllGroups,
  getGroupById,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  getGroupMessages,
};