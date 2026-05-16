import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

export const authMiddleware = async (req, res, next) => {
    const bearerToken = req.headers.authorization?.split(" ")[1];
    const cookieToken = req.cookies?.accessToken;
    const token = bearerToken || cookieToken;
    if (!token) return res.status(401).json({ message: "Không tìm thấy Token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = Number(decoded.id);
        if (userId && !Number.isNaN(userId)) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { isActive: true, role: true },
            });
            if (user && user.isActive === false) {
                return res.status(403).json({ message: "Tài khoản của bạn đã bị chặn" });
            }
        }

        req.user = decoded; // Gán user thật từ Token (id lúc này là số nguyên)
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token đã hết hạn", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ message: "Token không hợp lệ" });
    }
};