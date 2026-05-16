import prisma from "../config/prisma.js";

class CategoryRepository {
  async getAll() {
    return await prisma.category.findMany({
      orderBy: {
        name: 'asc' // Sắp xếp tên theo thứ tự bảng chữ cái
      }
    });
  }
  async findById(id) {
    return await prisma.category.findUnique({
      where: { id }
    });
  }

  async findBySlug(slug) {
    return await prisma.category.findUnique({
      where: { slug },
    });
  }

  async create(data) {
    return await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image || null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id, data) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  async countProducts(id) {
    return await prisma.product.count({
      where: { categoryId: id },
    });
  }

  async delete(id) {
    return await prisma.category.delete({
      where: { id },
    });
  }
}

export default new CategoryRepository();