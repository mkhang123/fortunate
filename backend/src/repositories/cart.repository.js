
import prisma from "../config/prisma.js";

class CartRepository {
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true, // SỬA TẠI ĐÂY: Chỉ cần để true, Prisma tự lấy mảng images
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }
    return cart;
  }
  async addItem(cartId, variantId, quantity) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, variantId },
    });

    if (existingItem) {
      return await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    }

    return await prisma.cartItem.create({
      data: { cartId, variantId, quantity },
    });
  }
  async removeItem(itemId) {
    return await prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
  async updateQuantity(itemId, quantity) {
    return await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }
  async clearCart(cartId) {
    return await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}

export default new CartRepository();

