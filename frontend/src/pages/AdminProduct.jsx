import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../apis/axiosConfig";
import { toast } from "react-hot-toast";

export default function AdminProduct() {
 const navigate = useNavigate();
 const currentUser = JSON.parse(localStorage.getItem("user") || "null");
 const isAdmin = currentUser?.role === "ADMIN";
 const isCreator = currentUser?.role === "CREATOR";

 const [products, setProducts] = useState([]);
 const [categories, setCategories] = useState([]);
 const [categoryForm, setCategoryForm] = useState({
 name: "",
 image: "",
 displayOrder: 0,
 isActive: true,
 });
 const [isCategoryEditing, setIsCategoryEditing] = useState(false);
 const [categoryEditId, setCategoryEditId] = useState(null);
 const [isCategorySaving, setIsCategorySaving] = useState(false);
 const [productViewFilter, setProductViewFilter] = useState("all");

 const fetchProducts = async () => {
 const params = {};
 if (isAdmin && productViewFilter === "pending") {
 params.status = "DRAFT";
 }
 const res = await api.get("/products", { params });
 setProducts(res.data?.data || []);
 };

 const fetchCategories = async () => {
 const catRes = await api.get("/categories");
 const catData = catRes.data?.data || [];
 setCategories(catData);
 };

 useEffect(() => {
 const fetchData = async () => {
 try {
 await Promise.all([fetchProducts(), fetchCategories()]);
 } catch (err) {
 console.error("Lỗi khi lấy dữ liệu:", err);
 }
 };
 fetchData();
 }, [productViewFilter]);

 const handleEdit = (p) => {
 navigate(`/admin/products/form/${p.id}`, { state: { product: p } });
 };

 const handleDelete = async (id) => {
 await api.delete(`/products/${id}`);
 setProducts(products.filter((p) => p.id !== id));
 toast.success("Đã xóa sản phẩm");
 };

 const handleApproveProduct = async (id) => {
 try {
 await api.patch(`/products/${id}/approve`);
 toast.success("Đã duyệt sản phẩm");
 await fetchProducts();
 } catch (err) {
 toast.error(err.response?.data?.message || "Không thể duyệt sản phẩm");
 }
 };

 const handleRejectProduct = async (id) => {
 try {
 await api.patch(`/products/${id}/reject`);
 toast.success("Đã từ chối sản phẩm");
 await fetchProducts();
 } catch (err) {
 toast.error(err.response?.data?.message || "Không thể từ chối sản phẩm");
 }
 };

 const statusLabelMap = {
 DRAFT: "Chờ duyệt",
 PUBLISHED: "Đã duyệt",
 REJECTED: "Từ chối",
 ARCHIVED: "Lưu trữ",
 OUT_OF_STOCK: "Hết hàng",
 };

 const statusClassMap = {
 DRAFT: "bg-yellow-100 text-yellow-700",
 PUBLISHED: "bg-green-100 text-green-700",
 REJECTED: "bg-red-100 text-red-700",
 ARCHIVED: "bg-slate-200 text-slate-700",
 OUT_OF_STOCK: "bg-gray-200 text-gray-600",
 };

 const resetCategoryForm = () => {
 setCategoryForm({
 name: "",
 image: "",
 displayOrder: 0,
 isActive: true,
 });
 setIsCategoryEditing(false);
 setCategoryEditId(null);
 };

 const handleCategoryEdit = (category) => {
 setIsCategoryEditing(true);
 setCategoryEditId(category.id);
 setCategoryForm({
 name: category.name || "",
 image: category.image || "",
 displayOrder: category.displayOrder ?? 0,
 isActive: category.isActive ?? true,
 });
 };

 const handleCategorySubmit = async (e) => {
 e.preventDefault();
 setIsCategorySaving(true);
 try {
 const payload = {
 name: categoryForm.name.trim(),
 image: categoryForm.image.trim() || undefined,
 displayOrder: Number(categoryForm.displayOrder) || 0,
 isActive: categoryForm.isActive,
 };

 if (isCategoryEditing && categoryEditId) {
 await api.patch(`/categories/${categoryEditId}`, payload);
 toast.success("Cập nhật danh mục thành công");
 } else {
 await api.post("/categories", payload);
 toast.success("Tạo danh mục thành công");
 }

 await fetchCategories();
 resetCategoryForm();
 } catch (err) {
 toast.error(err.response?.data?.message || "Không thể lưu danh mục");
 } finally {
 setIsCategorySaving(false);
 }
 };

 const handleCategoryDelete = async (id) => {
 try {
 await api.delete(`/categories/${id}`);
 toast.success("Đã xóa danh mục");
 await fetchCategories();
 } catch (err) {
 toast.error(err.response?.data?.message || "Không thể xóa danh mục");
 }
 };

 return (
 <main className="flex-1 overflow-auto">
 <div className="p-8 max-w-7xl mx-auto font-sans">
 <div className="flex items-center justify-between gap-3 mb-6">
 <h1 className="text-2xl font-bold tracking-widest text-gray-800">
 Quản lý Sản phẩm
 </h1>
 <button
 type="button"
 onClick={() => navigate("/admin/products/form")}
 className="bg-black text-white px-4 py-2 text-xs font-bold rounded hover:bg-gray-800 transition-colors"
 >
 Tạo sản phẩm
 </button>
 </div>

 <div className="overflow-hidden border rounded-xl shadow-sm bg-white">
 {isAdmin && (
 <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
 <button
 onClick={() => setProductViewFilter("all")}
 className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-colors ${
 productViewFilter === "all"
 ? "bg-black text-white"
 : "bg-white text-gray-500 border border-gray-200"
 }`}
 >
 Tất cả
 </button>
 <button
 onClick={() => setProductViewFilter("pending")}
 className={`px-3 py-1.5 text-[11px] font-bold rounded-full transition-colors ${
 productViewFilter === "pending"
 ? "bg-black text-white"
 : "bg-white text-gray-500 border border-gray-200"
 }`}
 >
 Chờ duyệt
 </button>
 </div>
 )}
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b">
 <tr>
 <th className="p-4 text-left font-semibold text-gray-600">Ảnh</th>
 <th className="p-4 text-left font-semibold text-gray-600">
 Sản phẩm
 </th>
 <th className="p-4 text-left font-semibold text-gray-600">
 Thương hiệu
 </th>
 <th className="p-4 text-left font-semibold text-gray-600">
 Giá niêm yết
 </th>
 <th className="p-4 text-center font-semibold text-gray-600">
 Trạng thái
 </th>
 <th className="p-4 text-center font-semibold text-gray-600">
 Thao tác
 </th>
 </tr>
 </thead>
 <tbody>
 {products.map((p) => (
 <tr
 key={p.id}
 className="border-b last:border-0 hover:bg-gray-50 transition-colors"
 >
 <td className="p-4">
 <img
 src={p.images?.[0] || "https://via.placeholder.com/50"}
 onError={(e) => {
 e.target.src =
 "https://via.placeholder.com/50?text=No+Image";
 }}
 alt=""
 className="w-12 h-12 object-cover rounded shadow-sm border"
 />
 </td>
 <td className="p-4 font-medium text-gray-700">{p.name}</td>
 <td className="p-4 text-gray-600 font-semibold ">
 {p.brand?.name || "---"}
 </td>
 <td className="p-4 text-blue-600 font-bold">
 {(p.price || p.variants?.[0]?.price || 0).toLocaleString()}₫
 </td>
 <td className="p-4 text-center">
 <span
 className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
 statusClassMap[p.status] || "bg-gray-100 text-gray-600"
 }`}
 >
 {statusLabelMap[p.status] || p.status}
 </span>
 </td>
 <td className="p-4 text-center">
 <button
 onClick={() => handleEdit(p)}
 className="text-blue-600 font-bold mr-4 hover:underline"
 >
 Sửa
 </button>
 <button
 onClick={() => handleDelete(p.id)}
 className="text-red-500 font-bold hover:underline"
 >
 Xóa
 </button>
 {isAdmin && p.status === "DRAFT" && (
 <>
 <button
 onClick={() => handleApproveProduct(p.id)}
 className="text-green-600 font-bold ml-4 hover:underline"
 >
 Duyệt
 </button>
 <button
 onClick={() => handleRejectProduct(p.id)}
 className="text-orange-600 font-bold ml-4 hover:underline"
 >
 Từ chối
 </button>
 </>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
 <form
 onSubmit={handleCategorySubmit}
 className="lg:col-span-1 border rounded-xl shadow-sm bg-white p-5 space-y-4"
 >
 <h2 className="text-sm font-black tracking-wider">
 {isCategoryEditing ? "Sửa danh mục" : "Tạo danh mục"}
 </h2>

 <input
 value={categoryForm.name}
 onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
 placeholder="Tên danh mục"
 className="w-full border p-2 rounded text-sm"
 required
 />

 <input
 value={categoryForm.image}
 onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
 placeholder="URL ảnh (tùy chọn)"
 className="w-full border p-2 rounded text-sm"
 />

 <input
 type="number"
 min="0"
 value={categoryForm.displayOrder}
 onChange={(e) =>
 setCategoryForm({ ...categoryForm, displayOrder: e.target.value })
 }
 placeholder="Thứ tự hiển thị"
 className="w-full border p-2 rounded text-sm"
 />

 <label className="flex items-center gap-2 text-sm text-gray-700">
 <input
 type="checkbox"
 checked={categoryForm.isActive}
 onChange={(e) =>
 setCategoryForm({ ...categoryForm, isActive: e.target.checked })
 }
 />
 Kích hoạt danh mục
 </label>

 <div className="flex gap-2">
 <button
 type="submit"
 disabled={isCategorySaving}
 className="flex-1 bg-black text-white font-bold text-xs rounded p-2.5 hover:bg-gray-800 transition-colors disabled:opacity-60"
 >
 {isCategorySaving
 ? "Đang lưu..."
 : isCategoryEditing
 ? "Lưu thay đổi"
 : "Tạo danh mục"}
 </button>
 {isCategoryEditing && (
 <button
 type="button"
 onClick={resetCategoryForm}
 className="px-4 bg-gray-200 text-black font-bold text-xs rounded p-2.5 hover:bg-gray-300 transition-colors"
 >
 Hủy
 </button>
 )}
 </div>
 </form>

 <div className="lg:col-span-2 overflow-hidden border rounded-xl shadow-sm bg-white">
 <div className="px-5 py-4 border-b bg-gray-50">
 <h2 className="text-sm font-black tracking-wider">
 Danh sách danh mục
 </h2>
 </div>
 <table className="w-full text-sm">
 <thead className="border-b">
 <tr>
 <th className="p-3 text-left font-semibold text-gray-600">Tên</th>
 <th className="p-3 text-left font-semibold text-gray-600">Slug</th>
 <th className="p-3 text-center font-semibold text-gray-600">Thứ tự</th>
 <th className="p-3 text-center font-semibold text-gray-600">Trạng thái</th>
 <th className="p-3 text-center font-semibold text-gray-600">Thao tác</th>
 </tr>
 </thead>
 <tbody>
 {categories.map((cat) => (
 <tr key={cat.id} className="border-b last:border-0 hover:bg-gray-50">
 <td className="p-3 font-medium text-gray-800">{cat.name}</td>
 <td className="p-3 text-gray-500">{cat.slug}</td>
 <td className="p-3 text-center text-gray-700">{cat.displayOrder ?? 0}</td>
 <td className="p-3 text-center">
 <span
 className={`text-[10px] font-bold px-2 py-1 rounded-full ${cat.isActive
 ? "bg-green-100 text-green-700"
 : "bg-gray-100 text-gray-500"
 }`}
 >
 {cat.isActive ? "Hoạt động" : "Ẩn"}
 </span>
 </td>
 <td className="p-3 text-center">
 <button
 onClick={() => handleCategoryEdit(cat)}
 className="text-blue-600 font-bold mr-4 hover:underline"
 >
 Sửa
 </button>
 <button
 onClick={() => handleCategoryDelete(cat.id)}
 className="text-red-500 font-bold hover:underline"
 >
 Xóa
 </button>
 </td>
 </tr>
 ))}
 {categories.length === 0 && (
 <tr>
 <td colSpan={5} className="p-6 text-center text-gray-400 font-semibold">
 Chưa có danh mục nào
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </main>
 );
}
