import React from 'react';
import { History, Target, Sparkles, Shirt, MoveRight, Quote, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  return (
    <div className="bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* SECTION 1: HERO - Tối ưu hiển thị ảnh nền */}
      <section className="relative h-[85vh] flex items-center justify-center bg-black overflow-hidden border-b border-gray-100">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?auto=format&fit=crop&q=80" 
            alt="Hero background" 
            className="w-full h-full object-cover grayscale brightness-50 contrast-125 transition-transform duration-[10s] hover:scale-110"
          />
          {/* Lớp phủ để chữ Fortunate nổi bật hơn */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white/10"></div>
        </div>
        
        <div className="relative z-10 text-center px-6">
          <h1 className="text-7xl md:text-[10rem] font-black italic uppercase tracking-tighter mb-4 animate-in fade-in zoom-in duration-1000 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-none">
            Fortunate
          </h1>
          <div className="flex flex-col items-center gap-4">
            <div className="h-[2px] w-20 bg-red-600 animate-pulse"></div>
            <p className="text-[10px] md:text-xs font-black tracking-[0.6em] uppercase text-gray-300">
              Kỷ nguyên thời trang số 2026
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-32">
        {/* SECTION 2: CÂU CHUYỆN THƯƠNG HIỆU */}
        <section className="mb-48 grid lg:grid-cols-2 gap-24 items-start">
          <div className="lg:sticky lg:top-40">
            <div className="flex items-center gap-3 mb-10 text-red-600">
              <History className="w-5 h-5" />
              <span className="text-[10px] font-black tracking-[0.4em] uppercase">The Origin Story</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-12 italic text-black">
              Định nghĩa <br /> lại mua sắm <br /> 
              <span className="text-transparent border-t-2 border-black stroke-black" style={{ WebkitTextStroke: '1px #e5e7eb' }}>trực tuyến.</span>
            </h2>
            <div className="space-y-8 max-w-lg border-l-4 border-black pl-8 py-2">
              <p className="text-gray-500 leading-relaxed text-sm text-justify font-medium">
                Ra đời vào năm 2026, <span className="text-black font-black italic">FORTUNATE</span> không chỉ là một thương hiệu thời trang tối giản. Chúng tôi xóa bỏ rào cản về kích cỡ bằng trí tuệ nhân tạo.
              </p>
              <p className="text-gray-500 leading-relaxed text-sm text-justify">
                Chúng tôi khao khát ứng dụng công nghệ <span className="text-red-600 font-bold">Virtual Try-on</span> chân thực nhất để bạn không bao giờ phải lo lắng về việc "không vừa" khi đặt hàng online.
              </p>
              <div className="pt-4">
                <Link to="/clothes" className="group inline-flex items-center gap-4 text-xs font-black uppercase tracking-widest border-b-4 border-black pb-2 hover:gap-10 transition-all duration-500">
                  Vào cửa hàng <MoveRight className="w-5 h-5 group-hover:text-red-600" />
                </Link>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-12">
            <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80" 
                alt="Branding" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            <div className="flex justify-end">
              <div className="w-4/5 aspect-square bg-gray-50 rounded-2xl overflow-hidden border-8 border-white shadow-xl -mt-20 z-10">
                <img 
                  src="https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80" 
                  alt="Process" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: GIÁ TRỊ CỐT LÕI */}
        <section className="mb-48">
          <div className="text-center mb-32">
            <div className="inline-block p-4 rounded-full bg-red-50 mb-6">
              <Sparkles className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 italic">Core Values</h2>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.5em] uppercase">
              Tâm điểm của sự sáng tạo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              { icon: Shirt, title: "Minimalism", desc: "Tối giản trong thiết kế nhưng tối đa trong chất lượng và trải nghiệm người dùng." },
              { icon: Target, title: "Precision", desc: "Độ khớp hoàn hảo nhờ thuật toán AI đo đạc kích thước cơ thể qua camera." },
              { icon: Smartphone, title: "Digital First", desc: "Trải nghiệm Virtual Try-on đột phá, đưa phòng thử đồ vào ngay chiếc smartphone của bạn." }
            ].map((item, idx) => (
              <div key={idx} className="group relative p-12 bg-white border-2 border-gray-50 hover:border-black transition-all duration-500 rounded-3xl">
                <div className="absolute -top-8 left-10 w-16 h-16 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg uppercase tracking-widest mb-6 pt-4 italic">{item.title}</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: QUOTE & STATEMENT */}
        <section className="relative py-40 px-12 rounded-[3rem] text-center flex flex-col items-center bg-black overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80" 
            className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale transition-transform duration-[15s] group-hover:scale-125"
          />
          <Quote className="relative z-10 w-16 h-16 text-red-600 mb-12 opacity-50" />
          <h2 className="relative z-10 text-4xl md:text-7xl font-black uppercase tracking-tighter mb-12 italic leading-[0.9] max-w-5xl text-white">
            "Công nghệ không thay thế thời trang, <br /> nó khiến thời trang trở nên <br /> 
            <span className="text-red-600 underline decoration-white underline-offset-8">vừa vặn hơn.</span>"
          </h2>
          <div className="relative z-10 h-1.5 w-32 bg-white mb-10"></div>
          <p className="relative z-10 text-gray-400 text-[10px] font-bold tracking-[0.6em] uppercase max-w-2xl mx-auto leading-loose">
            FORTUNATE CAM KẾT ĐỔI MỚI KHÔNG NGỪNG ĐỂ MANG LẠI GIÁ TRỊ THỰC CHO CỘNG ĐỒNG FASHIONISTA VIỆT NAM.
          </p>
        </section>
      </div>
    </div>
  );
}