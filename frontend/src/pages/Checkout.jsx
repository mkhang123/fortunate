import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig";
import { useNavigate, useLocation } from "react-router-dom";
import {
 CreditCard,
 Wallet,
 Check,
 ChevronRight,
 ShoppingBag,
 Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Checkout() {
 const [cart, setCart] = useState(null);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const navigate = useNavigate();
 const location = useLocation();
 const buyNowItem = location.state?.buyNowItem;
 const user = JSON.parse(localStorage.getItem("user"));

 // Form state
 const [formData, setFormData] = useState({
 receiverName: user?.name || "",
 receiverPhone: user?.phone || "",
 receiverEmail: user?.email || "",
 shippingAddress: user?.address || "",
 city: "",
 notes: "",
 paymentMethod: "VNPAY",
 });

 const [errors, setErrors] = useState({
 receiverName: "",
 receiverPhone: "",
 receiverEmail: "",
 shippingAddress: "",
 });

 // Fetch cart on mount
 useEffect(() => {
 fetchCart();
 }, []);

 const fetchCart = async () => {
 if (buyNowItem) {
   setCart({ items: [buyNowItem] });
   setLoading(false);
   return;
 }

 if (!user) {
 setLoading(true);
 try {
 const guestItems = JSON.parse(localStorage.getItem("guestCart") || "[]");
 const guestCart = { items: guestItems };
 setCart(guestCart);
 if (!guestItems.length) {
 toast.error("Giỏ hàng trống");
 navigate("/cart");
 }
 } catch (err) {
 console.error("Lỗi lấy giỏ hàng guest:", err);
 toast.error("Không thể tải giỏ hàng");
 navigate("/cart");
 } finally {
 setLoading(false);
 }
 return;
 }

 try {
 setLoading(true);
 const res = await api.get("/cart");
 setCart(res.data.data);

 // If cart is empty, redirect to cart page
 if (!res.data.data.items || res.data.data.items.length === 0) {
 toast.error("Giỏ hàng trống");
 navigate("/cart");
 }
 } catch (err) {
 console.error("Lỗi lấy giỏ hàng:", err);
 toast.error("Không thể tải giỏ hàng");
 navigate("/cart");
 } finally {
 setLoading(false);
 }
 };

 const calculateTotal = () => {
 if (!cart || !cart.items) return 0;
 return cart.items.reduce((total, item) => {
 return total + item.variant.price * item.quantity;
 }, 0);
 };

 const handleInputChange = (e) => {
 const { name, value } = e.target;
 setFormData({ ...formData, [name]: value });
 if (errors[name]) {
 setErrors({ ...errors, [name]: "" });
 }
 };

 const validateForm = () => {
 const { receiverName, receiverPhone, receiverEmail, shippingAddress } = formData;
 const newErrors = { receiverName: "", receiverPhone: "", receiverEmail: "", shippingAddress: "" };
 let isValid = true;

 if (!receiverName.trim()) {
 newErrors.receiverName = "Vui lòng nhập họ và tên!";
 isValid = false;
 }

 if (!receiverPhone.trim()) {
 newErrors.receiverPhone = "Vui lòng nhập số điện thoại!";
 isValid = false;
 } else if (!/^(0|\+84)[0-9]{9}$/.test(receiverPhone.replace(/\s/g, ""))) {
 newErrors.receiverPhone = "Số điện thoại không hợp lệ!";
 isValid = false;
 }

 if (!receiverEmail.trim()) {
 newErrors.receiverEmail = "Vui lòng nhập email!";
 isValid = false;
 } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
 newErrors.receiverEmail = "Email không hợp lệ. Vui lòng kiểm tra lại!";
 isValid = false;
 }

 if (!shippingAddress.trim()) {
 newErrors.shippingAddress = "Vui lòng nhập địa chỉ giao hàng!";
 isValid = false;
 }

 setErrors(newErrors);
 return isValid;
 };

 const handleSubmit = async (e) => {
 e.preventDefault();

 if (!validateForm()) return;

 try {
 setSubmitting(true);

 // Create order
 let payload = { ...formData };
 if (buyNowItem) {
   payload.items = [{
     variantId: buyNowItem.variant.id,
     quantity: buyNowItem.quantity,
   }];
 } else if (!user) {
   payload.items = (cart?.items || []).map((item) => ({
     variantId: item.variantId || item.variant?.id,
     quantity: item.quantity,
   }));
 }

 const orderResponse = await api.post(user ? "/orders" : "/orders/guest", payload);
 const { order, requiresPayment, paymentMethod } =
 orderResponse.data.metadata;

 console.log("Order created:", order);
 toast.success(`Đơn hàng #${order.id} đã được tạo`);

 if (!user) {
 localStorage.setItem(
 "guestOrderLookup",
 JSON.stringify({
 orderId: order.id,
 email: formData.receiverEmail,
 phone: formData.receiverPhone,
 })
 );
 localStorage.removeItem("guestCart");
 }

 // If VNPAY payment, get payment URL and redirect
 if (requiresPayment && paymentMethod === "VNPAY") {
 const paymentResponse = await api.post("/payments/vnpay/create", {
 orderId: order.id,
 amount: order.total,
 });

 const { redirectUrl } = paymentResponse.data.metadata;

 // Redirect to VNPAY
 window.location.href = redirectUrl;
 } else {
 // COD order - navigate to order confirmation
 navigate(`/order-confirmation/${order.id}`);
 }
 } catch (err) {
 console.error("Lỗi tạo đơn hàng:", err);
 toast.error(err.response?.data?.message || "Không thể tạo đơn hàng");
 } finally {
 setSubmitting(false);
 }
 };

 if (loading)
 return (
 <div className="min-h-screen flex items-center justify-center bg-white">
 <Loader2 className="w-8 h-8 animate-spin text-black" />
 </div>
 );

 return (
 <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-8 sm:py-12 bg-white min-h-screen">
 {/* BREADCRUMB */}
 <nav className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-gray-400 mb-8 sm:mb-12">
 <button onClick={() => navigate("/")} className="hover:text-black">
 Trang chủ
 </button>
 <ChevronRight className="w-3 h-3" />
 <button onClick={() => navigate("/cart")} className="hover:text-black">
 Giỏ hàng
 </button>
 <ChevronRight className="w-3 h-3" />
 <span className="text-black">Thanh toán</span>
 </nav>

 <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter mb-8 sm:mb-12">
 Thanh toán
 </h1>

 <form onSubmit={handleSubmit} noValidate>
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
 {/* FORM (LEFT) */}
 <div className="lg:col-span-7 space-y-8">
 {/* Thông tin người nhận */}
 <div className="space-y-6">
 <h2 className="text-sm font-black border-b pb-4 tracking-tight">
 Thông tin người nhận
 </h2>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Họ và tên <span className="text-red-600">*</span>
 </label>
 <input
 type="text"
 name="receiverName"
 value={formData.receiverName}
 onChange={handleInputChange}
 className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors ${errors.receiverName ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-black"}`}
 placeholder="Nguyễn Văn A"
 />
 {errors.receiverName && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.receiverName}
 </p>
 )}
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Số điện thoại <span className="text-red-600">*</span>
 </label>
 <input
 type="tel"
 name="receiverPhone"
 value={formData.receiverPhone}
 onChange={handleInputChange}
 className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors ${errors.receiverPhone ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-black"}`}
 placeholder="0901234567"
 />
 {errors.receiverPhone && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.receiverPhone}
 </p>
 )}
 </div>

 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Email <span className="text-red-600">*</span>
 </label>
 <input
 type="email"
 name="receiverEmail"
 value={formData.receiverEmail}
 onChange={handleInputChange}
 className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors ${errors.receiverEmail ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-black"}`}
 placeholder="email@example.com"
 />
 {errors.receiverEmail && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.receiverEmail}
 </p>
 )}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Địa chỉ giao hàng <span className="text-red-600">*</span>
 </label>
 <textarea
 name="shippingAddress"
 value={formData.shippingAddress}
 onChange={handleInputChange}
 rows={3}
 className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none transition-colors resize-none ${errors.shippingAddress ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-black"}`}
 placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
 />
 {errors.shippingAddress && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.shippingAddress}
 </p>
 )}
 </div>

 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Tỉnh/Thành phố
 </label>
 <input
 type="text"
 name="city"
 value={formData.city}
 onChange={handleInputChange}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors"
 placeholder="TP. Hồ Chí Minh"
 />
 </div>

 <div>
 <label className="block text-xs font-bold mb-2 text-gray-600">
 Ghi chú (Tùy chọn)
 </label>
 <textarea
 name="notes"
 value={formData.notes}
 onChange={handleInputChange}
 rows={2}
 className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors resize-none"
 placeholder="Yêu cầu đặc biệt về đơn hàng..."
 />
 </div>
 </div>
 </div>

 {/* Phương thức thanh toán */}
 <div className="space-y-6">
 <h2 className="text-sm font-black border-b pb-4 tracking-tight">
 Phương thức thanh toán
 </h2>

 <div className="space-y-3">
 {/* VNPAY */}
 <label
 className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === "VNPAY"
 ? "border-black bg-gray-50"
 : "border-gray-100 hover:border-gray-200"
 }`}
 >
 <input
 type="radio"
 name="paymentMethod"
 value="VNPAY"
 checked={formData.paymentMethod === "VNPAY"}
 onChange={handleInputChange}
 className="w-5 h-5 accent-black"
 />
 <CreditCard className="w-6 h-6 text-blue-600" />
 <div className="flex-1">
 <p className="font-black text-sm tracking-tight">
 VNPay
 </p>
 <p className="text-xs text-gray-500 font-medium">
 Thanh toán qua cổng VNPay
 </p>
 </div>
 {formData.paymentMethod === "VNPAY" && (
 <Check className="w-5 h-5 text-black" />
 )}
 </label>

 {/* COD */}
 <label
 className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethod === "COD"
 ? "border-black bg-gray-50"
 : "border-gray-100 hover:border-gray-200"
 }`}
 >
 <input
 type="radio"
 name="paymentMethod"
 value="COD"
 checked={formData.paymentMethod === "COD"}
 onChange={handleInputChange}
 className="w-5 h-5 accent-black"
 />
 <Wallet className="w-6 h-6 text-green-600" />
 <div className="flex-1">
 <p className="font-black text-sm tracking-tight">
 Thanh toán khi nhận hàng
 </p>
 <p className="text-xs text-gray-500 font-medium">
 Thanh toán bằng tiền mặt khi nhận hàng
 </p>
 </div>
 {formData.paymentMethod === "COD" && (
 <Check className="w-5 h-5 text-black" />
 )}
 </label>
 </div>
 </div>
 </div>

 {/* ORDER SUMMARY (RIGHT) */}
 <div className="lg:col-span-5">
 <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl border border-gray-100 space-y-6 lg:sticky lg:top-24 xl:top-32">
 <h2 className="text-sm font-black tracking-tight">
 Đơn hàng ({cart?.items?.length || 0} sản phẩm)
 </h2>

 {/* Items */}
 <div className="space-y-4 max-h-64 overflow-y-auto">
 {cart?.items?.map((item) => (
 <div key={item.id} className="flex gap-3">
 <div className="w-16 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-gray-100">
 <img
 src={
 item.variant.product.images[0] ||
 "https://via.placeholder.com/100"
 }
 alt={item.variant.product.name}
 className="w-full h-full object-contain mix-blend-multiply"
 />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[11px] font-black tracking-tight truncate">
 {item.variant.product.name}
 </p>
 <p className="text-[9px] text-gray-500 font-bold">
 Size: {item.variant.size} | SL: {item.quantity}
 </p>
 <p className="text-xs font-black italic mt-1">
 {(item.variant.price * item.quantity).toLocaleString(
 "vi-VN"
 )}{" "}
 VNĐ
 </p>
 </div>
 </div>
 ))}
 </div>

 <div className="h-[1px] bg-gray-200"></div>

 {/* Total */}
 <div className="space-y-3">
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
 <div className="h-[1px] bg-gray-200"></div>
 <div className="flex justify-between items-end">
 <span className="text-sm font-black">
 Tổng cộng
 </span>
 <span className="text-xl font-black italic text-red-600 tabular-nums">
 {calculateTotal().toLocaleString("vi-VN")} VNĐ
 </span>
 </div>
 </div>

 {/* Submit Button */}
 <button
 type="submit"
 disabled={submitting}
 className="w-full bg-black text-white py-5 rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
 >
 {submitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Đang xử lý...
 </>
 ) : (
 <>
 {formData.paymentMethod === "VNPAY"
 ? "Thanh toán VNPAY"
 : "Đặt hàng"}
 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 </form>
 </div>
 );
}
