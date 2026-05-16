import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../apis/axiosConfig";
import {
 ChevronRight,
 Loader2,
 Package,
 MapPin,
 Phone,
 Mail,
 CreditCard,
 Clock,
 ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OrderDetail() {
 const { orderId } = useParams();
 const navigate = useNavigate();
 const [order, setOrder] = useState(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetchOrder();
 }, [orderId]);

 const fetchOrder = async () => {
 try {
 setLoading(true);
 const res = await api.get(`/orders/${orderId}`);
 setOrder(res.data.metadata);
 } catch (err) {
 console.error("Lỗi tải đơn hàng:", err);
 toast.error("Không thể tải thông tin đơn hàng");
 navigate("/my-orders");
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

 const handleRetryPayment = async () => {
 try {
 const paymentResponse = await api.post("/payments/vnpay/create", {
 orderId: order.id,
 amount: order.total,
 });

 const { redirectUrl } = paymentResponse.data.metadata;
 window.location.href = redirectUrl;
 } catch (err) {
 console.error("Lỗi tạo link thanh toán:", err);
 toast.error("Không thể tạo link thanh toán");
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center bg-white">
 <Loader2 className="w-8 h-8 animate-spin text-black" />
 </div>
 );
 }

 if (!order) return null;

 return (
 <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
 <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-12">
 <Link to="/" className="hover:text-black">
 Trang chủ
 </Link>
 <ChevronRight className="w-3 h-3" />
 <Link to="/my-orders" className="hover:text-black">
 Đơn hàng của tôi
 </Link>
 <ChevronRight className="w-3 h-3" />
 <span className="text-black">Chi tiết đơn hàng</span>
 </nav>
 <button
 onClick={() => navigate("/my-orders")}
 className="flex items-center gap-2 text-[10px] font-black text-gray-600 hover:text-black transition-colors mb-8 group"
 >
 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
 Quay lại
 </button>
 <div className="flex flex-wrap items-start justify-between gap-4 mb-12">
 <div>
 <h1 className="text-4xl font-black italic tracking-tighter mb-2">
 Đơn hàng #{order.id}
 </h1>
 <p className="text-[11px] font-bold text-gray-500 flex items-center gap-2">
 <Clock className="w-3 h-3" />
 {new Date(order.createdAt).toLocaleDateString("vi-VN", {
 year: "numeric",
 month: "long",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 })}
 </p>
 </div>
 <div className="flex flex-col items-end gap-2">
 <span
 className={`px-4 py-2 rounded-full text-[10px] font-black tracking-wider border ${getStatusColor(
 order.status
 )}`}
 >
 {getDisplayStatus(order)}
 </span>
 {order.payment && (
 <span
 className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-wider ${order.payment.status === "SUCCESS"
 ? "bg-green-50 text-green-700"
 : order.payment.status === "FAILED"
 ? "bg-red-50 text-red-700"
 : "bg-yellow-50 text-yellow-700"
 }`}
 >
 {order.payment.method} -{" "}
 {order.payment.status === "SUCCESS"
 ? "Đã thanh toán"
 : order.payment.status === "FAILED"
 ? "Thanh toán thất bại"
 : "Chờ thanh toán"}
 </span>
 )}
 </div>
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-8">
 <div className="bg-white p-6 rounded-3xl border border-gray-100">
 <h2 className="text-xs font-black tracking-tight mb-6 flex items-center gap-2">
 <Package className="w-4 h-4" />
 Sản phẩm ({order.items?.length || 0})
 </h2>
 <div className="space-y-6">
 {order.items?.map((item) => (
 <div key={item.id} className="flex gap-4 border-b pb-6 last:border-0">
 <div className="w-24 aspect-[3/4] bg-white rounded-2xl overflow-hidden shrink-0 border border-gray-100">
 <img
 src={
 item.variant.product.images[0] ||
 "https://via.placeholder.com/300x400"
 }
 alt={item.variant.product.name}
 className="w-full h-full object-contain mix-blend-multiply"
 />
 </div>
 <div className="flex-1">
 <Link
 to={`/product/${item.variant.product.slug}`}
 className="font-black text-sm tracking-tight hover:text-red-600 transition-colors block mb-2"
 >
 {item.variant.product.name}
 </Link>
 <p className="text-[10px] text-gray-500 font-bold mb-3">
 Size: {item.variant.size}
 </p>
 <div className="flex items-center justify-between">
 <p className="text-[11px] text-gray-600">
 Số lượng: <span className="font-black">{item.quantity}</span>
 </p>
 <p className="font-black italic text-base">
 {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 {order.notes && (
 <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
 <h3 className="text-xs font-black tracking-tight mb-3">
 Ghi chú
 </h3>
 <p className="text-sm text-gray-700">{order.notes}</p>
 </div>
 )}
 </div>
 <div className="space-y-6">
 <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 sticky top-32">
 <h3 className="text-xs font-black tracking-tight mb-4 flex items-center gap-2">
 <MapPin className="w-4 h-4" />
 Thông tin giao hàng
 </h3>
 <div className="space-y-3 text-sm">
 <p className="font-black">{order.receiverName}</p>
 <p className="flex items-center gap-2 text-gray-600">
 <Phone className="w-3 h-3" />
 {order.receiverPhone}
 </p>
 <p className="flex items-center gap-2 text-gray-600">
 <Mail className="w-3 h-3" />
 {order.receiverEmail}
 </p>
 <div className="h-[1px] bg-gray-200 my-3"></div>
 <p className="text-gray-700 leading-relaxed">
 {order.shippingAddress}
 {order.city && `, ${order.city}`}
 </p>
 </div>
 </div>
 <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
 <h3 className="text-xs font-black tracking-tight mb-4 flex items-center gap-2">
 <CreditCard className="w-4 h-4" />
 Thanh toán
 </h3>
 <div className="space-y-3">
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">Tạm tính:</span>
 <span className="font-bold">
 {order.total.toLocaleString("vi-VN")} VNĐ
 </span>
 </div>
 <div className="flex justify-between text-sm">
 <span className="text-gray-600">Phí vận chuyển:</span>
            <span className="text-green-600 font-bold">Miễn phí</span>
 </div>
 <div className="h-[1px] bg-gray-200"></div>
 <div className="flex justify-between items-end">
 <span className="text-xs font-black">
 Tổng cộng
 </span>
 <span className="text-xl font-black italic text-red-600">
 {order.total.toLocaleString("vi-VN")} VNĐ
 </span>
 </div>
 </div>
 {order.status === "PENDING" &&
 order.payment?.method === "VNPAY" &&
 order.payment?.status === "PENDING" && (
 <>
 <div className="h-[1px] bg-gray-200 my-4"></div>
 <button
 onClick={handleRetryPayment}
 className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black tracking-wider hover:bg-blue-700 transition-all"
 >
 Thanh toán lại
 </button>
 </>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
