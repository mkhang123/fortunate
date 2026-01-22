import React, { useEffect, useState } from 'react';
import api from '../apis/axiosConfig';
import { Link, useParams } from 'react-router-dom'; // Thay useLocation bằng useParams
import { Search, ChevronDown } from 'lucide-react';

export default function Clothes() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [loading, setLoading] = useState(false);
  
  // Đọc categorySlug từ URL dạng /clothes/:categorySlug
  const { categorySlug } = useParams();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Gửi categorySlug trực tiếp lấy từ useParams()
        const params = {
          search: searchTerm,
          sort: sortOption,
          categorySlug: categorySlug || undefined, 
          status: 'PUBLISHED'
        };

        const res = await api.get('/products', { params });
        setProducts(res.data.data);
      } catch (err) {
        console.error("Lỗi lấy sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, sortOption, categorySlug]); // Lắng nghe categorySlug thay vì location.search

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-3">
            {/* Hiển thị tiêu đề dựa trên slug hiện tại */}
            {categorySlug ? categorySlug.replace('-', ' ') : "Tất cả sản phẩm"}
          </h1>
          <nav className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold">
            <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
            <span className="mx-2">/</span>
            <span className="text-black">Clothes</span>
            {categorySlug && (
              <>
                <span className="mx-2">/</span>
                <span className="text-black uppercase">{categorySlug.replace('-', ' ')}</span>
              </>
            )}
          </nav>
        </div>

        {/* Phần Search và Sort giữ nguyên như cũ */}
        <div className="flex flex-col md:flex-row gap-8 items-center w-full md:w-auto">
          <div className="relative group w-full md:w-56">
            <select
              className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-black transition-all bg-transparent text-[11px] font-black uppercase tracking-[0.2em] appearance-none cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="latest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp - Cao</option>
              <option value="price_desc">Giá: Cao - Thấp</option>
              <option value="name_asc">Tên: A - Z</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-0 top-3 text-gray-400 pointer-events-none group-hover:text-black transition-colors" />
          </div>

          <div className="relative w-full md:w-72 group">
            <input
              type="text"
              placeholder="TÌM KIẾM SẢN PHẨM..."
              className="w-full border-b-2 border-gray-100 py-3 pr-10 outline-none focus:border-black transition-all bg-transparent text-[11px] font-black tracking-[0.2em] uppercase placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-4 w-4 absolute right-0 top-3 text-gray-400 group-focus-within:text-black transition-colors stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Grid sản phẩm giữ nguyên logic render */}
      {loading ? (
        <div className="py-40 text-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
          Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {products.length > 0 ? (
            products.map((product) => (
              <Link 
                key={product.id} 
                to={`/product/${product.slug}`} 
                className="group flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#fcfcfc] mb-6 flex items-center justify-center border border-gray-50 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                  <div className="absolute top-4 left-4 z-10 bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest italic shadow-lg">
                    New Arrival
                  </div>
                  <img 
                    src={product.images?.[0]?.url || 'https://via.placeholder.com/600x800'} 
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 ease-in-out group-hover:scale-110"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-black group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed">
                    {product.name}
                  </h3>
                  <p className="text-[14px] font-black text-gray-900 italic tracking-tighter">
                    {(product.variants?.[0]?.price || 0).toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 uppercase tracking-[0.4em] text-[11px] font-black italic">
                Rất tiếc, không tìm thấy sản phẩm nào.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}