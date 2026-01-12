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

  async getFeaturedProducts(filters = {}) {
    const { search, sort } = filters;
    const where = {
      // Chỉ lấy sản phẩm có lượt yêu thích (tùy chọn logic của bạn)
      wishlists: { some: {} },
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    let orderBy = {};
    // Nếu sort là 'featured', sắp xếp theo số lượng wishlist giảm dần
    if (sort === "featured" || !sort) {
      orderBy = { wishlists: { _count: "desc" } };
    } else {
      // Sử dụng chung logic sắp xếp với hàm getAll
      switch (sort) {
        case "price_asc":
          orderBy = { variants: { _min: { price: "asc" } } };
          break;
        case "price_desc":
          orderBy = { variants: { _max: { price: "desc" } } };
          break;
        case "name_asc":
          orderBy = { name: "asc" };
          break;
      }
    }

    return await prisma.product.findMany({
      where,
      include: {
        images: true,
        variants: true,
        category: true,
        brand: true,
        _count: { select: { wishlists: true } },
      },
      orderBy,
      take: 10,
    });
  }

  async getAll(filters = {}) {
    const { search, categoryId, status, sort } = filters;

    const where = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (status) {
      where.status = status;
    }

    // Cập nhật logic sắp xếp (Sorting)
    let orderBy = {};

    switch (sort) {
      case "name_asc":
        orderBy = { name: "asc" };
        break;
      case "name_desc":
        orderBy = { name: "desc" };
        break;
      case "price_asc":
        // Sắp xếp theo giá nhỏ nhất của các biến thể tăng dần
        orderBy = { variants: { _min: { price: "asc" } } };
        break;
      case "price_desc":
        // Sắp xếp theo giá lớn nhất của các biến thể giảm dần
        orderBy = { variants: { _max: { price: "desc" } } };
        break;
      default:
        // Mặc định: Sản phẩm mới nhất lên đầu
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

  // fortunate/backend/src/repositories/product.repository.js

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
      // 1. Cập nhật thông tin chính và các quan hệ 1-n
      return await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          status: data.status,
          categoryId: data.categoryId,
          brandId: data.brandId,

          // Xử lý ảnh: Xóa toàn bộ ảnh cũ của SP này rồi tạo lại mới
          images: data.images
            ? {
                deleteMany: {},
                create: data.images,
              }
            : undefined,

          // Xử lý biến thể: Xóa toàn bộ cũ rồi tạo lại mới
          variants: data.variants
            ? {
                deleteMany: {},
                create: data.variants,
              }
            : undefined,
        },
        include: {
          images: true,
          variants: true,
        },
      });
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
