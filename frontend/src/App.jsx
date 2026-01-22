import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import MainDisplay from "./pages/MainDisplay";
import Featured from "./pages/Featured";
import AboutUs from "./pages/AboutUs";
import Clothes from "./pages/Clothes";
import Accessory from "./pages/Accessory";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminProduct from "./pages/AdminProduct";
import Profile from "./pages/Profile";
import AdminUserManagement from "./pages/AdminUserManagement";
import VirtualTryOn from "./pages/VirtualTryOn";
import ProductDetail from "./pages/ProductDetail";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
          },
        }}
      />
      
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<MainDisplay />} />
          <Route path="/featured" element={<Featured />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/clothes" element={<Clothes />} />
          <Route path="/clothes/:categorySlug" element={<Clothes />} />
          <Route path="/accessory" element={<Accessory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/products" element={<AdminProduct />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="/virtual-try-on" element={<VirtualTryOn />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
        </Route>
      </Routes>
    </>
  );
}
