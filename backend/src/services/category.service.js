import categoryRepository from "../repositories/category.repository.js";

class CategoryService {
  createSlug(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, "")
      .trim()
      .replace(/ +/g, "-");
  }

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

  async createCategory(payload) {
    const slug = this.createSlug(payload.name);
    const existed = await categoryRepository.findBySlug(slug);
    if (existed) {
      const err = new Error("Danh mục đã tồn tại");
      err.statusCode = 409;
      throw err;
    }

    return await categoryRepository.create({
      ...payload,
      slug,
    });
  }

  async updateCategory(id, payload) {
    const categoryId = Number(id);
    if (!categoryId || Number.isNaN(categoryId)) {
      const err = new Error("ID danh mục không hợp lệ");
      err.statusCode = 400;
      throw err;
    }

    const existing = await categoryRepository.findById(categoryId);
    if (!existing) {
      const err = new Error("Không tìm thấy danh mục");
      err.statusCode = 404;
      throw err;
    }

    const updateData = { ...payload };
    if (payload.name) {
      const newSlug = this.createSlug(payload.name);
      if (newSlug !== existing.slug) {
        const slugOwner = await categoryRepository.findBySlug(newSlug);
        if (slugOwner && slugOwner.id !== categoryId) {
          const err = new Error("Tên danh mục đã tồn tại");
          err.statusCode = 409;
          throw err;
        }
      }
      updateData.slug = newSlug;
    }

    return await categoryRepository.update(categoryId, updateData);
  }

  async deleteCategory(id) {
    const categoryId = Number(id);
    if (!categoryId || Number.isNaN(categoryId)) {
      const err = new Error("ID danh mục không hợp lệ");
      err.statusCode = 400;
      throw err;
    }

    const existing = await categoryRepository.findById(categoryId);
    if (!existing) {
      const err = new Error("Không tìm thấy danh mục");
      err.statusCode = 404;
      throw err;
    }

    const productCount = await categoryRepository.countProducts(categoryId);
    if (productCount > 0) {
      const err = new Error("Không thể xóa danh mục khi vẫn còn sản phẩm liên quan");
      err.statusCode = 409;
      throw err;
    }

    return await categoryRepository.delete(categoryId);
  }
}

export default new CategoryService();