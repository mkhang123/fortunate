import vtonService from '../services/vton.service.js';

class VTONController {
  /**
   * POST /api/vton/try-on
   * Thử đồ với sản phẩm từ catalog hoặc custom
   */
  async tryOn(req, res) {
    try {
      const userId = req.user.id;
      const { variantId, garmentImageUrl } = req.body;

      // Kiểm tra ảnh người
      if (!req.files || !req.files.personImage) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload ảnh người'
        });
      }

      const personImage = req.files.personImage[0];
      let garmentImage;

      if (req.files && req.files.garmentImage) {
        // Trường hợp 1: Upload file trực tiếp
        garmentImage = req.files.garmentImage[0];
      } else if (garmentImageUrl) {
        // Trường hợp 2: URL ảnh từ sản phẩm → backend tự download về server
        const { default: axios } = await import('axios');
        const { default: fs } = await import('fs');
        const { default: path } = await import('path');

        const dir = 'uploads/vton/garment';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const ext = path.extname(new URL(garmentImageUrl).pathname) || '.jpg';
        const filename = `garment_product_${userId}_${Date.now()}${ext}`;
        const filepath = `${dir}/${filename}`;

        const response = await axios({ url: garmentImageUrl, method: 'GET', responseType: 'stream' });
        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filepath);
          response.data.pipe(writer);
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        garmentImage = { path: filepath, filename, fieldname: 'garmentImage' };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ảnh quần áo hoặc URL ảnh sản phẩm'
        });
      }

      const variantIdInt = variantId ? parseInt(variantId) : null;

      const session = await vtonService.processTryOn(userId, personImage, garmentImage, variantIdInt);

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
