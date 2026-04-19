import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginUser } from "../apis/auth.api";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../apis/axiosConfig";

const Login = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const error = params.get("error");
        if (error === "account_blocked") {
            toast.error("Tài khoản của bạn đã bị chặn");
        } else if (error === "google_login_failed") {
            toast.error("Đăng nhập Google thất bại. Vui lòng thử lại!");
        }
    }, [location.search]);

    useEffect(() => {
        if (location.state?.message) {
            toast.error(location.state.message, { id: "redirect-message" });
        }
    }, []);

    const validate = () => {
        const newErrors = { email: "", password: "" };
        let isValid = true;

        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email!";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ. Vui lòng kiểm tra lại!";
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu!";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const response = await loginUser(formData);

            if (response.data.success) {
                const user = response.data.user;
                localStorage.setItem("user", JSON.stringify(user));
                toast.success("Đăng nhập thành công!");

                if (user.role === "ADMIN") {
                    window.location.href = "/admin/dashboard";
                } else {
                    // Kiểm tra body profile trước khi chuyển trang
                    try {
                        const meRes = await api.get("/users/me");
                        if (!meRes.data.data?.bodyProfile) {
                            localStorage.setItem("needsBodyProfile", "1");
                        } else {
                            localStorage.removeItem("needsBodyProfile");
                        }
                    } catch {
                        // Bỏ qua lỗi mạng, App.jsx sẽ fallback check sau
                    }
                    const redirectTo = location.state?.from || "/";
                    window.location.href = redirectTo;
                }
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-12">
                    <Link
                        to="/"
                        className="text-4xl font-black italic tracking-tighter hover:opacity-70 transition-opacity inline-block"
                    >
                        FORTUNATE
                    </Link>
                    <p className="mt-3 text-[10px] font-bold tracking-[0.3em] text-gray-500">
                        Đăng nhập vào tài khoản
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        {/* Email Input */}
                        <div>
                            <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="email"
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${errors.email
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-200 focus:border-black"
                                        }`}
                                    placeholder="example@gmail.com"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="password"
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${errors.password
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-200 focus:border-black"
                                        }`}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                                    <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Đăng nhập
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-[9px] tracking-widest">
                            <span className="bg-white px-4 text-gray-400 font-bold">Hoặc</span>
                        </div>
                    </div>

                    {/* Google Login Button */}
                    <button
                        type="button"
                        onClick={() => { window.location.href = "http://localhost:4000/api/auth/google"; }}
                        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-[10px] font-black tracking-[0.2em] text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Tiếp tục với Google
                    </button>

                    {/* Register Link */}
                    <div className="text-center mt-6">
                        <p className="text-xs text-gray-600">
                            Chưa có tài khoản?{" "}
                            <Link
                                to="/register"
                                className="font-black text-black hover:underline tracking-wider"
                            >
                                Đăng ký ngay
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-8">
                    <Link
                        to="/"
                        className="text-[10px] font-bold tracking-[0.2em] text-gray-500 hover:text-black transition-colors"
                    >
                        ← Quay lại trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
