// fortunate/backend/src/repositories/wishlist.repository.js
import prisma from "../config/prisma.js";

class WishlistRepository {
  // Thêm hoặc Xóa yêu thích (Toggle)
  async toggle(userId, productId) {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      // Nếu đã thích rồi thì xóa đi (Unlike)
      return await prisma.wishlist.delete({
        where: { id: existing.id },
      });
    }

    // Nếu chưa thích thì tạo mới (Like)
    return await prisma.wishlist.create({
      data: { userId, productId },
    });
  }

  // Lấy danh sách sản phẩm đã yêu thích của một User cụ thể
  async findByUserId(userId) {
    return await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: true,
            variants: true,
          },
        },
      },
    });
  }
}

export default new WishlistRepository();