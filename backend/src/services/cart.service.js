
import cartRepository from "../repositories/cart.repository.js";
import prisma from "../config/prisma.js";

class CartService {
  async addToCart(userId, variantId, quantity) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant || variant.stock < quantity) {
      throw new Error("Sản phẩm không đủ số lượng trong kho");
    }
    const cart = await cartRepository.getOrCreateCart(userId);
    return await cartRepository.addItem(cart.id, variantId, quantity);
  }

  async getCart(userId) {
    return await cartRepository.getOrCreateCart(userId);
  }

  async removeFromCart(itemId) {
    return await cartRepository.removeItem(itemId);
  }

  async updateQuantity(itemId, quantity) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    });

    if (!cartItem) throw new Error("Không tìm thấy sản phẩm trong giỏ");
    if (cartItem.variant.stock < quantity)
      throw new Error("Kho hàng không đủ số lượng");
    return await cartRepository.updateQuantity(itemId, quantity);
  }
}

export default new CartService();
