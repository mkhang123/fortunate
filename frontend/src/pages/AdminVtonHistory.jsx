import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
 Search,
 Filter,
 ChevronLeft,
 ChevronRight,
 Loader2,
 Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { getAdminVtonSessions } from "../apis/dashboard.api";

export default function AdminVtonHistory() {
 const navigate = useNavigate();
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

 const updateFilter = (patch) => {
 setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
 };

 return (
 <main className="flex-1 overflow-auto">
 <div className="bg-white border-b px-8 py-5 sticky top-0 z-10">
 <h1 className="text-2xl font-black italic tracking-tighter">
 Lịch sử thử đồ ảo
 </h1>
 <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">
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
 <p className="text-gray-500 font-bold text-sm">
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
 className="text-left py-3 px-3 text-[9px] font-black tracking-widest text-gray-400"
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
 {s.product?.name || "Custom"}
 </p>
 {s.aiModel && (
 <p className="text-[9px] text-gray-400">
 {s.aiModel.name}
 </p>
 )}
 </td>
 <td className="py-3 px-3">
 <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
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
 );
}
