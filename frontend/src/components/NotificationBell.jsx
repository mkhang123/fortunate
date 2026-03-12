import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import api from '../apis/axiosConfig';

// Mapping type → màu nền badge
const TYPE_COLORS = {
  ORDER_PLACED:    'bg-blue-50 border-blue-100',
  ORDER_PAID:      'bg-green-50 border-green-100',
  ORDER_SHIPPED:   'bg-amber-50 border-amber-100',
  ORDER_COMPLETED: 'bg-emerald-50 border-emerald-100',
  ORDER_CANCELLED: 'bg-red-50 border-red-100',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch thông báo
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // Không hiện lỗi nếu chưa login
    } finally {
      setLoading(false);
    }
  };

  // Polling mỗi 30 giây
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mở dropdown → fetch lại dữ liệu mới nhất
  const handleOpen = () => {
    setOpen((prev) => !prev);
    if (!open) fetchNotifications();
  };

  // Đánh dấu 1 thông báo đã đọc
  const handleMarkRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
    if (link) window.location.href = link;
  };

  // Đánh dấu tất cả đã đọc
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  // Format thời gian tương đối
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    return `${Math.floor(hrs / 24)} ngày trước`;
  };

  // Không render nếu chưa login
  const user = localStorage.getItem('user');
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-1 hover:text-gray-400 transition-colors"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <span className="text-xs font-black uppercase tracking-widest text-gray-700">
              Thông báo {unreadCount > 0 && <span className="text-red-500">({unreadCount})</span>}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold uppercase tracking-wide"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400 font-medium">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n.id, n.link)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-2 ${
                    n.isRead ? 'border-transparent' : 'border-black'
                  } ${TYPE_COLORS[n.type] || ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${n.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${n.isRead ? 'text-gray-400' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-black mt-1 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
