// fortunate/backend/src/controllers/product.controller.js
import productService from "../services/product.service.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/product.schema.js";

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

  async getAll(req, res) {
    try {
      // Lấy thêm trường sort từ query string (URL)
      const { search, categoryId, status, sort } = req.query;

      // Truyền tất cả filter (bao gồm sort) vào service
      const products = await productService.getAllProducts({
        search,
        categoryId,
        status,
        sort,
      });

      return res.status(200).json({ success: true, data: products });
    } catch (error) {
      return res
        .status(error.statusCode || 500)
        .json({ success: false, message: error.message });
    }
  }
  
  async update(req, res) {
    try {
      const { id } = req.params;

      // 1. Validate dữ liệu gửi lên (sử dụng partial schema)
      const validatedData = updateProductSchema.parse(req.body);

      // 2. Gọi service để xử lý cập nhật
      const result = await productService.updateProduct(id, validatedData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: result,
      });
    } catch (error) {
      // Bắt lỗi từ Zod hoặc từ Service
      const status = error.statusCode || 400;
      return res.status(status).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật sản phẩm",
        // Nếu có lỗi chi tiết từ Zod thì trả về thêm (tùy chọn)
        errors: error.errors || null,
      });
    }
  }
}

export default new ProductController();
