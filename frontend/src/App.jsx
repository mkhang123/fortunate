import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import MainDisplay from "./pages/MainDisplay";
import Featured from "./pages/Featured";
import AboutUs from "./pages/AboutUs";
import Clothes from "./pages/Clothes";
import Accessory from "./pages/Accessory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminProduct from "./pages/AdminProduct";
import AdminProductForm from "./pages/AdminProductForm";
import Profile from "./pages/Profile";
import AdminUserManagement from "./pages/AdminUserManagement";
import VirtualTryOn from "./pages/VirtualTryOn";
import ProductDetail from "./pages/ProductDetail";
import { Toaster } from "react-hot-toast";
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import AdminOrders from './pages/AdminOrders';
import AdminDashboard from './pages/AdminDashboard';
import GoogleCallback from './pages/GoogleCallback';
import AdminVtonHistory from "./pages/AdminVtonHistory";
import PrivateRoute from "./components/PrivateRoute";
import BodyProfileModal from "./components/BodyProfileModal";
import api from "./apis/axiosConfig";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [isAuthVerified, setIsAuthVerified] = useState(false);

  useEffect(() => {
    const user = (() => {
      try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();

    // Nếu không có user, coi như đã xác thực xong (chưa đăng nhập)
    if (!user) {
      setIsAuthVerified(true);
      return;
    }

    // Role ADMIN không cần check BodyProfile, coi như xong
    if (user.role === "ADMIN") {
      setIsAuthVerified(true);
      return;
    }

    // Ưu tiên 1: flag được set ngay tại thời điểm login (không cần chờ API)
    if (localStorage.getItem("needsBodyProfile") === "1") {
      setShowBodyModal(true);
      setIsAuthVerified(true);
      return;
    }

    // Ưu tiên 2: fallback cho session cũ chưa có flag — chỉ check 1 lần/session
    if (sessionStorage.getItem("bodyProfileChecked")) {
      setIsAuthVerified(true);
      return;
    }

    // Thực hiện xác thực session chính thức
    api.get("/users/me")
      .then((res) => {
        sessionStorage.setItem("bodyProfileChecked", "1");
        if (!res.data.data?.bodyProfile) {
          localStorage.setItem("needsBodyProfile", "1");
          setShowBodyModal(true);
        }
      })
      .catch(() => {
        // Token hết hạn hoặc lỗi mạng — logic refresh trong axiosConfig sẽ tự xử lý
      })
      .finally(() => {
        setIsAuthVerified(true);
      });
  }, []);

  return (
    <>
      <Toaster
        position="bottom-left"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "bold",
          },
        }}
      />

      {showBodyModal && (
        <BodyProfileModal
          onComplete={() => {
            setShowBodyModal(false);
            localStorage.removeItem("needsBodyProfile");
            sessionStorage.setItem("bodyProfileChecked", "1");
          }}
        />
      )}

      <ScrollToTop />
      <Routes>
        {/* Admin area — Tách biệt hoàn toàn khỏi MainLayout của người dùng */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProduct />} />
          <Route path="/admin/products/form" element={<AdminProductForm />} />
          <Route path="/admin/products/form/:id" element={<AdminProductForm />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/admin/vton-history" element={<AdminVtonHistory />} />
        </Route>

        {/* User routes — Sử dụng MainLayout (Header, Footer cửa hàng) */}
        <Route element={<MainLayout isAuthVerified={isAuthVerified} />}>
          <Route path="/" element={<MainDisplay />} />
          <Route path="/featured" element={<Featured />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/clothes" element={<Clothes />} />
          <Route path="/clothes/:categorySlug" element={<Clothes />} />
          <Route path="/accessory" element={<Accessory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để xem thông tin tài khoản!">
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="/virtual-try-on" element={<VirtualTryOn />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route
            path="cart"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để xem giỏ hàng!">
                <Cart />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để thanh toán!">
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để xem đơn hàng!">
                <OrderConfirmation />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để xem đơn hàng của bạn!">
                <MyOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-orders/:orderId"
            element={
              <PrivateRoute message="Vui lòng đăng nhập để xem chi tiết đơn hàng!">
                <OrderDetail />
              </PrivateRoute>
            }
          />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
        </Route>
      </Routes>
    </>
  );
}
