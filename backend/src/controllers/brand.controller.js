import prisma from "../config/prisma.js";

class BrandController {
  /**
   * GET /api/brands
   * Lấy danh sách thương hiệu (brand) đang có sản phẩm PUBLISHED
   */
  static async getAll(req, res) {
    const brands = await prisma.brand.findMany({
      where: {
        products: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      success: true,
      data: brands,
    });
  }
}

export default BrandController;

