import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig";
import toast from "react-hot-toast";

// ─── Modal khung chung ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Component chính ─────────────────────────────────────────────────────────
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Trạng thái modal chỉnh sửa thông tin cơ bản
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: "", phone: "" });
  const [infoSaving, setInfoSaving] = useState(false);

  // Trạng thái modal chỉnh sửa số đo cơ thể
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [bodyForm, setBodyForm] = useState({
    height: "",
    weight: "",
    chest: "",
    waist: "",
    hip: "",
  });
  const [bodySaving, setBodySaving] = useState(false);

  // ── Lấy thông tin profile ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
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

  // ── Mở modal chỉnh sửa thông tin ─────────────────────────────────────────
  const openInfoModal = () => {
    // Điền sẵn dữ liệu hiện tại vào form
    setInfoForm({ name: profile?.name || "", phone: profile?.phone || "" });
    setShowInfoModal(true);
  };

  // ── Lưu thông tin cơ bản ──────────────────────────────────────────────────
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    try {
      const res = await api.put("/users/me", infoForm);
      // Cập nhật state profile ngay lập tức, không cần fetch lại
      setProfile((prev) => ({ ...prev, ...res.data.data }));
      setShowInfoModal(false);
      toast.success("Cập nhật thông tin thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setInfoSaving(false);
    }
  };

  // ── Mở modal số đo cơ thể ─────────────────────────────────────────────────
  const openBodyModal = () => {
    const bp = profile?.bodyProfile;
    setBodyForm({
      height: bp?.height ?? "",
      weight: bp?.weight ?? "",
      chest: bp?.chest ?? "",
      waist: bp?.waist ?? "",
      hip: bp?.hip ?? "",
    });
    setShowBodyModal(true);
  };

  // ── Lưu số đo cơ thể ──────────────────────────────────────────────────────
  const handleSaveBody = async (e) => {
    e.preventDefault();
    setBodySaving(true);
    try {
      const res = await api.put("/users/me/body-profile", bodyForm);
      // Cập nhật bodyProfile trong state
      setProfile((prev) => ({ ...prev, bodyProfile: res.data.data }));
      setShowBodyModal(false);
      toast.success("Cập nhật số đo thành công!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật số đo");
    } finally {
      setBodySaving(false);
    }
  };

  // ── Loading / Error States ─────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );

  if (error)
    return <div className="text-center p-10 text-red-500 font-semibold">{error}</div>;

  // ── Giao diện chính ────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-6 mb-10 border-b pb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold uppercase shadow-lg">
            {profile?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">
              {profile?.name}
            </h1>
            <p className="text-gray-500 font-medium">{profile?.email}</p>
            {profile?.phone && (
              <p className="text-gray-400 text-sm mt-1">{profile.phone}</p>
            )}
            <span className="mt-2 inline-block px-3 py-1 bg-gray-100 text-[10px] font-bold tracking-widest uppercase rounded">
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Nút chỉnh sửa thông tin */}
        <button
          onClick={openInfoModal}
          className="px-5 py-2.5 border-2 border-black text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-black hover:text-white transition-all"
        >
          Chỉnh sửa thông tin
        </button>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Thông tin tài khoản */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-gray-400">
            Thông tin tài khoản
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Họ và tên</p>
              <p className="font-semibold text-gray-800">{profile?.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Địa chỉ Email</p>
              <p className="font-semibold text-gray-800">{profile?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Số điện thoại</p>
              <p className="font-semibold text-gray-800">{profile?.phone || "---"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Ngày gia nhập</p>
              <p className="font-semibold text-gray-800">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                  : "---"}
              </p>
            </div>
          </div>
        </div>

        {/* Chỉ số cơ thể */}
        <div className="bg-black text-white p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">
          <h2 className="text-xs font-black mb-6 uppercase tracking-[0.2em] text-gray-500">
            Chỉ số cơ thể
          </h2>
          {profile?.bodyProfile ? (
            <div className="grid grid-cols-2 gap-y-6">
              {[
                { label: "Chiều cao", val: profile.bodyProfile.height, unit: "cm" },
                { label: "Cân nặng", val: profile.bodyProfile.weight, unit: "kg" },
                { label: "Vòng ngực", val: profile.bodyProfile.chest, unit: "cm" },
                { label: "Vòng eo", val: profile.bodyProfile.waist, unit: "cm" },
                { label: "Vòng hông", val: profile.bodyProfile.hip, unit: "cm" },
              ].map(({ label, val, unit }) => (
                <div key={label}>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">{label}</p>
                  <p className="text-xl font-bold">
                    {val || "--"}
                    <span className="text-xs font-normal text-gray-500"> {unit}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4">
              <p className="text-gray-400 italic text-sm mb-6 uppercase tracking-tight">
                Chưa có thông tin số đo. Cập nhật ngay để nhận gợi ý size chính xác!
              </p>
            </div>
          )}

          <button
            onClick={openBodyModal}
            className="w-full mt-6 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cập nhật chỉ số
          </button>
        </div>
      </div>

      {/* ── Modal: Chỉnh sửa thông tin cơ bản ── */}
      {showInfoModal && (
        <Modal title="Chỉnh sửa thông tin" onClose={() => setShowInfoModal(false)}>
          <form onSubmit={handleSaveInfo} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={infoForm.name}
                onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                placeholder="Nhập họ và tên"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={infoForm.phone}
                onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase rounded-lg hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={infoSaving}
                className="flex-1 py-2.5 bg-black text-white text-xs font-black uppercase rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {infoSaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal: Cập nhật số đo ── */}
      {showBodyModal && (
        <Modal title="Cập nhật chỉ số cơ thể" onClose={() => setShowBodyModal(false)}>
          <form onSubmit={handleSaveBody} className="space-y-4">
            {[
              { key: "height", label: "Chiều cao (cm)", placeholder: "VD: 165" },
              { key: "weight", label: "Cân nặng (kg)", placeholder: "VD: 55" },
              { key: "chest", label: "Vòng ngực (cm)", placeholder: "VD: 86" },
              { key: "waist", label: "Vòng eo (cm)", placeholder: "VD: 68" },
              { key: "hip", label: "Vòng hông (cm)", placeholder: "VD: 90" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={bodyForm[key]}
                  onChange={(e) => setBodyForm({ ...bodyForm, [key]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBodyModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase rounded-lg hover:bg-gray-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={bodySaving}
                className="flex-1 py-2.5 bg-black text-white text-xs font-black uppercase rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
              >
                {bodySaving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
