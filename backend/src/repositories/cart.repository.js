// fortunate/backend/src/repositories/cart.repository.js
import prisma from "../config/prisma.js";

class CartRepository {
  // Tìm giỏ hàng của User hoặc tạo mới nếu chưa có
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { variant: { include: { product: { include: { images: true } } } } } } }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true }
      });
    }
    return cart;
  }

  // Thêm sản phẩm vào giỏ
  async addItem(cartId, variantId, quantity) {
    // Kiểm tra xem sản phẩm này đã có trong giỏ chưa
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, variantId }
    });

    if (existingItem) {
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      });
    }

    return await prisma.cartItem.create({
      data: { cartId, variantId, quantity }
    });
  }

  // Xóa sản phẩm khỏi giỏ
  async removeItem(itemId) {
    return await prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  // Cập nhật số lượng (tăng/giảm trực tiếp)
  async updateQuantity(itemId, quantity) {
    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }
}

export default new CartRepository();