import { useEffect, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../apis/auth.api";
import NotificationBell from "../components/NotificationBell";
import ChatAssistant from "../components/ChatAssistant";
import api from "../apis/axiosConfig";
import {
  User,
  Users,
  ShoppingCart,
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  Smartphone,
  Menu,
  X,
} from "lucide-react";

export default function MainLayout({ isAuthVerified }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(false);
  const [isBrandHoverOpen, setIsBrandHoverOpen] = useState(false);
  const [brands, setBrands] = useState([]);

  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Phân quyền chi tiết
  const isAdmin = user?.role === "ADMIN";
  const isCreator = user?.role === "CREATOR";
  const hasManagementAccess = isAdmin || isCreator;

  // Dữ liệu cho Menu SHOP - Tập trung hoàn toàn vào Quần áo
  const shopCategories = [
    { name: "Tất cả sản phẩm", path: "/clothes" },
    { name: "Áo thun (T-Shirts)", path: "/clothes/ao-thun" },
    { name: "Áo sơ mi (Shirts)", path: "/clothes/ao-so-mi" },
    { name: "Áo khoác (Outerwear)", path: "/clothes/ao-khoac" },
    { name: "Quần dài (Pants)", path: "/clothes/quan-dai" },
    { name: "Quần ngắn (Shorts)", path: "/clothes/quan-ngan" },
  ];

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Vẫn tiếp tục logout dù API lỗi
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("user");
      setIsMenuOpen(false);
      navigate("/login");
      window.location.reload();
    }
  };

  // ── Lấy danh sách thương hiệu dùng cho dropdown ───────────────────────────
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get("/brands");
        setBrands(res.data?.data || []);
      } catch (err) {
        // Không chặn UI nếu lỗi brand
        console.error("Lỗi tải thương hiệu:", err);
      }
    };

    fetchBrands();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* HEADER */}
      <header className="border-b sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl sm:text-2xl font-bold tracking-widest text-black shrink-0 min-w-0"
            onClick={() => setMobileNavOpen(false)}
          >
            FORTUNATE
          </Link>

          {/* MENU ĐIỀU HƯỚNG — desktop */}
          <nav className="hidden md:flex flex-1 justify-center gap-10 text-[13px] font-bold tracking-widest items-center max-w-3xl">
            <Link
              to="/"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              Trang chủ
            </Link>
            <Link
              to="/featured"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              Nổi bật
            </Link>

            {/* DROPDOWN SHOP */}
            <div className="relative group h-full py-2 cursor-pointer">
              <span className="hover:text-gray-400 transition-colors flex items-center gap-1 uppercase">
                Mua sắm{" "}
                <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
              </span>

              {/* Dropdown Content */}
              <div className="absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-xl py-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 mt-1">
                {/* Tất cả sản phẩm */}
                {shopCategories.slice(0, 1).map((item, idx) => (
                  <Link
                    key={idx}
                    to={item.path}
                    className="block px-6 py-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors text-xs font-semibold tracking-wide border-b border-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Thương hiệu (hover để hiện list) */}
                <div className="relative group">
                  <div
                    onMouseEnter={() => setIsBrandHoverOpen(true)}
                    onMouseLeave={() => setIsBrandHoverOpen(false)}
                    className="block px-6 py-3 text-gray-600 hover:text-black hover:bg-gray-50 transition-colors text-xs font-semibold tracking-wide border-b border-gray-50 cursor-default"
                  >
                    Thương hiệu
                  </div>

                  <div
                    onMouseEnter={() => setIsBrandHoverOpen(true)}
                    onMouseLeave={() => setIsBrandHoverOpen(false)}
                    className={`absolute top-0 left-full w-72 bg-white border border-gray-100 shadow-xl rounded-lg py-2 transition-all duration-200 z-50 ${isBrandHoverOpen ? "opacity-100 visible" : "opacity-0 invisible"
                      }`}
                  >
                    {brands.length === 0 ? (
                      <div className="px-4 py-3 text-xs font-semibold text-gray-400">
                        Đang tải...
                      </div>
                    ) : (
                      brands.map((b) => (
                        <Link
                          key={b.id}
                          to={`/clothes?brand=${encodeURIComponent(b.slug)}`}
                          className="block px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {b.name}
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Các nhóm áo/quần */}
                {shopCategories.slice(1).map((item, idx) => (
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
              className="relative hover:text-red-600 transition-colors flex items-center gap-1 uppercase"
            >
              Thử đồ ảo
              <span className="absolute -top-3 -right-6 bg-red-600 text-[8px] text-white px-1 rounded-sm animate-pulse font-black">
                AI
              </span>
            </Link>

            <Link
              to="/about"
              className="hover:text-gray-400 transition-colors uppercase"
            >
              Giới thiệu
            </Link>
          </nav>

          {/* Phải: icon + menu mobile */}
          <div className="flex items-center gap-2 sm:gap-6 shrink-0 ml-auto">
            {/* Search Icon (Bạn có thể thêm tính năng tìm kiếm sau) */}

            <Link to="/cart" title="Giỏ hàng">
              <ShoppingCart className="w-5 h-5 cursor-pointer hover:text-gray-400" />
            </Link>

            {/* Thông báo */}
            <NotificationBell isAuthVerified={isAuthVerified} />

            {!user ? (
              <Link to="/login" title="Đăng nhập">
                <User className="w-5 h-5 cursor-pointer hover:text-blue-600" />
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-1 text-xs font-bold hover:text-blue-600 focus:outline-none tracking-tighter"
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
                      className="fixed inset-0 z-[45]"
                      onClick={() => setIsMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-[min(calc(100vw-2rem),14rem)] sm:w-56 bg-white border border-gray-100 rounded-lg shadow-xl py-2 z-[50] animate-in fade-in zoom-in duration-200">
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
                          {isAdmin && (
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-semibold"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                          )}
                          <Link
                            to="/admin/products"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" /> Quản lý sản
                            phẩm
                          </Link>
                          {isAdmin && (
                            <>
                              <Link
                                to="/admin/orders"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <ShoppingCart className="w-4 h-4" /> Quản lý đơn hàng
                              </Link>
                              <Link
                                to="/admin/users"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Users className="w-4 h-4" /> Quản lý người dùng
                              </Link>
                            </>
                          )}
                          <div className="border-b my-1"></div>
                        </>
                      )}

                      <Link
                        to="/my-orders"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ShoppingCart className="w-4 h-4" /> Đơn hàng của tôi
                      </Link>

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
            <button
              type="button"
              className="md:hidden p-2 -mr-1 rounded-lg hover:bg-gray-100 text-black"
              aria-expanded={mobileNavOpen}
              aria-label="Mở menu điều hướng"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 bg-black/40 z-50 md:hidden"
              aria-label="Đóng menu"
              onClick={() => {
                setMobileNavOpen(false);
                setMobileShopOpen(false);
              }}
            />
            <div className="fixed top-0 right-0 bottom-0 z-[51] w-[min(100%,20rem)] bg-white shadow-2xl flex flex-col md:hidden animate-in slide-in-from-right duration-200">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                <span className="text-xs font-black tracking-[0.2em]">MENU</span>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100"
                  aria-label="Đóng"
                  onClick={() => {
                    setMobileNavOpen(false);
                    setMobileShopOpen(false);
                  }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-3 text-[11px] font-black tracking-widest">
                <Link
                  to="/"
                  className="block py-3 px-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileNavOpen(false)}
                >
                  TRANG CHỦ
                </Link>
                <Link
                  to="/featured"
                  className="block py-3 px-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileNavOpen(false)}
                >
                  NỔI BẬT
                </Link>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-3 px-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg text-left"
                  onClick={() => setMobileShopOpen((o) => !o)}
                >
                  <span>MUA SẮM</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${mobileShopOpen ? "rotate-180" : ""}`} />
                </button>
                {mobileShopOpen && (
                  <div className="pl-2 pb-2 space-y-0.5 border-b border-gray-100 mb-1">
                    {shopCategories.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="block py-2.5 px-3 text-[10px] font-semibold tracking-wide text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg"
                        onClick={() => setMobileNavOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <p className="px-3 pt-2 pb-1 text-[9px] font-black text-gray-400 tracking-widest">
                      THƯƠNG HIỆU
                    </p>
                    {brands.length === 0 ? (
                      <p className="px-3 py-2 text-[10px] text-gray-400">Đang tải...</p>
                    ) : (
                      brands.map((b) => (
                        <Link
                          key={b.id}
                          to={`/clothes?brand=${encodeURIComponent(b.slug)}`}
                          className="block py-2 px-3 text-[10px] font-semibold text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg"
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {b.name}
                        </Link>
                      ))
                    )}
                  </div>
                )}
                <Link
                  to="/virtual-try-on"
                  className="block py-3 px-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg text-red-600"
                  onClick={() => setMobileNavOpen(false)}
                >
                  THỬ ĐỒ ẢO
                </Link>
                <Link
                  to="/about"
                  className="block py-3 px-3 border-b border-gray-50 hover:bg-gray-50 rounded-lg"
                  onClick={() => setMobileNavOpen(false)}
                >
                  GIỚI THIỆU
                </Link>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* CONTENT */}
      <main className="flex-1 relative">
        <Outlet />
        {user && !pathname.startsWith("/admin") && <ChatAssistant />}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-50 text-gray-900 mt-auto border-t border-gray-100">


        {/* Main footer grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-black italic tracking-widest mb-4 text-black">FORTUNATE</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Thời trang tối giản, chất lượng cao — tích hợp công nghệ thử đồ ảo AI để mang lại trải nghiệm mua sắm hiện đại nhất.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {[
                { label: "FB", href: "#" },
                { label: "IG", href: "#" },
                { label: "TK", href: "#" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center text-[10px] font-black text-gray-500 hover:border-black hover:text-black transition-all"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h3 className="text-[10px] font-black tracking-[0.25em] text-gray-400 mb-5">
              Khám phá
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Trang chủ", to: "/" },
                { label: "Sản phẩm nổi bật", to: "/featured" },
                { label: "Mua sắm", to: "/clothes" },
                { label: "Thử đồ ảo AI", to: "/virtual-try-on" },
                { label: "Giới thiệu", to: "/about" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 hover:text-black transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h3 className="text-[10px] font-black tracking-[0.25em] text-gray-400 mb-5">
              Hỗ trợ
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Chính sách giao hàng", to: "/shipping" },
                { label: "Đổi trả & Bảo hành", to: "/returns" },
                { label: "Hướng dẫn chọn size", to: "/size-guide" },
                { label: "Liên hệ chúng tôi", to: "/contact" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 hover:text-black transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tài khoản */}
          <div>
            <h3 className="text-[10px] font-black tracking-[0.25em] text-gray-400 mb-5">
              Tài khoản
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Đăng nhập", to: "/login" },
                { label: "Đơn hàng của tôi", to: "/my-orders" },
                { label: "Danh sách yêu thích", to: "/wishlist" },
                { label: "Cài đặt hồ sơ", to: "/profile" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-gray-500 hover:text-black transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
            <p className="text-[10px] text-gray-400 tracking-[0.2em]">
              © 2026 Fortunate Clothing. All rights reserved.
            </p>
            <p className="text-[10px] text-gray-400 tracking-widest">
              Được xây dựng với ♥ — Luận văn tốt nghiệp 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
