import React, { useState } from 'react';
import { Smartphone, Upload, Shirt, RotateCcw, Download, Info, Plus } from 'lucide-react';

export default function VirtualTryOn() {
  const [userImage, setUserImage] = useState(null); // Ảnh người dùng
  const [selectedProduct, setSelectedProduct] = useState(null); // Sản phẩm đang chọn
  const [customProductImage, setCustomProductImage] = useState(null); // Ảnh đồ người dùng tải lên
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);

  // Danh sách sản phẩm mẫu từ hệ thống
  const clothesToTry = [
    { id: 1, name: "Basic White Tee", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80" },
    { id: 2, name: "Black Hoodie", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80" },
    { id: 3, name: "Denim Jacket", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80" },
  ];

  // Xử lý tải ảnh chân dung người dùng
  const handleUserImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserImage(URL.createObjectURL(file));
      setResultImage(null);
    }
  };

  // Xử lý tải ảnh quần áo cá nhân từ máy
  const handleCustomProductUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const customItem = {
        id: 'custom-' + Date.now(),
        name: "Đồ bạn tải lên",
        image: imageUrl
      };
      setCustomProductImage(customItem);
      setSelectedProduct(customItem); // Tự động chọn luôn sau khi tải
    }
  };

  const handleStartTryOn = () => {
    if (!userImage || !selectedProduct) {
      alert("Vui lòng tải ảnh cá nhân và chọn sản phẩm!");
      return;
    }
    setIsProcessing(true);
    
    // Giả lập AI xử lý
    setTimeout(() => {
      setIsProcessing(false);
      setResultImage(userImage); 
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen bg-white">
      {/* HEADER SECTION */}
      <div className="mb-12 border-b border-gray-100 pb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-4">
          Virtual Try-On <span className="text-xs bg-black text-white px-2 py-1 not-italic tracking-widest">BETA AI</span>
        </h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Tải lên ảnh chân dung và chọn trang phục (có sẵn hoặc từ máy của bạn) để bắt đầu phiên thử đồ ảo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* CỘT 1: TẢI ẢNH NGƯỜI DÙNG */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px]">1</span>
            Ảnh của bạn
          </h2>
          <div className="relative aspect-[3/4] border-2 border-dashed border-gray-200 rounded-sm overflow-hidden flex flex-col items-center justify-center group hover:border-black transition-colors bg-gray-50/30">
            {userImage ? (
              <>
                <img src={userImage} className="w-full h-full object-cover animate-in fade-in duration-500" alt="User" />
                <button onClick={() => setUserImage(null)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors">
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full h-full justify-center">
                <Upload className="w-10 h-10 text-gray-300 mb-4 group-hover:text-black transition-colors" />
                <span className="text-[11px] font-black uppercase tracking-widest">Tải ảnh chân dung</span>
                <input type="file" className="hidden" onChange={handleUserImageUpload} accept="image/*" />
              </label>
            )}
          </div>
          <div className="bg-blue-50 p-4 rounded-sm flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-[10px] text-blue-700 leading-relaxed uppercase font-bold">
              Lưu ý: Ảnh rõ nét, đứng thẳng sẽ giúp AI ghép đồ đẹp hơn.
            </p>
          </div>
        </div>

        {/* CỘT 2: PHÒNG THAY ĐỒ (KẾT QUẢ AI) */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-center">Phòng thay đồ ảo</h2>
          <div className="relative aspect-[3/4] bg-[#fdfdfd] rounded-sm overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
            {isProcessing ? (
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">AI đang tính toán phom dáng...</p>
              </div>
            ) : resultImage ? (
              <img src={resultImage} className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" alt="Result" />
            ) : (
              <div className="text-center px-10">
                <Smartphone className="w-12 h-12 text-gray-200 mx-auto mb-4 stroke-1" />
                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-loose">Kết quả sẽ hiển thị tại đây</p>
              </div>
            )}
          </div>
          <button 
            disabled={isProcessing}
            onClick={handleStartTryOn}
            className="w-full bg-black text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:bg-gray-200"
          >
            {isProcessing ? "Đang xử lý..." : "Bắt đầu thử đồ"}
          </button>
        </div>

        {/* CỘT 3: CHỌN TRANG PHỤC (MẪU HOẶC TẢI LÊN) */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px]">2</span>
            Chọn trang phục
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* NÚT TẢI ẢNH ĐỒ RIÊNG */}
            <label className="cursor-pointer border-2 border-dashed border-gray-200 aspect-[3/4] rounded-sm flex flex-col items-center justify-center hover:border-black transition-all bg-gray-50/50 group">
              <Plus className="w-6 h-6 text-gray-300 group-hover:text-black mb-1" />
              <span className="text-[9px] font-black uppercase text-center px-2 leading-tight">Tải đồ từ máy</span>
              <input type="file" className="hidden" onChange={handleCustomProductUpload} accept="image/*" />
            </label>

            {/* HIỂN THỊ ĐỒ ĐÃ TẢI LÊN (NẾU CÓ) */}
            {customProductImage && (
              <div 
                onClick={() => setSelectedProduct(customProductImage)}
                className={`relative cursor-pointer border-2 transition-all p-1 rounded-sm ${selectedProduct?.id === customProductImage.id ? 'border-black bg-gray-50' : 'border-transparent bg-white shadow-sm'}`}
              >
                <div className="aspect-[3/4] overflow-hidden bg-white mb-2">
                  <img src={customProductImage.image} className="w-full h-full object-cover" alt="Custom" />
                </div>
                <p className="text-[9px] font-black uppercase text-center truncate px-1 italic text-red-600 tracking-tighter">Personal Item</p>
              </div>
            )}

            {/* DANH SÁCH MẪU CÓ SẴN */}
            {clothesToTry.map((item) => (
              <div 
                key={item.id}
                onClick={() => setSelectedProduct(item)}
                className={`cursor-pointer border-2 transition-all p-1 rounded-sm ${selectedProduct?.id === item.id ? 'border-black bg-gray-50' : 'border-transparent bg-white hover:border-gray-50'}`}
              >
                <div className="aspect-[3/4] overflow-hidden bg-white mb-2">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <p className="text-[9px] font-black uppercase text-center truncate px-1">{item.name}</p>
              </div>
            ))}
          </div>

          {resultImage && (
            <button className="w-full border-2 border-black py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all">
              <Download className="w-4 h-4" /> Tải kết quả HD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}