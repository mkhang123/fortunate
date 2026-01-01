import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

  // Tạo Token JWT
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user, token };
};