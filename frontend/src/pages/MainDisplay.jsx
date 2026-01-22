import React from 'react';
import { Link } from 'react-router-dom';
import { MoveRight, ArrowRight, Smartphone } from 'lucide-react';

export default function MainDisplay() {
  return (
    <div className="bg-white">
      {/* 1. HERO SECTION - BANNER LỚN KIỂU DIRTYCOINS */}
      <section className="relative h-[85vh] w-full overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80" 
          alt="Main Banner" 
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white px-6">
          <h2 className="text-[10px] md:text-xs font-bold tracking-[0.6em] uppercase mb-4 animate-in fade-in slide-in-from-bottom duration-700">
            Fortunate New Generation 2026
          </h2>
          <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom duration-1000">
            Fortunate
          </h1>
          <Link 
            to="/clothes" 
            className="bg-white text-black px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all duration-300 shadow-2xl"
          >
            Mua sắm ngay
          </Link>
        </div>
      </section>

      {/* 2. COLLECTION GRID - DANH MỤC NỔI BẬT */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter italic">Collections</h2>
          <Link to="/clothes" className="text-[11px] font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:pr-4 transition-all">
            Xem tất cả bộ sưu tập
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Box 1: Áo Thun */}
          <Link to="/clothes/ao-thun" className="relative h-[600px] overflow-hidden group border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all flex flex-col justify-end p-12">
              <h3 className="text-4xl font-black italic uppercase text-white mb-4">T-Shirts</h3>
              <div className="flex items-center text-white text-xs font-bold tracking-widest gap-2">
                KHÁM PHÁ <MoveRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          {/* Box 2: Áo Khoác / Hoodie */}
          <Link to="/clothes/ao-khoac" className="relative h-[600px] overflow-hidden group border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-all flex flex-col justify-end p-12">
              <h3 className="text-4xl font-black italic uppercase text-white mb-4">Outerwears</h3>
              <div className="flex items-center text-white text-xs font-bold tracking-widest gap-2">
                KHÁM PHÁ <MoveRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. VIRTUAL TRY-ON CALLOUT - NHẤN MẠNH CÔNG NGHỆ */}
      <section className="bg-[#fafafa] py-24 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white rounded-full shadow-sm">
              <Smartphone className="w-8 h-8 text-black stroke-1" />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 leading-tight">
            Trải nghiệm <span className="text-gray-300">Thử đồ ảo</span> <br /> 
            ngay trên trình duyệt của bạn
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-2xl mx-auto">
            Không còn lo lắng về kích cỡ. Với công nghệ AI Fitting của FORTUNATE, 
            bạn có thể thấy chính mình trong bộ trang phục yêu thích chỉ với một cú click.
          </p>
          <Link to="/clothes" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-red-600 transition-colors">
            THỬ NGAY BÂY GIỜ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. CHÂN TRANG HOME - NHÃN HIỆU */}
      <section className="py-20 text-center">
        <h2 className="text-[10px] font-black tracking-[0.8em] uppercase text-gray-200 mb-4">
          Fortunate Clothing Co.
        </h2>
        <p className="text-xs text-gray-400 italic">Established 2026 — Ho Chi Minh City, VN</p>
      </section>
    </div>
  );
}