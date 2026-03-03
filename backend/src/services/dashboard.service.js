import prisma from "../config/prisma.js";

class DashboardService {
    /**
     * Lấy tất cả dữ liệu tổng quan cho admin dashboard
     */
    static async getDashboardStats() {
        const [
            totalOrders,
            totalRevenue,
            totalVtonSessions,
            totalUsers,
            topSellingProducts,
            recentVtonSessions,
            ordersByStatus,
            revenueByDay,
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
                    variant: {
                        include: {
                            product: { select: { name: true } },
                        },
                    },
                },
            }),

            // Đơn hàng theo trạng thái
            prisma.order.groupBy({
                by: ["status"],
                _count: { id: true },
            }),

            // Doanh thu 12 tháng gần nhất
            prisma.$queryRaw`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'MM/YYYY') as month,
          DATE_TRUNC('month', "createdAt") as month_date,
          SUM(total) as revenue,
          COUNT(id) as orders
        FROM "Order"
        WHERE 
          "createdAt" >= NOW() - INTERVAL '12 months'
          AND status IN ('PAID', 'SHIPPED', 'COMPLETED')
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month_date ASC
      `,
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
            // Convert BigInt từ raw SQL sang Number
            revenueByMonth: revenueByDay.map((row) => ({
                month: row.month,
                revenue: Number(row.revenue),
                orders: Number(row.orders),
            })),
        };
    }
}

export default DashboardService;
