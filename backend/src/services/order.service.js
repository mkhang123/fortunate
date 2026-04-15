import OrderRepository from "../repositories/order.repository.js";
import cartRepository from "../repositories/cart.repository.js";
import { NotFoundError, BadRequestError } from "../response/error.js";
import notificationService from "./notification.service.js";
import prisma from "../config/prisma.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

class OrderService {
    static async getGuestCheckoutUserId(tx) {
        const guestEmail = "guest.checkout@fortunate.local";
        const guestName = "Guest Checkout";

        const existing = await tx.user.findUnique({
            where: { email: guestEmail },
            select: { id: true },
        });

        if (existing) return existing.id;

        const tempPassword = crypto.randomBytes(16).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const created = await tx.user.create({
            data: {
                email: guestEmail,
                name: guestName,
                password: hashedPassword,
            },
            select: { id: true },
        });

        return created.id;
    }

    /**
     * Create order from user's cart
     */
    static async createOrderFromCart(userId, orderData) {
        const {
            receiverName,
            receiverPhone,
            receiverEmail,
            shippingAddress,
            city,
            paymentMethod = "VNPAY",
            notes,
        } = orderData;

        // Thực hiện toàn bộ thao tác tạo đơn + trừ tồn kho trong transaction
        const order = await prisma.$transaction(async (tx) => {
            // 1. Lấy giỏ hàng trong transaction (đảm bảo dữ liệu mới nhất)
            const cart = await tx.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            variant: true,
                        },
                    },
                },
            });

            if (!cart || !cart.items || cart.items.length === 0) {
                throw new BadRequestError("Giỏ hàng trống");
            }

            // 2. Tính tổng tiền và chuẩn bị danh sách order items
            let total = 0;
            const orderItems = cart.items.map((item) => {
                const price = item.variant.price;
                const quantity = item.quantity;
                total += price * quantity;

                return {
                    variantId: item.variantId,
                    price: price, // Snapshot price at time of purchase
                    quantity: quantity,
                };
            });

            // 3. Trừ tồn kho theo từng biến thể size
            for (const item of cart.items) {
                const result = await tx.productVariant.updateMany({
                    where: {
                        id: item.variantId,
                        stock: {
                            gte: item.quantity,
                        },
                    },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });

                if (result.count === 0) {
                    throw new BadRequestError(
                        "Sản phẩm không đủ số lượng trong kho"
                    );
                }
            }

            // 4. Tạo đơn hàng (+ bản ghi thanh toán COD để admin / chi tiết đơn hiển thị đúng)
            const orderCreateData = {
                userId,
                receiverName,
                receiverPhone,
                receiverEmail,
                shippingAddress,
                city: city || "TP. Hồ Chí Minh",
                notes,
                total,
                status: "PENDING",
                items: {
                    create: orderItems,
                },
            };

            if (paymentMethod === "COD") {
                orderCreateData.payment = {
                    create: {
                        method: "COD",
                        status: "PENDING",
                        amount: total,
                    },
                };
            }

            const createdOrder = await tx.order.create({
                data: orderCreateData,
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

            // 5. Xóa giỏ hàng sau khi tạo đơn thành công
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return createdOrder;
        });

        // 5. Gửi thông báo đặt hàng thành công cho user
        notificationService.notifyOrderPlaced(userId, order.id).catch(console.error);

        // 6. Return order with payment info
        // Payment record will be created by payment controller
        let result = {
            order,
            success: true,
        };

        if (paymentMethod === "VNPAY") {
            result.requiresPayment = true;
            result.paymentMethod = "VNPAY";
        }

        return result;
    }

    /**
     * Create order from guest cart items
     */
    static async createOrderForGuest(orderData) {
        const {
            receiverName,
            receiverPhone,
            receiverEmail,
            shippingAddress,
            city,
            paymentMethod = "VNPAY",
            notes,
            items,
        } = orderData;

        const normalizedItems = (items || []).map((item) => ({
            variantId: Number(item.variantId),
            quantity: Number(item.quantity),
        }));

        if (normalizedItems.some((item) => !item.variantId || !item.quantity || item.quantity < 1)) {
            throw new BadRequestError("Dữ liệu sản phẩm không hợp lệ");
        }

        const order = await prisma.$transaction(async (tx) => {
            const guestUserId = await this.getGuestCheckoutUserId(tx);

            const variantIds = [...new Set(normalizedItems.map((item) => item.variantId))];
            const variants = await tx.productVariant.findMany({
                where: { id: { in: variantIds } },
                include: { product: true },
            });

            const variantMap = new Map(variants.map((variant) => [variant.id, variant]));
            let total = 0;
            const orderItems = [];

            for (const item of normalizedItems) {
                const variant = variantMap.get(item.variantId);
                if (!variant) {
                    throw new BadRequestError("Sản phẩm không tồn tại");
                }

                const updated = await tx.productVariant.updateMany({
                    where: {
                        id: item.variantId,
                        stock: { gte: item.quantity },
                    },
                    data: {
                        stock: { decrement: item.quantity },
                    },
                });

                if (updated.count === 0) {
                    throw new BadRequestError("Sản phẩm không đủ số lượng trong kho");
                }

                total += variant.price * item.quantity;
                orderItems.push({
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: variant.price,
                });
            }

            const guestOrderData = {
                userId: guestUserId,
                receiverName,
                receiverPhone,
                receiverEmail,
                shippingAddress,
                city: city || "TP. Hồ Chí Minh",
                notes,
                total,
                status: "PENDING",
                items: {
                    create: orderItems,
                },
            };

            if (paymentMethod === "COD") {
                guestOrderData.payment = {
                    create: {
                        method: "COD",
                        status: "PENDING",
                        amount: total,
                    },
                };
            }

            return tx.order.create({
                data: guestOrderData,
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
        });

        return {
            order,
            success: true,
            requiresPayment: paymentMethod === "VNPAY",
            paymentMethod,
        };
    }

    /**
     * Find order by ID with validation
     */
    static async findById(orderId) {
        const order = await OrderRepository.findOrderById(orderId);

        if (!order) {
            throw new NotFoundError("Order not found");
        }

        return order;
    }

    /**
     * Get all orders with filters (Admin)
     */
    static async getAllOrders(filters) {
        return await OrderRepository.findAllOrders(filters);
    }

    /**
     * Update payment status based on VNPAY response code
     */
    static async updatePaymentStatus(orderId, vnpayResponseCode) {
        const order = await this.findById(orderId);

        // Map VNPAY response codes to order status
        let orderStatus = order.status;

        if (vnpayResponseCode === "00") {
            // Payment successful
            orderStatus = "PAID";
        } else {
            // Payment failed - keep current status or mark as cancelled
            // You can customize this logic based on your business requirements
            orderStatus = "CANCELLED";
        }

        return await OrderRepository.updateOrderStatus(orderId, orderStatus);
    }

    /**
     * Update order status (Admin)
     */
    static async updateOrderStatus(orderId, status) {
        const order = await this.findById(orderId);
        const previousStatus = order.status;

        // Validate status transitions
        const validStatuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError("Invalid order status");
        }

        // Khi đơn bị hủy trước khi giao/hoàn tất, trả lại kho theo các biến thể
        // (hiện hệ thống trừ kho ngay khi tạo đơn)
        let updated;
        if (
            status === "CANCELLED" &&
            previousStatus !== "CANCELLED" &&
            previousStatus !== "COMPLETED"
        ) {
            await prisma.$transaction(async (tx) => {
                // Hoàn kho: cộng lại đúng số lượng đã trừ khi tạo đơn
                for (const item of order.items || []) {
                    const variantId = item.variantId ?? item.variant?.id;
                    const quantity = item.quantity;
                    if (!variantId || !quantity) continue;

                    await tx.productVariant.update({
                        where: { id: variantId },
                        data: { stock: { increment: quantity } },
                    });
                }

                updated = await tx.order.update({
                    where: { id: orderId },
                    data: { status },
                });
            });
        } else {
            updated = await OrderRepository.updateOrderStatus(orderId, status);
        }

        // Gửi thông báo cho user theo trạng thái mới
        const notifyMap = {
            PAID:      () => notificationService.notifyOrderPaid(order.userId, orderId),
            SHIPPED:   () => notificationService.notifyOrderShipped(order.userId, orderId),
            COMPLETED: () => notificationService.notifyOrderCompleted(order.userId, orderId),
            CANCELLED: () => notificationService.notifyOrderCancelled(order.userId, orderId),
        };
        if (notifyMap[status]) {
            notifyMap[status]().catch(console.error);
        }

        return updated;
    }

    /**
     * Validate order for payment
     */
    static async validateOrderForPayment(orderId, amount) {
        const order = await this.findById(orderId);

        // Check if order already paid
        if (order.status === "PAID" || order.status === "COMPLETED") {
            throw new BadRequestError("Order already paid");
        }

        // Check if order is cancelled
        if (order.status === "CANCELLED") {
            throw new BadRequestError("Cannot pay for cancelled order");
        }

        // Verify amount matches
        if (Math.abs(order.total - amount) > 0.01) {
            throw new BadRequestError(
                `Amount mismatch. Expected ${order.total}, got ${amount}`
            );
        }

        // Check if payment already exists
        if (order.payment) {
            if (order.payment.status === "SUCCESS") {
                throw new BadRequestError("Order already has successful payment");
            }
            // If payment exists but not successful, we can create a new one
        }

        return order;
    }

    /**
     * Get orders by user ID
     */
    static async getOrdersByUserId(userId) {
        return await OrderRepository.findOrdersByUserId(userId);
    }

    /**
     * Delete order (Admin)
     */
    static async deleteOrder(orderId) {
        const order = await this.findById(orderId);

        // Optional: Prevent deletion of completed orders
        if (order.status === "COMPLETED") {
            throw new BadRequestError("Cannot delete completed orders");
        }

        return await OrderRepository.deleteOrder(orderId);
    }
}

export default OrderService;
