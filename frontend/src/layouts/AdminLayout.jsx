import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    Shirt,
    LogOut,
} from "lucide-react";
import { logoutUser } from "../apis/auth.api";

const navItems = [
    { label: "Tổng quan", icon: LayoutDashboard, to: "/admin/dashboard" },
    { label: "Đơn hàng", icon: ShoppingBag, to: "/admin/orders" },
    { label: "Sản phẩm", icon: Package, to: "/admin/products" },
    { label: "Người dùng", icon: Users, to: "/admin/users" },
    { label: "Lịch sử thử đồ ảo", icon: Shirt, to: "/admin/vton-history" },
];

function AdminSidebar({ user, onLogout }) {
    const location = useLocation();

    return (
        <aside className="w-56 flex-shrink-0 bg-black text-white flex flex-col min-h-screen sticky top-0">
            {/* Logo */}
            <div className="px-6 py-6 border-b border-white/10">
                <Link to="/" className="text-xl font-black tracking-widest italic">
                    FORTUNATE
                </Link>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
                    Admin Panel
                </p>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        location.pathname === item.to ||
                        (item.to === "/admin/products" &&
                            location.pathname.startsWith("/admin/products"));

                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                isActive
                                    ? "bg-white text-black"
                                    : "text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="border-t border-white/10 px-4 py-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-white">
                            {user?.name?.[0]?.toUpperCase() || "A"}
                        </span>
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[11px] font-black truncate">{user?.name}</p>
                        <p className="text-[9px] text-white/40 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}

export default function AdminLayout() {
    const navigate = useNavigate();
    const user = (() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();

    const handleLogout = async () => {
        try { await logoutUser(); } catch (_) { /* ignore */ }
        localStorage.removeItem("user");
        navigate("/login");
        window.location.reload();
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <AdminSidebar user={user} onLogout={handleLogout} />
            <div className="flex-1 overflow-auto min-w-0">
                <Outlet />
            </div>
        </div>
    );
}
