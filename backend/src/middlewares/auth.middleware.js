import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Không tìm thấy Token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Gán user thật từ Token (id lúc này sẽ là UUID String)
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token không hợp lệ" });
    }
};