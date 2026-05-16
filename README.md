# Fortunate - E-commerce Fashion & Virtual Try-on Platform

Fortunate là một nền tảng thương mại điện tử thời trang hiện đại, tích hợp các công nghệ AI tiên tiến nhằm nâng cao trải nghiệm mua sắm của người dùng. Hệ thống hỗ trợ thử đồ ảo (Virtual Try-on - VTON) và trợ lý ảo AI để gợi ý phối đồ, tư vấn kích thước tự động.

## 🚀 Tính Năng Nổi Bật

- **Mua sắm trực tuyến**: Giỏ hàng, thanh toán VNPAY, quản lý đơn hàng.
- **Thử đồ ảo AI (Virtual Try-On)**: Tích hợp mô hình AI (IDM-VTON) qua Google Colab, Hugging Face hoặc Replicate để ghép đồ lên người dùng.
- **Trợ lý AI (Chatbot)**: Gợi ý trang phục, phối đồ theo phong cách (Basic, Street, Classic) và tư vấn size tự động dựa trên số đo cơ thể bằng Gemini AI.
- **Tài khoản cá nhân**: Đăng nhập bằng Google (OAuth2), lưu trữ số đo cơ thể (Body Profile) và danh sách yêu thích.
- **Quản trị viên (Admin Dashboard)**: Quản lý sản phẩm, đơn hàng, người dùng, cấu hình VTON server và xem thống kê doanh thu trực quan.

## 🛠 Tech Stack

- **Frontend:** React.js, Vite, TailwindCSS v4, React Router, Zustand/Context, Lucide React, React Hot Toast.
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL.
- **Tích hợp bên thứ ba:**
  - AI Models: Google Gemini, Hugging Face, Replicate, Gradio (Google Colab).
  - Thanh toán: VNPAY.
  - Lưu trữ ảnh: Cloudinary.
  - Xác thực: JWT, Google OAuth20.

---

## 💻 Hướng Dẫn Cài Đặt (Installation)

Yêu cầu môi trường:
- Node.js (phiên bản 18.x trở lên)
- PostgreSQL (hoặc MySQL tùy thuộc vào cấu hình DB của bạn)
- npm hoặc yarn

### Bước 1: Clone kho lưu trữ

```bash
git clone https://github.com/your-username/fortunate.git
cd fortunate
```

### Bước 2: Cài đặt và khởi chạy Backend

1. Di chuyển vào thư mục backend và cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Cấu hình biến môi trường:
   Tạo file `.env` trong thư mục `backend/` dựa trên `.env.example` (hoặc cấu hình các key sau):
   ```env
   # Database
   DB_URL="postgresql://user:password@localhost:5432/fortunate_db?schema=public"

   # JWT & Auth
   JWT_SECRET="your_jwt_secret_key"
   FRONTEND_URL="http://localhost:5173"

   # Google OAuth2
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   GOOGLE_CALLBACK_URL="http://localhost:4000/api/auth/google/callback"

   # Cloudinary (Lưu trữ ảnh)
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"

   # Gemini AI
   GEMINI_API_KEY="your_gemini_api_key"

   # VNPAY
   VNP_TMN_CODE="your_vnp_tmn_code"
   VNP_HASH_SECRET="your_vnp_hash_secret"
   VNP_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
   VNP_RETURN_URL="http://localhost:5173/checkout"
   ```

3. Khởi tạo Database (Prisma):
   ```bash
   npx prisma generate
   npx prisma db push
   # (Tùy chọn) Chạy seed data nếu có
   npm run seed
   ```

4. Khởi chạy server Backend:
   ```bash
   npm run dev
   # Server sẽ chạy ở cổng 4000 (http://localhost:4000)
   ```

### Bước 3: Cài đặt và khởi chạy Frontend

1. Mở một terminal mới, di chuyển vào thư mục frontend và cài đặt dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Cấu hình biến môi trường:
   Tạo file `.env` trong thư mục `frontend/` (nếu cần đổi cổng API):
   ```env
   VITE_API_URL="http://localhost:4000/api"
   ```

3. Khởi chạy ứng dụng Frontend:
   ```bash
   npm run dev
   # Giao diện sẽ chạy ở cổng 5173 (http://localhost:5173)
   ```

---

## 🤖 Cấu hình Virtual Try-On (VTON)

Để tính năng thử đồ ảo hoạt động, hệ thống Fortunate hỗ trợ kết nối tới Google Colab chạy IDM-VTON.
1. Mở notebook Colab đã được chuẩn bị sẵn của project.
2. Run các cell để khởi động Gradio Server (`xxxx.gradio.live`).
3. Đăng nhập tài khoản Admin trên Fortunate -> Cài đặt Admin -> Điền link Gradio vào mục **Cấu hình AI Server**.

## 📝 Giấy phép (License)
Dự án được phát triển phục vụ cho Khóa luận tốt nghiệp.
