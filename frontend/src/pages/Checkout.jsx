import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig";
import { useNavigate } from "react-router-dom";
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

    // Form state
    const [formData, setFormData] = useState({
        receiverName: "",
        receiverPhone: "",
        receiverEmail: "",
        shippingAddress: "",
        city: "",
        notes: "",
        paymentMethod: "VNPAY",
    });

    // Fetch cart on mount
    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
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
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const validateForm = () => {
        const { receiverName, receiverPhone, receiverEmail, shippingAddress } =
            formData;

        if (!receiverName || !receiverPhone || !receiverEmail || !shippingAddress) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(receiverEmail)) {
            toast.error("Email không hợp lệ");
            return false;
        }

        // Validate phone (Vietnamese phone format)
        const phoneRegex = /^(0|\+84)[0-9]{9}$/;
        if (!phoneRegex.test(receiverPhone.replace(/\s/g, ""))) {
            toast.error("Số điện thoại không hợp lệ");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setSubmitting(true);

            // Create order
            const orderResponse = await api.post("/orders", formData);
            const { order, requiresPayment, paymentMethod } =
                orderResponse.data.metadata;

            console.log("Order created:", order);
            toast.success(`Đơn hàng #${order.id} đã được tạo`);

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
        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
            {/* BREADCRUMB */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-12">
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

            <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-12">
                Thanh toán
            </h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* FORM (LEFT) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Thông tin người nhận */}
                        <div className="space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] border-b pb-4">
                                Thông tin người nhận
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
                                        Họ và tên <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="receiverName"
                                        value={formData.receiverName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors"
                                        placeholder="Nguyễn Văn A"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
                                            Số điện thoại <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            name="receiverPhone"
                                            value={formData.receiverPhone}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors"
                                            placeholder="0901234567"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
                                            Email <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            name="receiverEmail"
                                            value={formData.receiverEmail}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors"
                                            placeholder="email@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
                                        Địa chỉ giao hàng <span className="text-red-600">*</span>
                                    </label>
                                    <textarea
                                        name="shippingAddress"
                                        value={formData.shippingAddress}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-black focus:outline-none transition-colors resize-none"
                                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
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
                                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-gray-600">
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
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] border-b pb-4">
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
                                        <p className="font-black text-sm uppercase tracking-tight">
                                            VNPay
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
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
                                        <p className="font-black text-sm uppercase tracking-tight">
                                            Thanh toán khi nhận hàng
                                        </p>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
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
                        <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 space-y-6 sticky top-32">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em]">
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
                                            <p className="text-[11px] font-black uppercase tracking-tight truncate">
                                                {item.variant.product.name}
                                            </p>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">
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
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>Tạm tính</span>
                                    <span className="text-black">
                                        {calculateTotal().toLocaleString("vi-VN")} VNĐ
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>Phí vận chuyển</span>
                                    <span className="text-green-600">MIỄN PHÍ</span>
                                </div>
                                <div className="h-[1px] bg-gray-200"></div>
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        Tổng cộng
                                    </span>
                                    <span className="text-xl font-black italic text-red-600 tracking-tighter">
                                        {calculateTotal().toLocaleString("vi-VN")} VNĐ
                                    </span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-black text-white py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
