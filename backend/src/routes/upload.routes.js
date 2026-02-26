import express from 'express';
import { uploadProductImage } from '../config/cloudinary.config.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/upload/image - Upload 1 ảnh sản phẩm lên Cloudinary
router.post('/image', authMiddleware, (req, res) => {
    // Gọi multer thủ công để bắt được lỗi Cloudinary
    uploadProductImage.single('image')(req, res, (err) => {
        if (err) {
            console.error('❌ Multer/Cloudinary error:', err);
            return res.status(500).json({
                success: false,
                message: 'Upload thất bại: ' + (err.message || 'Lỗi không xác định'),
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Không có file ảnh' });
        }

        console.log('✅ Upload thành công:', req.file.path);
        return res.status(200).json({
            success: true,
            message: 'Upload ảnh thành công',
            data: {
                url: req.file.path,           // Cloudinary secure URL
                public_id: req.file.filename, // Cloudinary public_id
            },
        });
    });
});

export default router;
