import prisma from '../config/prisma.js';

class NotificationRepository {

  async create({ userId, title, message, type = null, link = null }) {
    return await prisma.notification.create({
      data: { userId, title, message, type, link },
    });
  }

  async findByUserId(userId, limit = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countUnread(userId) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export default new NotificationRepository();
