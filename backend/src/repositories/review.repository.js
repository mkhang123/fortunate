import prisma from '../config/prisma.js';

class ReviewRepository {
    // Lấy tất cả đánh giá của một sản phẩm
    async getByProductId(productId) {
        return await prisma.review.findMany({
            where: { productId: Number(productId) },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Kiểm tra user đã mua sản phẩm này chưa (verifiedPurchase)
    async hasPurchased(userId, productId) {
        const order = await prisma.order.findFirst({
            where: {
                userId: Number(userId),
                status: { in: ['PAID', 'SHIPPED', 'COMPLETED'] },
                items: {
                    some: {
                        variant: { productId: Number(productId) },
                    },
                },
            },
        });
        return !!order;
    }

    // Kiểm tra user đã review sản phẩm này chưa
    async findExisting(userId, productId) {
        return await prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId: Number(userId),
                    productId: Number(productId),
                },
            },
        });
    }

    // Tạo đánh giá mới
    async create({ userId, productId, rating, comment, verifiedPurchase }) {
        return await prisma.review.create({
            data: {
                userId: Number(userId),
                productId: Number(productId),
                rating: Number(rating),
                comment: comment || null,
                verifiedPurchase,
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });
    }
}

export default new ReviewRepository();
