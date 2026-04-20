import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Smartphone, Upload, RotateCcw, Download, Plus } from 'lucide-react';
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

 // Xử lý tải ảnh cá nhân người dùng
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

 const productId = !selectedProduct.isCustom ? selectedProduct.id : null;
 const result = await vtonAPI.tryOn(userImageFile, garmentFile, productId, garmentImageUrl);

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

 const handleDownloadResult = async (format = 'png') => {
 if (!resultImage) return;
 try {
   // Fetch ảnh về dưới dạng blob để tránh CORS khi vẽ canvas
   const response = await fetch(resultImage);
   const blob = await response.blob();
   const imgBitmap = await createImageBitmap(blob);

   const canvas = document.createElement('canvas');
   canvas.width = imgBitmap.width;
   canvas.height = imgBitmap.height;
   const ctx = canvas.getContext('2d');

   if (format === 'jpg') {
     // JPG không hỗ trợ trong suốt → fill nền trắng trước
     ctx.fillStyle = '#ffffff';
     ctx.fillRect(0, 0, canvas.width, canvas.height);
   }
   ctx.drawImage(imgBitmap, 0, 0);

   const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
   const quality = format === 'jpg' ? 0.95 : undefined;
   const dataUrl = canvas.toDataURL(mimeType, quality);

   const link = document.createElement('a');
   link.href = dataUrl;
   link.download = `virtual-try-on-result.${format}`;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
 } catch (e) {
   // Fallback: mở tab mới nếu canvas bị chặn
   window.open(resultImage, '_blank');
 }
 };

 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 min-h-screen bg-white">
 {/* HEADER SECTION */}
 <div className="mb-8 sm:mb-12 border-b border-gray-100 pb-6 sm:pb-8">
 <h1 className="text-2xl sm:text-4xl font-black italic tracking-tighter mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-4">
 Virtual Try-On
 </h1>
 <p className="text-gray-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
 Tải ảnh cá nhân, chọn trang phục từ máy hoặc từ sản phẩm khi vào từ trang chi tiết, rồi nhấn bắt đầu thử đồ.
 </p>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

 {/* CỘT 1: TẢI ẢNH NGƯỜI DÙNG */}
 <div className="space-y-6">
 <h2 className="text-xs font-black tracking-[0.2em] flex items-center justify-center gap-2">
 <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px]">1</span>
 Ảnh cá nhân
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
 <span className="text-[11px] font-black tracking-widest">Tải ảnh cá nhân</span>
 <input type="file" className="hidden" onChange={handleUserImageUpload} accept="image/*" />
 </label>
 )}
  </div>
 </div>

 {/* CỘT 2: KẾT QUẢ AI */}
 <div className="space-y-6">
 {/* Cùng hàng tiêu đề với cột 1 & 3 (badge 24px + gap-2) để khung ảnh bắt đầu cùng một đường */}
 <h2 className="text-xs font-black tracking-[0.2em] flex items-center gap-2 min-h-6">
 <span className="w-6 h-6 shrink-0 rounded-full opacity-0 pointer-events-none" aria-hidden />
 <span className="flex-1 text-center">Kết quả</span>
 </h2>
 <div className="relative bg-[#fdfdfd] rounded-sm overflow-hidden flex items-center justify-center border border-gray-100 shadow-inner">
 {isProcessing ? (
 <div className="text-center" style={{ minHeight: '280px' }}>
 <div className="w-12 h-12 border-2 border-gray-200 border-t-black rounded-full animate-spin mx-auto mb-4" style={{ marginTop: '110px' }}></div>
 <p className="text-[9px] font-bold tracking-[0.2em] animate-pulse">AI đang tính toán phom dáng...</p>
 </div>
 ) : error ? (
 <div className="text-center px-8" style={{ minHeight: '280px', paddingTop: '80px' }}>
 <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <span className="text-2xl">❌</span>
 </div>
 <p className="text-[10px] text-red-600 font-bold tracking-widest mb-2">
    {error.includes("không hợp lệ") ? "KIỂM DUYỆT AN TOÀN" : "CÓ LỖI XẢY RA"}
  </p>
  <p className="text-[9px] text-red-500 leading-relaxed">
    {error}
  </p>
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
 <p className="text-[10px] text-gray-400 tracking-widest leading-loose">Kết quả sẽ hiển thị tại đây</p>
 </div>
 )}
 </div>
 <div className="flex flex-col gap-3">
 <button
 disabled={isProcessing}
 onClick={handleStartTryOn}
 className="w-full bg-black text-white py-4 text-xs font-black tracking-[0.2em] hover:bg-gray-800 transition-all disabled:bg-gray-200"
 >
 {isProcessing ? "Đang xử lý..." : "Bắt đầu thử đồ"}
 </button>
 <button
 type="button"
 disabled={!resultImage || isProcessing}
 onClick={() => handleDownloadResult('png')}
 title={!resultImage ? 'Thử đồ xong để tải kết quả' : undefined}
 className="w-full border-2 border-black py-3 text-xs font-black tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-transparent disabled:hover:text-inherit"
 >
 <Download className="w-4 h-4 shrink-0" /> Tải kết quả HD
 </button>
 </div>
 </div>

 {/* CỘT 3: CHỌN TRANG PHỤC (MẪU HOẶC TẢI LÊN) */}
 <div className="space-y-6">
  <h2 className="text-xs font-black tracking-[0.2em] flex items-center justify-center gap-2">
  <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px]">2</span>
  Chọn trang phục
  </h2>

 <div className="flex flex-col gap-3">
 {/* Hai ô vuông cạnh nhau: tải đồ | ảnh — áp dụng cả khi có đồ từ máy hoặc sản phẩm từ trang chi tiết */}
 {customProductImage ? (
 <div className="grid grid-cols-2 gap-3 w-full">
 <label className="cursor-pointer aspect-square w-full border-2 border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center gap-2 hover:border-black transition-all bg-gray-50/50 group min-h-0">
 <Plus className="w-6 h-6 text-gray-300 group-hover:text-black shrink-0" />
 <span className="text-[9px] font-black text-center px-2 leading-tight">Tải đồ từ máy</span>
 <input type="file" className="hidden" onChange={handleCustomProductUpload} accept="image/*" />
 </label>
 <div
 role="button"
 tabIndex={0}
 onClick={() => setSelectedProduct(customProductImage)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 setSelectedProduct(customProductImage);
 }
 }}
 className={`flex flex-col aspect-square w-full min-h-0 rounded-sm border-2 overflow-hidden cursor-pointer transition-all ${selectedProduct?.id === customProductImage.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'}`}
 >
 <div className="flex-1 min-h-0 overflow-hidden bg-white p-2 flex items-center justify-center">
 <img src={customProductImage.image} className="w-full h-full object-contain" alt="Đồ tải từ máy" />
 </div>
 <p className="text-[9px] font-black text-center truncate px-1 py-1.5 shrink-0 italic text-red-600 tracking-tighter bg-white border-t border-gray-100">
 Personal Item
 </p>
 </div>
 </div>
 ) : fromProductItem ? (
 <div className="grid grid-cols-2 gap-3 w-full">
 <label className="cursor-pointer aspect-square w-full border-2 border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center gap-2 hover:border-black transition-all bg-gray-50/50 group min-h-0">
 <Plus className="w-6 h-6 text-gray-300 group-hover:text-black shrink-0" />
 <span className="text-[9px] font-black text-center px-2 leading-tight">Tải đồ từ máy</span>
 <input type="file" className="hidden" onChange={handleCustomProductUpload} accept="image/*" />
 </label>
 <div
 role="button"
 tabIndex={0}
 onClick={() => setSelectedProduct(fromProductItem)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 setSelectedProduct(fromProductItem);
 }
 }}
 className={`flex flex-col aspect-square w-full min-h-0 rounded-sm border-2 overflow-hidden cursor-pointer transition-all ${selectedProduct?.id === fromProductItem.id ? 'border-black bg-gray-50' : 'border-gray-200 bg-white'}`}
 >
 <div className="flex-1 min-h-0 overflow-hidden bg-white flex items-center justify-center">
 {fromProductItem.image ? (
 <img src={fromProductItem.image} className="w-full h-full object-contain mix-blend-multiply" alt={fromProductItem.name} />
 ) : (
 <div className="text-[9px] text-gray-300 font-bold">No Image</div>
 )}
 </div>
 <p className="text-[9px] font-black text-center truncate px-1 py-1.5 shrink-0 text-blue-600 italic tracking-tighter bg-white border-t border-gray-100">
 Đã chọn
 </p>
 <p className="text-[8px] font-bold text-center truncate px-1 pb-1.5 text-gray-500 bg-white">{fromProductItem.name}</p>
 </div>
 </div>
 ) : (
 <label className="cursor-pointer w-full border-2 border-dashed border-gray-200 rounded-sm flex flex-row items-center justify-center gap-3 hover:border-black transition-all bg-gray-50/50 group min-h-[100px] py-4">
 <Plus className="w-6 h-6 text-gray-300 group-hover:text-black shrink-0" />
 <span className="text-[9px] font-black text-center tracking-tight">Tải đồ từ máy</span>
 <input type="file" className="hidden" onChange={handleCustomProductUpload} accept="image/*" />
 </label>
 )}

 {/* HƯỚNG DẪN SỬ DỤNG — 3 bước */}
 <div className="mt-2 flex flex-col gap-3">
 <p className="text-[9px] font-black tracking-[0.15em] text-gray-400 uppercase">Hướng dẫn</p>
 {[
   { step: '01', label: 'Tải ảnh cá nhân', desc: 'Chọn ảnh chụp đứng thẳng, rõ nét để AI ghép đồ chính xác hơn.' },
   { step: '02', label: 'Chọn trang phục', desc: 'Tải ảnh đồ từ máy hoặc chọn sản phẩm từ trang chi tiết.' },
   { step: '03', label: 'Bắt đầu thử đồ', desc: 'Nhấn nút "Bắt đầu thử đồ" và chờ AI xử lý kết quả.' },
 ].map(({ step, label, desc }) => (
   <div key={step} className="flex items-start gap-3 bg-gray-50 rounded-sm px-3 py-3">
     <span className="w-6 h-6 shrink-0 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-black mt-0.5">{step}</span>
     <div>
       <p className="text-[10px] font-black tracking-wide mb-0.5">{label}</p>
       <p className="text-[9px] text-gray-500 leading-relaxed">{desc}</p>
     </div>
   </div>
 ))}
 </div>
 </div>

 </div>
 </div>
 </div>
 );
}