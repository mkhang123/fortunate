import prisma from '../config/prisma.js';

class VTONRepository {
  /**
   * Tạo session mới
   */
  async createSession(data) {
    return await prisma.virtualTryOnSession.create({
      data: {
        userId: data.userId,
        productId: data.productId || null,
        aiModelId: data.aiModelId || null,
        inputImage: data.inputImage,
        outputImage: data.outputImage || '',
        status: data.status || 'PENDING',
        processingTime: data.processingTime || null,
      },
      include: {
        product: true,
        aiModel: true,
      }
    });
  }

  /**
   * Cập nhật session (khi AI xử lý xong)
   */
  async updateSession(sessionId, data) {
    return await prisma.virtualTryOnSession.update({
      where: { id: sessionId },
      data,
      include: {
        product: true,
        aiModel: true,
      }
    });
  }

  /**
   * Tìm session theo ID
   */
  async findById(sessionId) {
    return await prisma.virtualTryOnSession.findUnique({
      where: { id: sessionId },
      include: {
        product: true,
        aiModel: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
  }

  /**
   * Lấy lịch sử của user
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where = { userId };
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.virtualTryOnSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          aiModel: true,
        }
      }),
      prisma.virtualTryOnSession.count({ where })
    ]);

    return {
      sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Xóa session
   */
  async deleteSession(sessionId) {
    return await prisma.virtualTryOnSession.delete({
      where: { id: sessionId }
    });
  }

  /**
   * Lấy hoặc tạo AI Model record
   */
  async getOrCreateAIModel(name, version, description = null) {
    let model = await prisma.aIModel.findFirst({
      where: { name, version }
    });

    if (!model) {
      model = await prisma.aIModel.create({
        data: { name, version, description }
      });
    }

    return model;
  }
}

export default new VTONRepository();
