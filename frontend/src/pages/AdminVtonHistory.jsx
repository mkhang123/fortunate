import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    Shirt,
    LogOut,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminVtonSessions } from "../apis/dashboard.api";
import { logoutUser } from "../apis/auth.api";

function Sidebar({ user, onLogout }) {
    const location = useLocation();
    const navItems = [
        { label: "Tổng quan", icon: LayoutDashboard, to: "/admin/dashboard" },
        { label: "Đơn hàng", icon: ShoppingBag, to: "/admin/orders" },
        { label: "Sản phẩm", icon: Package, to: "/admin/products" },
        { label: "Người dùng", icon: Users, to: "/admin/users" },
        { label: "Lịch sử thử đồ ảo", icon: Shirt, to: "/admin/vton-history" },
    ];

    return (
        <aside className="w-56 flex-shrink-0 bg-black text-white flex flex-col min-h-screen sticky top-0">
            <div className="px-6 py-6 border-b border-white/10">
                <Link to="/" className="text-xl font-black tracking-widest italic">
                    FORTUNATE
                </Link>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
                    Admin Panel
                </p>
            </div>

            <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive
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

export default function AdminVtonHistory() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        status: "",
        page: 1,
        limit: 10,
    });

    useEffect(() => {
        fetchSessions();
    }, [filters]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await getAdminVtonSessions(filters);
            setSessions(res.data.metadata.sessions);
            setPagination(res.data.metadata.pagination);
        } catch (error) {
            if (error.response?.status === 403) {
                toast.error("Bạn không có quyền truy cập");
                navigate("/");
                return;
            }
            toast.error("Không thể tải lịch sử thử đồ ảo");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (_) {
            // ignore
        }
        localStorage.removeItem("user");
        navigate("/login");
        window.location.reload();
    };

    const updateFilter = (patch) => {
        setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar user={user} onLogout={handleLogout} />

            <main className="flex-1 overflow-auto">
                <div className="bg-white border-b px-8 py-5 sticky top-0 z-10">
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                        Lịch sử thử đồ ảo
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        Theo dõi các phiên thử đồ ảo của người dùng
                    </p>
                </div>

                <div className="px-8 py-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative md:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    placeholder="Tìm theo tên/email người dùng hoặc tên sản phẩm..."
                                    onChange={(e) => updateFilter({ search: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none"
                                />
                            </div>

                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => updateFilter({ status: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none appearance-none bg-white"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="PENDING">Đang xử lý</option>
                                    <option value="COMPLETED">Hoàn thành</option>
                                    <option value="FAILED">Thất bại</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-black" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                                <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 font-bold uppercase text-sm">
                                    Không có dữ liệu thử đồ ảo
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                {["#", "Người dùng", "Sản phẩm", "Trạng thái", "Kết quả", "Thời gian"].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="text-left py-3 px-3 text-[9px] font-black uppercase tracking-widest text-gray-400"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.map((s) => (
                                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-3 text-[10px] font-black text-gray-400">#{s.id}</td>
                                                    <td className="py-3 px-3">
                                                        <p className="text-[11px] font-black">{s.user?.name || "—"}</p>
                                                        <p className="text-[9px] text-gray-400">{s.user?.email || "—"}</p>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className="text-[11px] font-black">
                                                            {s.variant?.product?.name || "Custom"}
                                                        </p>
                                                        {s.variant && (
                                                            <p className="text-[9px] text-gray-400">
                                                                {s.variant.color} · {s.variant.size}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                                                            {s.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        {s.outputImage ? (
                                                            <a
                                                                href={s.outputImage}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:underline"
                                                            >
                                                                <ImageIcon className="w-3.5 h-3.5" />
                                                                Xem ảnh
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400">Chưa có</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-[10px] text-gray-400 font-medium whitespace-nowrap">
                                                        {new Date(s.createdAt).toLocaleString("vi-VN", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {pagination && pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6">
                                        <p className="text-sm text-gray-600">
                                            Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                            {Math.min(pagination.page * pagination.limit, pagination.total)} của{" "}
                                            {pagination.total} phiên
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                                                }
                                                disabled={pagination.page === 1}
                                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-4 py-2 text-sm font-bold">
                                                {pagination.page} / {pagination.totalPages}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                                                }
                                                disabled={pagination.page === pagination.totalPages}
                                                className="p-2 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
