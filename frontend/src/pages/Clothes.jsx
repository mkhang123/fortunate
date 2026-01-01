import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig';
import { Link } from 'react-router-dom';

export default function Clothes() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.data); // Lấy mảng products từ response
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8 italic uppercase tracking-tighter">Tất cả sản phẩm</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-3 relative">
              {/* Hiển thị ảnh đầu tiên từ mảng images */}
              <img 
                src={product.images?.[0]?.url || 'https://via.placeholder.com/300x400'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <h3 className="text-sm font-medium uppercase">{product.name}</h3>
            {/* Lấy giá từ biến thể (variant) đầu tiên */}
            <p className="text-sm text-gray-500 font-bold">
               {product.variants?.[0]?.price.toLocaleString()}đ
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}