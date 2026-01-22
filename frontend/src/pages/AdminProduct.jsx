import React, { useState, useEffect } from "react";
import api from "../apis/axiosConfig";
import { toast } from "react-hot-toast";

export default function AdminProduct() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    stock: "",
    color: "Basic",
    size: "FREE SIZE",
    imageUrl: "",
    description: "",
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
    await api.delete(`/products/${id}`);
    const res = await api.get("/products");
    setProducts(res.data?.data || []);
    toast.success("Đã xóa sản phẩm");
  };

  const handleEdit = (p) => {
    setIsEditing(true);
    setEditId(p.id);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      price: p.variants?.[0]?.price || "",
      stock: p.variants?.[0]?.stock || "",
      color: p.variants?.[0]?.color || "Basic",
      size: p.variants?.[0]?.size || "FREE SIZE",
      imageUrl: p.images?.[0]?.url || "",
      description: p.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({
      name: "",
      categoryId: categories[0]?.id || "",
      price: "",
      stock: "",
      color: "Basic",
      size: "FREE SIZE",
      imageUrl: "",
      description: "",
    });
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
      const defaultSizes = ["S", "M", "L", "XL"];

      const payload = {
        name: formData.name,
        slug: createSlug(formData.name),
        description: formData.description || "Mô tả sản phẩm mặc định",
        status: "PUBLISHED",
        categoryId: Number(formData.categoryId),
        images: formData.imageUrl
          ? [{ url: formData.imageUrl, isMain: true }]
          : [{ url: "https://via.placeholder.com/150", isMain: true }],

        variants: defaultSizes.map((s) => ({
          sku: `SKU-${s}-${Date.now()}`,
          color: "Basic",
          size: s,
          price: Number(formData.price),
          stock: Number(formData.stock),
        })),
      };

      if (isEditing) {
        await api.patch(`/products/${editId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      const res = await api.get("/products");
      setProducts(res.data?.data || []);
      cancelEdit();
      toast.success(
        isEditing ? "Cập nhật thành công" : "Thêm sản phẩm thành công",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi thao tác.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? "Chỉnh sửa sản phẩm" : "Quản lý Sản phẩm (Admin)"}
      </h1>

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

        <input
          placeholder="URL Hình ảnh (http://...)"
          value={formData.imageUrl}
          className="border p-2 rounded col-span-2"
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
        />

        {/* Ô CHỌN DANH MỤC */}
        <select
          className="border p-2 rounded bg-white font-medium"
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          required
        >
          <option value="" disabled>
            -- Chọn danh mục --
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

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
          className="border p-2 rounded col-span-full md:col-span-3"
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          required
        />

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            className={`${isEditing ? "bg-blue-600" : "bg-black"} text-white font-bold p-2 flex-1 rounded uppercase tracking-widest`}
          >
            {isEditing ? "Lưu thay đổi" : "Thêm sản phẩm"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-400 text-white font-bold p-2 px-6 rounded uppercase tracking-widest"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left w-20">Ảnh</th>
              <th className="p-3 text-left">Tên sản phẩm</th>
              <th className="p-3 text-left">Giá</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={
                          p.images.find((img) => img.isMain)?.url ||
                          p.images[0].url
                        }
                        alt=""
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
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-blue-500 hover:underline mr-4"
                    >
                      Sửa
                    </button>
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
                <td
                  colSpan="4"
                  className="p-10 text-center text-gray-400 italic"
                >
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
