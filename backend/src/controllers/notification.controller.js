import notificationService from '../services/notification.service.js';

// GET /api/notifications — lấy danh sách thông báo + số chưa đọc
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await notificationService.getNotifications(userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/:id/read — đánh dấu 1 thông báo đã đọc
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await notificationService.markAsRead(id, userId);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/read-all — đánh dấu tất cả đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
