import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig";
import { Link, useNavigate } from "react-router-dom";
import {
 Trash2,
 Minus,
 Plus,
 ArrowRight,
 ShoppingBag,
 ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Cart() {
 const [cart, setCart] = useState(null);
 const [loading, setLoading] = useState(true);
 const navigate = useNavigate();
 const user = JSON.parse(localStorage.getItem("user"));

 // 1. Lấy dữ liệu giỏ hàng từ Backend
 const fetchCart = async () => {
 if (!user) {
 setLoading(true);
 try {
 const guestItems = JSON.parse(localStorage.getItem("guestCart") || "[]");
 setCart({ items: guestItems });
 } catch {
 setCart({ items: [] });
 } finally {
 setLoading(false);
 }
 return;
 }

 try {
 setLoading(true);
 const res = await api.get("/cart");
 setCart(res.data.data);
 } catch (err) {
 console.error("Lỗi lấy giỏ hàng:", err);
 toast.error("Không thể tải giỏ hàng");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchCart();
 }, []);

 // 2. Xóa sản phẩm khỏi giỏ
 const removeItem = async (itemId) => {
 if (!user) {
 const guestItems = JSON.parse(localStorage.getItem("guestCart") || "[]");
 const next = guestItems.filter((item) => item.id !== itemId);
 localStorage.setItem("guestCart", JSON.stringify(next));
 setCart({ items: next });
 toast.success("Đã xóa sản phẩm");
 return;
 }

 await api.delete(`/cart/item/${itemId}`);
 toast.success("Đã xóa sản phẩm");
 fetchCart(); // Tải lại giỏ hàng
 };

 // 3. Cập nhật số lượng sản phẩm (Tăng/Giảm)
 const updateQuantity = async (itemId, currentQty, adjustment) => {
 const newQty = currentQty + adjustment;

 // Chặn không cho giảm xuống dưới 1
 if (newQty < 1) return;

 if (!user) {
 const guestItems = JSON.parse(localStorage.getItem("guestCart") || "[]");
 const next = guestItems.map((item) =>
 item.id === itemId ? { ...item, quantity: newQty } : item,
 );
 localStorage.setItem("guestCart", JSON.stringify(next));
 setCart({ items: next });
 return;
 }

 try {
 // Gọi API patch để cập nhật số lượng trong DB
 await api.patch(`/cart/item/${itemId}`, { quantity: newQty });

 fetchCart();
 } catch (err) {
 console.error("Lỗi cập nhật số lượng:", err);
 toast.error("Kho hàng không đủ số lượng");
 }
 };

 // 4. Tính tổng tiền
 const calculateTotal = () => {
 if (!cart || !cart.items) return 0;
 return cart.items.reduce((total, item) => {
 return total + item.variant.price * item.quantity;
 }, 0);
 };

 if (loading && !cart)
 return (
 <div className="min-h-screen flex items-center justify-center bg-white font-black text-sm animate-pulse">
 Đang kiểm tra giỏ hàng...
 </div>
 );

 return (
 <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
 {/* BREADCRUMB */}
 <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 mb-12">
 <Link to="/" className="hover:text-black">
 Trang chủ
 </Link>
 <ChevronRight className="w-3 h-3" />
 <span className="text-black">Giỏ hàng của bạn</span>
 </nav>

 <h1 className="text-4xl font-black italic tracking-tighter mb-12">
 Giỏ hàng
 </h1>

 {!cart || cart.items.length === 0 ? (
 <div className="text-center py-40 border-2 border-dashed border-gray-100 rounded-3xl">
 <ShoppingBag className="w-12 h-12 mx-auto mb-6 text-gray-200" />
 <p className="text-sm font-black text-gray-400 mb-8">
 Giỏ hàng của bạn đang trống
 </p>
 <Link
 to="/clothes"
 className="inline-block bg-black text-white px-10 py-4 text-sm font-black hover:bg-gray-800 transition-all rounded-xl shadow-xl"
 >
 Tiếp tục mua sắm
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
 {/* DANH SÁCH SẢN PHẨM (LEFT) */}
 <div className="lg:col-span-8 space-y-8">
 {cart.items.map((item) => (
 <div
 key={item.id}
 className="flex gap-6 pb-8 border-b border-gray-50 group"
 >
 {/* Ảnh sản phẩm */}
 <div className="w-32 aspect-[3/4] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative shrink-0">
 <img
 src={
 item.variant.product.images[0] ||
 "https://via.placeholder.com/300x400"
 }
 onError={(e) => {
 e.target.src = "https://via.placeholder.com/300x400?text=No+Image";
 }}
 className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
 alt={item.variant.product.name}
 />
 </div>

 {/* Thông tin sản phẩm */}
 <div className="flex-1 flex flex-col justify-between py-2">
 <div className="flex justify-between items-start">
 <div>
 <h3
 className="text-sm font-black tracking-tight mb-1 hover:text-red-600 transition-colors cursor-pointer"
 onClick={() =>
 navigate(`/product/${item.variant.product.slug}`)
 }
 >
 {item.variant.product.name}
 </h3>
 <p className="text-xs font-semibold text-gray-400">
 Size: {item.variant.size}
 </p>
 </div>
 <button
 onClick={() => removeItem(item.id)}
 className="text-gray-300 hover:text-red-600 transition-colors p-1"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="flex justify-between items-end">
 {/* BỘ ĐIỀU KHIỂN SỐ LƯỢNG */}
 <div className="flex items-center border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
 <button
 onClick={() =>
 updateQuantity(item.id, item.quantity, -1)
 }
 disabled={item.quantity <= 1}
 className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-400 disabled:opacity-20"
 >
 <Minus className="w-3 h-3" />
 </button>
 <span className="px-4 text-xs font-black w-10 text-center">
 {item.quantity}
 </span>
 <button
 onClick={() =>
 updateQuantity(item.id, item.quantity, 1)
 }
 className="px-3 py-2 hover:bg-gray-50 transition-colors text-gray-400"
 >
 <Plus className="w-3 h-3" />
 </button>
 </div>
 <p className="font-black text-sm tracking-tighter italic">
 {(item.variant.price * item.quantity).toLocaleString(
 "vi-VN",
 )}{" "}
 VNĐ
 </p>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* TỔNG KẾT & THANH TOÁN (RIGHT) */}
 <div className="lg:col-span-4">
 <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-8 sticky top-32">
 <h2 className="text-sm font-black tracking-tight">
 Tóm tắt đơn hàng
 </h2>

 <div className="space-y-4">
 <div className="flex justify-between text-sm font-semibold text-gray-500">
 <span>Tạm tính</span>
 <span className="text-black tabular-nums">
 {calculateTotal().toLocaleString("vi-VN")} VNĐ
 </span>
 </div>
 <div className="flex justify-between text-sm font-semibold text-gray-500">
 <span>Phí vận chuyển</span>
 <span className="text-green-600">Miễn phí</span>
 </div>
 <div className="h-[1px] bg-gray-200 my-4"></div>
 <div className="flex justify-between items-end">
 <span className="text-sm font-black">
 Tổng cộng
 </span>
 <span className="text-xl font-black italic text-red-600 tabular-nums">
 {calculateTotal().toLocaleString("vi-VN")} VNĐ
 </span>
 </div>
 </div>

 <button
 onClick={() => navigate('/checkout')}
 className="w-full bg-black text-white py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800 transition-all group"
 >
 Tiến hành thanh toán{" "}
 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>

 <div className="pt-4 space-y-2">
 <p className="text-xs text-gray-400 font-medium text-center leading-relaxed">
* Miễn phí vận chuyển cho mọi đơn hàng
                <br />* Đổi trả trong vòng 07 ngày
 </p>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
