// server/src/middlewares/multer.middleware.js
import multer from 'multer';
import fs from 'fs';
import path from 'path'; // Needed for constructing paths

// Define the temporary directory
const tempDir = './public/temp';

// Ensure the directory exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir); // Store files in the temporary directory
    },
    filename: function (req, file, cb) {
        // Use a unique name to avoid conflicts, while retaining original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB file size limit, adjust as needed
    },
    fileFilter: (req, file, cb) => {
        // Optional: Filter file types (e.g., only images)
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});