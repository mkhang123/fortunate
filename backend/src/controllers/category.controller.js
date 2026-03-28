import categoryService from "../services/category.service.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.schema.js";

class CategoryController {
  async getAll(req, res) {
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Đã xảy ra lỗi khi lấy danh mục",
      });
    }
  }

  async create(req, res) {
    try {
      const payload = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(payload);
      return res.status(201).json({
        success: true,
        message: "Tạo danh mục thành công",
        data: category,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Không thể tạo danh mục",
      });
    }
  }

  async update(req, res) {
    try {
      const payload = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(req.params.id, payload);
      return res.status(200).json({
        success: true,
        message: "Cập nhật danh mục thành công",
        data: category,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Không thể cập nhật danh mục",
      });
    }
  }

  async delete(req, res) {
    try {
      await categoryService.deleteCategory(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Xóa danh mục thành công",
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Không thể xóa danh mục",
      });
    }
  }
}

export default new CategoryController();