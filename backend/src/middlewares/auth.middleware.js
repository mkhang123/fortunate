import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không tìm thấy Token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gán user thật từ Token (id lúc này là số nguyên)
        next();
    } catch (error) {
        // Phân biệt token hết hạn vs token không hợp lệ để frontend xử lý đúng
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token đã hết hạn", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ message: "Token không hợp lệ" });
    }
};