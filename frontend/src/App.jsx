import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import MainDisplay from "./pages/MainDisplay";
import Featured from "./pages/Featured";
import Sneaker from "./pages/Sneaker";
import Clothes from "./pages/Clothes";
import Accessory from "./pages/Accessory";
import Login from "./pages/Login"; 
import Register from "./pages/Register";
import AdminProduct from "./pages/AdminProduct";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<MainDisplay />} />
        <Route path="/featured" element={<Featured />} />
        <Route path="/sneaker" element={<Sneaker />} />
        <Route path="/clothes" element={<Clothes />} />
        <Route path="/accessory" element={<Accessory />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/products" element={<AdminProduct />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
