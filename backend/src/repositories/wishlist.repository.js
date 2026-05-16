
import prisma from "../config/prisma.js";

class WishlistRepository {
  async toggle(userId, productId) {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      return await prisma.wishlist.delete({
        where: { id: existing.id },
      });
    }
    return await prisma.wishlist.create({
      data: { userId, productId },
    });
  }
  async findByUserId(userId) {
    return await prisma.wishlist.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
      },
    });
  }
}

export default new WishlistRepository();