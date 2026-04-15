import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

/**
 * Nếu có accessToken hợp lệ → gán req.user; không có hoặc lỗi → bỏ qua (không 401).
 * Dùng cho chat / tra cứu đơn khi vừa hỗ trợ khách vừa hỗ trợ user đăng nhập.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  const bearerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = req.cookies?.accessToken;
  const token = bearerToken || cookieToken;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number(decoded.id);
    if (userId && !Number.isNaN(userId)) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true },
      });
      if (user && user.isActive === false) {
        return next();
      }
    }
    req.user = decoded;
  } catch {
    // Token hết hạn / sai → coi như chưa đăng nhập
  }
  next();
};
