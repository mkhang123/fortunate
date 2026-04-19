import Replicate from "replicate";
import { client } from "@gradio/client";
import fs from "fs";
import path from "path";
import axios from "axios";
import sharp from "sharp";

class VTONAIService {
  constructor() {
    this.mode = process.env.VTON_MODE || "mock";

    // Replicate initialization với Custom Fetch để chống lỗi Timeout (fetch failed) khi cold-boot
    // Mặc định Node.js sẽ ngắt mạng sau khoản 5p, IDM-VTON lúc warmup có thể tốn hơn 5p
    const customFetch = (url, options) => {
      // 10 minutes timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); 
      
      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeoutId));
    };

    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
      fetch: customFetch
    });
    this.replicateModelVersion =
      process.env.VTON_MODEL_REPLICATE ||
      "cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4";

    // Danh sách HF Space — tự động rotate khi một cái bị rate-limited
    this.hfSpaces = [
      "yisol/IDM-VTON",
      "Nymbo/Virtual-Try-On",
      "yisol/IDM-VTON-DC",
    ];
    this.hfSpaceIndex = 0; // Đang dùng Space nào
    this.hfSpace = this.hfSpaces[0];

    // Google Colab server URL (có thể cập nhật runtime, không cần restart)
    this.colabUrl = process.env.VTON_COLAB_URL || null;

    console.log(`VTON Service initialized in ${this.mode.toUpperCase()} mode`);
  }

  /**
   * Cập nhật Colab URL ngay trong runtime (không cần restart backend)
   */
  setColabUrl(url) {
    this.colabUrl = url;
    this.mode = "colab";
    console.log(`🔗 Colab URL updated: ${url}`);
  }

  /**
   * Rotate sang HF Space tiếp theo khi bị rate-limited
   */
  _rotateHFSpace() {
    this.hfSpaceIndex = (this.hfSpaceIndex + 1) % this.hfSpaces.length;
    this.hfSpace = this.hfSpaces[this.hfSpaceIndex];
    console.log(`🔄 Rotate sang HF Space: ${this.hfSpace} (${this.hfSpaceIndex + 1}/${this.hfSpaces.length})`);
  }

  /**
   * Lấy config hiện tại
   */
  getConfig() {
    return {
      mode: this.mode,
      colabUrl: this.colabUrl,
      hfSpace: this.hfSpace,
      hfSpaceIndex: this.hfSpaceIndex,
      totalHFSpaces: this.hfSpaces.length,
    };
  }

  /**
   * Xử lý Virtual Try-On với cơ chế Tự động Dự phòng (Fallback)
   */
  async generateTryOn(personImagePath, garmentImagePath) {
    console.log(`\n 🎨 VTON Service [${this.mode.toUpperCase()}]`);
    console.log("Person image:", personImagePath);
    console.log("Garment image:", garmentImagePath);

    try {
      switch (this.mode) {
        case "mock":
          return await this._generateMock(personImagePath, garmentImagePath);

        case "huggingface":
          try {
            return await this._generateHuggingFace(personImagePath, garmentImagePath);
          } catch (error) {
            // Tự động rotate sang Space khác
            console.warn(`⚠️ HF Space [${this.hfSpace}] lỗi: ${error.message}`);
            this._rotateHFSpace();
            try {
              console.log(`🔄 Thử lại với Space: ${this.hfSpace}...`);
              return await this._generateHuggingFace(personImagePath, garmentImagePath);
            } catch (err2) {
              console.warn("⚠️ Tất cả Space đều lỗi. Fallback Mock...");
              return await this._generateMock(personImagePath, garmentImagePath);
            }
          }

        case "colab":
          if (!this.colabUrl) throw new Error("Chưa cấu hình Colab URL. Vui lòng nhập link Gradio từ Google Colab.");
          try {
            return await this._generateColab(personImagePath, garmentImagePath);
          } catch (error) {
            console.warn("⚠️ Colab server lỗi. Tự động chuyển sang Mock Mode dự phòng...");
            return await this._generateMock(personImagePath, garmentImagePath);
          }

        case "replicate":
          return await this._generateReplicate(personImagePath, garmentImagePath);

        default:
          throw new Error(`Unknown VTON mode: ${this.mode}`);
      }
    } catch (error) {
      console.error("❌ VTON Service Error:", error.message);
      throw new Error(`VTON processing failed: ${error.message}`);
    }
  }

  /**
   * === MOCK MODE "XỊN" ===
   * Trả về ảnh kết quả mẫu khớp với loại áo đầu vào
   */
  async _generateMock(personImagePath, garmentImagePath) {
    console.log("⛔ [MOCK MODE] Đã hết lượt thử đồ ảo.");
    throw new Error(
      "Đã hết lượt thử đồ ảo miễn phí. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
    );
  }

  /**
   * === GOOGLE COLAB MODE ===
   * Kết nối đến Gradio server đang chạy trên Google Colab
   */
  async _generateColab(personImagePath, garmentImagePath) {
    console.log(`☁️ Google Colab Proxy: Connecting to ${this.colabUrl}...`);
    try {
      const app = await client(this.colabUrl);

      const personBuffer = fs.readFileSync(personImagePath);
      const garmentBuffer = fs.readFileSync(garmentImagePath);

      const personMime = this.getMimeType(personImagePath);
      const garmentMime = this.getMimeType(garmentImagePath);

      // Colab proxy nhận ảnh dưới dạng Blob (file)
      const personBlob = new Blob([personBuffer], { type: personMime });
      const garmentBlob = new Blob([garmentBuffer], { type: garmentMime });

      console.log("⏳ Colab Proxy đang gọi HF Space từ IP Google...");

      // Colab proxy expose endpoint /predict (Gradio Interface mặc định)
      const result = await app.predict("/predict", [
        personBlob,
        garmentBlob,
      ]);

      if (result.data && result.data[0]) {
        const resultImg = result.data[0];
        // Gradio trả về object { url } hoặc string URL
        const imageUrl = typeof resultImg === 'string' ? resultImg : resultImg.url;
        console.log("✅ Colab Proxy: processing completed");
        return imageUrl;
      }
      throw new Error("Colab Proxy không trả về kết quả.");
    } catch (error) {
      throw error;
    }
  }

  /**
   * === HUGGING FACE SPACE MODE ===
   */
  async _generateHuggingFace(personImagePath, garmentImagePath) {
    console.log("🤗 Hugging Face Space: Connecting via Gradio...");
    try {
      const app = await client(this.hfSpace, {
        hf_token: process.env.HF_API_TOKEN
      });

      const personBlob = fs.readFileSync(personImagePath);
      const garmentBlob = fs.readFileSync(garmentImagePath);

      console.log("⏳ AI đang xử lý (Hugging Face Space)...");

      const result = await app.predict("/tryon", [
        { "background": personBlob, "layers": [], "composite": null },
        garmentBlob,
        "fashion item",
        true,
        true,
        30,
        42,
      ]);

      if (result.data && result.data[0]) {
        console.log("✅ Hugging Face processing completed");
        return result.data[0].url;
      }
      throw new Error("AI không trả về kết quả.");
    } catch (error) {
      throw error; // Để hàm generateTryOn bắt lại và chạy Mock
    }
  }

  /**
   * === REPLICATE MODE ===
   */
  async _generateReplicate(personImagePath, garmentImagePath) {
    try {
      // Bật chế độ resize (true) để chuẩn hóa ảnh về 768x1024 trước khi gọi Replicate
      const personImageData = await this.fileToDataURL(personImagePath, true);
      const garmentImageData = await this.fileToDataURL(garmentImagePath, true);

      // Lấy loại áo hoặc mô tả (tạm thời hardcode là short sleeve t-shirt, nhưng nên dynmaic sau này)
      const garmentDescription = "Short sleeve shirt, t-shirt, top";

      const output = await this.replicate.run(this.replicateModelVersion, {
        input: {
          human_img: personImageData,
          garm_img: garmentImageData,
          garment_des: garmentDescription, // Đưa mô tả chi tiết để tránh ra áo dài tay
          is_checked: true,
          is_checked_crop: false, // Để AI tự cắt theo thông số tốt nhất nếu cần
          denoise_steps: 30, // 30 là chuẩn, giúp áo bám sát hơn
          seed: 42,
        },
      });

      console.log("📦 Replicate raw output type:", typeof output);

      // Helper: lấy URL string từ nhiều kiểu output khác nhau
      const extractUrl = (val) => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        // FileOutput.url() là method → trả về URL object hoặc string
        if (typeof val.url === 'function') {
          const urlResult = val.url();
          if (typeof urlResult === 'string') return urlResult;
          if (urlResult?.href) return urlResult.href; // URL object
          return null;
        }
        if (typeof val.url === 'string') return val.url;
        // val chính là URL object (có .href)
        if (val.href && typeof val.href === 'string') return val.href;
        return null;
      };

      // ReadableStream/AsyncIterable (Replicate SDK mới)
      if (output && typeof output[Symbol.asyncIterator] === 'function') {
        let lastValue = null;
        for await (const chunk of output) {
          lastValue = chunk;
          console.log("📡 Stream chunk type:", typeof chunk, chunk);
        }
        const url = extractUrl(lastValue);
        if (url) {
          console.log("✅ Replicate URL (stream):", url);
          return url;
        }
      }

      // Array of outputs (SDK cũ)
      if (Array.isArray(output) && output.length > 0) {
        const url = extractUrl(output[0]);
        if (url) {
          console.log("✅ Replicate URL (array):", url);
          return url;
        }
      }

      // Output trực tiếp
      const directUrl = extractUrl(output);
      if (directUrl) {
        console.log("✅ Replicate URL (direct):", directUrl);
        return directUrl;
      }

      throw new Error("Replicate không trả về URL hợp lệ.");
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật để hỗ trợ cả đường dẫn local và URL (thường là Cloudinary)
  async fileToDataURL(filePathOrUrl, resize = false) {
    let fileBuffer;
    let mimeType;

    try {
      if (filePathOrUrl.startsWith('http://') || filePathOrUrl.startsWith('https://')) {
        // Nếu là URL, tải hình ảnh bằng axios với retry tự động
        // Xử lý lỗi mạng tạm thời (ECONNRESET khi đổi mạng WiFi↔4G, v.v.)
        const MAX_RETRIES = 3;
        let lastError;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            console.log(`📥 Tải ảnh từ URL (lần ${attempt}/${MAX_RETRIES}): ${filePathOrUrl}`);
            const response = await axios({
              url: filePathOrUrl,
              method: 'GET',
              responseType: 'arraybuffer',
              timeout: 30000, // 30s timeout mỗi lần thử
            });
            fileBuffer = Buffer.from(response.data);
            mimeType = response.headers['content-type'] || 'image/jpeg';
            break; // Thành công → thoát vòng lặp
          } catch (err) {
            lastError = err;
            const retryable = ['ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_NETWORK'].includes(err.code);
            if (retryable && attempt < MAX_RETRIES) {
              const delay = attempt * 2000; // 2s, 4s,...
              console.warn(`⚠️ Lỗi mạng (${err.code}) lần ${attempt}. Thử lại sau ${delay / 1000}s...`);
              await new Promise(r => setTimeout(r, delay));
            } else {
              throw err; // Lỗi không thể retry hoặc đã hết lần thử
            }
          }
        }

        if (!fileBuffer) throw lastError;
      } else {
        // Nếu là file local
        fileBuffer = fs.readFileSync(filePathOrUrl);
        mimeType = this.getMimeType(filePathOrUrl);
      }
    } catch (err) {
      console.error(`Lỗi khi đọc file/url ${filePathOrUrl}:`, err);
      throw new Error(`Không thể đọc ảnh đầu vào: ${err.message}`);
    }

    // Tạm thời loại bỏ việc tự động resize bằng sharp theo yêu cầu
    // vì nó bóp méo ảnh và không giữ đúng bố cục gốc.
    // Nếu sau này API Replicate báo lỗi kích thước, ta có thể
    // quay lại resize nhưng với sharp format giữ đúng tỉ lệ.
    /*
    if (resize) {
      try {
        fileBuffer = await sharp(fileBuffer)
          .resize({
            width: 768,
            height: 1024,
            fit: 'contain', // Thu nhỏ để vừa khung, phần thừa bù màu nền
            background: { r: 255, g: 255, b: 255, alpha: 1 } // Viền trắng
          })
          .jpeg({ quality: 90 }) 
          .toBuffer();
        mimeType = "image/jpeg";
      } catch (err) {
        console.error("Lỗi khi resize ảnh với sharp:", err);
      }
    }
    */

    const base64 = fileBuffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
    return mimeTypes[ext] || "image/jpeg";
  }

  async downloadImage(imageUrl, outputPath) {
    const response = await axios({ url: imageUrl, method: "GET", responseType: "stream" });
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(outputPath));
      writer.on("error", reject);
    });
  }
}

export default new VTONAIService();