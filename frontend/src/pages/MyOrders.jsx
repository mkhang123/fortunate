import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../apis/axiosConfig";
import {
 Package,
 ChevronRight,
 Loader2,
 ShoppingBag,
 Eye,
} from "lucide-react";
import toast from "react-hot-toast";

export default function MyOrders() {
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();

 useEffect(() => {
 fetchOrders();
 }, []);

 const fetchOrders = async () => {
 try {
 setLoading(true);
 const res = await api.get("/orders/me");
 setOrders(res.data.metadata);
 } catch (err) {
 console.error("Lỗi tải đơn hàng:", err);
 toast.error("Không thể tải danh sách đơn hàng");
 } finally {
 setLoading(false);
 }
 };

 const getStatusColor = (status) => {
 const colors = {
 PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
 PAID: "bg-blue-100 text-blue-800 border-blue-200",
 SHIPPED: "bg-purple-100 text-purple-800 border-purple-200",
 COMPLETED: "bg-green-100 text-green-800 border-green-200",
 CANCELLED: "bg-red-100 text-red-800 border-red-200",
 };
 return colors[status] || colors.PENDING;
 };

 const getStatusText = (status) => {
 const texts = {
 PENDING: "Đang xử lý",
 PAID: "Đã thanh toán",
 SHIPPED: "Đang giao hàng",
 COMPLETED: "Hoàn thành",
 CANCELLED: "Đã hủy",
 };
 return texts[status] || status;
 };

 const getDisplayStatus = (order) => {
 if (order.status === "PENDING" && order.payment?.status === "SUCCESS") {
 return "Chờ admin duyệt";
 }
 return getStatusText(order.status);
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-white">
 <Loader2 className="w-8 h-8 animate-spin text-black" />
 </div>
 );
 }

 return (
 <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
 <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-12">
 <Link to="/" className="hover:text-black">
 Trang chủ
 </Link>
 <ChevronRight className="w-3 h-3" />
 <span className="text-black">Đơn hàng của tôi</span>
 </nav>

 <h1 className="text-4xl font-black italic tracking-tighter mb-12">
 Đơn hàng của tôi ({orders.length})
 </h1>

 {orders.length === 0 ? (
 <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-3xl">
 <ShoppingBag className="w-12 h-12 mx-auto mb-6 text-gray-200" />
 <p className="text-[11px] font-black text-gray-400 mb-8">
 Bạn chưa có đơn hàng nào
 </p>
 <Link
 to="/clothes"
 className="inline-block bg-black text-white px-10 py-4 text-[10px] font-black tracking-widest hover:bg-gray-800 transition-all rounded-xl shadow-xl"
 >
 Tiếp tục mua sắm
 </Link>
 </div>
 ) : (
 <div className="space-y-6">
 {orders.map((order) => (
 <div
 key={order.id}
 className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-lg transition-all group"
 >
 <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b">
 <div className="flex items-center gap-4">
 <Package className="w-5 h-5 text-gray-400" />
 <div>
 <p className="text-xs font-black">
 Đơn hàng #{order.id}
 </p>
 <p className="text-[10px] text-gray-500 font-bold">
 {new Date(order.createdAt).toLocaleDateString("vi-VN", {
 year: "numeric",
 month: "long",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 })}
 </p>
 </div>
 </div>
 <span
 className={`px-4 py-2 rounded-full text-[10px] font-black tracking-wider border ${getStatusColor(
 order.status
 )}`}
 >
 {getDisplayStatus(order)}
 </span>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
 {order.items.slice(0, 5).map((item) => (
 <div
 key={item.id}
 className="aspect-[3/4] bg-white rounded-2xl overflow-hidden border border-gray-100 relative group/item"
 >
 <img
 src={
 item.variant.product.images[0] ||
 "https://via.placeholder.com/300x400"
 }
 alt={item.variant.product.name}
 className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/item:scale-110"
 />
 {item.quantity > 1 && (
 <div className="absolute top-2 right-2 bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
 {item.quantity}
 </div>
 )}
 </div>
 ))}
 {order.items.length > 5 && (
 <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
 <p className="text-2xl font-black text-gray-400">
 +{order.items.length - 5}
 </p>
 </div>
 )}
 </div>
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-1">
 Tổng tiền
 </p>
 <p className="text-xl font-black italic text-red-600 tracking-tighter">
 {order.total.toLocaleString("vi-VN")} VNĐ
 </p>
 </div>
 <button
 onClick={() => navigate(`/my-orders/${order.id}`)}
 className="bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black tracking-wider hover:bg-gray-800 transition-all flex items-center gap-2 group/btn"
 >
 <Eye className="w-4 h-4" />
 Xem chi tiết
 <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
