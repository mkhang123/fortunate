// fortunate/backend/src/controllers/wishlist.controller.js
import wishlistService from "../services/wishlist.service.js";

class WishlistController {
  async toggle(req, res) {
    try {
      const userId = req.user.id; // Lấy từ authMiddleware
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ success: false, message: "Thiếu Product ID" });
      }

      const result = await wishlistService.toggleWishlist(userId, Number(productId));
      
      return res.status(200).json({
        success: true,
        message: "Cập nhật danh sách yêu thích thành công",
        data: result,
      });
    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getMyWishlist(req, res) {
    try {
      const userId = req.user.id;
      const data = await wishlistService.getUserWishlist(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new WishlistController();