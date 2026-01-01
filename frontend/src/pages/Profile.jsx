import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig"; // Đảm bảo đường dẫn này đúng với cấu hình của bạn

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Gọi API lấy thông tin người dùng hiện tại
        const res = await api.get("/users/me");
        setProfile(res.data.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin", err);
        setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center p-10 text-red-500 font-semibold">{error}</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      {/* Tiêu đề và Tên hiển thị nổi bật */}
      <div className="flex items-center gap-6 mb-10 border-b pb-8">
        <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold uppercase shadow-lg">
          {profile?.name?.charAt(0) || "U"}
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            {profile?.name}
          </h1>
          <p className="text-gray-500 font-medium">{profile?.email}</p>
          <span className="mt-2 inline-block px-3 py-1 bg-gray-100 text-[10px] font-bold tracking-widest uppercase rounded">
            {profile?.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Khối thông tin cơ bản */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-gray-400">
            Thông tin tài khoản
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Họ và tên
              </p>
              <p className="font-semibold text-gray-800">{profile?.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Địa chỉ Email
              </p>
              <p className="font-semibold text-gray-800">{profile?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">
                Ngày gia nhập
              </p>
              <p className="font-semibold text-gray-800">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                  : "---"}
              </p>
            </div>
          </div>
        </div>

        {/* Khối số đo cơ thể (Body Profile) */}
        <div className="bg-black text-white p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">
          <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-gray-500">
            Chỉ số cơ thể
          </h2>
          {profile?.bodyProfile ? (
            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Chiều cao
                </p>
                <p className="text-2xl font-black">
                  {profile.bodyProfile.height}{" "}
                  <span className="text-xs font-normal">cm</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Cân nặng
                </p>
                <p className="text-2xl font-black">
                  {profile.bodyProfile.weight}{" "}
                  <span className="text-xs font-normal">kg</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Vòng ngực
                </p>
                <p className="text-xl font-bold">
                  {profile.bodyProfile.chest || "--"}{" "}
                  <span className="text-xs font-normal text-gray-500">cm</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">
                  Vòng eo
                </p>
                <p className="text-xl font-bold">
                  {profile.bodyProfile.waist || "--"}{" "}
                  <span className="text-xs font-normal text-gray-500">cm</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-gray-400 italic text-sm mb-6 uppercase tracking-tight">
                Chưa có thông tin số đo. Cập nhật ngay để nhận gợi ý size chính
                xác!
              </p>
            </div>
          )}

          <button className="w-full mt-4 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
            Cập nhật chỉ số
          </button>
        </div>
      </div>
    </div>
  );
}
