import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Dùng để chuyển trang mà không load lại web
import { loginUser } from "../apis/auth.api"; // Gọi hàm API đã tạo trong folder apis

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Hàm xử lý khi nhấn nút Đăng nhập
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser(formData);

      if (response.data.success) {
        // 1. Lưu Token và thông tin User vào localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // 2. Chuyển hướng về trang chủ (hoặc trang Dashboard)
        navigate("/");
      }
    } catch (error) {
      // Hiển thị lỗi từ Backend trả về (ví dụ: Sai mật khẩu)
      alert(
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2>Đăng Nhập</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Email:</label>
          <input
            type="email"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Mật khẩu:</label>
          <input
            type="password"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="********"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Đang xử lý..." : "Đăng Nhập"}
        </button>
      </form>

      <p style={{ marginTop: "15px", textAlign: "center" }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
      </p>
    </div>
  );
};

export default Login;
