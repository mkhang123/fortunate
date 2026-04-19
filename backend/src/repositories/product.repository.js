// fortunate/backend/src/repositories/product.repository.js
import prisma from "../config/prisma.js";

class ProductRepository {
  _createBrandSlug(name = "") {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, "")
      .trim()
      .replace(/ +/g, "-");
  }

  async _resolveBrandId(db, data = {}, currentBrandId = null) {
    const brandName = data.brandName?.trim();
    if (brandName) {
      const slug = this._createBrandSlug(brandName);
      if (!slug) return currentBrandId;

      const brand = await db.brand.upsert({
        where: { slug },
        update: { name: brandName },
        create: {
          name: brandName,
          slug,
        },
      });

      return brand.id;
    }

    if (data.brandId !== undefined) {
      return data.brandId ? Number(data.brandId) : null;
    }

    return currentBrandId;
  }

  async createProduct(data) {
    const brandId = await this._resolveBrandId(prisma, data, null);
    return await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        // Bỏ description vì không tồn tại trong Prisma schema
        categoryId: Number(data.categoryId),
        brandId,
        status: data.status ?? "DRAFT",
        price: data.price ? Number(data.price) : null,

        // SỬA TẠI ĐÂY: Gán trực tiếp mảng chuỗi
        images: data.images || [],

        variants: {
          create: data.variants || [],
        },
      },
      include: {
        variants: true,
        brand: true,
      },
    });
  }

  async findBySlug(slug) {
    return await prisma.product.findUnique({
      where: { slug: slug },
      include: {
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
        variants: true,
        category: true,
        brand: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getFeaturedProducts(filters = {}) {
    const { search, sort } = filters;

    const where = {
      status: "PUBLISHED",
      wishlists: { some: {} },
    };

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const isPriceSort = sort === "price_asc" || sort === "price_desc";

    // Với price sort → dùng orderBy mặc định, sort bằng JS sau
    let orderBy = { wishlists: { _count: "desc" } };
    if (sort === "name_asc") orderBy = { name: "asc" };

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        _count: { select: { wishlists: true } },
      },
      orderBy,
      take: 20,
    });

    // Sort theo giá thấp nhất của variants
    if (isPriceSort) {
      const getMinPrice = (p) =>
        p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0;
      products.sort((a, b) =>
        sort === "price_asc"
          ? getMinPrice(a) - getMinPrice(b)
          : getMinPrice(b) - getMinPrice(a)
      );
    }

    return products;
  }

  async getAll(filters = {}) {
    const { search, categoryId, categorySlug, status, sort, brand, style } = filters;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (status) {
      where.status = status;
    }

    if (brand) {
      where.brand = {
        OR: [
          { name: { contains: brand, mode: "insensitive" } },
          { slug: { contains: this._createBrandSlug(brand), mode: "insensitive" } },
        ],
      };
    }

    if (style) {
      where.variants = {
        some: {
          color: { contains: style, mode: "insensitive" },
        },
      };
    }

    // Với price sort → fetch trước rồi sort bằng JS
    const isPriceSort = sort === "price_asc" || sort === "price_desc";

    let orderBy = { createdAt: "desc" };
    if (sort === "name_asc") orderBy = { name: "asc" };
    if (sort === "name_desc") orderBy = { name: "desc" };

    const products = await prisma.product.findMany({
      where,
      include: { variants: true, category: true, brand: true },
      orderBy,
    });

    // Sort theo giá thấp nhất của variants
    if (isPriceSort) {
      const getMinPrice = (p) =>
        p.variants.length > 0 ? Math.min(...p.variants.map((v) => v.price)) : 0;
      products.sort((a, b) =>
        sort === "price_asc"
          ? getMinPrice(a) - getMinPrice(b)
          : getMinPrice(b) - getMinPrice(a)
      );
    }

    return products;
  }

  async deleteProduct(id) {
    // SỬA: Nhờ có onDelete: Cascade trong Schema, bạn chỉ cần xóa Product.
    // Các bảng như Variant, CartItem, Review... tự động bị xóa theo.
    return await prisma.product.delete({
      where: { id: Number(id) },
    });
  }

  async updateProduct(id, data) {
    const productId = Number(id);

    return await prisma.$transaction(async (tx) => {
      const existingProduct = await tx.product.findUnique({
        where: { id: productId },
        select: { brandId: true },
      });
      const resolvedBrandId = await this._resolveBrandId(
        tx,
        data,
        existingProduct?.brandId ?? null
      );

      // 1. Cập nhật thông tin cơ bản và MẢNG ẢNH
      // Prisma sẽ ghi đè mảng cũ bằng mảng mới trong data.images
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          name: data.name,
          slug: data.slug,
          status: data.status,
          images: data.images, // Ghi đè mảng chuỗi trực tiếp
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
          brandId: resolvedBrandId,
          price: data.price ? Number(data.price) : undefined,
        },
      });

      // 2. Xử lý biến thể (Variants) - Đồng bộ hoàn toàn (Sync)
      if (data.variants && Array.isArray(data.variants)) {
        const incomingIds = data.variants
          .filter((v) => v.id)
          .map((v) => Number(v.id));

        // Xóa các biến thể không còn trong danh sách gửi lên
        await tx.productVariant.deleteMany({
          where: {
            productId,
            id: { notIn: incomingIds },
          },
        });

        // Cập nhật hoặc Thêm mới
        for (const variant of data.variants) {
          const variantData = {
            size: variant.size,
            color: variant.color || "Basic",
            price: Number(variant.price || data.price || 0),
            stock: Number(variant.stock || 0),
          };

          if (variant.id) {
            await tx.productVariant.update({
              where: { id: Number(variant.id) },
              data: variantData,
            });
          } else {
            await tx.productVariant.create({
              data: {
                ...variantData,
                productId,
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
      include: { variants: true, brand: true, category: true },
    });
  }

  async updateStatus(id, status) {
    return await prisma.product.update({
      where: { id: Number(id) },
      data: { status },
      include: { variants: true, brand: true, category: true },
    });
  }
}

export default new ProductRepository();
