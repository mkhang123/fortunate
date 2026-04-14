import React, { useEffect, useState, useCallback } from "react";
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
  ShoppingBag,
  Users,
  Shirt,
  TrendingUp,
  CheckCircle,
  XCircle,
  Trophy,
  ChevronRight,
  Loader2,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { getDashboardStats } from "../apis/dashboard.api";

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

/** 15_300_000 → "15 triệu 300 VND" */
function formatRevenueReadableVND(amount) {
  const n = Math.round(Number(amount) || 0);
  if (n === 0) return "0 VND";
  if (n < 1_000_000) return `${n.toLocaleString("vi-VN")} VND`;
  const trieu = Math.floor(n / 1_000_000);
  const du = n % 1_000_000;
  const nghin = Math.round(du / 1_000);
  if (nghin === 0) return `${trieu} triệu VND`;
  return `${trieu} triệu ${nghin} VND`;
}

const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ─── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ filterType, setFilterType, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Toggle Theo tháng / Theo ngày */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setFilterType("month")}
          className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
            filterType === "month" ? "bg-black text-white shadow" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Theo tháng
        </button>
        <button
          onClick={() => setFilterType("day")}
          className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
            filterType === "day" ? "bg-black text-white shadow" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Theo ngày
        </button>
      </div>

      {/* Year selector */}
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="text-[10px] font-black px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        {YEAR_OPTIONS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      {/* Month selector — chỉ hiện khi Theo ngày */}
      {filterType === "day" && (
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="text-[10px] font-black px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i + 1} value={i + 1}>{name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow min-w-0">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="text-lg sm:text-xl font-black leading-none mt-1 whitespace-nowrap overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {value}
      </p>
      <p className="text-[10px] font-bold tracking-widest text-gray-400">{label}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filterType, setFilterType] = useState("month");
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const navigate = useNavigate();

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = { filterType, year: selectedYear };
      if (filterType === "day") params.month = selectedMonth;
      const res = await getDashboardStats(params);
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
  }, [filterType, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Line chart ──
  const chartRef = useRef(null);

  const getGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(0,0,0,0.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    return gradient;
  };

  const revenueChart = stats?.revenueChart || [];

  const lineData = {
    labels: revenueChart.length > 0
      ? revenueChart.map((r) => r.label)
      : ["Chưa có dữ liệu"],
    datasets: [
      {
        label: "Doanh thu",
        data: revenueChart.length > 0 ? revenueChart.map((r) => r.revenue) : [0],
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
          label: (ctx) => ` ${formatRevenueReadableVND(ctx.parsed.y)}`,
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

  // ── Tiêu đề phụ theo filter ──
  const filterLabel =
    filterType === "day"
      ? `Tháng ${selectedMonth}/${selectedYear}`
      : `Năm ${selectedYear}`;

  // ── Loading / Error ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-black" />
          <p className="text-xs font-black tracking-widest text-gray-400">
            Đang tải dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
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
      value: formatRevenueReadableVND(summary.totalRevenue),
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
      label: "Đã duyệt",
      value: (ordersByStatus.PAID || 0).toLocaleString("vi-VN"),
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
    PENDING: { label: "Chờ thanh toán", bar: "bg-yellow-400" },
    PAID: { label: "Đã thanh toán", bar: "bg-blue-500" },
    SHIPPED: { label: "Đang giao hàng", bar: "bg-purple-500" },
    COMPLETED: { label: "Hoàn thành", bar: "bg-emerald-500" },
    CANCELLED: { label: "Đã hủy", bar: "bg-red-400" },
  };
  const totalOrders = Object.values(ordersByStatus).reduce((a, b) => a + b, 0);

  return (
    <main className="flex-1 overflow-auto">
      {/* Top bar */}
      <div className="bg-white border-b px-8 py-5 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-black italic tracking-tighter">Admin Dashboard</h1>
          <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">
            Tổng quan hệ thống và hiệu suất kinh doanh
          </p>
        </div>
        <Link
          to="/profile"
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[10px] font-black tracking-widest rounded-xl hover:bg-gray-800 transition-colors"
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

        {/* ── Bộ lọc chung ── */}
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            BỘ LỌC
          </div>
          <FilterBar
            filterType={filterType}
            setFilterType={setFilterType}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
          <span className="ml-auto text-[10px] font-black text-gray-400">
            Đang xem: <span className="text-black">{filterLabel}</span>
          </span>
        </div>

        {/* ── Line Chart + Top 10 ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Line Chart doanh thu - 2/3 */}
          <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Tăng trưởng doanh thu
                </p>
                <h2 className="text-lg font-black tracking-tight mt-0.5">{filterLabel}</h2>
              </div>
              <span className="text-[9px] font-black tracking-widest px-2.5 py-1.5 bg-gray-100 rounded-lg text-gray-500">
                {filterType === "day" ? "Theo ngày" : "Theo tháng"}
              </span>
            </div>

            <div style={{ height: 280 }} className="mt-4">
              {revenueChart.length === 0 ? (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-400 font-bold">Chưa có dữ liệu trong khoảng này</p>
                </div>
              ) : (
                <Line ref={chartRef} data={lineData} options={lineOptions} />
              )}
            </div>
          </div>

          {/* Top 10 Ranking - 1/3 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-black tracking-tight">Top 10</h2>
              <span className="ml-auto text-[9px] font-black tracking-widest px-2 py-1 bg-gray-100 rounded-lg text-gray-500">
                Sản phẩm bán chạy
              </span>
            </div>
            <p className="text-[9px] text-gray-400 font-bold mb-4">{filterLabel}</p>

            {topSellingProducts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-gray-400 font-bold">Chưa có dữ liệu</p>
              </div>
            ) : (
              <ol className="space-y-3 flex-1 overflow-auto">
                {topSellingProducts.map((p, idx) => (
                  <li key={p.variantId} className="flex items-center gap-3 group">
                    <span
                      className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-[10px] font-black ${
                        idx === 0
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
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate leading-none">{p.productName}</p>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                        {p.color} · {p.size}
                      </p>
                    </div>
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
            <h2 className="text-base font-black tracking-tight mb-5">Trạng Thái Đơn Hàng</h2>
            <div className="space-y-4">
              {Object.entries(ordersByStatus).map(([status, count]) => {
                const meta = statusLabels[status];
                const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-gray-600">{meta.label}</span>
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
              <span className="text-[10px] font-black text-gray-400">Tổng</span>
              <span className="font-black text-xl">{totalOrders}</span>
            </div>
          </div>

          {/* VTON Sessions table - 2/3 */}
          <div className="xl:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-base font-black tracking-tight">Phiên Thử Đồ Ảo Gần Đây</h2>
                <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">
                  10 phiên mới nhất · {filterLabel}
                </p>
              </div>
              <Shirt className="w-5 h-5 text-gray-300" />
            </div>

            <div className="mt-4">
              {recentVtonSessions.length === 0 ? (
                <div className="flex items-center justify-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-xs text-gray-400 font-bold">Chưa có phiên nào trong khoảng này</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        {["#", "Người dùng", "Sản phẩm", "Trạng thái", "Thời gian"].map((h) => (
                          <th
                            key={h}
                            className="text-left py-2 px-3 text-[9px] font-black tracking-widest text-gray-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentVtonSessions.map((s) => (
                        <tr
                          key={s.id}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-3 text-[10px] font-black text-gray-400">#{s.id}</td>
                          <td className="py-3 px-3">
                            <p className="text-[11px] font-black">{s.user?.name || "—"}</p>
                            <p className="text-[9px] text-gray-400">{s.user?.email}</p>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-[11px] font-black">{s.product?.name || "Custom"}</p>
                            {s.aiModel && (
                              <p className="text-[9px] text-gray-400">{s.aiModel.name}</p>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
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
      </div>
    </main>
  );
}
