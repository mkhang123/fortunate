import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

class VTONAIService {
  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Model IDM-VTON trên Replicate
    this.modelVersion = 'cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4';
  }

  /**
   * Xử lý Virtual Try-On bằng AI
   * @param {string} personImagePath - Đường dẫn ảnh người
   * @param {string} garmentImagePath - Đường dẫn ảnh quần áo  
   * @returns {Promise<string>} - URL ảnh kết quả
   */
  async generateTryOn(personImagePath, garmentImagePath) {
    try {
      console.log('Starting AI processing...');
      console.log('Person image:', personImagePath);
      console.log('Garment image:', garmentImagePath);

      // === MOCK MODE (Không cần Replicate API) ===
      const MOCK_MODE = process.env.VTON_MOCK_MODE === 'true';

      if (MOCK_MODE) {
        console.log('🎭 MOCK MODE: Simulating AI processing...');

        // Giả lập thời gian xử lý AI (2-3 giây)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Trả về ảnh garment làm "kết quả" (giả lập)
        // Trong thực tế, đây sẽ là ảnh người đã mặc quần áo
        console.log('✅ Mock AI completed - returning garment image as result');
        return garmentImagePath; // Trả về path thay vì URL
      }

      // === REAL MODE (Gọi Replicate API) ===
      // Đọc file thành base64 hoặc URL
      const personImageData = await this.fileToDataURL(personImagePath);
      const garmentImageData = await this.fileToDataURL(garmentImagePath);

      // Gọi Replicate API
      const output = await this.replicate.run(this.modelVersion, {
        input: {
          human_img: personImageData,
          garm_img: garmentImageData,
          garment_des: 'clothing item', // Mô tả quần áo
          is_checked: true,
          is_checked_crop: false,
          denoise_steps: 30,
          seed: 42
        }
      });

      console.log('AI processing completed');
      return output; // URL của ảnh kết quả

    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }

  /**
   * Convert file local thành Data URL
   */
  async fileToDataURL(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString('base64');
    const mimeType = this.getMimeType(filePath);
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Lấy MIME type từ extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Download ảnh kết quả từ URL về server
   */
  async downloadImage(imageUrl, outputPath) {
    try {
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputPath));
        writer.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }
}

export default new VTONAIService();
