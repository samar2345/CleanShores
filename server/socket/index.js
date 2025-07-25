// server/socket/index.js
import { Server } from "socket.io";
import jwt from 'jsonwebtoken'; // For authenticating socket connections
import { User } from '../src/models/User.js'; // To find user from token
import { Message } from '../src/models/Message.js'; // To save messages
import { Group } from '../src/models/Group.js'; // To check group membership
import mongoose from 'mongoose';

// Map to store connected users and their socket IDs (optional, for direct messaging/status)
const onlineUsers = new Map();

// This function will be called from server/index.js to initialize Socket.IO
const initializeSocketIO = (server) => {
    const io = new Server(server, {
        pingTimeout: 60000, // Disconnects users if no pong received for 60 seconds
        cors: {
            origin: process.env.CORS_ORIGIN, // Must match your React app's origin
            credentials: true,
        },
    });

    // Middleware to authenticate socket connection
    // This runs BEFORE the connection event for each new socket
    io.use(async (socket, next) => {
        try {
            // Get token from handshake query or headers
            const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error("Authentication error: No token provided."));
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken");

            if (!user) {
                return next(new Error("Authentication error: User not found."));
            }

            // Attach user data to the socket object
            socket.user = user;
            next();
        } catch (error) {
            console.error("Socket.IO Authentication Error:", error.message);
            next(new Error("Authentication error: Invalid token."));
        }
    });

    // --- Socket.IO Event Handlers ---
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.username} (ID: ${socket.id})`);
        onlineUsers.set(socket.user._id.toString(), socket.id); // Track online users

        // Emit 'connected' event to the client with user data (optional)
        socket.emit("connected", { userId: socket.user._id, username: socket.user.username });

        // 1. Join a Group Room
        // Client emits 'joinGroup' with groupId
        socket.on("joinGroup", async (groupId) => {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return socket.emit("groupError", "Invalid Group ID format.");
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return socket.emit("groupError", "Group not found.");
            }

            // Check if user is a member of the group before allowing join
            const isMember = group.members.some(member => member.userId.equals(socket.user._id));
            if (!isMember) {
                return socket.emit("groupError", "You are not a member of this group.");
            }

            socket.join(groupId); // Join the Socket.IO room for this group
            console.log(`${socket.user.username} joined room: ${groupId}`);
            
            // Optionally, fetch and emit recent messages to the joining user
            const recentMessages = await Message.find({ group: groupId })
                .populate('sender', 'fullName username profilePicture')
                .sort({ createdAt: 1 })
                .limit(50); // Get last 50 messages
            socket.emit("recentMessages", recentMessages);
            
            // Notify others in the group that a user has joined
            // Sending socket.user.username to ensure correct display
            socket.to(groupId).emit("userJoined", `${socket.user.username} has joined the chat.`);
        });

        // 2. Send Message
        // Client emits 'sendMessage' with { groupId, content }
        socket.on("sendMessage", async ({ groupId, content }) => {
            if (!mongoose.Types.ObjectId.isValid(groupId)) {
                return socket.emit("messageError", "Invalid Group ID format.");
            }
            if (!content || content.trim() === "") {
                return socket.emit("messageError", "Message content cannot be empty.");
            }

            const group = await Group.findById(groupId);
            if (!group) {
                return socket.emit("messageError", "Group not found.");
            }

            // Check if sender is actually a member of the group
            const isMember = group.members.some(member => member.userId.equals(socket.user._id));
            if (!isMember) {
                return socket.emit("messageError", "You are not a member of this group.");
            }

            // Save message to DB
            const newMessage = await Message.create({
                group: groupId,
                sender: socket.user._id, // Store sender's ID
                content: content.trim(),
            });

            // Populate sender info for broadcasting
            // The change is here: Await the populate and use the result
            const populatedMessage = await Message.findById(newMessage._id)
                                                  .populate('sender', 'fullName username profilePicture');

            if (!populatedMessage) { // Defensive check
                console.error("Failed to populate sender for new message during broadcast.");
                return socket.emit("messageError", "Server error processing message.");
            }

            // Emit the FULLY POPULATED message to all clients in that group room
            io.to(groupId).emit("receiveMessage", populatedMessage); // <-- Use populatedMessage
            console.log(`Message sent to group ${groupId} by ${populatedMessage.sender.username}: ${populatedMessage.content}`);
        });

        // 3. Leave a Group Room (optional, typically handled by API calls)
        socket.on("leaveGroup", (groupId) => {
            socket.leave(groupId);
            console.log(`${socket.user.username} left room: ${groupId}`);
            socket.to(groupId).emit("userLeft", `${socket.user.username} has left the chat.`);
        });


        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user.username} (ID: ${socket.id})`);
            onlineUsers.delete(socket.user._id.toString()); // Remove from online users map
            // You might want to notify all rooms the user was in
        });

        // Handle errors on the socket
        socket.on("error", (err) => {
            console.error("Socket Error:", err.message);
        });
    });

    console.log("Socket.IO initialized successfully.");
    return io;
};

export { initializeSocketIO };