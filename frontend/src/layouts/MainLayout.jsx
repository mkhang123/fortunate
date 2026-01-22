import { useState } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  User,
  Users,
  Search,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  Smartphone, // Thêm icon Smartphone cho Virtual Try-on
} from "lucide-react";

export default function MainLayout() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Phân quyền chi tiết
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  const hasManagementAccess = isAdmin || isCreator;

  // Dữ liệu cho Menu SHOP - Tập trung hoàn toàn vào Quần áo
  const shopCategories = [
    { name: "TẤT CẢ SẢN PHẨM", path: "/clothes" },
    { name: "ÁO THUN (T-SHIRTS)", path: "/clothes/ao-thun" },
    { name: "ÁO SƠ MI (SHIRTS)", path: "/clothes/ao-so-mi" },
    { name: "ÁO KHOÁC (OUTERWEAR)", path: "/clothes/ao-khoac" },
    { name: "QUẦN DÀI (PANTS)", path: "/clothes/quan-dai" },
    { name: "QUẦN NGẮN (SHORTS)", path: "/clothes/quan-ngan" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsMenuOpen(false);
    navigate("/login");
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* HEADER */}
      <header className="border-b sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold tracking-widest text-black"
          >
            FORTUNATE
          </Link>

          {/* MENU ĐIỀU HƯỚNG MỚI */}
          <nav className="hidden md:flex gap-10 text-[13px] font-bold tracking-widest items-center">
            <Link
              to="/"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              HOME
            </Link>
            <Link
              to="/featured"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              POPULAR
            </Link>

            {/* DROPDOWN SHOP */}
            <div className="relative group h-full py-2 cursor-pointer">
              <span className="hover:text-gray-400 transition-colors flex items-center gap-1 uppercase">
                SHOP{" "}
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </span>

              {/* Dropdown Content */}
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-xl py-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 mt-1">
                {shopCategories.map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    className="block px-6 py-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors text-xs font-semibold tracking-wide border-b border-gray-50 last:border-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* VIRTUAL TRY-ON CẬP NHẬT */}
            <Link
              to="/virtual-try-on"
              className="relative hover:text-red-600 transition-colors uppercase flex items-center gap-1"
            >
              VIRTUAL TRY-ON
              <span className="absolute -top-3 -right-6 bg-red-600 text-[8px] text-white px-1 rounded-sm animate-pulse font-black">
                AI
              </span>
            </Link>

            <Link
              to="/about"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              ABOUT US
            </Link>
          </nav>

          {/* Icons Group */}
          <div className="flex items-center gap-6">
            {/* Search Icon (Bạn có thể thêm tính năng tìm kiếm sau) */}

            <Link to="/cart" title="Giỏ hàng">
              <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-gray-400" />
            </Link>

            {!user ? (
              <Link to="/login" title="Đăng nhập">
                <User className="w-5 h-5 cursor-pointer hover:text-blue-600" />
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-1 text-xs font-bold hover:text-blue-600 focus:outline-none uppercase tracking-tighter"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    Hi, {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isMenuOpen && (
                  <>
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

                      {hasManagementAccess && (
                        <>
                          <Link
                            to="/admin/products"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" /> Quản lý sản
                            phẩm
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin/users"
                              className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <Users className="w-4 h-4" /> Quản lý người dùng
                            </Link>
                          )}
                          <div className="border-b my-1"></div>
                        </>
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
      <footer className="border-t bg-[#fcfcfc] mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          <div>
            <h3 className="font-bold mb-4 tracking-widest text-lg italic">
              FORTUNATE
            </h3>
            <p className="text-gray-500 leading-relaxed">
              Thương hiệu thời trang tối giản, tập trung vào chất lượng sản phẩm
              và trải nghiệm mua sắm tích hợp công nghệ thử đồ ảo.
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-4 uppercase tracking-widest text-xs">
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-3 text-gray-500">
              <li>
                <Link to="/shipping" className="hover:text-black">
                  Chính sách giao hàng
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-black">
                  Đổi trả & Bảo hành
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-black">
                  Liên hệ chúng tôi
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4 uppercase tracking-widest text-xs">
              Về chúng tôi
            </h3>
            <ul className="space-y-3 text-gray-500">
              <li>
                <Link to="/about" className="hover:text-black">
                  Câu chuyện thương hiệu
                </Link>
              </li>
              <li>
                <Link to="/stores" className="hover:text-black">
                  Hệ thống cửa hàng
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="text-center text-[10px] text-gray-400 py-6 border-t tracking-[0.2em] uppercase">
          © 2026 FORTUNATE CLOTHING. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
