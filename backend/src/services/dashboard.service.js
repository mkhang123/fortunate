import prisma from "../config/prisma.js";

class DashboardService {
    /**
     * Lấy tất cả dữ liệu tổng quan cho admin dashboard
     */
    static async getDashboardStats(options = {}) {
        const { filterType = "month", year = new Date().getFullYear(), month = null } = options;

        const rangeStart =
            filterType === "day"
                ? new Date(year, (month || 1) - 1, 1, 0, 0, 0, 0)
                : new Date(year, 0, 1, 0, 0, 0, 0);
        const rangeEnd =
            filterType === "day"
                ? new Date(year, month || 1, 1, 0, 0, 0, 0)
                : new Date(year + 1, 0, 1, 0, 0, 0, 0);

        const [
            totalOrders,
            totalRevenue,
            totalVtonSessions,
            totalUsers,
            topSellingProducts,
            recentVtonSessions,
            ordersByStatus,
            revenueOrders,
        ] = await Promise.all([
            // Tổng số đơn hàng
            prisma.order.count(),

            // Tổng doanh thu (chỉ tính đơn PAID, SHIPPED, COMPLETED)
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
            }),

            // Tổng số phiên thử đồ ảo
            prisma.virtualTryOnSession.count(),

            // Tổng số người dùng (trừ admin)
            prisma.user.count({
                where: { role: "USER" },
            }),

            // Top 10 sản phẩm bán chạy theo số lượng
            prisma.orderItem.groupBy({
                by: ["variantId"],
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: "desc" } },
                take: 10,
            }),

            // 10 phiên thử đồ ảo gần nhất
            prisma.virtualTryOnSession.findMany({
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    product: { select: { name: true, images: true } },
                    aiModel: { select: { name: true } },
                },
            }),

            // Đơn hàng theo trạng thái
            prisma.order.groupBy({
                by: ["status"],
                _count: { id: true },
            }),

            // Dữ liệu doanh thu theo bộ lọc biểu đồ
            prisma.order.findMany({
                where: {
                    status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
                    createdAt: {
                        gte: rangeStart,
                        lt: rangeEnd,
                    },
                },
                select: {
                    createdAt: true,
                    total: true,
                },
                orderBy: { createdAt: "asc" },
            }),
        ]);

        // Enrich top selling products với tên sản phẩm
        const productIds = topSellingProducts.map((item) => item.variantId);
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: productIds } },
            include: {
                product: { select: { name: true, images: true } },
            },
        });

        const variantMap = {};
        variants.forEach((v) => {
            variantMap[v.id] = v;
        });

        const enrichedTopProducts = topSellingProducts.map((item) => {
            const variant = variantMap[item.variantId];
            return {
                variantId: item.variantId,
                quantitySold: Number(item._sum.quantity) || 0,
                productName: variant?.product?.name || "Không xác định",
                color: variant?.color || "",
                size: variant?.size || "",
                image: variant?.product?.images?.[0] || null,
            };
        });

        // Format order status counts
        const statusMap = {};
        ordersByStatus.forEach((s) => {
            statusMap[s.status] = s._count.id;
        });

        const revenueMap = new Map();
        for (const order of revenueOrders) {
            const createdAt = new Date(order.createdAt);
            const key =
                filterType === "day"
                    ? createdAt.getDate()
                    : createdAt.getMonth() + 1;
            revenueMap.set(key, (revenueMap.get(key) || 0) + Number(order.total || 0));
        }

        const revenueChart = Array.from(revenueMap.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([key, revenue]) => ({
                label: filterType === "day" ? `${key}/${month}` : `T${key}`,
                revenue,
            }));

        return {
            summary: {
                totalOrders,
                totalRevenue: totalRevenue._sum.total || 0,
                totalVtonSessions,
                totalUsers,
            },
            topSellingProducts: enrichedTopProducts,
            recentVtonSessions,
            ordersByStatus: {
                PENDING: Number(statusMap.PENDING || 0),
                PAID: Number(statusMap.PAID || 0),
                SHIPPED: Number(statusMap.SHIPPED || 0),
                COMPLETED: Number(statusMap.COMPLETED || 0),
                CANCELLED: Number(statusMap.CANCELLED || 0),
            },
            revenueChart,
        };
    }

    /**
     * Lấy danh sách lịch sử thử đồ ảo cho admin
     */
    static async getVtonSessions(options = {}) {
        const { page = 1, limit = 10, status, search } = options;
        const skip = (page - 1) * limit;

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { user: { name: { contains: search, mode: "insensitive" } } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { variant: { product: { name: { contains: search, mode: "insensitive" } } } },
            ];
        }

        const [sessions, total] = await Promise.all([
            prisma.virtualTryOnSession.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    product: { select: { name: true, images: true } },
                    aiModel: { select: { name: true } },
                },
            }),
            prisma.virtualTryOnSession.count({ where }),
        ]);

        return {
            sessions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}

export default DashboardService;
