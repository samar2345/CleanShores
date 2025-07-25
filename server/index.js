// server/index.js (in the root of your server directory)
import 'dotenv/config'; // Load environment variables at the very top

import connectDB from './src/db/index.js'; // Corrected import path
import { app } from './src/app.js';       // Corrected import path and named export

import { initializeSocketIO } from './socket/index.js'; // <-- ADD THIS IMPORT FOR SOCKET.IO

// Ensure process.env.PORT is loaded by dotenv
const PORT = process.env.PORT || 8000; // Using 8000 as per your example, or 5000 from our initial setup

connectDB()
    .then(() => {
        const server = app.listen(PORT, () => { // Capture server instance for graceful shutdown
            console.log(`Server is running on port ${PORT}`);
        });

        // Initialize Socket.IO with the HTTP server instance
        const io = initializeSocketIO(server);
        app.set("io", io); // Optionally attach io to app for access in controllers if needed
        //app.listen(PORT, ...): The server instance returned by app.listen() is critical. Socket.IO attaches itself to this existing HTTP server.
        // initializeSocketIO(server): We pass the HTTP server to our Socket.IO setup function.

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received. Closing HTTP server.');
            server.close(() => {
                console.log('HTTP server closed.');
                process.exit(0);
            });
        });

        process.on('unhandledRejection', (err, promise) => {
            console.error(`Error: ${err.message}`);
            // Log full error stack for unhandled rejections
            console.error(err.stack);
            console.log('Unhandled Rejection detected. Shutting down...');
            server.close(() => process.exit(1));
        });

    })
    .catch((error) => {
        console.log("MongoDB connection failed!!!", error);
        process.exit(1);
    });