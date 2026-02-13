import vtonRepo from '../repositories/vton.repository.js';
import aiService from './ai/vton-ai.service.js';
import fs from 'fs';
import path from 'path';

class VTONService {
  /**
   * Xử lý toàn bộ quy trình Try-On
   */
  async processTryOn(userId, personImageFile, garmentImageFile, variantId = null) {
    const startTime = Date.now();
    let session = null;

    try {
      // 1. Lấy thông tin AI model
      const aiModel = await vtonRepo.getOrCreateAIModel(
        'IDM-VTON',
        '1.0',
        'Image-based Virtual Try-On'
      );

      // 2. Tạo session với status PENDING
      session = await vtonRepo.createSession({
        userId,
        variantId,
        aiModelId: aiModel.id,
        inputImage: personImageFile.path,
        status: 'PROCESSING',
      });

      console.log(`📝 Created session #${session.id}`);

      // 3. Gọi AI để xử lý
      const resultUrl = await aiService.generateTryOn(
        personImageFile.path,
        garmentImageFile.path
      );

      // 4. Xử lý kết quả (Real vs Mock mode)
      const MOCK_MODE = process.env.VTON_MOCK_MODE === 'true';
      let resultPath;

      if (MOCK_MODE) {
        // Mock mode: resultUrl là path của garment image
        // Copy garment image sang thư mục results
        const resultFileName = `result_${session.id}_${Date.now()}.jpg`;
        resultPath = path.join('uploads', 'vton', 'results', resultFileName);

        fs.copyFileSync(resultUrl, resultPath);
        console.log('🎭 Mock result saved:', resultPath);
      } else {
        // Real mode: Download ảnh từ URL
        const resultFileName = `result_${session.id}_${Date.now()}.jpg`;
        resultPath = path.join('uploads', 'vton', 'results', resultFileName);

        await aiService.downloadImage(resultUrl, resultPath);
      }

      // 5. Cập nhật session với kết quả
      const processingTime = Date.now() - startTime;
      session = await vtonRepo.updateSession(session.id, {
        outputImage: resultPath,
        status: 'COMPLETED',
        processingTime: Math.floor(processingTime / 1000), // Convert to seconds
      });

      console.log(`✅ Session #${session.id} completed in ${processingTime}ms`);
      return session;

    } catch (error) {
      console.error('❌ Error in processTryOn:', error);

      // Cập nhật session thành FAILED nếu có lỗi
      if (session) {
        await vtonRepo.updateSession(session.id, {
          status: 'FAILED',
        });
      }

      throw error;
    }
  }

  /**
   * Lấy lịch sử thử đồ của user
   */
  async getUserHistory(userId, page = 1, limit = 10) {
    return await vtonRepo.findByUserId(userId, { page, limit });
  }

  /**
   * Lấy chi tiết một session
   */
  async getSessionById(sessionId, userId) {
    const session = await vtonRepo.findById(sessionId);

    // Kiểm tra quyền truy cập
    if (!session || session.userId !== userId) {
      throw new Error('Session not found or access denied');
    }

    return session;
  }

  /**
   * Xóa session và ảnh liên quan
   */
  async deleteSession(sessionId, userId) {
    const session = await this.getSessionById(sessionId, userId);

    // Xóa file ảnh
    try {
      if (session.inputImage && fs.existsSync(session.inputImage)) {
        fs.unlinkSync(session.inputImage);
      }
      if (session.outputImage && fs.existsSync(session.outputImage)) {
        fs.unlinkSync(session.outputImage);
      }
    } catch (error) {
      console.error('Error deleting files:', error);
    }

    // Xóa record trong database
    await vtonRepo.deleteSession(sessionId);

    return { success: true, message: 'Session deleted successfully' };
  }
}

export default new VTONService();
