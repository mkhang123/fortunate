import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../apis/axiosConfig";
import toast from "react-hot-toast";
function Modal({ title, onClose, children, titleClassName }) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
 <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
 <h3
 className={
 titleClassName ?? "text-sm font-black tracking-widest text-gray-900"
 }
 >
 {title}
 </h3>
 <button
 type="button"
 onClick={onClose}
 className="text-gray-400 hover:text-gray-700 transition-colors text-2xl leading-none p-1 -mr-1"
 aria-label="Đóng"
 >
 ×
 </button>
 </div>
 <div className="px-6 py-6">{children}</div>
 </div>
 </div>
 );
}
export default function Profile() {
 const [profile, setProfile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [showInfoModal, setShowInfoModal] = useState(false);
 const [infoForm, setInfoForm] = useState({ name: "", phone: "", address: "" });
 const [infoSaving, setInfoSaving] = useState(false);
 const [showBodyModal, setShowBodyModal] = useState(false);
 const [bodyForm, setBodyForm] = useState({
 height: "",
 weight: "",
 chest: "",
 waist: "",
 hip: "",
 });
 const [bodySaving, setBodySaving] = useState(false);
 const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
 const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
 const avatarPreviewUrlRef = useRef(null);
 const avatarModalInputRef = useRef(null);
 const [wishlistItems, setWishlistItems] = useState([]);
 const [wishlistLoading, setWishlistLoading] = useState(true);
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
 useEffect(() => {
 const fetchWishlist = async () => {
 try {
 setWishlistLoading(true);
 const res = await api.get("/wishlist/me");
 setWishlistItems(res.data?.data || []);
 } catch (err) {
 console.error("Lỗi lấy wishlist", err);
 toast.error("Không thể tải danh sách yêu thích");
 } finally {
 setWishlistLoading(false);
 }
 };

 fetchWishlist();
 }, []);

 const handleRemoveWishlist = async (productId) => {
 try {
 await api.post("/wishlist/toggle", { productId });
 setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
 toast.success("Đã xóa khỏi danh sách yêu thích");
 } catch (err) {
 toast.error(err.response?.data?.message || "Không thể xóa sản phẩm yêu thích");
 }
 };

 const revokeAvatarPreview = () => {
 if (avatarPreviewUrlRef.current) {
 URL.revokeObjectURL(avatarPreviewUrlRef.current);
 avatarPreviewUrlRef.current = null;
 }
 setAvatarPreviewUrl(null);
 };
 const openInfoModal = () => {
 revokeAvatarPreview();
 setPendingAvatarFile(null);
 if (avatarModalInputRef.current) avatarModalInputRef.current.value = "";
 setInfoForm({ name: profile?.name || "", phone: profile?.phone || "", address: profile?.address || "" });
 setShowInfoModal(true);
 };

 const closeInfoModal = () => {
 revokeAvatarPreview();
 setPendingAvatarFile(null);
 if (avatarModalInputRef.current) avatarModalInputRef.current.value = "";
 setShowInfoModal(false);
 };
 const handleSaveInfo = async (e) => {
 e.preventDefault();
 setInfoSaving(true);
 try {
 let nextAvatar = profile?.avatar;
 if (pendingAvatarFile) {
 const formData = new FormData();
 formData.append("avatar", pendingAvatarFile);
 const avRes = await api.post("/users/me/avatar", formData, {
 headers: { "Content-Type": "multipart/form-data" },
 });
 nextAvatar = avRes.data.data.avatar;
 }
 const res = await api.put("/users/me", infoForm);
 setProfile((prev) => {
 const nextState = {
 ...prev,
 ...res.data.data,
 avatar: nextAvatar ?? res.data.data?.avatar ?? prev?.avatar,
 };
 const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
 localStorage.setItem("user", JSON.stringify({ ...currentUser, ...nextState }));
 return nextState;
 });
 revokeAvatarPreview();
 setPendingAvatarFile(null);
 if (avatarModalInputRef.current) avatarModalInputRef.current.value = "";
 setShowInfoModal(false);
 toast.success("Cập nhật hồ sơ thành công!");
 } catch (err) {
 toast.error(err.response?.data?.message || "Lỗi khi cập nhật");
 } finally {
 setInfoSaving(false);
 }
 };

 const handleModalAvatarPick = (e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (file.size > 5 * 1024 * 1024) {
 toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
 e.target.value = "";
 return;
 }
 revokeAvatarPreview();
 setPendingAvatarFile(file);
 const url = URL.createObjectURL(file);
 avatarPreviewUrlRef.current = url;
 setAvatarPreviewUrl(url);
 };
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
 const handleSaveBody = async (e) => {
 e.preventDefault();
 setBodySaving(true);
 try {
 const res = await api.put("/users/me/body-profile", bodyForm);
 setProfile((prev) => ({ ...prev, bodyProfile: res.data.data }));
 setShowBodyModal(false);
 toast.success("Cập nhật số đo thành công!");
 } catch (err) {
 toast.error(err.response?.data?.message || "Lỗi khi cập nhật số đo");
 } finally {
 setBodySaving(false);
 }
 };

 useEffect(() => {
 return () => {
 if (avatarPreviewUrlRef.current) {
 URL.revokeObjectURL(avatarPreviewUrlRef.current);
 avatarPreviewUrlRef.current = null;
 }
 };
 }, []);
 if (loading)
 return (
 <div className="flex justify-center items-center h-screen">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
 </div>
 );

 if (error)
 return <div className="text-center p-10 text-red-500 font-semibold">{error}</div>;
 return (
 <div className="max-w-4xl mx-auto p-8 animate-in fade-in duration-500">
 <div className="flex items-center justify-between gap-6 mb-10 border-b pb-8">
 <div className="flex items-center gap-6">
 <div className="shrink-0">
 {profile?.avatar ? (
 <img
 src={profile.avatar}
 alt={profile.name}
 className="w-24 h-24 rounded-full object-cover shadow-lg border-2 border-gray-200"
 />
 ) : (
 <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-lg">
 {profile?.name?.charAt(0) || "U"}
 </div>
 )}
 </div>
 <div>
 <h1 className="text-4xl font-black tracking-tighter italic">
 {profile?.name}
 </h1>
 <p className="text-gray-500 font-medium">{profile?.email}</p>
 {profile?.phone && (
 <p className="text-gray-400 text-sm mt-1">{profile.phone}</p>
 )}
 <span className="mt-2 inline-block px-3 py-1 bg-gray-100 text-[10px] font-bold tracking-widest rounded">
 {profile?.role}
 </span>
 </div>
 </div>
 <button
 onClick={openInfoModal}
 className="px-5 py-2.5 border-2 border-black text-black text-xs font-black tracking-widest rounded-lg hover:bg-black hover:text-white transition-all"
 >
 Chỉnh sửa thông tin
 </button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
 <h2 className="text-xs font-black mb-6 tracking-[0.2em] text-gray-400">
 Thông tin tài khoản
 </h2>
 <div className="space-y-4">
 <div>
 <p className="text-[10px] font-bold text-gray-400">Họ và tên</p>
 <p className="font-semibold text-gray-800">{profile?.name}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-gray-400">Địa chỉ Email</p>
 <p className="font-semibold text-gray-800">{profile?.email}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-gray-400">Số điện thoại</p>
 <p className="font-semibold text-gray-800">{profile?.phone || "---"}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-gray-400">Địa chỉ</p>
 <p className="font-semibold text-gray-800">{profile?.address || "---"}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-gray-400">Ngày gia nhập</p>
 <p className="font-semibold text-gray-800">
 {profile?.createdAt
 ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
 : "---"}
 </p>
 </div>
 </div>
 </div>
 <div className="bg-black text-white p-8 rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">
 <h2 className="text-xs font-black mb-6 tracking-[0.2em] text-gray-500">
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
 <p className="text-[10px] font-bold text-gray-500 mb-1">{label}</p>
 <p className="text-xl font-bold">
 {val || "--"}
 <span className="text-xs font-normal text-gray-500"> {unit}</span>
 </p>
 </div>
 ))}
 </div>
 ) : (
 <div className="py-4">
 <p className="text-gray-400 italic text-sm mb-6 tracking-tight">
 Chưa có thông tin số đo. Cập nhật ngay để nhận gợi ý size chính xác!
 </p>
 </div>
 )}

 <button
 onClick={openBodyModal}
 className="w-full mt-6 py-3 bg-white text-black text-xs font-black tracking-widest rounded-lg hover:bg-gray-200 transition-colors"
 >
 Cập nhật chỉ số
 </button>
 </div>
 </div>
 <div className="mt-10 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
 <div className="flex items-center justify-between mb-6">
 <h2 className="text-xs font-black tracking-[0.2em] text-gray-400">
 Sản phẩm yêu thích
 </h2>
 <span className="text-[10px] font-bold tracking-widest text-gray-500">
 {wishlistItems.length} sản phẩm
 </span>
 </div>

 {wishlistLoading ? (
 <div className="py-12 flex items-center justify-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
 </div>
 ) : wishlistItems.length === 0 ? (
 <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
 <p className="text-sm font-semibold text-gray-500 mb-4">
 Bạn chưa có sản phẩm yêu thích nào.
 </p>
 <Link
 to="/featured"
 className="inline-block px-5 py-2 border border-black text-black text-xs font-black tracking-widest rounded-lg hover:bg-black hover:text-white transition-colors"
 >
 Khám phá sản phẩm
 </Link>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
 {wishlistItems.map((item) => {
 const product = item.product;
 const firstVariant = product?.variants?.[0];
 const basePrice = firstVariant?.price || 0;

 return (
 <div
 key={item.id}
 className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
 >
 <Link to={`/product/${product.slug}`} className="block">
 <div className="aspect-[4/5] bg-gray-100 overflow-hidden p-4">
 <img
 src={product?.images?.[0] || "https://via.placeholder.com/400x500"}
 alt={product?.name}
 className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
 />
 </div>
 </Link>

 <div className="p-4">
 <Link to={`/product/${product.slug}`} className="block">
 <p className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[40px]">
 {product?.name}
 </p>
 </Link>
 <p className="text-sm font-black text-black mt-2">
 {basePrice.toLocaleString("vi-VN")} đ
 </p>

 <div className="mt-4 flex gap-2">
 <Link
 to={`/product/${product.slug}`}
 className="flex-1 text-center py-2 border border-black text-[10px] font-black tracking-wider rounded-lg hover:bg-black hover:text-white transition-colors"
 >
 Xem chi tiết
 </Link>
 <button
 onClick={() => handleRemoveWishlist(product.id)}
 className="px-3 py-2 border border-red-200 text-red-600 text-[10px] font-black tracking-wider rounded-lg hover:bg-red-50 transition-colors"
 >
 Bỏ thích
 </button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 {showInfoModal && (
 <Modal
 title="Chỉnh sửa hồ sơ"
 titleClassName="text-lg font-bold text-gray-900 tracking-tight"
 onClose={closeInfoModal}
 >
 <form onSubmit={handleSaveInfo} className="space-y-6">
 <div className="flex flex-col items-center">
 <button
 type="button"
 disabled={infoSaving}
 onClick={() => avatarModalInputRef.current?.click()}
 className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:opacity-60"
 >
 {avatarPreviewUrl || profile?.avatar ? (
 <img
 src={avatarPreviewUrl || profile.avatar}
 alt=""
 className="w-28 h-28 rounded-full object-cover border-2 border-violet-100 shadow-md"
 />
 ) : (
 <div className="w-28 h-28 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-4xl font-black border-2 border-violet-200/80 shadow-inner">
 {(infoForm.name || profile?.name || "U").trim().charAt(0).toUpperCase() || "U"}
 </div>
 )}
 <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
 <svg
 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow"
 fill="none"
 stroke="currentColor"
 viewBox="0 0 24 24"
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
 />
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 strokeWidth={2}
 d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
 />
 </svg>
 </span>
 </button>
 <input
 ref={avatarModalInputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 className="hidden"
 onChange={handleModalAvatarPick}
 />
 <p className="mt-2 text-xs text-gray-500 font-medium">Ảnh đại diện</p>
 </div>

 <div>
 <label className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5">
 Tên hiển thị <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 value={infoForm.name}
 onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
 placeholder="Nhập tên hiển thị"
 required
 />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5">
 Số điện thoại
 </label>
 <input
 type="tel"
 value={infoForm.phone}
 onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
 placeholder="Nhập số điện thoại"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold text-gray-500 tracking-wider block mb-1.5">
 Địa chỉ
 </label>
 <input
 type="text"
 value={infoForm.address}
 onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
 className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
 placeholder="Nhập địa chỉ"
 />
 </div>

 <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
 <button
 type="button"
 onClick={closeInfoModal}
 className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors py-2"
 >
 Hủy bỏ
 </button>
 <button
 type="submit"
 disabled={infoSaving}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:pointer-events-none"
 >
 <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
 <path d="M17 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
 </svg>
 {infoSaving ? "Đang lưu..." : "Lưu thay đổi"}
 </button>
 </div>
 </form>
 </Modal>
 )}
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
 <label className="text-[10px] font-bold text-gray-400 block mb-1">
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
 className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors"
 >
 Huỷ
 </button>
 <button
 type="submit"
 disabled={bodySaving}
 className="flex-1 py-2.5 bg-black text-white text-xs font-black rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
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
