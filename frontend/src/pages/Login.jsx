import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../apis/auth.api";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(formData);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        toast.success("Đăng nhập thành công!");

        // Reload to update navbar
        window.location.href = "/";
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
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
            Đăng nhập vào tài khoản
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
              <span className="bg-white px-4 text-gray-400 font-bold">Hoặc</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-black text-black hover:underline uppercase tracking-wider"
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
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
