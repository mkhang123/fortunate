import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useRef } from "react";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Package,
    Shirt,
    LogOut,
    TrendingUp,
    CheckCircle,
    XCircle,
    Trophy,
    ChevronRight,
    Loader2,
    ShoppingCart,
} from "lucide-react";
import { getDashboardStats } from "../apis/dashboard.api";
import { logoutUser } from "../apis/auth.api";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ user, onLogout }) {
    const navItems = [
        { label: "Tổng quan", icon: LayoutDashboard, to: "/admin/dashboard", active: true },
        { label: "Đơn hàng", icon: ShoppingBag, to: "/admin/orders" },
        { label: "Sản phẩm", icon: Package, to: "/admin/products" },
        { label: "Người dùng", icon: Users, to: "/admin/users" },
        { label: "Virtual Try-On", icon: Shirt, to: "/admin/dashboard" },
    ];

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
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${item.active
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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}
                >
                    <Icon className="w-4 h-4" />
                </span>
            </div>
            <p className="text-2xl font-black leading-none mt-1">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {label}
            </p>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const res = await getDashboardStats();
            setStats(res.data.metadata);
        } catch (err) {
            if (err.response?.status === 403) {
                setError("Bạn không có quyền truy cập trang này.");
            } else {
                setError("Không thể tải dữ liệu dashboard.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const rt = localStorage.getItem("refreshToken");
            if (rt) await logoutUser(rt);
        } catch (_) { /* ignore */ }
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login");
        window.location.reload();
    };

    // ── Line chart (doanh thu theo tháng) ──
    const chartRef = useRef(null);

    const getGradient = (ctx, chartArea) => {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, "rgba(0,0,0,0.18)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        return gradient;
    };

    const revenueMonths = stats?.revenueByMonth || [];

    const lineData = {
        labels: revenueMonths.length > 0
            ? revenueMonths.map((r) => r.month)
            : ["Chưa có dữ liệu"],
        datasets: [
            {
                label: "Doanh thu",
                data: revenueMonths.length > 0
                    ? revenueMonths.map((r) => r.revenue)
                    : [0],
                borderColor: "#000",
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: "#000",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return "rgba(0,0,0,0.05)";
                    return getGradient(ctx, chartArea);
                },
            },
        ],
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed.y;
                        if (val >= 1_000_000)
                            return ` ${(val / 1_000_000).toFixed(2)}M đ`;
                        return ` ${val.toLocaleString("vi-VN")} đ`;
                    },
                },
                backgroundColor: "#111",
                titleColor: "#fff",
                bodyColor: "#aaa",
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 10, weight: "bold" }, color: "#888" },
            },
            y: {
                beginAtZero: true,
                grid: { color: "rgba(0,0,0,0.05)" },
                ticks: {
                    font: { size: 10 },
                    color: "#aaa",
                    callback: (val) =>
                        val >= 1_000_000
                            ? (val / 1_000_000).toFixed(1) + "M"
                            : val >= 1_000
                                ? (val / 1_000).toFixed(0) + "K"
                                : val,
                },
            },
        },
    };

    // ── Loading / Error ──
    if (loading) {
        return (
            <div className="flex min-h-screen">
                <Sidebar user={user} onLogout={handleLogout} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-black" />
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                            Đang tải dashboard…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen">
                <Sidebar user={user} onLogout={handleLogout} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="font-black text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => navigate("/")}
                            className="px-6 py-2 bg-black text-white text-sm font-bold rounded-xl"
                        >
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { summary, topSellingProducts, recentVtonSessions, ordersByStatus } = stats;

    const statCards = [
        {
            label: "Tổng đơn hàng",
            value: summary.totalOrders.toLocaleString("vi-VN"),
            icon: ShoppingBag,
            accent: "bg-black/5 text-black",
        },
        {
            label: "Doanh thu",
            value:
                summary.totalRevenue >= 1_000_000
                    ? (summary.totalRevenue / 1_000_000).toFixed(1) + "M đ"
                    : summary.totalRevenue.toLocaleString("vi-VN") + " đ",
            icon: TrendingUp,
            accent: "bg-emerald-50 text-emerald-600",
        },
        {
            label: "Phiên thử đồ",
            value: summary.totalVtonSessions.toLocaleString("vi-VN"),
            icon: Shirt,
            accent: "bg-violet-50 text-violet-600",
        },
        {
            label: "Người dùng",
            value: summary.totalUsers.toLocaleString("vi-VN"),
            icon: Users,
            accent: "bg-blue-50 text-blue-600",
        },
        {
            label: "Hoàn thành",
            value: (ordersByStatus.COMPLETED || 0).toLocaleString("vi-VN"),
            icon: CheckCircle,
            accent: "bg-green-50 text-green-600",
        },
        {
            label: "Đã hủy",
            value: (ordersByStatus.CANCELLED || 0).toLocaleString("vi-VN"),
            icon: XCircle,
            accent: "bg-red-50 text-red-500",
        },
    ];

    const statusLabels = {
        PENDING: { label: "Chờ TT", bar: "bg-yellow-400" },
        PAID: { label: "Đã TT", bar: "bg-blue-500" },
        SHIPPED: { label: "Đang giao", bar: "bg-purple-500" },
        COMPLETED: { label: "Hoàn thành", bar: "bg-emerald-500" },
        CANCELLED: { label: "Đã hủy", bar: "bg-red-400" },
    };
    const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <Sidebar user={user} onLogout={handleLogout} />

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                {/* Top bar */}
                <div className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="text-2xl font-black italic uppercase tracking-tighter">
                            Admin Dashboard
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            Tổng quan hệ thống và hiệu suất kinh doanh
                        </p>
                    </div>
                    <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <Users className="w-3.5 h-3.5" />
                        Trang cá nhân
                    </Link>
                </div>

                <div className="px-8 py-6 space-y-6">
                    {/* ── 6 Stat Cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                        {statCards.map((c) => (
                            <StatCard key={c.label} {...c} />
                        ))}
                    </div>

                    {/* ── Line Chart + Top 10 ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Line Chart doanh thu - 2/3 */}
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" /> Tăng trưởng doanh thu
                                    </p>
                                    <h2 className="text-lg font-black uppercase tracking-tight mt-0.5">
                                        12 tháng qua
                                    </h2>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 bg-gray-100 rounded-lg text-gray-500">
                                    Theo tháng
                                </span>
                            </div>

                            <div style={{ height: 280 }} className="mt-4">
                                <Line ref={chartRef} data={lineData} options={lineOptions} />
                            </div>
                        </div>

                        {/* Top 10 Ranking - 1/3 */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
                            <div className="flex items-center gap-2 mb-5">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <h2 className="text-base font-black uppercase tracking-tight">
                                    Top 10
                                </h2>
                                <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-lg text-gray-500">
                                    Sản phẩm bán chạy
                                </span>
                            </div>

                            {topSellingProducts.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-xs text-gray-400 font-bold uppercase">
                                        Chưa có dữ liệu
                                    </p>
                                </div>
                            ) : (
                                <ol className="space-y-3 flex-1 overflow-auto">
                                    {topSellingProducts.map((p, idx) => (
                                        <li key={p.variantId} className="flex items-center gap-3 group">
                                            {/* Rank */}
                                            <span
                                                className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-[10px] font-black ${idx === 0
                                                    ? "bg-amber-400 text-white"
                                                    : idx === 1
                                                        ? "bg-gray-300 text-gray-700"
                                                        : idx === 2
                                                            ? "bg-orange-300 text-white"
                                                            : "bg-gray-100 text-gray-400"
                                                    }`}
                                            >
                                                {idx + 1}
                                            </span>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black truncate leading-none">
                                                    {p.productName}
                                                </p>
                                                <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                                    {p.color} · {p.size}
                                                </p>
                                            </div>

                                            {/* Qty */}
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-black leading-none">{p.quantitySold}</p>
                                                <p className="text-[9px] text-gray-400 font-bold">sản phẩm</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>

                    {/* ── Order Status + VTON Table ── */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Order Status breakdown */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-base font-black uppercase tracking-tight mb-5">
                                Trạng Thái Đơn Hàng
                            </h2>
                            <div className="space-y-4">
                                {Object.entries(ordersByStatus).map(([status, count]) => {
                                    const meta = statusLabels[status];
                                    const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                                    return (
                                        <div key={status}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-black uppercase text-gray-600">
                                                    {meta.label}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400">{pct}%</span>
                                                    <span className="font-black text-sm w-6 text-right">{count}</span>
                                                </div>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${meta.bar}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-gray-400">Tổng</span>
                                <span className="font-black text-xl">{totalOrders}</span>
                            </div>
                        </div>

                        {/* VTON Sessions table - 2/3 */}
                        <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-base font-black uppercase tracking-tight">
                                        Phiên Thử Đồ Ảo Gần Đây
                                    </h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                        10 phiên mới nhất
                                    </p>
                                </div>
                                <Shirt className="w-5 h-5 text-gray-300" />
                            </div>

                            {recentVtonSessions.length === 0 ? (
                                <div className="flex items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                                    <p className="text-xs text-gray-400 font-bold uppercase">
                                        Chưa có phiên nào
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                {["#", "Người dùng", "Sản phẩm", "Trạng thái", "Thời gian"].map(
                                                    (h) => (
                                                        <th
                                                            key={h}
                                                            className="text-left py-2 px-3 text-[9px] font-black uppercase tracking-widest text-gray-400"
                                                        >
                                                            {h}
                                                        </th>
                                                    )
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentVtonSessions.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                                >
                                                    <td className="py-3 px-3 text-[10px] font-black text-gray-400">
                                                        #{s.id}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <p className="text-[11px] font-black">{s.user?.name || "—"}</p>
                                                        <p className="text-[9px] text-gray-400">{s.user?.email}</p>
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
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
