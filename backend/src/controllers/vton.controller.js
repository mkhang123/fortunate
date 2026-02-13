import vtonService from '../services/vton.service.js';

class VTONController {
  /**
   * POST /api/vton/try-on
   * Thử đồ với sản phẩm từ catalog hoặc custom
   */
  async tryOn(req, res) {
    try {
      const userId = req.user.id;
      const { variantId } = req.body;

      // Kiểm tra file upload
      if (!req.files || !req.files.personImage || !req.files.garmentImage) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload đầy đủ ảnh người và ảnh quần áo'
        });
      }

      const personImage = req.files.personImage[0];
      const garmentImage = req.files.garmentImage[0];

      // Parse variantId to Int (nếu có)
      const variantIdInt = variantId ? parseInt(variantId) : null;

      // Gọi service xử lý
      const session = await vtonService.processTryOn(
        userId,
        personImage,
        garmentImage,
        variantIdInt
      );

      return res.status(201).json({
        success: true,
        message: 'Virtual try-on completed successfully',
        data: session
      });

    } catch (error) {
      console.error('Error in tryOn controller:', error);
      return res.status(500).json({
        success: false,
        message: error.message
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
