// server/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApiError } from './utils/ApiError.js'; 

// Import routes
import userRouter from './routes/user.routes.js';
import eventRouter from './routes/event.routes.js';
import enrollmentRouter from './routes/enrollment.routes.js';
import ecommerceRouter from './routes/ecommerce.routes.js'; 
import attendanceRouter from './routes/attendance.routes.js'; 
import groupRouter from './routes/group.routes.js'; 
import adminRouter from './routes/admin.routes.js'; 


const app = express();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/events", enrollmentRouter); 
app.use("/api/v1/ecommerce", ecommerceRouter);
// app.use("/api/v1/ecommerce", import('./routes/ecommerce.routes.js').then(module => module.default)); // Lazy load ecommerce routes
app.use("/api/v1/attendance", attendanceRouter); 
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/admin",adminRouter);

// Global error handling middleware (from your example)
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error("Global Error Handler:", err);
    // Ensure ApiError is imported to be used here
    if (err instanceof ApiError) { // This line caused the ReferenceError
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors
        });
    }
    // Handle Multer errors specifically
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large. Max 5MB allowed.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            message = `Unexpected file field: ${err.field}. Check your form-data keys.`;
        }
        return res.status(400).json({
            success: false,
            message: message,
            errors: [{ field: err.field, code: err.code }]
        });
    }

    // Fallback for unhandled errors that are not ApiError instances
    return res.status(err.statusCode || 500).json({ // Use err.statusCode if available
        success: false,
        message: err.message || "An unexpected error occurred. Please try again later.",
        errors: []
    });
});

export { app };