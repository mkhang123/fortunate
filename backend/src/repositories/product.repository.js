// fortunate/backend/src/repositories/product.repository.js
import prisma from "../config/prisma.js";

class ProductRepository {
  async createProduct(data) {
    // Prisma tự động thực hiện transaction cho các nested create (images, variants)
    return await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,
        status: data.status ?? "DRAFT",

        images: {
          create: data.images || [],
        },

        variants: {
          create: data.variants || [],
        },
      },
      include: {
        images: true,
        variants: true,
      },
    });
  }

  async findBySlug(slug) {
    return await prisma.product.findUnique({
      where: { slug },
    });
  }
  async getAllProducts() {
    return await prisma.product.findMany({
      include: {
        images: true, // Lấy kèm danh sách ảnh
        variants: true, // Lấy kèm các biến thể (giá, size, màu)
        category: true, // Lấy kèm thông tin danh mục
        brand: true, // Lấy kèm thông tin thương hiệu
      },
      orderBy: {
        createdAt: "desc", // Sản phẩm mới nhất lên đầu
      },
    });
  }

  async deleteProduct(id) {
    return await prisma.product.delete({
      where: { id },
    });
  }

  // fortunate/backend/src/repositories/product.repository.js

  async getFeaturedProducts() {
    return await prisma.product.findMany({
      include: {
        images: true,
        variants: true,
        category: true,
        brand: true,
        _count: {
          select: { favorites: true }, // Đếm số lượt yêu thích từ bảng Favorite
        },
      },
      orderBy: {
        favorites: {
          _count: "desc", // Sắp xếp giảm dần theo lượt yêu thích
        },
      },
      take: 10, // Chỉ lấy 10 sản phẩm nổi bật nhất
    });
  }

  async getAll(filters = {}) {
    const { search, categoryId, status } = filters;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    return await prisma.product.findMany({
      where, // Truyền object where đã tổng hợp các điều kiện
      include: {
        images: true,
        variants: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new ProductRepository();
