import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig';
import { Link } from 'react-router-dom';

export default function Clothes() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // 1. Thêm State lưu trữ kiểu sắp xếp
  const [sortOption, setSortOption] = useState("latest"); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // 2. Gửi cả search và sort lên API
        const res = await api.get(`/products?search=${searchTerm}&sort=${sortOption}`);
        setProducts(res.data.data); 
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, sortOption]); // Chạy lại khi search HOẶC sort thay đổi

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold italic uppercase tracking-tighter">
          Tất cả sản phẩm
        </h1>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* 3. BỘ LỌC SẮP XẾP */}
          <div className="relative">
            <select
              className="w-full md:w-48 border-b border-gray-300 py-2 outline-none focus:border-black transition-colors bg-transparent text-sm appearance-none cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="latest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="name_asc">Tên: A - Z</option>
              <option value="name_desc">Tên: Z - A</option>
            </select>
            {/* Icon mũi tên cho select */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
               <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>

          {/* THANH TÌM KIẾM */}
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
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* HIỂN THỊ DANH SÁCH (Giữ nguyên logic của bạn) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} className="group cursor-pointer border p-2 hover:shadow-md transition-shadow">
               {/* Bạn nên bọc ảnh bằng thẻ Link để dẫn tới trang chi tiết sau này */}
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-3 relative">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/300x400'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <h3 className="text-sm font-medium uppercase truncate">{product.name}</h3>
              <p className="text-sm text-gray-500 font-bold">
                 {product.variants?.[0]?.price.toLocaleString()}đ
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-gray-500 italic">
             Không tìm thấy sản phẩm nào phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}