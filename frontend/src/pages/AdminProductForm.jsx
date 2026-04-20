import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../apis/axiosConfig";
import { Plus, Trash2, X } from "lucide-react";

export default function AdminProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "ADMIN";

  const isEditing = Boolean(id);
  const productFromState = location.state?.product || null;

  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    brandName: "",
    categoryId: "",
    price: "",
    stock: "",
    style: "Basic",
    imageUrl: "",
    variants: [],
  });

  // Helper cho biến thể
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { size: "", stock: 0 }],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: newVariants }));
  };

  const titleText = useMemo(
    () => (isEditing ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm"),
    [isEditing]
  );

  const createSlug = (name) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  const mapProductToForm = (p) => {
    const existingImage = Array.isArray(p.images) ? p.images[0] : "";
    setImagePreview(existingImage);
    setFormData({
      name: p.name || "",
      brandName: p.brand?.name || "",
      categoryId: p.categoryId || "",
      price: p.price || p.variants?.[0]?.price || "",
      stock: p.variants?.[0]?.stock || "",
      style: p.variants?.[0]?.color || "Basic",
      imageUrl: existingImage,
      variants: p.variants || [],
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRes = await api.get("/categories");
        const catData = catRes.data?.data || [];
        setCategories(catData);
        if (!isEditing && catData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId: prev.categoryId || catData[0].id,
            // Khởi tạo size mặc định cho sản phẩm mới
            variants: prev.variants.length > 0 ? prev.variants : [
              { size: "S", stock: 0 },
              { size: "M", stock: 0 },
              { size: "L", stock: 0 },
              { size: "XL", stock: 0 },
            ]
          }));
        }
      } catch (err) {
        toast.error("Không thể tải danh mục");
      }
    };

    fetchCategories();
  }, [isEditing]);

  useEffect(() => {
    const fetchProductForEdit = async () => {
      if (!isEditing) return;

      if (productFromState) {
        mapProductToForm(productFromState);
        return;
      }

      setIsLoadingProduct(true);
      try {
        // Backend chưa có API lấy sản phẩm theo ID, nên tải danh sách rồi tìm theo id.
        const res = await api.get("/products");
        const products = res.data?.data || [];
        const matched = products.find((item) => String(item.id) === String(id));
        if (!matched) {
          toast.error("Không tìm thấy sản phẩm để chỉnh sửa");
          navigate("/admin/products");
          return;
        }
        mapProductToForm(matched);
      } catch (err) {
        toast.error("Không thể tải dữ liệu sản phẩm");
        navigate("/admin/products");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProductForEdit();
  }, [id, isEditing, navigate, productFromState]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setIsUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append("image", file);
      const res = await api.post("/upload/image", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const cloudUrl = res.data?.data?.url;
      setFormData((prev) => ({ ...prev, imageUrl: cloudUrl }));
      toast.success("Upload ảnh thành công!");
    } catch (err) {
      toast.error("Upload ảnh thất bại, bạn có thể nhập URL thủ công");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        slug: createSlug(formData.name),
        status: isAdmin ? "PUBLISHED" : "DRAFT",
        categoryId: Number(formData.categoryId),
        brandName: formData.brandName?.trim() || undefined,
        price: Number(formData.price),
        images: formData.imageUrl
          ? [formData.imageUrl]
          : ["https://via.placeholder.com/150"],
        variants: formData.variants.map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          color: formData.style || "Basic",
          size: v.size,
          price: Number(formData.price),
          stock: Number(v.stock),
        })),
      };

      if (isEditing) {
        await api.patch(`/products/${id}`, payload);
        toast.success(
          isAdmin ? "Cập nhật thành công" : "Đã gửi lại sản phẩm để chờ admin duyệt"
        );
      } else {
        await api.post("/products", payload);
        toast.success(
          isAdmin ? "Thêm sản phẩm thành công" : "Tạo sản phẩm thành công, đang chờ admin duyệt"
        );
      }

      navigate("/admin/products");
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(`${errorData.errors[0].message}`);
      } else if (errorData?.message) {
        toast.error(errorData.message);
      } else {
        toast.error("Lỗi thao tác dữ liệu.");
      }
    }
  };

  if (isLoadingProduct) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto font-sans">
          <p className="text-gray-500 font-semibold">Đang tải dữ liệu sản phẩm...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8 max-w-7xl mx-auto font-sans">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold tracking-widest text-gray-800">
            {titleText}
          </h1>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 text-xs font-bold rounded border border-gray-300 hover:bg-gray-50"
          >
            Quay lại
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-black tracking-wider text-gray-700 mb-4">
              Thông tin cơ bản
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Tên sản phẩm"
                value={formData.name}
                className="border p-2.5 rounded focus:ring-1 focus:ring-black outline-none"
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                placeholder="Thương hiệu (ví dụ adidas, nike)"
                value={formData.brandName}
                className="border p-2.5 rounded focus:ring-1 focus:ring-black outline-none"
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              />
              <select
                className="border p-2.5 rounded bg-white cursor-pointer"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                placeholder="Phong cách (ví dụ Basic, Street, Classic...)"
                value={formData.style}
                className="border p-2.5 rounded focus:ring-1 focus:ring-black outline-none"
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-black tracking-wider text-gray-700 mb-4">
              Hình ảnh sản phẩm
            </h2>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center gap-2 border border-dashed border-gray-400 px-4 py-2.5 rounded hover:border-black transition-all whitespace-nowrap text-sm font-semibold text-gray-700">
                <span>{isUploading ? "Đang upload..." : "Chọn ảnh"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
              </label>
              <input
                placeholder="Hoặc nhập URL ảnh"
                value={formData.imageUrl}
                className="flex-1 border p-2.5 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value });
                  setImagePreview(e.target.value);
                }}
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-14 h-14 object-cover rounded border shadow-sm flex-shrink-0"
                />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-black tracking-wider text-gray-700 mb-4">
              Giá niêm yết
            </h2>
            <input
              type="number"
              placeholder="Giá (VNĐ)"
              value={formData.price}
              className="w-full border p-2.5 rounded focus:ring-1 focus:ring-black outline-none"
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black tracking-wider text-gray-700">
                Biến thể (Kích thước & Số lượng)
              </h2>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-[10px] font-black tracking-widest text-blue-600 hover:text-blue-800 uppercase transition-colors"
              >
                <Plus className="w-3 h-3" /> Thêm biến thể
              </button>
            </div>

            <div className="space-y-3">
              {formData.variants.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">Chưa có biến thể nào. Nhấn "+ Thêm biến thể" để bắt đầu.</p>
              ) : (
                formData.variants.map((v, idx) => (
                  <div key={idx} className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex-1 relative">
                      <input
                        placeholder="Size (S, M, L, XL, 39, 40...)"
                        value={v.size}
                        className="w-full border p-2.5 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                        onChange={(e) => updateVariant(idx, "size", e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-32 relative">
                      <input
                        type="number"
                        placeholder="Kho"
                        value={v.stock}
                        className="w-full border p-2.5 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                        onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Xóa biến thể"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-black tracking-wider text-gray-700 mb-4">
              Hành động
            </h2>
            <div className="flex flex-col md:flex-row gap-2">
              <button
                type="submit"
                className={`text-white font-bold p-3 flex-1 rounded transition-all shadow-md ${isEditing ? "bg-blue-600 hover:bg-blue-700" : "bg-black hover:bg-gray-800"
                  }`}
              >
                {isEditing ? "Lưu thay đổi" : "Tạo sản phẩm"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="bg-gray-200 text-black font-bold p-3 px-8 rounded hover:bg-gray-300 transition-all shadow-sm"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
