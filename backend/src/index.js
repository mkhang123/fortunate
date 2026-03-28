import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import productRoutes from "./routes/product.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wishlistRoutes from "./routes/wishlist.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.routes.js";
import orderRoutes from "./routes/order.routes.js";
import vtonRoutes from './routes/vton.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import reviewRoutes from './routes/review.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from "./routes/chat.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import passport from './config/passport.config.js';

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // URL của Vite/React
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize()); // Google OAuth
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/vton', vtonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/products/:productId/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/brands", brandRoutes);


// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
