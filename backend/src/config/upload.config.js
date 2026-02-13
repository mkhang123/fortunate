import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Đảm bảo thư mục tồn tại
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    // Phân loại theo loại ảnh
    if (file.fieldname === 'personImage') {
      uploadPath = 'uploads/vton/person';
    } else if (file.fieldname === 'garmentImage') {
      uploadPath = 'uploads/vton/garment';
    } else {
      uploadPath = 'uploads/vton';
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  
  // Đặt tên file unique
  filename: (req, file, cb) => {
    const userId = req.user?.id || 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}_${userId}_${timestamp}${ext}`;
    cb(null, uniqueName);
  }
});

// Chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)'), false);
  }
};

// Export cấu hình
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB tối đa
  }
});

export const vtonUploadFields = upload.fields([
  { name: 'personImage', maxCount: 1 },
  { name: 'garmentImage', maxCount: 1 }
]);
