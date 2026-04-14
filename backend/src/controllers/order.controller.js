import { OKResponse, CreatedResponse } from "../response/success.js";
import { BadRequestError } from "../response/error.js";
import OrderService from "../services/order.service.js";
import { generateInvoicePDF } from "../utils/generateInvoicePDF.js";

class OrderController {
    /**
     * Create order from cart
     * POST /api/orders
     */
    static async createOrder(req, res) {
        try {
            const userId = req.user.id;
            const orderData = req.body;

            // Validate required fields
            const {
                receiverName,
                receiverPhone,
                receiverEmail,
                shippingAddress,
                paymentMethod,
            } = orderData;

            if (!receiverName || !receiverPhone || !receiverEmail || !shippingAddress) {
                throw new BadRequestError(
                    "Missing required fields: receiverName, receiverPhone, receiverEmail, shippingAddress"
                );
            }

            const result = await OrderService.createOrderFromCart(userId, orderData);

            console.log(`[ORDER] Created order #${result.order.id} for user ${userId}`);

            new CreatedResponse({
                message: "Order created successfully",
                metadata: result,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Create order for guest checkout
     * POST /api/orders/guest
     */
    static async createGuestOrder(req, res) {
        try {
            const orderData = req.body;
            const {
                receiverName,
                receiverPhone,
                receiverEmail,
                shippingAddress,
                items,
            } = orderData;

            if (!receiverName || !receiverPhone || !receiverEmail || !shippingAddress) {
                throw new BadRequestError(
                    "Missing required fields: receiverName, receiverPhone, receiverEmail, shippingAddress"
                );
            }

            if (!Array.isArray(items) || items.length === 0) {
                throw new BadRequestError("Giỏ hàng trống");
            }

            const result = await OrderService.createOrderForGuest(orderData);

            console.log(`[ORDER] Created guest order #${result.order.id}`);

            new CreatedResponse({
                message: "Guest order created successfully",
                metadata: result,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user's orders
     * GET /api/orders/me
     */
    static async getUserOrders(req, res) {
        try {
            const userId = req.user.id;

            const orders = await OrderService.getOrdersByUserId(userId);

            new OKResponse({
                metadata: orders,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get order by ID
     * GET /api/orders/:id
     */
    static async getOrderById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const order = await OrderService.findById(+id);

            // Check if user owns this order or is admin
            if (order.userId !== userId && req.user.role !== "ADMIN") {
                throw new BadRequestError("Unauthorized to view this order");
            }

            new OKResponse({
                metadata: order,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get guest order by ID (requires receiver verification)
     * GET /api/orders/guest/:id?email=...&phone=...
     */
    static async getGuestOrderById(req, res) {
        try {
            const { id } = req.params;
            const email = (req.query.email || "").toString().trim().toLowerCase();
            const phone = (req.query.phone || "").toString().replace(/\s/g, "");

            if (!email || !phone) {
                throw new BadRequestError("Email và số điện thoại là bắt buộc");
            }

            const order = await OrderService.findById(+id);
            const orderEmail = (order.receiverEmail || "").trim().toLowerCase();
            const orderPhone = (order.receiverPhone || "").replace(/\s/g, "");

            if (orderEmail !== email || orderPhone !== phone) {
                throw new BadRequestError("Không thể xác thực thông tin đơn hàng");
            }

            new OKResponse({
                metadata: order,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all orders (Admin)
     * GET /api/orders
     */
    static async getAllOrders(req, res) {
        try {
            const { status, page, limit, search } = req.query;

            const filters = {
                status,
                page: page ? +page : 1,
                limit: limit ? +limit : 20,
                search,
            };

            const result = await OrderService.getAllOrders(filters);

            new OKResponse({
                metadata: result,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update order status (Admin)
     * PATCH /api/orders/:id/status
     */
    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status) {
                throw new BadRequestError("Status is required");
            }

            const order = await OrderService.updateOrderStatus(+id, status);

            console.log(`[ORDER] Updated order #${id} status to ${status}`);

            new OKResponse({
                message: "Order status updated successfully",
                metadata: order,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Download invoice PDF for authenticated user
     * GET /api/orders/:id/invoice
     */
    static async downloadInvoice(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const order = await OrderService.findById(+id);

            if (order.userId !== userId && req.user.role !== "ADMIN") {
                throw new BadRequestError("Unauthorized to access this order");
            }

            generateInvoicePDF(order, res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Download invoice PDF for guest order
     * GET /api/orders/guest/:id/invoice?email=...&phone=...
     */
    static async downloadGuestInvoice(req, res) {
        try {
            const { id } = req.params;
            const email = (req.query.email || "").toString().trim().toLowerCase();
            const phone = (req.query.phone || "").toString().replace(/\s/g, "");

            if (!email || !phone) {
                throw new BadRequestError("Email và số điện thoại là bắt buộc");
            }

            const order = await OrderService.findById(+id);
            const orderEmail = (order.receiverEmail || "").trim().toLowerCase();
            const orderPhone = (order.receiverPhone || "").replace(/\s/g, "");

            if (orderEmail !== email || orderPhone !== phone) {
                throw new BadRequestError("Không thể xác thực thông tin đơn hàng");
            }

            generateInvoicePDF(order, res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete order (Admin)
     * DELETE /api/orders/:id
     */
    static async deleteOrder(req, res) {
        try {
            const { id } = req.params;

            await OrderService.deleteOrder(+id);

            console.log(`[ORDER] Deleted order #${id}`);

            new OKResponse({
                message: "Order deleted successfully",
            }).send(res);
        } catch (error) {
            throw error;
        }
    }
}

export default OrderController;
