import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; 
import { Star, Search, X, ChevronDown } from 'lucide-react'; 

export default function Featured() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // 1. Thêm State để lưu trữ lựa chọn sắp xếp
  const [sortOption, setSortOption] = useState("featured"); // Mặc định là 'featured' (theo lượt yêu thích)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // 2. Gửi cả searchTerm và sortOption lên API
        // URL ví dụ: /products/featured?search=abc&sort=price_asc
        const res = await api.get(`/products/featured?search=${searchTerm}&sort=${sortOption}`);
        setProducts(res.data.data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchFeatured();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, sortOption]); // Chạy lại mỗi khi từ khóa tìm kiếm hoặc kiểu lọc thay đổi

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      {/* HEADER & THANH CÔNG CỤ (TÌM KIẾM + LỌC) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-widest uppercase italic text-black">NỔI BẬT</h1>
          <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">HOT</span>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto items-center">
          {/* 3. BỘ LỌC SẮP XẾP MINIMALIST */}
          <div className="relative w-full md:w-48 group">
            <select
              className="w-full border-b border-gray-300 py-2 pl-1 pr-8 outline-none focus:border-black transition-all duration-300 bg-transparent text-sm appearance-none cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="featured">Phổ biến nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="name_asc">Tên: A - Z</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-1 top-2.5 text-gray-400 pointer-events-none group-hover:text-black transition-colors" />
          </div>

          {/* THANH TÌM KIẾM */}
          <div className="relative w-full md:w-72 group">
            <input
              type="text"
              placeholder="Tìm sản phẩm hot..."
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
      </div>
      
      {/* HIỂN THỊ DANH SÁCH (Giữ nguyên phần render của bạn) */}
      {loading && products.length === 0 ? (
          <div className="text-center py-20 text-gray-400 animate-pulse">Đang tìm kiếm sản phẩm...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded-sm shadow-sm">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm border border-gray-100">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product._count?.wishlists || 0} {/* Đổi favorites thành wishlists cho khớp repository của bạn */}
                </div>
              </div>
              
              <h3 className="text-sm font-semibold uppercase mb-1 tracking-tight group-hover:underline">{product.name}</h3>
              <p className="text-sm text-gray-900 font-bold">
                {product.variants?.[0]?.price?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
          {searchTerm 
            ? `Không tìm thấy sản phẩm nổi bật nào khớp với "${searchTerm}"` 
            : "Chưa có sản phẩm nào có lượt yêu thích."}
        </div>
      )}
    </div>
  );
}