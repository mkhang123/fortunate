import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
// Thêm các icon cần thiết từ lucide-react
import {
  User,
  Search,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lấy thông tin user từ localStorage để kiểm tra trạng thái đăng nhập
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "ADMIN";

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsMenuOpen(false);
    navigate("/login");
    // Tải lại trang để cập nhật trạng thái menu
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* HEADER */}
      <header className="border-b sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold tracking-widest">
            FORTUNATE
          </Link>

          {/* Menu điều hướng chính */}
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <Link to="/featured" className="hover:text-black">
              NỔI BẬT
            </Link>
            <Link to="/sneaker" className="hover:text-black">
              GIÀY DÉP
            </Link>
            <Link to="/clothes" className="hover:text-black">
              QUẦN ÁO
            </Link>
            <Link to="/accessory" className="hover:text-black">
              PHỤ KIỆN
            </Link>
          </nav>

          {/* Icons Group */}
          <div className="flex items-center gap-5">
            <Link to="/cart" title="Giỏ hàng">
              <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-gray-500" />
            </Link>

            {/* XỬ LÝ HIỂN THỊ USER/DROPDOWN */}
            {!user ? (
              // Nếu chưa đăng nhập: Hiện icon dẫn đến trang Login
              <Link to="/login" title="Đăng nhập">
                <User className="w-5 h-5 cursor-pointer hover:text-blue-600" />
              </Link>
            ) : (
              // Nếu đã đăng nhập: Hiện Menu thả xuống
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 focus:outline-none"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    Hi, {user.name || "User"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* DROPDOWN MENU CONTENT */}
                {isMenuOpen && (
                  <>
                    {/* Overlay để đóng menu khi click ra ngoài */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    ></div>

                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-xl py-2 z-20 animate-in fade-in zoom-in duration-200">
                      <div className="px-4 py-2 border-b mb-1">
                        <p className="text-sm font-bold truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Link dành riêng cho ADMIN */}
                      {isAdmin && (
                        <Link
                          to="/admin/products"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Bảng điều
                          khiển Admin
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" /> Cài đặt tài khoản
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 mt-1 border-t border-gray-50"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-gray-50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-semibold mb-3">FORTUNATE</h3>
            <p className="text-gray-500">
              Thương hiệu thời trang phong cách tối giản.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">HỖ TRỢ</h3>
            <ul className="space-y-2 text-gray-500">
              <li>Chính sách đổi trả</li>
              <li>Hướng dẫn mua hàng</li>
              <li>Liên hệ</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-gray-400 py-4 border-t">
          © 2026 FORTUNATE. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
