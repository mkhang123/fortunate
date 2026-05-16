import prisma from "../config/prisma.js";

class OrderRepository {
    /**
     * Create a new order with items
     */
    static async createOrder(orderData, items) {
        return await prisma.order.create({
            data: {
                ...orderData,
                items: {
                    create: items,
                },
            },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                payment: true,
            },
        });
    }

    /**
     * Find order by ID with items
     */
    static async findOrderById(orderId) {
        return await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                payment: true,
                user: true,
            },
        });
    }

    /**
     * Find all orders with filters and pagination
     */
    static async findAllOrders(filters = {}) {
        const { status, userId, page = 1, limit = 20, search } = filters;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (userId) {
            where.userId = userId;
        }

        if (search) {
            where.OR = [
                { id: isNaN(search) ? undefined : parseInt(search) },
                { receiverName: { contains: search, mode: 'insensitive' } },
                { receiverPhone: { contains: search } },
            ].filter(Boolean);
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                },
                            },
                        },
                    },
                    payment: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);

        return {
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Update order status
     */
    static async updateOrderStatus(orderId, status) {
        return await prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

    /**
     * Find orders by user ID
     */
    static async findOrdersByUserId(userId) {
        return await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
                payment: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    /**
     * Delete order
     */
    static async deleteOrder(orderId) {
        return await prisma.order.delete({
            where: { id: orderId },
        });
    }
}

export default OrderRepository;
