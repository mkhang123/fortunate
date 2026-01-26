import React, { useEffect, useState } from "react";
import api from "../apis/axiosConfig";
import { Link } from "react-router-dom";
import { Star, Search, ChevronDown, X } from "lucide-react";

export default function Featured() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("featured");

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        // Gọi API Featured với các tham số lọc
        const res = await api.get(
          `/products/featured?search=${searchTerm}&sort=${sortOption}`
        );
        setProducts(res.data.data);
      } catch (err) {
        console.error("Lỗi khi lấy sản phẩm nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchFeatured();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, sortOption]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-16 py-12 bg-white min-h-screen">
      {/* HEADER & THANH CÔNG CỤ (ĐỒNG BỘ VỚI CLOTHES) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              Nổi bật
            </h1>
            <span className="bg-black text-white text-[8px] font-black px-2 py-1 rounded-sm shadow-sm animate-pulse tracking-widest uppercase italic">
              Hot
            </span>
          </div>
          <nav className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold">
            <Link to="/" className="hover:text-black transition-colors">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <span className="text-black">Popular</span>
          </nav>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-center w-full md:w-auto">
          {/* SORT DROPDOWN */}
          <div className="relative group w-full md:w-56">
            <select
              className="w-full border-b-2 border-gray-100 py-3 outline-none focus:border-black transition-all bg-transparent text-[11px] font-black uppercase tracking-[0.2em] appearance-none cursor-pointer"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="featured">Phổ biến nhất</option>
              <option value="price_asc">Giá: Thấp - Cao</option>
              <option value="price_desc">Giá: Cao - Thấp</option>
              <option value="name_asc">Tên: A - Z</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-0 top-3 text-gray-400 pointer-events-none group-hover:text-black transition-colors" />
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-72 group">
            <input
              type="text"
              placeholder="TÌM SẢN PHẨM HOT..."
              className="w-full border-b-2 border-gray-100 py-3 pr-10 outline-none focus:border-black transition-all bg-transparent text-[11px] font-black tracking-[0.2em] uppercase placeholder:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute right-0 top-3 flex items-center gap-2">
              {searchTerm && (
                <X
                  className="w-4 h-4 text-gray-400 cursor-pointer hover:text-black"
                  onClick={() => setSearchTerm("")}
                />
              )}
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* GRID SẢN PHẨM (ĐỒNG BỘ VỚI CLOTHES) */}
      {loading ? (
        <div className="py-40 text-center text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
          Đang tải dữ liệu nổi bật...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
          {products.length > 0 ? (
            products.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`} // Chuyển hướng tới trang chi tiết dựa vào slug
                className="group flex flex-col"
              >
                {/* KHUNG ẢNH */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#fcfcfc] mb-6 flex items-center justify-center border border-gray-50 shadow-sm transition-all duration-500 group-hover:shadow-xl">
                  {/* Tag HOT theo lượt wishlists */}
                  <div className="absolute top-4 left-4 z-10 bg-black text-white px-2 py-1 text-[8px] font-black uppercase tracking-widest italic shadow-lg flex items-center gap-1">
                    <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                    Hot Trend
                  </div>

                  {/* Lượt yêu thích */}
                  <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-[9px] font-black shadow-sm border border-gray-100">
                    <Star className="w-2.5 h-2.5 fill-black text-black" />
                    {product._count?.wishlists || 0}
                  </div>

                  <img
                    src={
                      product.images?.[0] ||
                      "https://via.placeholder.com/600x800"
                    }
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/600x800?text=No+Image";
                    }}
                    alt={product.name}
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 ease-in-out group-hover:scale-110"
                  />
                </div>

                {/* THÔNG TIN */}
                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-black group-hover:text-red-600 transition-colors line-clamp-2 leading-relaxed">
                    {product.name}
                  </h3>
                  <p className="text-[14px] font-black text-gray-900 italic tracking-tighter">
                    {(product.variants?.[0]?.price || 0).toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 uppercase tracking-[0.4em] text-[11px] font-black italic">
                {searchTerm
                  ? `Không tìm thấy sản phẩm nổi bật nào khớp với "${searchTerm}"`
                  : "Hiện chưa có sản phẩm nào có lượt yêu thích."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}