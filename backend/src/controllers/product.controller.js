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
      // CẬP NHẬT: Thêm categorySlug để nhận từ URL (?categorySlug=...)
      const { search, categoryId, categorySlug, status, sort } = req.query;

      // Truyền tất cả filter vào service
      const products = await productService.getAllProducts({
        search,
        categoryId,
        categorySlug, // Thêm vào object truyền đi
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
      const validatedData = updateProductSchema.parse(req.body);
      const result = await productService.updateProduct(id, validatedData);

      return res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: result,
      });
    } catch (error) {
      const status = error.statusCode || 400;
      return res.status(status).json({
        success: false,
        message: error.message || "Lỗi khi cập nhật sản phẩm",
        errors: error.errors || null,
      });
    }
  }

  async getBySlug(req, res) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductDetail(slug);

      return res.status(200).json({
        success: true,
        data: product,
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