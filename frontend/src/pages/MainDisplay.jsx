import React from 'react';
import { Link } from 'react-router-dom';
import { MoveRight, ArrowRight, Smartphone } from 'lucide-react';

export default function MainDisplay() {
 const styleCollections = [
 {
 name: "Basic",
 image:
 "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80",
 clothingTypes: ["Áo thun", "Áo sơ mi", "Quần dài", "Quần ngắn"],
 },
 {
 name: "Street",
 image:
 "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&q=80",
 clothingTypes: ["Áo khoác", "Áo thun oversize", "Quần cargo", "Hoodie"],
 },
 {
 name: "Sport",
 image:
 "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80",
 clothingTypes: ["Áo jersey", "Áo tank", "Quần short thể thao", "Quần jogger"],
 },
 ];

 return (
 <div className="bg-white">
 {/* 1. HERO SECTION - ĐÃ FIX CỨNG ẢNH TĨNH */}
 <section className="relative min-h-[70svh] h-[85vh] md:h-[90vh] w-full overflow-hidden group">
 <img 
 src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80" 
 alt="Fortunate Seasonal Banner" 
 className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105"
 />
 {/* Overlay phủ đen nhẹ để nổi bật chữ */}
 <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white px-4 sm:px-6 text-center">
 <h2 className="text-[9px] sm:text-[10px] md:text-xs font-bold tracking-[0.35em] sm:tracking-[0.6em] mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom duration-700">
 Fortunate New Generation 2026
 </h2>
 <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black italic tracking-tighter mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom duration-1000 max-w-full">
 Fortunate
 </h1>
 <Link 
 to="/clothes" 
 className="bg-white text-black px-8 py-3.5 sm:px-12 sm:py-4 text-[10px] font-black tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-2xl active:scale-95"
 >
 Mua sắm ngay
 </Link>
 </div>
 </section>

 {/* 2. COLLECTION GRID - BỘ SƯU TẬP THEO PHONG CÁCH */}
 <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-12 gap-4 border-b border-gray-100 pb-8">
 <div>
 <h2 className="text-3xl sm:text-4xl font-black italic tracking-tighter">Collections</h2>
 <p className="text-[10px] text-gray-400 tracking-widest mt-2">
 Chọn bộ sưu tập theo phong cách thời trang
 </p>
 </div>
 <Link to="/clothes" className="text-[11px] font-bold tracking-widest border-b-2 border-black pb-1 hover:pr-6 transition-all">
 Xem tất cả sản phẩm
 </Link>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 {styleCollections.map((collection) => (
 <Link
 key={collection.name}
 to={`/clothes?style=${encodeURIComponent(collection.name)}`}
 className="relative h-[min(520px,70svh)] sm:h-[420px] md:h-[480px] lg:h-[520px] overflow-hidden group rounded-sm"
 >
 <img
 src={collection.image}
 className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110"
 alt={`${collection.name} Collection`}
 />
 <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-8 transition-all group-hover:from-black/85">
 <h3 className="text-2xl sm:text-3xl md:text-4xl font-black italic text-white mb-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
 {collection.name}
 </h3>
 <p className="text-[10px] tracking-[0.25em] text-white/85 mb-4">
 {collection.clothingTypes.join(" • ")}
 </p>
 <div className="flex items-center text-white text-[10px] font-black tracking-[0.25em] gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
 Khám phá ngay <MoveRight className="w-4 h-4" />
 </div>
 </div>
 </Link>
 ))}
 </div>

 <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
 {styleCollections.map((collection) => (
 <div key={`${collection.name}-tags`} className="border border-gray-100 rounded-lg p-4">
 <h4 className="text-xs font-black tracking-widest mb-2">{collection.name}</h4>
 <p className="text-[11px] text-gray-500 leading-relaxed">
 Gợi ý loại quần áo: {collection.clothingTypes.join(", ")}.
 </p>
 </div>
 ))}
 </div>
 </section>

 {/* 3. VIRTUAL TRY-ON CALLOUT - TRỌNG TÂM LUẬN VĂN */}
 <section className="bg-black py-16 sm:py-24 md:py-32 overflow-hidden relative">
 {/* Đồ họa trang trí trừu tượng cho cảm giác AI */}
 <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-red-600/10 rounded-full blur-[120px]" />
 
 <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
 <div className="flex justify-center mb-10">
 <div className="p-5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
 <Smartphone className="w-10 h-10 text-white stroke-[1.5]" />
 </div>
 </div>
 <h2 className="text-2xl sm:text-4xl md:text-6xl font-black italic text-white tracking-tighter mb-6 sm:mb-10 leading-tight px-1">
 Trải nghiệm <span className="text-red-600">Thử đồ ảo AI</span>
 <br />
 Đột phá công nghệ
 </h2>
 <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-8 sm:mb-12 max-w-2xl mx-auto font-medium tracking-wide">
 Không còn nỗi lo về kích cỡ hay kiểu dáng không phù hợp. Với thuật toán AI thông minh, 
 FORTUNATE cho phép bạn mô phỏng trang phục trên chính cơ thể mình chỉ qua một tấm ảnh.
 </p>
 <Link to="/clothes" className="inline-flex items-center gap-3 text-[11px] font-black tracking-[0.3em] text-white border border-white/20 px-10 py-5 hover:bg-white hover:text-black transition-all">
 Trải nghiệm AI Fitting <ArrowRight className="w-4 h-4" />
 </Link>
 </div>
 </section>

 {/* 4. FOOTER BRANDING */}
 <section className="py-24 text-center bg-white">
 <h2 className="text-[10px] font-black tracking-[1em] text-gray-200 mb-6">
 Fortunate Clothing Co.
 </h2>
 <div className="h-[1px] w-20 bg-gray-100 mx-auto mb-6" />
 <p className="text-[9px] text-gray-400 italic tracking-widest font-bold">
 Established 2026 — Can Tho City, VN
 </p>
 </section>
 </div>
 );
}