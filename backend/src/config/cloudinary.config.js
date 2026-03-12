import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// ==================================================
// Cấu hình Cloudinary từ biến môi trường
// ==================================================
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==================================================
// 1. Storage cho ảnh SẢN PHẨM
//    Folder: fortunate/products
//    Transform: resize 800x800, tự chọn quality
// ==================================================
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'fortunate/products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
    },
});

export const uploadProductImage = multer({
    storage: productStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ==================================================
// 2. Storage cho ẢNH ĐẠI DIỆN (avatar) của user
//    Folder: fortunate/avatars
//    Transform: crop vuông 300x300, fill + face detection
// ==================================================
const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'fortunate/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' }
        ],
    },
});

export const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ==================================================
// 3. Storage cho ảnh VTON (thử đồ ảo)
//    Folder: fortunate/vton
//    KHÔNG transform vì AI cần ảnh gốc chất lượng cao
// ==================================================
const vtonStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'fortunate/vton',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        // Không transform để giữ nguyên chất lượng cho AI model
    },
});

export const uploadVtonImages = multer({
    storage: vtonStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).fields([
    { name: 'personImage', maxCount: 1 },
    { name: 'garmentImage', maxCount: 1 },
]);

// ==================================================
// Helper: Xóa ảnh khỏi Cloudinary theo public_id
// ==================================================
export const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`🗑️ Đã xóa ảnh Cloudinary: ${publicId}`, result);
        return result;
    } catch (error) {
        console.error(`❌ Lỗi xóa ảnh Cloudinary (${publicId}):`, error.message);
        return null;
    }
};

// Helper: Upload ảnh từ URL lên Cloudinary (dùng cho garment URL)
export const uploadFromUrl = async (url, folder = 'fortunate/vton') => {
    const result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: 'image',
    });
    return result; // result.secure_url, result.public_id
};

export default cloudinary;
