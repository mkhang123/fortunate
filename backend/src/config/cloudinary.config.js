import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage cho ảnh sản phẩm
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

export default cloudinary;
