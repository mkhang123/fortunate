import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../apis/axiosConfig";
import {
    Package,
    Search,
    Filter,
    Eye,
    Trash2,
    Loader2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: "",
        search: "",
        page: 1,
        limit: 10,
    });
    const [pagination, setPagination] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [filters]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.status) params.append("status", filters.status);
            if (filters.search) params.append("search", filters.search);
            params.append("page", filters.page);
            params.append("limit", filters.limit);

            const res = await api.get(`/orders/all?${params.toString()}`);
            setOrders(res.data.metadata.orders);
            setPagination(res.data.metadata.pagination);
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            toast.success("Cập nhật trạng thái thành công");
            fetchOrders();
        } catch (err) {
            console.error("Lỗi cập nhật trạng thái:", err);
            toast.error("Không thể cập nhật trạng thái");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;

        try {
            await api.delete(`/orders/${orderId}`);
            toast.success("Xóa đơn hàng thành công");
            fetchOrders();
        } catch (err) {
            console.error("Lỗi xóa đơn hàng:", err);
            toast.error(err.response?.data?.message || "Không thể xóa đơn hàng");
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
            PAID: "bg-blue-100 text-blue-800 border-blue-300",
            SHIPPED: "bg-purple-100 text-purple-800 border-purple-300",
            COMPLETED: "bg-green-100 text-green-800 border-green-300",
            CANCELLED: "bg-red-100 text-red-800 border-red-300",
        };
        return colors[status] || colors.PENDING;
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-8">
                Quản lý đơn hàng
            </h1>

            {/* Filters */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo mã đơn, tên, SĐT..."
                            value={filters.search}
                            onChange={(e) =>
                                setFilters({ ...filters, search: e.target.value, page: 1 })
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filters.status}
                            onChange={(e) =>
                                setFilters({ ...filters, status: e.target.value, page: 1 })
                            }
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none appearance-none bg-white"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ thanh toán</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="SHIPPED">Đang giao hàng</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                    </div>

                    {/* Items per page */}
                    <div>
                        <select
                            value={filters.limit}
                            onChange={(e) =>
                                setFilters({ ...filters, limit: +e.target.value, page: 1 })
                            }
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none appearance-none bg-white"
                        >
                            <option value="10">10 đơn/trang</option>
                            <option value="20">20 đơn/trang</option>
                            <option value="50">50 đơn/trang</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-2xl">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-bold uppercase text-sm">
                        Không tìm thấy đơn hàng
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Mã ĐH
                                    </th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Khách hàng
                                    </th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Tổng tiền
                                    </th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Thanh toán
                                    </th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Trạng thái
                                    </th>
                                    <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Ngày tạo
                                    </th>
                                    <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <span className="font-black text-sm">#{order.id}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="font-bold text-sm">{order.receiverName}</p>
                                                <p className="text-xs text-gray-500">{order.receiverPhone}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-black italic">
                                                {order.total.toLocaleString("vi-VN")} đ
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-xs font-bold">
                                                {order.payment?.method || "N/A"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                <option value="PENDING">Chờ thanh toán</option>
                                                <option value="PAID">Đã thanh toán</option>
                                                <option value="SHIPPED">Đang giao</option>
                                                <option value="COMPLETED">Hoàn thành</option>
                                                <option value="CANCELLED">Hủy</option>
                                            </select>
                                        </td>
                                        <td className="py-4 px-4 text-xs text-gray-600">
                                            {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/my-orders/${order.id}`}
                                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-600" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Xóa đơn hàng"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8">
                            <p className="text-sm text-gray-600">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} của{" "}
                                {pagination.total} đơn hàng
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={pagination.page === 1}
                                    className="p-2 border border-gray-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 text-sm font-bold">
                                    {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
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
    );
}
