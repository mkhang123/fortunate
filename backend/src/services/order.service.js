import OrderRepository from "../repositories/order.repository.js";
import cartRepository from "../repositories/cart.repository.js";
import { NotFoundError, BadRequestError } from "../response/error.js";

class OrderService {
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

        // 1. Get cart with items
        const cart = await cartRepository.getOrCreateCart(userId);

        if (!cart.items || cart.items.length === 0) {
            throw new BadRequestError("Giỏ hàng trống");
        }

        // 2. Calculate total and prepare order items
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

        // 3. Create order
        const order = await OrderRepository.createOrder(
            {
                userId,
                receiverName,
                receiverPhone,
                receiverEmail,
                shippingAddress,
                city: city || "TP. Hồ Chí Minh",
                notes,
                total,
                status: "PENDING",
            },
            orderItems
        );

        // 4. Clear cart after successful order creation
        await cartRepository.clearCart(cart.id);

        // 5. Return order with payment info
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

        // Validate status transitions
        const validStatuses = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
        if (!validStatuses.includes(status)) {
            throw new BadRequestError("Invalid order status");
        }

        return await OrderRepository.updateOrderStatus(orderId, status);
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
