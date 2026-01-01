// fortunate/backend/src/controllers/product.controller.js
import productService from "../services/product.service.js";
import { createProductSchema } from "../validators/product.schema.js";

class ProductController {
  async create(req, res) {
    try {
      const validatedData = createProductSchema.parse(req.body);
      const result = await productService.createNewProduct(validatedData);

      return res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: result,
      });
    } catch (error) {
      // Nếu có statusCode từ Service thì dùng, không thì mặc định 400
      const status = error.statusCode || 400;

      return res.status(status).json({
        success: false,
        message: error.message || "Đã xảy ra lỗi không xác định",
      });
    }
  }

  async getAll(req, res) {
    try {
      const products = await productService.getAllProducts();
      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      await productService.removeProduct(req.params.id);
      res.status(200).json({ success: true, message: "Đã xóa sản phẩm" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  async getFeatured(req, res) {
    try {
      const products = await productService.getFeaturedProducts();
      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new ProductController();
