import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../apis/axiosConfig";
import { reviewAPI } from "../apis/review.api";
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
  Star,
  Send,
  X,
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

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, totalReviews: 0, ratingBreakdown: {} });
  const [eligibility, setEligibility] = useState({ canReview: false, hasPurchased: false, hasReviewed: false });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', images: [] });
  const [submittingReview, setSubmittingReview] = useState(false);
  const reviewImageInputRef = useRef(null);

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

  // Fetch reviews khi có product
  useEffect(() => {
    if (!product) return;
    const fetchReviews = async () => {
      try {
        const res = await reviewAPI.getReviews(product.id);
        if (res.data.success) {
          const { reviews, avgRating, totalReviews, ratingBreakdown } = res.data.data;
          setReviews(reviews);
          setReviewStats({ avgRating, totalReviews, ratingBreakdown });
        }
      } catch (err) {
        console.error('Lỗi lấy reviews:', err);
      }
    };
    fetchReviews();

    // Kiểm tra quyền đánh giá nếu đã đăng nhập
    if (user) {
      reviewAPI.checkEligibility(product.id)
        .then(res => { if (res.data.success) setEligibility(res.data.data); })
        .catch(() => { });
    }
  }, [product?.id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { toast.error('Vui lòng chọn số sao'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewAPI.createReview(product.id, reviewForm);
      if (res.data.success) {
        toast.success('Đánh giá đã được gửi thành công!');
        setReviews([res.data.data, ...reviews]);
        setReviewStats(prev => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          avgRating: Math.round(((prev.avgRating * prev.totalReviews + reviewForm.rating) / (prev.totalReviews + 1)) * 10) / 10,
        }));
        setEligibility(prev => ({ ...prev, canReview: false, hasReviewed: true }));
        setReviewForm({ rating: 5, comment: '', images: [] });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const accepted = files.filter((file) => file.type.startsWith("image/"));
    if (accepted.length !== files.length) {
      toast.error("Chỉ hỗ trợ upload file ảnh");
    }

    const next = [...reviewForm.images, ...accepted].slice(0, 5);
    if (next.length < reviewForm.images.length + accepted.length) {
      toast.error("Tối đa 5 ảnh cho mỗi đánh giá");
    }

    setReviewForm((prev) => ({ ...prev, images: next }));
    e.target.value = "";
  };

  const removeReviewImage = (idx) => {
    setReviewForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

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

    if (!user) {
      const raw = localStorage.getItem("guestCart");
      const guestCart = raw ? JSON.parse(raw) : [];
      const existing = guestCart.find((item) => item.variantId === selectedVariant.id);

      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + quantity,
          selectedVariant.stock || existing.quantity + quantity,
        );
      } else {
        guestCart.push({
          id: `guest-${selectedVariant.id}`,
          variantId: selectedVariant.id,
          quantity,
          variant: {
            ...selectedVariant,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              images: product.images || [],
            },
          },
        });
      }

      localStorage.setItem("guestCart", JSON.stringify(guestCart));
      toast.success("Đã thêm vào giỏ hàng thành công!");
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
      toast.error(err.response?.data?.message || "Không thể thêm vào giỏ hàng");
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
          <div className="flex flex-wrap md:flex-col gap-3 md:w-24">
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
                    ? `✓ Đã chọn Size ${selectedVariant.size.toUpperCase()}`
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
                      {variant.size.toUpperCase()}
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
                  navigate('/virtual-try-on', {
                    state: {
                      fromProduct: {
                        id: product.id,
                        name: product.name,
                        image: product.images?.[0] || null,
                      }
                    }
                  })
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

      {/* SECTION ĐÁNH GIÁ */}
      <div className="mt-20 lg:mt-32 pt-12 border-t-2 border-gray-50">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* TIÊU ĐỀ + THỐNG KÊ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-xs font-black uppercase tracking-[0.4em]">Đánh giá sản phẩm</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={`w-5 h-5 ${s <= Math.round(reviewStats.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-2xl font-black">{reviewStats.avgRating || 0}</span>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">({reviewStats.totalReviews} đánh giá)</span>
            </div>
          </div>

          {/* FORM ĐÁNH GIÁ — chỉ hiện với người đã mua và chưa review */}
          {user && eligibility.canReview && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em]">Viết đánh giá của bạn</h3>
              {/* CHỌN SAO */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Đánh giá</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                      className="p-1 transition-transform hover:scale-125">
                      <Star className={`w-8 h-8 transition-colors ${s <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              {/* NHẬN XÉT */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Nhận xét (tùy chọn)</p>
                <textarea
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:border-black focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Hình ảnh thực tế (tùy chọn, tối đa 5 ảnh)
                </p>
                <input
                  ref={reviewImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReviewImagesChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => reviewImageInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                  >
                    Chọn hình ảnh
                  </button>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {reviewForm.images.length > 0
                      ? `Đã chọn ${reviewForm.images.length}/5 ảnh`
                      : "Chưa chọn ảnh"}
                  </p>
                </div>
                {reviewForm.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                    {reviewForm.images.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`review-upload-${idx}`}
                          className="w-full aspect-square object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={submittingReview}
                className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:opacity-50">
                <Send className="w-4 h-4" />
                {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          )}

          {/* THÔNG BÁO trạng thái */}
          {user && !eligibility.canReview && (
            <div className="bg-gray-50 rounded-2xl px-6 py-4 border border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                {eligibility.hasReviewed
                  ? '✓ Bạn đã đánh giá sản phẩm này'
                  : '⚠ Chỉ khách hàng đã mua sản phẩm mới có thể đánh giá'}
              </p>
            </div>
          )}
          {!user && (
            <div className="bg-gray-50 rounded-2xl px-6 py-4 border border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Vui lòng <span className="text-black underline cursor-pointer" onClick={() => navigate('/login')}>đăng nhập</span> để xem quyền đánh giá
              </p>
            </div>
          )}

          {/* DANH SÁCH ĐÁNH GIÁ */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-300">Chưa có đánh giá nào</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="flex gap-5 pb-6 border-b border-gray-50 last:border-0">
                  {/* AVATAR */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    {review.user.avatar
                      ? <img src={review.user.avatar} alt={review.user.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-400">{review.user.name?.[0]?.toUpperCase()}</div>
                    }
                  </div>
                  {/* NỘI DUNG */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-tight">{review.user.name || 'Ẩn danh'}</span>
                        {review.verifiedPurchase && (
                          <span className="text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">✓ Đã mua hàng</span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-300 font-bold shrink-0">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'}`} />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                    )}
                    {Array.isArray(review.images) && review.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                        {review.images.map((img, idx) => (
                          <a
                            key={`${img}-${idx}`}
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-xl overflow-hidden border border-gray-100 bg-white shadow-sm"
                          >
                            <img
                              src={img}
                              alt={`review-image-${idx}`}
                              className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
