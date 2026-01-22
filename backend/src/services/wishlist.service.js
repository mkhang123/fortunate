// fortunate/backend/src/services/wishlist.service.js
import wishlistRepository from "../repositories/wishlist.repository.js";
import productRepository from "../repositories/product.repository.js";

class WishlistService {
  async toggleWishlist(userId, productId) {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await productRepository.findById(productId);
    if (!product) {
      const error = new Error("Sản phẩm không tồn tại");
      error.statusCode = 404;
      throw error;
    }

    return await wishlistRepository.toggle(userId, productId);
  }

  async getUserWishlist(userId) {
    return await wishlistRepository.findByUserId(userId);
  }
}

export default new WishlistService();