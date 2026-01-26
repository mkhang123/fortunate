import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig';
import { Search, X } from 'lucide-react';

export default function Accessory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // 1. State cho từ khóa tìm kiếm

  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        // 2. Gọi API lấy sản phẩm kèm tham số tìm kiếm
        const res = await api.get(`/products?search=${searchTerm}`);

        // 3. Lọc sản phẩm thuộc danh mục "Phụ kiện" hoặc slug "accessory"
        const accessoryList = res.data.data.filter(
          (p) => p.category?.name === "Phụ kiện" || p.category?.slug === "accessory"
        );

        setProducts(accessoryList);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phụ kiện:", err);
      } finally {
        setLoading(false);
      }
    };

    // 4. Kỹ thuật Debounce: Đợi người dùng dừng gõ 500ms mới gọi API
    const delayDebounceFn = setTimeout(() => {
      fetchAccessories();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // Chạy lại mỗi khi searchTerm thay đổi

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      {/* HEADER & THANH TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <h1 className="text-2xl font-bold tracking-widest uppercase italic text-black">PHỤ KIỆN</h1>

        {/* THANH TÌM KIẾM MINIMALIST */}
        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder="Tìm phụ kiện (túi, ví, mũ...)"
            className="w-full border-b border-gray-300 py-2 pl-2 pr-10 outline-none focus:border-black transition-all duration-300 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute right-2 top-2.5 flex items-center gap-2">
            {searchTerm && (
              <X
                className="w-4 h-4 text-gray-400 cursor-pointer hover:text-black"
                onClick={() => setSearchTerm("")}
              />
            )}
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
        </div>
      </div>

      {/* HIỂN THỊ DANH SÁCH */}
      {loading && products.length === 0 ? (
        <div className="text-center p-20 text-gray-400 animate-pulse italic">Đang tải phụ kiện...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded-sm shadow-sm">
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/400x500'}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x500?text=No+Image";
                  }}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <h3 className="text-sm font-semibold uppercase mb-1 tracking-tight group-hover:underline">{product.name}</h3>
              <p className="text-sm text-gray-900 font-bold">
                {product.variants?.[0]?.price?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
          {searchTerm
            ? `Không tìm thấy phụ kiện nào khớp với "${searchTerm}"`
            : "Chưa có phụ kiện nào được cập nhật trong hệ thống."}
        </div>
      )}
    </div>
  );
}