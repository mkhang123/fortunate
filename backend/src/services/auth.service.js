import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email đã được sử dụng');
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.create({
    data: { email, password: hashedPassword, name }
  });
};

export const login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Tài khoản không tồn tại');
  if (user.isActive === false) {
    throw Object.assign(new Error('Tài khoản của bạn đã bị chặn'), { statusCode: 403 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Mật khẩu không chính xác');
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }
  });

  return { user, accessToken, refreshToken };
};

export const refresh = async (token) => {
  if (!token) throw Object.assign(new Error('Không có refresh token'), { statusCode: 401 });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Refresh token không hợp lệ hoặc đã hết hạn'), { statusCode: 403 });
  }
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user || user.refreshToken !== token) {
    throw Object.assign(new Error('Refresh token đã bị vô hiệu hóa'), { statusCode: 403 });
  }
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken };
};

export const logout = async (token) => {
  if (!token) throw Object.assign(new Error('Không có refresh token'), { statusCode: 400 });
  await prisma.user.updateMany({
    where: { refreshToken: token },
    data: { refreshToken: null }
  });
};

export const googleLogin = async (googleUser) => {
  if (googleUser?.isActive === false) {
    throw Object.assign(new Error('Tài khoản của bạn đã bị chặn'), { statusCode: 403 });
  }

  const { accessToken, refreshToken } = generateTokens(googleUser.id, googleUser.role);
  await prisma.user.update({
    where: { id: googleUser.id },
    data: { refreshToken },
  });

  return {
    user: {
      id: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.avatar,
      role: googleUser.role,
    },
    accessToken,
    refreshToken,
  };
};