import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../apis/axiosConfig";

const GoogleCallback = () => {
 const navigate = useNavigate();

 useEffect(() => {
 const run = async () => {
 const params = new URLSearchParams(window.location.search);
 const userRaw = params.get("user");
 const error = params.get("error");

 if (error || !userRaw) {
 toast.error("Đăng nhập Google thất bại. Vui lòng thử lại!");
 navigate("/login");
 return;
 }

 try {
 const user = JSON.parse(decodeURIComponent(userRaw));
 localStorage.setItem("user", JSON.stringify(user));
 toast.success(`Chào mừng ${user.name || "bạn"}!`);
 try {
 const meRes = await api.get("/users/me");
 if (!meRes.data.data?.bodyProfile) {
 localStorage.setItem("needsBodyProfile", "1");
 } else {
 localStorage.removeItem("needsBodyProfile");
 }
 } catch {
 }

 window.location.href = "/";
 } catch {
 toast.error("Đã có lỗi xảy ra. Vui lòng thử lại!");
 navigate("/login");
 }
 };
 run();
 }, [navigate]);

 return (
 <div className="min-h-screen bg-white flex items-center justify-center">
 <div className="text-center space-y-4">
 <Loader2 className="w-8 h-8 animate-spin mx-auto text-black" />
 <p className="text-xs font-bold tracking-widest text-gray-500">
 Đang xử lý đăng nhập...
 </p>
 </div>
 </div>
 );
};

export default GoogleCallback;
