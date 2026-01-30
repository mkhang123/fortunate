import prisma from "../config/prisma.js";

class PaymentRepository {
    /**
     * Create a new payment record
     */
    static async createPayment(data) {
        return await prisma.payment.create({
            data,
        });
    }

    /**
     * Find payment by transaction reference
     */
    static async findPaymentByTxnRef(txnRef) {
        return await prisma.payment.findUnique({
            where: { txnRef },
            include: {
                order: true,
            },
        });
    }

    /**
     * Find payment by order ID
     */
    static async findPaymentByOrderId(orderId) {
        return await prisma.payment.findUnique({
            where: { orderId },
            include: {
                order: true,
            },
        });
    }

    /**
     * Update payment by transaction reference
     */
    static async updatePaymentByTxnRef(txnRef, data) {
        return await prisma.payment.update({
            where: { txnRef },
            data,
        });
    }

    /**
     * Update payment by order ID
     */
    static async updatePaymentByOrderId(orderId, data) {
        return await prisma.payment.update({
            where: { orderId },
            data,
        });
    }
}

export default PaymentRepository;
