import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Tạo cặp token: accessToken (15 phút) + refreshToken (7 ngày)
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (userData) => {
  const { email, password, name } = userData;

  // 1. Kiểm tra email tồn tại
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email đã được sử dụng');

  // 2. Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Lưu user mới
  return await prisma.user.create({
    data: { email, password: hashedPassword, name }
  });
};

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Tài khoản không tồn tại');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Mật khẩu không chính xác');

  // Tạo cặp token mới
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  // Lưu refreshToken vào DB (ghi đè session cũ nếu có)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return { user, accessToken, refreshToken };
};

export const refresh = async (token) => {
  if (!token) throw Object.assign(new Error('Không có refresh token'), { statusCode: 401 });

  // 1. Verify chữ ký và hạn của refreshToken
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Refresh token không hợp lệ hoặc đã hết hạn'), { statusCode: 403 });
  }

  // 2. Kiểm tra token có khớp với DB không (tránh dùng token cũ sau logout)
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.refreshToken !== token) {
    throw Object.assign(new Error('Refresh token đã bị vô hiệu hóa'), { statusCode: 403 });
  }

  // 3. Tạo accessToken mới
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken };
};

export const logout = async (token) => {
  if (!token) throw Object.assign(new Error('Không có refresh token'), { statusCode: 400 });

  // Tìm user có refreshToken này và xóa đi
  await prisma.user.updateMany({
    where: { refreshToken: token },
    data: { refreshToken: null }
  });
};