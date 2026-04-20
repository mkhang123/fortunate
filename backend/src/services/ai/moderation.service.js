import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

class ModerationService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
    
    if (this.apiKey) {
      const genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = genAI.getGenerativeModel({ model: this.modelName });
    }
  }

  async _urlToGenerativePart(url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      
      return {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType
        },
      };
    } catch (error) {
      console.error("Error converting URL to generative part:", error.message);
      throw new Error("Không thể tải ảnh để kiểm duyệt.");
    }
  }

  /**
   * Kiểm tra tính an toàn của hình ảnh
   * @param {string} imageUrl URL của ảnh
   * @param {'PERSON' | 'GARMENT'} type Loại ảnh cần kiểm tra
   * @returns {Promise<{safe: boolean, reason: string}>}
   */
  async checkImageSafety(imageUrl, type = 'PERSON') {
    if (!this.model) {
      console.warn("⚠️ Gemini API Key chưa được cấu hình. Bỏ qua kiểm duyệt.");
      return { safe: true, reason: "Skipped" };
    }

    try {
      const imagePart = await this._urlToGenerativePart(imageUrl);
      
      const personPrompt = `
        Bạn là chuyên gia kiểm duyệt ảnh NGƯỜI cho ứng dụng thời trang.
        Hành vi bị từ chối (REJECTED):
        1. Khỏa thân hoặc hở hang quá mức (lộ đồ lót, đồ bơi quá mỏng).
        2. Bạo lực, máu me.
        3. Không phải ảnh người (phong cảnh, động vật).
      `;

      const garmentPrompt = `
        Bạn là chuyên gia kiểm duyệt ảnh TRANG PHỤC (đồ vật) cho ứng dụng thời trang.
        Hành vi bị từ chối (REJECTED):
        1. Là đồ lót (bra, underwear), đồ bơi nhạy cảm (bikini mỏng).
        2. Chứa hình ảnh bạo lực hoặc cấm trên trang phục.
        3. Không phải là quần áo/phụ kiện thời trang.
      `;

      const prompt = `
        ${type === 'PERSON' ? personPrompt : garmentPrompt}
        
        CÁCH TRẢ LỜI:
        - Nếu an toàn: Trả về duy nhất từ 'SAFE'.
        - Nếu vi phạm: Trả về 'REJECTED' kèm lý do ngắn gọn tiếng Việt.
      `;

      const result = await this.model.generateContent([prompt, imagePart]);
      const text = result.response.text().trim();

      console.log(`🔍 [MODERATION-${type}] Result: ${text}`);

      if (text.startsWith("SAFE")) {
        return { safe: true, reason: "" };
      } else {
        const reason = text.replace("REJECTED:", "").trim() || "Ảnh không phù hợp.";
        return { safe: false, reason };
      }
    } catch (error) {
      console.error("❌ Moderation Error:", error.message);
      return { safe: true, reason: "Error allowed" };
    }
  }
}

export default new ModerationService();
