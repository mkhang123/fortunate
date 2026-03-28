import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import api from "../apis/axiosConfig";
import {
    CheckCircle2,
    XCircle,
    Package,
    ChevronRight,
    Loader2,
    CreditCard,
    MapPin,
    Phone,
    Mail,
} from "lucide-react";
import toast from "react-hot-toast";

export default function OrderConfirmation() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        fetchOrder();
    }, [orderId, location.search]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            if (user) {
                const res = await api.get(`/orders/${orderId}`);
                setOrder(res.data.metadata);
                return;
            }

            const params = new URLSearchParams(location.search);
            const emailFromUrl = (params.get("email") || "").trim();
            const phoneFromUrl = (params.get("phone") || "").trim();
            const lookup = JSON.parse(localStorage.getItem("guestOrderLookup") || "{}");
            const effectiveLookup = emailFromUrl && phoneFromUrl
                ? { orderId, email: emailFromUrl, phone: phoneFromUrl }
                : lookup;

            if (
                !effectiveLookup?.orderId ||
                Number(effectiveLookup.orderId) !== Number(orderId) ||
                !effectiveLookup?.email ||
                !effectiveLookup?.phone
            ) {
                toast.error("Không thể xác thực đơn hàng khách");
                navigate("/");
                return;
            }

            const res = await api.get(`/orders/guest/${orderId}`, {
                params: {
                    email: effectiveLookup.email,
                    phone: effectiveLookup.phone,
                },
            });
            setOrder(res.data.metadata);
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
            toast.error("Không thể tải thông tin đơn hàng");
            navigate("/");
        } finally {
            setLoading(false);
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
            PENDING: "Chờ thanh toán",
            PAID: "Đã thanh toán",
            SHIPPED: "Đang giao hàng",
            COMPLETED: "Hoàn thành",
            CANCELLED: "Đã hủy",
        };
        return texts[status] || status;
    };

    const isSuccess = order.status === "PAID" || order.status === "COMPLETED";

    return (
        <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
            {/* BREADCRUMB */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-12">
                <Link to="/" className="hover:text-black">
                    Trang chủ
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-black">Xác nhận đơn hàng</span>
            </nav>

            {/* Success/Error Header */}
            <div className="text-center mb-12">
                {isSuccess ? (
                    <>
                        <CheckCircle2 className="w-20 h-20 mx-auto mb-6 text-green-600" />
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
                            Đặt hàng thành công!
                        </h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                            Mã đơn hàng: #{order.id}
                        </p>
                    </>
                ) : (
                    <>
                        <XCircle className="w-20 h-20 mx-auto mb-6 text-yellow-600" />
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
                            Đơn hàng đang chờ xử lý
                        </h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                            Mã đơn hàng: #{order.id}
                        </p>
                    </>
                )}
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* Order Status */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                Trạng thái đơn hàng
                            </p>
                            <span
                                className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(
                                    order.status
                                )}`}
                            >
                                {getStatusText(order.status)}
                            </span>
                        </div>
                        {order.payment && (
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                                    Thanh toán
                                </p>
                                <span
                                    className={`inline-block px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border ${order.payment.status === "SUCCESS"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : order.payment.status === "FAILED"
                                            ? "bg-red-100 text-red-800 border-red-200"
                                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        }`}
                                >
                                    {order.payment.method} -{" "}
                                    {order.payment.status === "SUCCESS"
                                        ? "Thành công"
                                        : order.payment.status === "FAILED"
                                            ? "Thất bại"
                                            : "Chờ thanh toán"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Thông tin giao hàng
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p className="font-bold">{order.receiverName}</p>
                            <p className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-3 h-3" />
                                {order.receiverPhone}
                            </p>
                            <p className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-3 h-3" />
                                {order.receiverEmail}
                            </p>
                            <p className="text-gray-600 pt-2">
                                {order.shippingAddress}
                                {order.city && `, ${order.city}`}
                            </p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Thông tin thanh toán
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Phương thức:</span>
                                <span className="font-bold">{order.payment?.method}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng tiền:</span>
                                <span className="font-black text-lg italic text-red-600">
                                    {order.total.toLocaleString("vi-VN")} VNĐ
                                </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>Ngày đặt:</span>
                                <span>
                                    {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Sản phẩm ({order.items?.length || 0})
                    </h3>
                    <div className="space-y-4">
                        {order.items?.map((item) => (
                            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                                <div className="w-20 h-24 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100">
                                    <img
                                        src={
                                            item.variant.product.images[0] ||
                                            "https://via.placeholder.com/100"
                                        }
                                        alt={item.variant.product.name}
                                        className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-black text-sm uppercase tracking-tight mb-1">
                                        {item.variant.product.name}
                                    </p>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">
                                        Size: {item.variant.size} | Số lượng: {item.quantity}
                                    </p>
                                    <p className="font-black italic mt-2">
                                        {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-2">
                            Ghi chú
                        </h3>
                        <p className="text-sm text-gray-700">{order.notes}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <Link
                        to={user ? "/my-orders" : "/"}
                        className="flex-1 bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center hover:bg-gray-800 transition-all"
                    >
                        {user ? "Quản lý đơn hàng" : "Về trang chủ"}
                    </Link>
                    <Link
                        to="/clothes"
                        className="flex-1 bg-gray-100 text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-center hover:bg-gray-200 transition-all"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>
            </div>
        </div>
    );
}
