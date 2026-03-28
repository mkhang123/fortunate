import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Smartphone, Upload, RotateCcw, Download, Info, Plus } from 'lucide-react';
import { vtonAPI } from '../apis/vton.api';

export default function VirtualTryOn() {
  const location = useLocation();

  // Lấy thông tin user để kiểm tra quyền admin
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Nếu navigate từ trang chi tiết sản phẩm → pre-select sản phẩm đó
  const fromProduct = location.state?.fromProduct;
  const initialSelected = fromProduct
    ? { id: fromProduct.id, name: fromProduct.name, image: fromProduct.image, isFromProduct: true }
    : null;

  const [userImage, setUserImage] = useState(null);
  const [userImageFile, setUserImageFile] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(initialSelected);
  // Sản phẩm được navigate từ ProductDetail (hiển thị trong grid)
  const [fromProductItem] = useState(initialSelected?.isFromProduct ? initialSelected : null);
  const [customProductImage, setCustomProductImage] = useState(null);
  const [customProductFile, setCustomProductFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);
  // Kích thước thực tế của ảnh người (để đồng bộ ảnh kết quả)
  const [personImgSize, setPersonImgSize] = useState(null);
  const personImgRef = useRef(null);

  // Danh sách sản phẩm mẫu từ hệ thống (chỉ áo)
  const clothesToTry = [
    { id: 1, name: "Basic White Tee", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80" },
    { id: 2, name: "Black Hoodie", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80" },
    { id: 3, name: "Denim Jacket", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80" },
  ];

  // Xử lý tải ảnh chân dung người dùng
  const handleUserImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserImageFile(file);
      setUserImage(URL.createObjectURL(file));
      setResultImage(null);
      setError(null);
    }
  };

  // Xử lý tải ảnh quần áo cá nhân từ máy
  const handleCustomProductUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomProductFile(file);
      const imageUrl = URL.createObjectURL(file);
      const customItem = {
        id: 'custom-' + Date.now(),
        name: "Đồ bạn tải lên",
        image: imageUrl,
        isCustom: true,
      };
      setCustomProductImage(customItem);
      setSelectedProduct(customItem); // Tự động chọn luôn sau khi tải
    }
  };

  const handleStartTryOn = async () => {
    if (!currentUser) {
      setError("Vui lòng đăng nhập để có thể thực hiện chức năng");
      return;
    }

    if (!userImageFile || !selectedProduct) {
      alert("Vui lòng tải ảnh cá nhân và chọn sản phẩm!");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let garmentFile = null;
      let garmentImageUrl = null;

      if (selectedProduct.isCustom) {
        // Ảnh custom từ máy → gửi file trực tiếp
        garmentFile = customProductFile;
      } else {
        // Ảnh từ sản phẩm → gửi URL để backend tự download (tránh CORS)
        garmentImageUrl = selectedProduct.image;
      }

      // Gọi API
      const result = await vtonAPI.tryOn(userImageFile, garmentFile, null, garmentImageUrl);

      console.log('VTON Result:', result);

      // Hiển thị kết quả
      if (result.success && result.data.outputImage) {
        // Construct URL to result image
        let resultImageUrl = result.data.outputImage;
        // Chỉ nối localhost nếu trả về đường dẫn tương đối (file lưu trên ổ cứng local)
        if (!resultImageUrl.startsWith('http')) {
          resultImageUrl = `http://localhost:4000/${resultImageUrl.replace(/\\/g, '/')}`;
        }
        setResultImage(resultImageUrl);
      } else {
        throw new Error('Không nhận được kết quả từ server');
      }

    } catch (error) {
      console.error('Error in VTON:', error);
      const backendMessage = error.response?.data?.message || '';
      const isAuthError =
        error.response?.status === 401 ||
        /không tìm thấy token|token/i.test(backendMessage);

      setError(
        isAuthError
          ? "Vui lòng đăng nhập để có thể thực hiện chức năng"
          : backendMessage || error.message || 'Có lỗi xảy ra khi xử lý'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadResult = () => {
    if (!resultImage) return;
    try {
      const link = document.createElement('a');
      link.href = resultImage;
      link.download = 'virtual-try-on-result.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(resultImage, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen bg-white">
      {/* HEADER SECTION */}
      <div className="mb-12 border-b border-gray-100 pb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-4">
          Virtual Try-On
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
          <div className="relative border-2 border-dashed border-gray-200 rounded-sm overflow-hidden flex flex-col items-center justify-center group hover:border-black transition-colors bg-gray-50/30">
            {userImage ? (
              <>
                <img
                  ref={personImgRef}
                  src={userImage}
                  className="w-full max-h-[520px] object-contain animate-in fade-in duration-500"
                  alt="User"
                  onLoad={() => {
                    if (personImgRef.current) {
                      setPersonImgSize({
                        width: personImgRef.current.offsetWidth,
                        height: personImgRef.current.offsetHeight,
                      });
                    }
                  }}
                />
                <button onClick={() => setUserImage(null)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors">
                  <RotateCcw className="w-4 h-4 text-gray-600" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-8 text-center w-full justify-center" style={{ minHeight: '280px' }}>
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
          {/* Cùng hàng tiêu đề với cột 1 & 3 (badge 24px + gap-2) để khung ảnh bắt đầu cùng một đường */}
          <h2 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 min-h-6">
            <span className="w-6 h-6 shrink-0 rounded-full opacity-0 pointer-events-none" aria-hidden />
            <span className="flex-1 text-center">Phòng thay đồ ảo</span>
          </h2>
          <div className="relative bg-[#fdfdfd] rounded-sm overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
            {isProcessing ? (
              <div className="text-center" style={{ minHeight: '280px' }}>
                <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" style={{ marginTop: '110px' }}></div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">AI đang tính toán phom dáng...</p>
              </div>
            ) : error ? (
              <div className="text-center px-8" style={{ minHeight: '280px', paddingTop: '80px' }}>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">❌</span>
                </div>
                <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mb-2">Có lỗi xảy ra</p>
                <p className="text-[9px] text-red-500">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-4 text-[9px] underline hover:no-underline"
                >
                  Thử lại
                </button>
              </div>
            ) : resultImage ? (
              <div
                style={
                  personImgSize
                    ? {
                        height: `${personImgSize.height}px`,
                      }
                    : {}
                }
                className="flex items-center justify-center"
              >
                <img
                  src={resultImage}
                  className="h-full object-contain animate-in fade-in zoom-in duration-700"
                  alt="Result"
                />
              </div>
            ) : (
              <div className="text-center px-10" style={{ minHeight: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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

          <div className="grid grid-cols-2 gap-3">
            {/* NÚT TẢI ẢNH ĐỒ RIÊNG */}
            <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center hover:border-black transition-all bg-gray-50/50 group" style={{ height: '180px' }}>
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
                <div className="overflow-hidden bg-white mb-1" style={{ height: '156px' }}>
                  <img src={customProductImage.image} className="w-full h-full object-cover" alt="Custom" />
                </div>
                <p className="text-[9px] font-black uppercase text-center truncate px-1 italic text-red-600 tracking-tighter">Personal Item</p>
              </div>
            )}

            {/* SẢN PHẨM TỪ TRANG CHI TIẾT (PRE-SELECTED) */}
            {fromProductItem && (
              <div
                onClick={() => setSelectedProduct(fromProductItem)}
                className={`relative cursor-pointer border-2 transition-all p-1 rounded-sm ${selectedProduct?.id === fromProductItem.id ? 'border-black bg-gray-50' : 'border-transparent bg-white shadow-sm'}`}
              >
                <div className="overflow-hidden bg-white mb-1" style={{ height: '156px' }}>
                  {fromProductItem.image
                    ? <img src={fromProductItem.image} className="w-full h-full object-contain mix-blend-multiply" alt={fromProductItem.name} />
                    : <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-300 font-bold uppercase">No Image</div>
                  }
                </div>
                <p className="text-[9px] font-black uppercase text-center truncate px-1 text-blue-600 tracking-tighter italic">Đã chọn</p>
                <p className="text-[8px] font-bold text-center truncate px-1 text-gray-500">{fromProductItem.name}</p>
              </div>
            )}

            {/* DANH SÁCH MẪU CÓ SẴN */}
            {clothesToTry.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedProduct(item)}
                className={`cursor-pointer border-2 transition-all p-1 rounded-sm ${selectedProduct?.id === item.id ? 'border-black bg-gray-50' : 'border-transparent bg-white hover:border-gray-50'}`}
              >
                <div className="overflow-hidden bg-white mb-1" style={{ height: '156px' }}>
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <p className="text-[9px] font-black uppercase text-center truncate px-1">{item.name}</p>
              </div>
            ))}
          </div>

          {resultImage && (
            <button
              onClick={handleDownloadResult}
              className="w-full border-2 border-black py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all"
            >
              <Download className="w-4 h-4" /> Tải kết quả HD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}