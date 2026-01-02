// fortunate/backend/src/services/product.service.js
import productRepository from "../repositories/product.repository.js";

class ProductService {
  async createNewProduct(productData) {
    const existing = await productRepository.findBySlug(productData.slug);

    if (existing) {
      // Gắn thêm status để Controller nhận diện
      const error = new Error("Slug sản phẩm đã tồn tại");
      error.statusCode = 409; // Conflict
      throw error;
    }

    try {
      return await productRepository.createProduct(productData);
    } catch (dbError) {
      const error = new Error("Lỗi cơ sở dữ liệu khi tạo sản phẩm");
      error.statusCode = 500;
      throw error;
    }
  }

  async getAllProducts() {
    try {
      return await productRepository.getAllProducts();
    } catch (error) {
      const err = new Error("Lỗi khi lấy danh sách sản phẩm");
      err.statusCode = 500;
      throw err;
    }
  }

  async getFeaturedProducts() {
    try {
      return await productRepository.getFeaturedProducts();
    } catch (error) {
      const err = new Error("Lỗi khi lấy danh sách sản phẩm nổi bật");
      err.statusCode = 500;
      throw err;
    }
  }

  async getAllProducts(filters) {
    return await productRepository.getAll(filters);
  }
}

export default new ProductService();
