import vtonService from '../services/vton.service.js';
import moderationService from '../services/ai/moderation.service.js';
import { uploadFromUrl, deleteFromCloudinary } from '../config/cloudinary.config.js';

class VTONController {
  /**
   * POST /api/vton/try-on
   * Thử đồ với sản phẩm từ catalog hoặc custom
   */
  async tryOn(req, res) {
    try {
      const userId = req.user.id;
      const { productId, garmentImageUrl } = req.body;

      // Kiểm tra ảnh người
      if (!req.files || !req.files.personImage) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload ảnh người'
        });
      }

      // personImage đã được upload lên Cloudinary bởi multer middleware
      const personImage = req.files.personImage[0];

      // --- BƯỚC KIỂM DUYỆT ẢNH BẰNG AI (MODERATION) ---
      console.log('🛡️ [1/2] Starting Person image moderation check...');
      const personModeration = await moderationService.checkImageSafety(personImage.path, 'PERSON');

      if (!personModeration.safe) {
        console.warn('🔞 Person Image rejected:', personModeration.reason);
        // Xóa ngay ảnh vừa upload lên Cloudinary để bảo mật
        if (personImage.filename) {
          await deleteFromCloudinary(personImage.filename);
        }
        return res.status(400).json({
          success: false,
          message: `Ảnh người không hợp lệ: ${personModeration.reason}`
        });
      }
      console.log('✅ Image passed moderation.');
      // -----------------------------------------------

      let garmentImage;

      if (req.files && req.files.garmentImage) {
        // Trường hợp 1: Upload file trực tiếp → đã lên Cloudinary
        garmentImage = req.files.garmentImage[0];
      } else if (garmentImageUrl) {
        // Trường hợp 2: URL ảnh từ sản phẩm → upload lên Cloudinary
        try {
          const cloudResult = await uploadFromUrl(garmentImageUrl, 'fortunate/vton');
          garmentImage = {
            path: cloudResult.secure_url,
            filename: cloudResult.public_id,
            fieldname: 'garmentImage',
          };
        } catch (uploadErr) {
          console.error('Garment URL upload to Cloudinary failed:', uploadErr.message);
          return res.status(400).json({
            success: false,
            message: 'Không tải được ảnh sản phẩm lên Cloudinary. Thử chọn ảnh từ máy (mục "Tải đồ từ máy").',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ảnh quần áo hoặc URL ảnh sản phẩm'
        });
      }

      // --- KIỂM DUYỆT ẢNH ĐỒ (MODERATION 2) ---
      console.log('🛡️ [2/2] Starting Garment image moderation check...');
      const garmentModeration = await moderationService.checkImageSafety(garmentImage.path, 'GARMENT');

      if (!garmentModeration.safe) {
        console.warn('🔞 Garment Image rejected:', garmentModeration.reason);
        // Xóa ảnh vừa upload nếu có
        if (personImage.filename) await deleteFromCloudinary(personImage.filename);
        if (garmentImage.filename) await deleteFromCloudinary(garmentImage.filename);

        return res.status(400).json({
          success: false,
          message: `Trang phục không hợp lệ: ${garmentModeration.reason}`
        });
      }
      console.log('✅ Both images passed moderation.');
      // ----------------------------------------

      const productIdInt = productId ? parseInt(productId) : null;

      const session = await vtonService.processTryOn(userId, personImage, garmentImage, productIdInt);

      return res.status(201).json({
        success: true,
        message: 'Virtual try-on completed successfully',
        data: session
      });

    } catch (error) {
      console.error('Error in tryOn controller:', error?.stack || error);
      return res.status(500).json({
        success: false,
        message: error?.message || 'Lỗi xử lý thử đồ. Kiểm tra terminal backend để xem chi tiết.'
      });
    }
  }

  /**
   * GET /api/vton/history
   * Lấy lịch sử thử đồ
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const history = await vtonService.getUserHistory(userId, page, limit);
      return res.status(200).json({
        success: true,
        message: 'History retrieved successfully',
        data: history
      });

    } catch (error) {
      console.error('Error in getHistory controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/vton/session/:id
   * Lấy chi tiết một session
   */
  async getSessionById(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = parseInt(req.params.id);

      const session = await vtonService.getSessionById(sessionId, userId);
      return res.status(200).json({
        success: true,
        message: 'Session retrieved successfully',
        data: session
      });

    } catch (error) {
      console.error('Error in getSessionById controller:', error);
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/vton/session/:id
   * Xóa session
   */
  async deleteSession(req, res) {
    try {
      const userId = req.user.id;
      const sessionId = parseInt(req.params.id);

      const result = await vtonService.deleteSession(sessionId, userId);
      return res.status(200).json({
        success: true,
        message: 'Session deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error in deleteSession controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default new VTONController();
