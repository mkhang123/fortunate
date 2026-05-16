import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../apis/auth.api";
import { UserPlus, Mail, Lock, User, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const Register = () => {
 const [formData, setFormData] = useState({
 name: "",
 email: "",
 password: "",
 confirmPassword: "",
 });
 const [errors, setErrors] = useState({
 name: "",
 email: "",
 password: "",
 confirmPassword: "",
 });
 const [loading, setLoading] = useState(false);
 const navigate = useNavigate();

 const validate = () => {
 const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
 let isValid = true;

 if (!formData.name.trim()) {
 newErrors.name = "Vui lòng nhập họ và tên!";
 isValid = false;
 }

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
 } else if (formData.password.length < 6) {
 newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự!";
 isValid = false;
 }

 if (!formData.confirmPassword) {
 newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu!";
 isValid = false;
 } else if (formData.password !== formData.confirmPassword) {
 newErrors.confirmPassword = "Mật khẩu nhập lại không khớp!";
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
 const response = await registerUser({
 name: formData.name,
 email: formData.email,
 password: formData.password,
 });

 if (response.data.success) {
 toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
 navigate("/login");
 }
 } catch (error) {
 toast.error(
 error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!"
 );
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12">
 <div className="w-full max-w-md">
 <div className="text-center mb-12">
 <Link
 to="/"
 className="text-4xl font-black italic tracking-tighter hover:opacity-70 transition-opacity inline-block"
 >
 FORTUNATE
 </Link>
 <p className="mt-3 text-[10px] font-bold tracking-[0.3em] text-gray-500">
 Tạo tài khoản mới
 </p>
 </div>
 <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
 <form onSubmit={handleSubmit} className="space-y-5" noValidate>
 <div>
 <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
 Họ và tên
 </label>
 <div className="relative">
 <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${
 errors.name
 ? "border-red-400 focus:border-red-400"
 : "border-gray-200 focus:border-black"
 }`}
 placeholder="Nguyễn Văn A"
 value={formData.name}
 onChange={(e) => handleChange("name", e.target.value)}
 />
 </div>
 {errors.name && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.name}
 </p>
 )}
 </div>
 <div>
 <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
 Email
 </label>
 <div className="relative">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="email"
 className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${
 errors.email
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
 <div>
 <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
 Mật khẩu
 </label>
 <div className="relative">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="password"
 className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${
 errors.password
 ? "border-red-400 focus:border-red-400"
 : "border-gray-200 focus:border-black"
 }`}
 placeholder="Ít nhất 6 ký tự"
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
 <div>
 <label className="block text-[10px] font-black tracking-[0.2em] mb-2 text-gray-700">
 Xác nhận mật khẩu
 </label>
 <div className="relative">
 <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="password"
 className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none transition-colors text-sm ${
 errors.confirmPassword
 ? "border-red-400 focus:border-red-400"
 : "border-gray-200 focus:border-black"
 }`}
 placeholder="Nhập lại mật khẩu"
 value={formData.confirmPassword}
 onChange={(e) => handleChange("confirmPassword", e.target.value)}
 />
 </div>
 {errors.confirmPassword && (
 <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
 <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
 {errors.confirmPassword}
 </p>
 )}
 </div>
 <button
 type="submit"
 disabled={loading}
 className="w-full bg-black text-white py-4 rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
 >
 {loading ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin" />
 Đang xử lý...
 </>
 ) : (
 <>
 <UserPlus className="w-4 h-4" />
 Đăng ký ngay
 </>
 )}
 </button>
 </form>
 <div className="relative my-8">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-gray-100"></div>
 </div>
 <div className="relative flex justify-center text-[9px] tracking-widest">
 <span className="bg-white px-4 text-gray-400 font-bold">
 Hoặc
 </span>
 </div>
 </div>
 <div className="text-center">
 <p className="text-xs text-gray-600">
 Đã có tài khoản?{" "}
 <Link
 to="/login"
 className="font-black text-black hover:underline tracking-wider"
 >
 Đăng nhập tại đây
 </Link>
 </p>
 </div>
 </div>
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

export default Register;
