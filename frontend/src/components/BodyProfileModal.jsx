import React, { useState, useEffect } from "react";
import api from "../apis/axiosConfig";
import toast from "react-hot-toast";

const FIELDS = [
  { key: "height", label: "Chiều cao (cm)", placeholder: "VD: 165", required: true },
  { key: "weight", label: "Cân nặng (kg)",  placeholder: "VD: 55",  required: true },
  { key: "chest",  label: "Vòng ngực (cm)", placeholder: "VD: 86",  required: false },
  { key: "waist",  label: "Vòng eo (cm)",   placeholder: "VD: 68",  required: false },
  { key: "hip",    label: "Vòng hông (cm)", placeholder: "VD: 90",  required: false },
];

export default function BodyProfileModal({ onComplete }) {
  const [form, setForm] = useState({ height: "", weight: "", chest: "", waist: "", hip: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Khoá scroll trang khi modal mở
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.height || isNaN(form.height) || Number(form.height) <= 0)
      errs.height = "Vui lòng nhập chiều cao hợp lệ";
    if (!form.weight || isNaN(form.weight) || Number(form.weight) <= 0)
      errs.weight = "Vui lòng nhập cân nặng hợp lệ";
    ["chest", "waist", "hip"].forEach((key) => {
      if (form[key] !== "" && (isNaN(form[key]) || Number(form[key]) <= 0))
        errs[key] = "Giá trị phải là số dương";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { height: Number(form.height), weight: Number(form.weight) };
      if (form.chest !== "") payload.chest = Number(form.chest);
      if (form.waist !== "") payload.waist = Number(form.waist);
      if (form.hip   !== "") payload.hip   = Number(form.hip);
      await api.put("/users/me/body-profile", payload);
      toast.success("Cập nhật chỉ số thành công!");
      onComplete();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header — giống Profile.jsx Modal nhưng không có nút X */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Cập nhật chỉ số cơ thể
          </h3>
          {/* Không có nút đóng — bắt buộc phải điền */}
        </div>

        {/* Mô tả */}
        <div className="px-6 pt-5 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 leading-relaxed">
            Vui lòng nhập thông tin cơ thể để Fortunate gợi ý size chính xác hơn cho bạn.{" "}
            <span className="text-red-500">Chiều cao và cân nặng là bắt buộc.</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
          {FIELDS.map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form[key]}
                onChange={(e) => {
                  setForm({ ...form, [key]: e.target.value });
                  if (errors[key]) setErrors({ ...errors, [key]: "" });
                }}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none transition-colors ${
                  errors[key]
                    ? "border-red-400 bg-red-50/30 focus:border-red-400"
                    : "border-gray-200 focus:border-black"
                }`}
                placeholder={placeholder}
              />
              {errors[key] && (
                <p className="mt-1 text-[10px] font-bold text-red-500">{errors[key]}</p>
              )}
            </div>
          ))}

          {/* Chỉ có nút Lưu — không có nút Huỷ */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
