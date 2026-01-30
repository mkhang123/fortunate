import React from 'react';
import { Link } from 'react-router-dom';
import { MoveRight, ArrowRight, Smartphone } from 'lucide-react';

export default function MainDisplay() {
  return (
    <div className="bg-white">
      {/* 1. HERO SECTION - ĐÃ FIX CỨNG ẢNH TĨNH */}
      <section className="relative h-[90vh] w-full overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80" 
          alt="Fortunate Seasonal Banner" 
          className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105"
        />
        {/* Overlay phủ đen nhẹ để nổi bật chữ */}
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white px-6">
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.6em] uppercase mb-4 animate-in fade-in slide-in-from-bottom duration-700">
            Fortunate New Generation 2026
          </h2>
          <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom duration-1000">
            Fortunate
          </h1>
          <Link 
            to="/clothes" 
            className="bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-2xl active:scale-95"
          >
            Mua sắm ngay
          </Link>
        </div>
      </section>

      {/* 2. COLLECTION GRID - DANH MỤC TĨNH */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4 border-b border-gray-100 pb-8">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Collections</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-2">Lựa chọn phong cách riêng của bạn</p>
          </div>
          <Link to="/clothes" className="text-[11px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:pr-6 transition-all">
            Xem tất cả sản phẩm
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Box 1: Áo Thun */}
          <Link to="/clothes/ao-thun" className="relative h-[650px] overflow-hidden group rounded-sm">
            <img 
              src="https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" 
              alt="T-Shirts Category"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12 transition-all group-hover:from-black/80">
              <h3 className="text-5xl font-black italic uppercase text-white mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">T-Shirts</h3>
              <div className="flex items-center text-white text-[10px] font-black tracking-[0.3em] gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                KHÁM PHÁ NGAY <MoveRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Box 2: Áo Khoác */}
          <Link to="/clothes/ao-khoac" className="relative h-[650px] overflow-hidden group rounded-sm">
            <img 
              src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover transition-transform duration-[1500ms] group-hover:scale-110" 
              alt="Outerwear Category"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12 transition-all group-hover:from-black/80">
              <h3 className="text-5xl font-black italic uppercase text-white mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">Outerwears</h3>
              <div className="flex items-center text-white text-[10px] font-black tracking-[0.3em] gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                KHÁM PHÁ NGAY <MoveRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. VIRTUAL TRY-ON CALLOUT - TRỌNG TÂM LUẬN VĂN */}
      <section className="bg-black py-32 overflow-hidden relative">
        {/* Đồ họa trang trí trừu tượng cho cảm giác AI */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
        
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center mb-10">
            <div className="p-5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              <Smartphone className="w-10 h-10 text-white stroke-[1.5]" />
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white tracking-tighter mb-10 leading-tight">
            Trải nghiệm <span className="text-red-600">Thử đồ ảo AI</span> <br /> 
            Đột phá công nghệ
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-12 max-w-2xl mx-auto font-medium tracking-wide">
            Không còn nỗi lo về kích cỡ hay kiểu dáng không phù hợp. Với thuật toán AI thông minh, 
            FORTUNATE cho phép bạn mô phỏng trang phục trên chính cơ thể mình chỉ qua một tấm ảnh.
          </p>
          <Link to="/clothes" className="inline-flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white border border-white/20 px-10 py-5 hover:bg-white hover:text-black transition-all">
            TRẢI NGHIỆM AI FITTING <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. FOOTER BRANDING */}
      <section className="py-24 text-center bg-white">
        <h2 className="text-[10px] font-black tracking-[1em] uppercase text-gray-200 mb-6">
          Fortunate Clothing Co.
        </h2>
        <div className="h-[1px] w-20 bg-gray-100 mx-auto mb-6" />
        <p className="text-[9px] text-gray-400 italic uppercase tracking-widest font-bold">
          Established 2026 — Can Tho City, VN
        </p>
      </section>
    </div>
  );
}