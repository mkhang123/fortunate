import vtonRepo from '../repositories/vton.repository.js';
import aiService from './ai/vton-ai.service.js';
import cloudinary, { deleteFromCloudinary } from '../config/cloudinary.config.js';
import fs from 'fs';

class VTONService {
  /**
   * Xử lý toàn bộ quy trình Try-On
   * personImageFile và garmentImageFile đã có .path là Cloudinary URL
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
      // personImageFile.path là Cloudinary URL (đã upload qua multer middleware)
      session = await vtonRepo.createSession({
        userId,
        variantId,
        aiModelId: aiModel.id,
        inputImage: personImageFile.path,  // Cloudinary URL
        status: 'PROCESSING',
      });

      console.log(`📝 Created session #${session.id}`);

      // 3. Gọi AI để xử lý
      const result = await aiService.generateTryOn(
        personImageFile.path,   // Cloudinary URL
        garmentImageFile.path   // Cloudinary URL
      );

      // 4. Upload kết quả AI lên Cloudinary
      const MOCK_MODE = process.env.VTON_MODE === 'mock';
      let outputUrl;

      if (MOCK_MODE) {
        // Mock mode: result là local path của garment image (đã có trên disk)
        // → upload lên Cloudinary
        const uploadResult = await cloudinary.uploader.upload(result, {
          folder: 'fortunate/vton/results',
          resource_type: 'image',
        });
        outputUrl = uploadResult.secure_url;
        console.log('🎭 Mock result uploaded to Cloudinary:', outputUrl);
      } else {
        console.log("🛠️ Result from AI target:", typeof result, result);
        
        // Real mode: result có thể là URL hoặc Blob hoặc local path (Python)
        // Xoay xở trường hợp result là mảng chứa url (Replicate cũ)
        let finalResultToUpload = result;
        if (Array.isArray(result) && result.length > 0) {
            finalResultToUpload = result[0];
        }

        if (typeof finalResultToUpload === 'string' && finalResultToUpload.startsWith('http')) {
          // URL từ Replicate → upload lên Cloudinary
          console.log("☁️ Uploading to Cloudinary from URL:", finalResultToUpload);
          const uploadResult = await cloudinary.uploader.upload(finalResultToUpload, {
            folder: 'fortunate/vton/results',
            resource_type: 'image',
          });
          outputUrl = uploadResult.secure_url;
          console.log('🚀 Replicate result uploaded to Cloudinary:', outputUrl);
        } else if (finalResultToUpload instanceof Blob) {
          // Blob từ Hugging Face → chuyển sang buffer → upload lên Cloudinary
          const arrayBuffer = await result.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'fortunate/vton/results', resource_type: 'image' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
          outputUrl = uploadResult.secure_url;
          console.log('🤗 Hugging Face result uploaded to Cloudinary:', outputUrl);
        } else if (typeof result === 'string' && result.length > 0) {
          // Local path từ Python VTON → upload lên Cloudinary
          const uploadResult = await cloudinary.uploader.upload(result, {
            folder: 'fortunate/vton/results',
            resource_type: 'image',
          });
          outputUrl = uploadResult.secure_url;
          console.log('🐍 Python VTON result uploaded to Cloudinary:', outputUrl);
        } else {
          throw new Error(`Unsupported result type: ${typeof result}`);
        }
      }

      // 5. Cập nhật session với Cloudinary URL
      const processingTime = Date.now() - startTime;
      session = await vtonRepo.updateSession(session.id, {
        outputImage: outputUrl,       // Cloudinary URL
        status: 'COMPLETED',
        processingTime: Math.floor(processingTime / 1000),
      });

      console.log(`✅ Session #${session.id} completed in ${processingTime}ms`);
      return session;

    } catch (error) {
      console.error('❌ Error in processTryOn:', error);

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

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or access denied');
    }

    return session;
  }

  /**
   * Xóa session và ảnh liên quan trên Cloudinary
   */
  async deleteSession(sessionId, userId) {
    const session = await this.getSessionById(sessionId, userId);

    // Xóa ảnh trên Cloudinary thay vì xóa file local
    try {
      const extractPublicId = (url) => {
        if (!url || !url.includes('cloudinary.com')) return null;
        // URL: https://res.cloudinary.com/<cloud>/image/upload/v123/fortunate/vton/xxx.jpg
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) return null;
        // Bỏ qua version (v1234567) nếu có
        const afterUpload = parts.slice(uploadIndex + 1);
        if (afterUpload[0]?.startsWith('v')) afterUpload.shift();
        // Ghép lại thành public_id, bỏ extension
        const withExt = afterUpload.join('/');
        return withExt.replace(/\.[^/.]+$/, '');
      };

      const inputPublicId = extractPublicId(session.inputImage);
      const outputPublicId = extractPublicId(session.outputImage);

      if (inputPublicId) await deleteFromCloudinary(inputPublicId);
      if (outputPublicId) await deleteFromCloudinary(outputPublicId);
    } catch (error) {
      console.error('Error deleting Cloudinary assets:', error);
    }

    // Xóa record trong database
    await vtonRepo.deleteSession(sessionId);

    return { success: true, message: 'Session deleted successfully' };
  }
}

export default new VTONService();
