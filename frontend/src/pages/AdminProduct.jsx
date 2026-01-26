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
    imageUrl: "",
    variants: [], // Lưu trữ variants cũ để lấy ID khi update
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

      // Xử lý variants khác nhau cho CREATE vs EDIT
      const payload = {
        name: formData.name,
        slug: createSlug(formData.name),
        status: "PUBLISHED",
        categoryId: Number(formData.categoryId),
        brandId: null,
        price: Number(formData.price),
        images: formData.imageUrl
          ? [formData.imageUrl]
          : ["https://via.placeholder.com/150"],
        variants: isEditing
          ? // Khi EDIT: Cập nhật tất cả variants hiện có
          formData.variants?.map((v) => ({
            id: v.id, // Giữ nguyên ID để update
            color: formData.color || "Basic",
            size: v.size, // Giữ nguyên size cũ
            price: Number(formData.price),
            stock: Number(formData.stock),
          })) || []
          : // Khi CREATE: Tạo mới 4 sizes mặc định
          defaultSizes.map((s) => ({
            color: formData.color || "Basic",
            size: s,
            price: Number(formData.price),
            stock: Number(formData.stock),
          })),
      };

      if (isEditing) {
        await api.patch(`/products/${editId}`, payload);
        toast.success("Cập nhật thành công");
      } else {
        await api.post("/products", payload);
        toast.success("Thêm sản phẩm thành công");
      }

      const res = await api.get("/products");
      setProducts(res.data?.data || []);
      cancelEdit();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(`${errorData.errors[0].message}`);
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("Lỗi thao tác dữ liệu.");
      }
      console.error("Chi tiết lỗi hệ thống:", errorData);
    }
  };

  const handleEdit = (p) => {
    setIsEditing(true);
    setEditId(p.id);
    setFormData({
      name: p.name,
      categoryId: p.categoryId,
      price: p.price || p.variants?.[0]?.price || "",
      stock: p.variants?.[0]?.stock || "",
      color: p.variants?.[0]?.color || "Basic",
      imageUrl: Array.isArray(p.images) ? p.images[0] : "",
      variants: p.variants || [], // Lưu lại mảng variants để lấy ID trong handleSubmit
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
      imageUrl: "",
      variants: [],
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/products/${id}`);
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Đã xóa sản phẩm");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6 uppercase tracking-widest text-gray-800">
        {isEditing ? "Chỉnh sửa sản phẩm" : "Quản lý Sản phẩm"}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 border p-6 rounded-lg shadow-sm mb-8 bg-white"
      >
        <input
          placeholder="Tên sản phẩm"
          value={formData.name}
          className="border p-2 rounded col-span-2 focus:ring-1 focus:ring-black outline-none"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <input
          placeholder="URL Hình ảnh"
          value={formData.imageUrl}
          className="border p-2 rounded col-span-2 focus:ring-1 focus:ring-black outline-none"
          onChange={(e) =>
            setFormData({ ...formData, imageUrl: e.target.value })
          }
        />

        <select
          className="border p-2 rounded bg-white cursor-pointer"
          value={formData.categoryId}
          onChange={(e) =>
            setFormData({ ...formData, categoryId: e.target.value })
          }
          required
        >
          <option value="" disabled>
            -- Danh mục --
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Giá (VNĐ)"
          value={formData.price}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Kho"
          value={formData.stock}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
          required
        />
        <input
          placeholder="Màu (Basic, Black...)"
          value={formData.color}
          className="border p-2 rounded"
          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          required
        />

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            className={`text-white font-bold p-3 flex-1 rounded uppercase transition-all shadow-md ${isEditing
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-black hover:bg-gray-800"
              }`}
          >
            {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm mới"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-200 text-black font-bold p-3 px-8 rounded uppercase hover:bg-gray-300 transition-all shadow-sm"
            >
              Hủy
            </button>
          )}
        </div>
      </form>

      <div className="overflow-hidden border rounded-xl shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-600">Ảnh</th>
              <th className="p-4 text-left font-semibold text-gray-600">
                Sản phẩm
              </th>
              <th className="p-4 text-left font-semibold text-gray-600">
                Giá niêm yết
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
                <td className="p-4 text-blue-600 font-bold">
                  {(p.price || p.variants?.[0]?.price || 0).toLocaleString()}₫
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
