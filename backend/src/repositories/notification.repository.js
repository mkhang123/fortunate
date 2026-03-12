import prisma from '../config/prisma.js';

class NotificationRepository {
  // Tạo một thông báo mới
  async create({ userId, title, message, type = null, link = null }) {
    return await prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  }

  // Lấy danh sách thông báo của user (mới nhất trước)
  async findByUserId(userId, limit = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Đếm số thông báo chưa đọc
  async countUnread(userId) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  // Đánh dấu một thông báo là đã đọc
  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Đánh dấu tất cả thông báo của user là đã đọc
  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export default new NotificationRepository();
