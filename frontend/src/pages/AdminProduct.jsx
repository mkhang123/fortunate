import React, { useState, useEffect } from "react";
import api from "../apis/axiosConfig";

export default function AdminProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    color: "",
    size: "",
    imageUrl: "", // Thêm trường URL ảnh vào state
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);
        setProducts(prodRes.data?.data || []);
        const catData = catRes.data?.data || [];
        setCategories(catData);

        if (catData.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: catData[0].id }));
        }
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này không?")) {
      try {
        await api.delete(`/products/${id}`);
        const res = await api.get("/products");
        setProducts(res.data?.data || []);
      } catch (err) {
        alert(err.response?.data?.message || "Lỗi khi xóa sản phẩm");
      }
    }
  };

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        slug: createSlug(formData.name),
        description: "Mô tả sản phẩm mặc định",
        status: "PUBLISHED",
        categoryId: formData.categoryId,
        // THÊM MẢNG ẢNH VÀO PAYLOAD ĐỂ KHỚP VỚI SCHEMA BACKEND
        images: formData.imageUrl 
          ? [{ url: formData.imageUrl, isMain: true }] 
          : [], 
        variants: [
          {
            sku: `SKU-${Date.now()}`,
            color: formData.color || "Basic",
            size: formData.size || "Free",
            price: Number(formData.price),
            stock: Number(formData.stock),
          },
        ],
      };

      await api.post("/products", payload);
      alert("Tạo sản phẩm thành công!");

      const res = await api.get("/products");
      setProducts(res.data?.data || []);

      setFormData({
        name: "",
        categoryId: categories[0]?.id || "",
        price: "",
        stock: "",
        color: "",
        size: "",
        imageUrl: "", // Reset URL ảnh
      });
    } catch (err) {
      const errorData = err.response?.data;
      alert(errorData?.message || "Lỗi khi tạo sản phẩm.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quản lý Sản phẩm (Admin)</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-6 rounded-lg shadow-sm mb-8 bg-gray-50"
      >
        <input
          placeholder="Tên sản phẩm"
          value={formData.name}
          className="border p-2 rounded col-span-2"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        {/* Ô NHẬP URL ẢNH */}
        <input
          placeholder="URL Hình ảnh (http://...)"
          value={formData.imageUrl}
          className="border p-2 rounded col-span-2"
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
        />

        <input
          type="number"
          placeholder="Giá"
          value={formData.price}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Số lượng kho"
          value={formData.stock}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          required
        />
        <input
          placeholder="Mô tả"
          value={formData.description}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
        <input
          placeholder="Kích thước (Size)"
          value={formData.size}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          required
        />

        <button
          type="submit"
          className="bg-black text-white font-bold p-2 col-span-full rounded uppercase tracking-widest"
        >
          Thêm sản phẩm
        </button>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left w-20">Ảnh</th> {/* CỘT ẢNH */}
              <th className="p-3 text-left">Tên sản phẩm</th>
              <th className="p-3 text-left">Giá</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  {/* HIỂN THỊ ẢNH TRONG BẢNG */}
                  <td className="p-3">
                    {p.images && p.images.length > 0 ? (
                      <img 
                        src={p.images.find(img => img.isMain)?.url || p.images[0].url} 
                        alt={p.name} 
                        className="w-12 h-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500">
                        No Alt
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 font-bold text-blue-600">
                    {p.variants?.[0]?.price?.toLocaleString()}đ
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-blue-500 hover:underline mr-4">Sửa</button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(p.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                  Đang tải hoặc chưa có sản phẩm...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}