import notificationRepository from '../repositories/notification.repository.js';
import prisma from "../config/prisma.js";

class NotificationService {

  async create({ userId, title, message, type, link }) {
    return await notificationRepository.create({ userId, title, message, type, link });
  }

  async getNotifications(userId) {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepository.findByUserId(userId, 20),
      notificationRepository.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    return await notificationRepository.markAsRead(Number(notificationId), userId);
  }

  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  async notifyByRole(role, payloadBuilder) {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
      select: { id: true },
    });

    if (!users.length) return;

    await Promise.all(
      users.map((u) => this.create({ userId: u.id, ...payloadBuilder(u.id) }))
    );
  }

  async notifyProductPendingApproval({ productId, productName }) {
    return await this.notifyByRole("ADMIN", () => ({
      title: "📝 Có sản phẩm chờ duyệt",
      message: `Sản phẩm "${productName}" (#${productId}) vừa được gửi và đang chờ duyệt.`,
      type: "PRODUCT_PENDING_APPROVAL",
      link: "/admin/products",
    }));
  }

  async notifyProductApprovedToCreators({ productId, productName }) {
    return await this.notifyByRole("CREATOR", () => ({
      title: "✅ Sản phẩm đã được duyệt",
      message: `Sản phẩm "${productName}" (#${productId}) đã được duyệt và hiển thị công khai.`,
      type: "PRODUCT_APPROVED",
      link: "/admin/products",
    }));
  }

  async notifyProductRejectedToCreators({ productId, productName }) {
    return await this.notifyByRole("CREATOR", () => ({
      title: "❌ Sản phẩm bị từ chối",
      message: `Sản phẩm "${productName}" (#${productId}) đã bị từ chối. Vui lòng chỉnh sửa và gửi lại.`,
      type: "PRODUCT_REJECTED",
      link: "/admin/products",
    }));
  }

  async notifyOrderPlaced(userId, orderId) {
    return await this.create({
      userId,
      title: '🎉 Đặt hàng thành công!',
      message: `Đơn hàng #${orderId} của bạn đã được tiếp nhận. Chúng tôi sẽ xử lý sớm nhất có thể!`,
      type: 'ORDER_PLACED',
      link: `/my-orders`,
    });
  }

  async notifyOrderPendingApprovalToAdmins(orderId) {
    return await this.notifyByRole("ADMIN", () => ({
      title: "🛎️ Có đơn hàng chờ duyệt",
      message: `Đơn hàng #${orderId} vừa được tạo và đang ở trạng thái chờ duyệt.`,
      type: "ORDER_PENDING_APPROVAL",
      link: "/admin/orders",
    }));
  }

  async notifyOrderPaid(userId, orderId) {
    return await this.create({
      userId,
      title: '✅ Thanh toán thành công!',
      message: `Đơn hàng #${orderId} đã được xác nhận thanh toán. Chúng tôi đang chuẩn bị hàng cho bạn.`,
      type: 'ORDER_PAID',
      link: `/my-orders`,
    });
  }

  async notifyOrderShipped(userId, orderId) {
    return await this.create({
      userId,
      title: '🚚 Đơn hàng đang được giao!',
      message: `Đơn hàng #${orderId} đang trên đường đến với bạn. Hãy chú ý điện thoại nhé!`,
      type: 'ORDER_SHIPPED',
      link: `/my-orders`,
    });
  }

  async notifyOrderCompleted(userId, orderId) {
    return await this.create({
      userId,
      title: '🎊 Đơn hàng hoàn thành!',
      message: `Đơn hàng #${orderId} đã được giao thành công. Cảm ơn bạn đã mua sắm tại FORTUNATE!`,
      type: 'ORDER_COMPLETED',
      link: `/my-orders`,
    });
  }

  async notifyOrderCancelled(userId, orderId) {
    return await this.create({
      userId,
      title: '❌ Đơn hàng đã bị huỷ',
      message: `Đơn hàng #${orderId} đã bị huỷ. Nếu có thắc mắc, vui lòng liên hệ chúng tôi.`,
      type: 'ORDER_CANCELLED',
      link: `/my-orders`,
    });
  }
}

export default new NotificationService();
