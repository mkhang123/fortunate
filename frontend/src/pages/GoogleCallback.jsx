import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const GoogleCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const userRaw = params.get("user");
        const error = params.get("error");

        if (error || !accessToken || !userRaw) {
            toast.error("Đăng nhập Google thất bại. Vui lòng thử lại!");
            navigate("/login");
            return;
        }

        try {
            const user = JSON.parse(decodeURIComponent(userRaw));
            localStorage.setItem("token", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("user", JSON.stringify(user));
            toast.success(`Chào mừng ${user.name || "bạn"}!`);
            window.location.href = "/"; // reload để navbar cập nhật
        } catch {
            toast.error("Đã có lỗi xảy ra. Vui lòng thử lại!");
            navigate("/login");
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-black" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Đang xử lý đăng nhập...
                </p>
            </div>
        </div>
    );
};

export default GoogleCallback;
