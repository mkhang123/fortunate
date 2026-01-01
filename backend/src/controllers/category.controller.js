import categoryService from "../services/category.service.js";

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
}

export default new CategoryController();