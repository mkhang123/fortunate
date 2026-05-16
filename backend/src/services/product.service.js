
import productRepository from "../repositories/product.repository.js";
import notificationService from "./notification.service.js";

class ProductService {
  async createNewProduct(productData, actor = {}) {
    const existing = await productRepository.findBySlug(productData.slug);

    if (existing) {
      const error = new Error("Slug sản phẩm đã tồn tại");
      error.statusCode = 409; // Conflict
      throw error;
    }

    try {
      const normalizedData = { ...productData };
      if (actor.role === "CREATOR") {
        normalizedData.status = "DRAFT";
      }
      const created = await productRepository.createProduct(normalizedData);
      if (actor.role === "CREATOR") {
        notificationService
          .notifyProductPendingApproval({
            productId: created.id,
            productName: created.name,
          })
          .catch(() => {});
      }

      return created;
    } catch (dbError) {
      const error = new Error("Lỗi cơ sở dữ liệu khi tạo sản phẩm");
      error.statusCode = 500;
      throw error;
    }
  }

  async getAllProducts(filters = {}) {
    try {
      const { search, categoryId, categorySlug, status, sort, brand, style } = filters;
      return await productRepository.getAll({
        search,
        categoryId,
        categorySlug,
        status,
        sort,
        brand,
        style,
      });
    } catch (error) {
      const err = new Error(error.message || "Lỗi khi lấy danh sách sản phẩm");
      err.statusCode = error.statusCode || 500;
      throw err;
    }
  }

  async getFeaturedProducts(filters = {}) {
    try {
      return await productRepository.getFeaturedProducts(filters);
    } catch (error) {
      const err = new Error("Lỗi khi lấy danh sách sản phẩm nổi bật");
      err.statusCode = 500;
      throw err;
    }
  }

  async removeProduct(id) {
    try {
      const productId = Number(id); // Number() an toàn hơn parseInt() cho ID
      if (isNaN(productId) || productId <= 0) {
        const error = new Error("ID sản phẩm không hợp lệ");
        error.statusCode = 400;
        throw error;
      }

      return await productRepository.deleteProduct(productId);
    } catch (error) {
      console.error("Lỗi tại ProductService:", error);
      throw error; // Quăng nguyên object error để Controller lấy được statusCode
    }
  }

  async updateProduct(id, data, actor = {}) {
    const productId = Number(id);
    const existingProduct = await productRepository.findById(productId);
    if (!existingProduct) {
      const error = new Error("Không tìm thấy sản phẩm để cập nhật");
      error.statusCode = 404;
      throw error;
    }

    const normalizedData = { ...data };
    if (actor.role === "CREATOR") {
      normalizedData.status = "DRAFT";
    }
    const updated = await productRepository.updateProduct(productId, normalizedData);

    if (actor.role === "CREATOR") {
      notificationService
        .notifyProductPendingApproval({
          productId: updated.id,
          productName: updated.name,
        })
        .catch(() => {});
    }

    return updated;
  }

  async getProductDetail(slug) {
    try {
      const product = await productRepository.findBySlug(slug);

      if (!product) {
        const error = new Error("Sản phẩm không tồn tại");
        error.statusCode = 404;
        throw error;
      }

      return product;
    } catch (error) {
      if (!error.statusCode) error.statusCode = 500;
      throw error;
    }
  }

  async approveProduct(id) {
    const productId = Number(id);
    const existing = await productRepository.findById(productId);
    if (!existing) {
      const error = new Error("Không tìm thấy sản phẩm");
      error.statusCode = 404;
      throw error;
    }

    const approved = await productRepository.updateStatus(productId, "PUBLISHED");
    notificationService
      .notifyProductApprovedToCreators({
        productId: approved.id,
        productName: approved.name,
      })
      .catch(() => {});
    return approved;
  }

  async rejectProduct(id) {
    const productId = Number(id);
    const existing = await productRepository.findById(productId);
    if (!existing) {
      const error = new Error("Không tìm thấy sản phẩm");
      error.statusCode = 404;
      throw error;
    }

    const rejected = await productRepository.updateStatus(productId, "REJECTED");
    notificationService
      .notifyProductRejectedToCreators({
        productId: rejected.id,
        productName: rejected.name,
      })
      .catch(() => {});
    return rejected;
  }
}

export default new ProductService();
