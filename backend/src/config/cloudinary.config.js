import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const vtonStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'fortunate/vton',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],

    },
});

export const uploadVtonImages = multer({
    storage: vtonStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).fields([
    { name: 'personImage', maxCount: 1 },
    { name: 'garmentImage', maxCount: 1 },
]);

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

export const uploadFromUrl = async (url, folder = 'fortunate/vton') => {
    const result = await cloudinary.uploader.upload(url, {
        folder,
        resource_type: 'image',
    });
    return result; // result.secure_url, result.public_id
};

export default cloudinary;
