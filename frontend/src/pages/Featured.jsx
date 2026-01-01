import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig'; // Sử dụng axiosConfig
import { Star } from 'lucide-react'; // Thêm icon ngôi sao nếu muốn

export default function Featured() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Gọi API lấy sản phẩm nổi bật nhất
        const res = await api.get('/products/featured');
        setProducts(res.data.data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return <div className="text-center p-20 text-gray-500">Đang tìm kiếm sản phẩm nổi bật...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold tracking-widest uppercase italic">NỔI BẬT</h1>
        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">HOT</span>
      </div>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product.id} className="group cursor-pointer">
              <div className="aspect-[3/4] overflow-hidden bg-gray-100 mb-4 relative rounded-sm">
                <img 
                  src={product.images?.[0]?.url || 'https://via.placeholder.com/400x500'} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Hiển thị số lượt yêu thích nhỏ ở góc ảnh */}
                <div className="absolute top-2 right-2 bg-white/80 px-2 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-sm">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {product._count?.favorites || 0}
                </div>
              </div>
              
              <h3 className="text-sm font-semibold uppercase mb-1 tracking-tight">{product.name}</h3>
              <p className="text-sm text-gray-600 font-bold">
                {product.variants?.[0]?.price?.toLocaleString()}đ
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          Chưa có sản phẩm nào có lượt yêu thích. Hãy là người đầu tiên!
        </div>
      )}
    </div>
  );
}