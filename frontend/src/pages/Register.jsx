import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../apis/auth.api'; // Gọi hàm API đã tạo

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra mật khẩu nhập lại
    if (formData.password !== formData.confirmPassword) {
      return alert("Mật khẩu nhập lại không khớp!");
    }

    setLoading(true);
    try {
      // Gửi dữ liệu name, email, password lên Backend
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        navigate('/login'); // Chuyển hướng sang trang đăng nhập
      }
    } catch (error) {
      alert(error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container" style={{ maxWidth: '450px', margin: '50px auto', padding: '30px', border: '1px solid #eee', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>Tạo Tài Khoản</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Họ và tên:</label>
          <input 
            type="text" 
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Nguyễn Văn A"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Email:</label>
          <input 
            type="email" 
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Mật khẩu:</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Ít nhất 6 ký tự"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>Xác nhận mật khẩu:</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? "Đang xử lý..." : "Đăng Ký Ngay"}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Đã có tài khoản? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Đăng nhập tại đây</Link>
      </p>
    </div>
  );
};

export default Register;