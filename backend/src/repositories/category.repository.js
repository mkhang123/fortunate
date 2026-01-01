import prisma from "../config/prisma.js";

class CategoryRepository {
  // Lấy tất cả danh mục trong hệ thống
  async getAll() {
    return await prisma.category.findMany({
      orderBy: {
        name: 'asc' // Sắp xếp tên theo thứ tự bảng chữ cái
      }
    });
  }

  // Tìm danh mục theo ID (dùng để kiểm tra khi tạo sản phẩm)
  async findById(id) {
    return await prisma.category.findUnique({
      where: { id }
    });
  }
}

export default new CategoryRepository();