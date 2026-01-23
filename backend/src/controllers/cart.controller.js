// fortunate/backend/src/controllers/cart.controller.js
import cartService from "../services/cart.service.js";

class CartController {
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { variantId, quantity } = req.body;
      const result = await cartService.addToCart(
        userId,
        Number(variantId),
        Number(quantity),
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const cart = await cartService.getCart(userId);
      res.status(200).json({ success: true, data: cart });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async deleteItem(req, res) {
    try {
      const { itemId } = req.params;
      await cartService.removeFromCart(Number(itemId));
      res
        .status(200)
        .json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ hàng" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateQuantity(req, res) {
    try {
      const { itemId } = req.params; // Lấy từ URL
      const { quantity } = req.body; // Lấy từ dữ liệu gửi kèm

      // Gọi đến service để cập nhật database
      const result = await cartService.updateQuantity(
        Number(itemId),
        Number(quantity),
      );

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new CartController();
