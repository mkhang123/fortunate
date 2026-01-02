// fortunate/frontend/src/pages/Sneaker.jsx
import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; 
import { Search, X } from 'lucide-react'; // Sử dụng icon để giao diện chuyên nghiệp hơn

export default function Sneaker() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(""); // 1. State cho từ khóa tìm kiếm

  useEffect(() => {
    const fetchSneakers = async () => {
      try {
        // 2. Gọi API kèm tham số search để lọc từ Backend
        const res = await api.get(`/products?search=${searchTerm}`);
        
        // 3. Lọc sản phẩm thuộc danh mục "Giày dép" hoặc "sneaker" từ kết quả trả về
        const sneakerList = res.data.data.filter(
          (p) => p.category?.name === "Giày dép" || p.category?.slug === "sneaker"
        );
        
        setProducts(sneakerList);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách giày dép:", err);
      } finally {
        setLoading(false);
      }
    };

    // 4. Kỹ thuật Debounce: Đợi 500ms sau khi ngừng gõ mới gọi API
    const delayDebounceFn = setTimeout(() => {
      fetchSneakers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // Chạy lại mỗi khi searchTerm thay đổi

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      {/* HEADER & THANH TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <h1 className="text-2xl font-bold tracking-widest uppercase italic">GIÀY DÉP</h1>

        {/* Ô TÌM KIẾM RIÊNG CHO SNEAKER */}
        <div className="relative w-full md:w-80 group">
          <input
            type="text"
            placeholder="Tìm mẫu giày bạn thích..."
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
      
      {loading && products.length === 0 ? (
        <div className="text-center p-20 text-gray-400 animate-pulse">Đang tìm kiếm sản phẩm...</div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded-sm">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <h3 className="text-sm font-semibold uppercase mb-1 tracking-tight group-hover:underline">{product.name}</h3>
              <p className="text-sm text-gray-600 font-bold">
                {product.variants?.[0]?.price?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg">
          {searchTerm 
            ? `Không tìm thấy mẫu giày nào khớp với "${searchTerm}"` 
            : "Hiện chưa có sản phẩm giày dép nào được cập nhật."}
        </div>
      )}
    </div>
  );
}