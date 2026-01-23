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
      where: { slug: slug },
      include: {
        images: true,
        variants: true,
        category: true,
        brand: true,
        wishlists: true,
      },
    });
  }

  async getAllProducts() {
    return await prisma.product.findMany({
      include: {
        images: true,
        variants: true,
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // fortunate/backend/src/repositories/product.repository.js

  async getFeaturedProducts() {
    return await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        // ĐIỀU KIỆN QUAN TRỌNG: Chỉ lấy sản phẩm có lượt yêu thích
        wishlists: {
          some: {},
        },
      },
      include: {
        images: true,
        variants: true,
        _count: {
          select: { wishlists: true }, // Trả về số lượng để hiển thị icon sao/tim
        },
      },
      orderBy: {
        wishlists: {
          _count: "desc", // Sắp xếp sản phẩm hot nhất lên đầu
        },
      },
      take: 10,
    });
  }

  async getAll(filters = {}) {
    // SỬA TẠI ĐÂY: Thêm categorySlug vào danh sách bóc tách biến từ filters
    const { search, categoryId, categorySlug, status, sort } = filters;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    // Logic này sẽ chạy đúng sau khi bạn đã khai báo categorySlug ở trên
    if (categorySlug) {
      where.category = {
        slug: categorySlug,
      };
    }

    if (status) {
      where.status = status;
    }

    // Logic sắp xếp (Sorting)
    let orderBy = {};

    switch (sort) {
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "price_asc":
        orderBy = { variants: { _min: { price: "asc" } } };
        break;
      case "price_desc":
        orderBy = { variants: { _max: { price: "desc" } } };
        break;
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    return await prisma.product.findMany({
      where,
      include: {
        images: true,
        variants: true,
        category: true,
      },
      orderBy,
    });
  }

  async deleteProduct(id) {
    // Bỏ dòng parseInt ở đây vì Service đã làm rồi, đảm bảo id nhận vào là số
    return await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.wishlist.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),

      // Xóa VirtualTryOnSession nếu có để tránh lỗi khóa ngoại
      prisma.virtualTryOnSession.deleteMany({
        where: { variant: { productId: id } },
      }),

      prisma.$executeRaw`DELETE FROM "ProductMeasurement" WHERE "variantId" IN (SELECT id FROM "ProductVariant" WHERE "productId" = ${id})`,
      prisma.cartItem.deleteMany({ where: { variant: { productId: id } } }),

      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id: id } }),
    ]);
  }

  async updateProduct(id, data) {
    const productId = Number(id);

    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin cơ bản của sản phẩm
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: data.status,
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
          brandId: data.brandId ? Number(data.brandId) : undefined,
        },
      });

      // 2. Xử lý ảnh: Chỉ xóa và tạo lại nếu có danh sách ảnh mới gửi lên
      if (data.images && data.images.length > 0) {
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productImage.createMany({
          data: data.images.map((img) => ({ ...img, productId })),
        });
      }

      // 3. Xử lý biến thể (SỬA LỖI TẠI ĐÂY):
      // Thay vì deleteMany, chúng ta cập nhật từng cái hoặc chỉ thêm mới
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          if (variant.id) {
            // Nếu có ID -> Cập nhật biến thể cũ (Tránh vi phạm khóa ngoại giỏ hàng)
            await tx.productVariant.update({
              where: { id: Number(variant.id) },
              data: {
                size: variant.size,
                price: Number(variant.price),
                stock: Number(variant.stock),
                sku: variant.sku,
              },
            });
          } else {
            // Nếu không có ID -> Tạo biến thể mới
            await tx.productVariant.create({
              data: {
                ...variant,
                productId,
                price: Number(variant.price),
                stock: Number(variant.stock),
              },
            });
          }
        }
      }

      return updatedProduct;
    });
  }

  async findById(id) {
    return await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { images: true, variants: true },
    });
  }
}

export default new ProductRepository();
