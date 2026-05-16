import prisma from '../config/prisma.js';

class ReviewRepository {
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
    async create({ userId, productId, rating, comment, images = [], verifiedPurchase }) {
        return await prisma.review.create({
            data: {
                userId: Number(userId),
                productId: Number(productId),
                rating: Number(rating),
                comment: comment || null,
                images: Array.isArray(images) ? images : [],
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
