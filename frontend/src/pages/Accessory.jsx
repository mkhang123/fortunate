import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; // Sử dụng cấu hình axios có token
import { Link } from 'react-router-dom';

export default function Accessory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        // Gọi API lấy tất cả sản phẩm
        const res = await api.get('/products');
        
        // Lọc sản phẩm thuộc danh mục "Phụ kiện"
        // Lưu ý: "Phụ kiện" phải khớp với tên Category bạn lưu trong Database
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
    fetchAccessories();
  }, []);

  if (loading) return <div className="text-center p-20 text-gray-500 italic">Đang tải phụ kiện...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold mb-8 tracking-widest uppercase italic">PHỤ KIỆN</h1>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              {/* Ảnh sản phẩm */}
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded-sm">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
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
          Chưa có phụ kiện nào được cập nhật trong hệ thống.
        </div>
      )}
    </div>
  );
}