import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../apis/axiosConfig";
import {
  ShoppingBag,
  Smartphone,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  RotateCcw,
  Truck,
  Check,
  Heart,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Lấy thông tin user từ localStorage để kiểm tra đăng nhập
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/${slug}`);
        const productData = res.data.data;

        // --- BẮT ĐẦU PHẦN SỬA LỖI LẶP SIZE ---
        // Lọc để chỉ giữ lại các variant có size duy nhất
        if (productData && productData.variants) {
          const uniqueVariants = [];
          const seenSizes = new Set();

          productData.variants.forEach((variant) => {
            if (!seenSizes.has(variant.size)) {
              seenSizes.add(variant.size);
              uniqueVariants.push(variant);
            }
          });
          productData.variants = uniqueVariants;
        }
        // --- KẾT THÚC PHẦN SỬA LỖI ---

        setProduct(productData);
        setMainImage(
          productData.images?.[0] || "https://via.placeholder.com/800x1000",
        );
        setSelectedVariant(null);

        // KIỂM TRA TRẠNG THÁI YÊU THÍCH BAN ĐẦU
        if (user && Array.isArray(productData.wishlists)) {
          const liked = productData.wishlists.some((w) => w.userId === user.id);
          setIsWishlisted(liked);
        } else {
          setIsWishlisted(false);
        }
      } catch (err) {
        console.error("Lỗi lấy chi tiết sản phẩm:", err);
        setIsWishlisted(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug, user?.id]);

  // HÀM XỬ LÝ TOGGLE WISHLIST (YÊU THÍCH)
  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng yêu thích");
      return;
    }

    try {
      const res = await api.post("/wishlist/toggle", { productId: product.id });
      if (res.data.success) {
        setIsWishlisted(!isWishlisted);
        toast.success(
          isWishlisted
            ? "Đã xóa khỏi danh sách yêu thích"
            : "Đã thêm vào danh sách yêu thích",
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật yêu thích",
      );
    }
  };

  const updateQuantity = (val) => {
    const stockLimit = selectedVariant?.stock || 1;
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= stockLimit) setQuantity(newQty);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error("Vui lòng chọn size!");
      return;
    }

    try {
      const res = await api.post("/cart/add", {
        variantId: selectedVariant.id,
        quantity: quantity,
      });

      if (res.data.success) {
        toast.success(`Đã thêm vào giỏ hàng thành công!`);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Vui lòng đăng nhập để mua hàng",
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
            Đang tải...
          </p>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h2 className="text-3xl font-black italic uppercase text-red-600">
            Sản phẩm không tồn tại
          </h2>
          <button
            onClick={() => navigate("/")}
            className="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-red-600 transition-all"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 py-8 lg:py-12 bg-white">
      {/* BREADCRUMB */}
      <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8 lg:mb-12">
        <span
          className="cursor-pointer hover:text-black transition-colors"
          onClick={() => navigate("/")}
        >
          Trang chủ
        </span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-black truncate max-w-[200px] font-black italic">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
        {/* LEFT: GALLERY */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-5">
          <div className="flex md:flex-col gap-3 overflow-x-auto md:w-24 pb-2 md:pb-0">
            {product.images?.map((img, idx) => (
              <div
                key={idx}
                className={`aspect-[3/4] min-w-[70px] border-2 cursor-pointer p-1 rounded-xl transition-all duration-300 ${mainImage === img ? "border-black shadow-lg scale-105" : "border-gray-100 opacity-60 hover:opacity-100"}`}
                onClick={() => setMainImage(img)}
              >
                <img
                  src={img}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/800x1000?text=No+Image";
                  }}
                  className="w-full h-full object-contain mix-blend-multiply"
                  alt="thumb"
                />
              </div>
            ))}
          </div>
          <div className="flex-1 aspect-[3/4] bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm group">
            <img
              src={mainImage}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/800x1000?text=No+Image";
              }}
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-110"
              alt={product.name}
            />
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="lg:col-span-5 space-y-10 lg:sticky lg:top-32 h-fit">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl lg:text-4xl font-black italic uppercase tracking-tighter leading-none pr-4">
                {product.name}
              </h1>
              {/* NÚT YÊU THÍCH (WISH LIST) */}
              <button
                onClick={handleToggleWishlist}
                className={`p-3 rounded-2xl transition-all duration-300 shadow-sm border ${isWishlisted ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100 hover:bg-red-50"}`}
              >
                <Heart
                  className={`w-6 h-6 transition-all duration-500 ${isWishlisted ? "fill-red-600 text-red-600 scale-110" : "text-gray-300"}`}
                />
              </button>
            </div>
            <p className="text-3xl font-black text-red-600 tracking-tight">
              {(
                selectedVariant?.price ||
                product.variants?.[0]?.price ||
                0
              ).toLocaleString("vi-VN")}{" "}
              VNĐ
            </p>
          </div>

          {/* DYNAMIC SIZE SELECTION */}
          <div className="space-y-6 bg-gray-50 p-6 rounded-3xl border border-gray-100">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black">
                  1. Chọn kích thước
                </h3>
                <p
                  className={`text-[10px] font-bold uppercase ${selectedVariant ? "text-green-600" : "text-red-500"}`}
                >
                  {selectedVariant
                    ? `✓ Đã chọn Size ${selectedVariant.size}`
                    : "⚠ Vui lòng chọn size"}
                </p>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest border-b-2 border-black pb-0.5 hover:text-red-600 transition-all">
                Size Chart
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {product.variants?.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const isOutOfStock = variant.stock === 0;
                return (
                  <button
                    key={variant.id}
                    disabled={isOutOfStock}
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    className={`relative h-16 flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${isSelected ? "border-black bg-black text-white shadow-xl scale-105" : "border-gray-200 bg-white text-black hover:border-black"} ${isOutOfStock ? "opacity-20 cursor-not-allowed grayscale" : "cursor-pointer active:scale-90"}`}
                  >
                    <span className="text-sm font-black uppercase">
                      {variant.size}
                    </span>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3 text-white stroke-[4]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUANTITY & ACTION */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                Số lượng:
              </span>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl overflow-hidden h-14 w-36 bg-white shadow-sm">
                <button
                  onClick={() => updateQuantity(-1)}
                  disabled={quantity <= 1}
                  className="flex-1 flex justify-center hover:bg-gray-50 transition-colors disabled:opacity-20"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-black text-lg">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(1)}
                  disabled={
                    !selectedVariant || quantity >= selectedVariant.stock
                  }
                  className="flex-1 flex justify-center hover:bg-gray-50 transition-colors disabled:opacity-20"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                className={`w-full py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl rounded-2xl ${selectedVariant && selectedVariant.stock > 0 ? "bg-black text-white hover:bg-gray-800" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
              >
                <ShoppingBag className="w-5 h-5" />
                {!selectedVariant
                  ? "Chọn Size"
                  : selectedVariant.stock > 0
                    ? "Thêm vào giỏ hàng"
                    : "Hết hàng"}
              </button>

              <button
                onClick={() =>
                  navigate(`/virtual-try-on?productId=${product.id}`)
                }
                className="w-full border-2 border-red-600 text-red-600 py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-md rounded-2xl"
              >
                <Smartphone className="w-5 h-5" /> Thử đồ ảo AI
              </button>
            </div>
          </div>

          {/* POLICIES */}
          <div className="grid grid-cols-1 gap-4 pt-8 border-t border-gray-100">
            {[
              { icon: Truck, text: "Miễn phí giao hàng toàn quốc" },
              { icon: RotateCcw, text: "07 ngày đổi trả dễ dàng" },
              { icon: ShieldCheck, text: "Sản phẩm chính hãng 100%" },
            ].map((policy, i) => (
              <div
                key={i}
                className="flex items-center gap-4 group cursor-default"
              >
                <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                  <policy.icon className="w-5 h-5 text-black group-hover:text-white transition-colors" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors">
                  {policy.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER DETAIL */}
      <div className="mt-20 lg:mt-32 pt-12 border-t-2 border-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-black bg-gray-100 px-6 py-2 rounded-full inline-block">
            Mô tả sản phẩm
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed font-medium text-justify md:text-center uppercase tracking-tighter">
            {product.description || "Thông tin sản phẩm đang được cập nhật..."}
          </p>
        </div>
      </div>
    </div>
  );
}
