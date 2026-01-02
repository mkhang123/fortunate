import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; 
import { Star, Search, X } from 'lucide-react'; // Thêm icon Search và X

export default function Featured() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // 1. State lưu từ khóa tìm kiếm

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // 2. Truyền tham số search vào API featured
        // URL sẽ dạng: /products/featured?search=tên_sản_phẩm
        const res = await api.get(`/products/featured?search=${searchTerm}`);
        setProducts(res.data.data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };

    // 3. Debounce: Đợi 500ms sau khi ngừng gõ mới gọi API để tránh spam server
    const delayDebounceFn = setTimeout(() => {
      fetchFeatured();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // Chạy lại mỗi khi searchTerm thay đổi

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      {/* HEADER & THANH TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-widest uppercase italic text-black">NỔI BẬT</h1>
          <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">HOT</span>
        </div>

        {/* 4. THANH TÌM KIẾM MINIMALIST */}
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
      
      {/* HIỂN THỊ DANH SÁCH */}
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
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product._count?.favorites || 0}
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
        <div className="text-center py-20 text-gray-400 italic bg-gray-50 rounded-lg">
          {searchTerm 
            ? `Không tìm thấy sản phẩm nổi bật nào khớp với "${searchTerm}"` 
            : "Chưa có sản phẩm nào có lượt yêu thích."}
        </div>
      )}
    </div>
  );
}