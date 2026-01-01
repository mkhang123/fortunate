import categoryRepository from "../repositories/category.repository.js";

class CategoryService {
  async getAllCategories() {
    try {
      const categories = await categoryRepository.getAll();
      return categories;
    } catch (error) {
      const err = new Error("Lỗi khi lấy danh sách danh mục từ Database");
      err.statusCode = 500;
      throw err;
    }
  }
}

export default new CategoryService();