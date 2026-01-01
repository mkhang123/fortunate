// fortunate/frontend/src/pages/Sneaker.jsx
import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; // Sử dụng instance axios đã cấu hình
import { Link } from 'react-router-dom';

export default function Sneaker() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSneakers = async () => {
      try {
        // Gọi API lấy toàn bộ sản phẩm
        const res = await api.get('/products');
        
        // Lọc sản phẩm thuộc danh mục "Giày dép"
        // Bạn có thể lọc theo name hoặc categoryId tùy vào dữ liệu trong Database
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
    fetchSneakers();
  }, []);

  if (loading) return <div className="text-center p-20 text-gray-500">Đang tải danh sách giày dép...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold mb-8 tracking-widest uppercase italic">GIÀY DÉP</h1>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              {/* Khung ảnh sản phẩm */}
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay khi hover giống phong cách tối giản */}
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Thông tin sản phẩm */}
              <h3 className="text-sm font-semibold uppercase mb-1 tracking-tight">{product.name}</h3>
              <p className="text-sm text-gray-600 font-bold">
                {product.variants?.[0]?.price?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg">
          Hiện chưa có sản phẩm giày dép nào được cập nhật.
        </div>
      )}
    </div>
  );
}