import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../utils/cloudinary.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer(); // Memory storage by default

// @route   POST /api/upload
// @desc    Upload image to Cloudinary
// @access  Admin (for now, can be expanded)
router.post('/', authenticate, isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'tripsang_broadcasts', // Organize in a folder
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        const result = await streamUpload(req);

        res.json({
            success: true,
            imageUrl: result.secure_url,
            publicId: result.public_id
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
});

export default router;
