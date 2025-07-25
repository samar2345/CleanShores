// server/src/utils/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'; // Node.js file system module

// Configure Cloudinary (replace with your actual credentials in .env)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Auto-detect resource type (image, video, raw)
        });

        // File has been uploaded successfully
        // console.log("File uploaded on Cloudinary:", response.url);
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file

        return response; // Return the Cloudinary response object
    } catch (error) {
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file even if upload failed
        console.error("Cloudinary upload error:", error);
        return null;
    }
};

// Optional: Function to delete from Cloudinary (useful for updating avatars/cover images)
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {
        if (!publicId) return null;

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        // console.log("Cloudinary deletion result:", result);
        return result;
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
        return null;
    }
};


export { uploadOnCloudinary, deleteFromCloudinary };    