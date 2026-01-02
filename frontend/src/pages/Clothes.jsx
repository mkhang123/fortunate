import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig';
import { Link } from 'react-router-dom';

export default function Clothes() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // 1. State lưu từ khóa tìm kiếm

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 2. Gửi searchTerm lên API để lọc sản phẩm từ Database
        const res = await api.get(`/products?search=${searchTerm}`);
        setProducts(res.data.data); 
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
      }
    };

    // 3. Kỹ thuật Debounce: Đợi khách hàng ngừng gõ 500ms mới gọi server
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]); // Chạy lại mỗi khi searchTerm thay đổi

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold italic uppercase tracking-tighter">
          Tất cả sản phẩm
        </h1>

        {/* 4. THANH TÌM KIẾM CHO KHÁCH HÀNG */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full border-b border-gray-300 py-2 pl-2 pr-10 outline-none focus:border-black transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute right-2 top-2.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* HIỂN THỊ DANH SÁCH */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-3 relative">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/300x400'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-sm font-medium uppercase">{product.name}</h3>
              <p className="text-sm text-gray-500 font-bold">
                 {product.variants?.[0]?.price.toLocaleString()}đ
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 italic">
            {searchTerm 
              ? `Không tìm thấy sản phẩm nào phù hợp với "${searchTerm}"` 
              : "Đang tải sản phẩm..."}
          </div>
        )}
      </div>
    </div>
  );
}