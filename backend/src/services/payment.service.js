import PaymentRepository from "../repositories/payment.repository.js";
import { NotFoundError } from "../response/error.js";

class PaymentService {
    /**
     * Get available payment methods
     */
    static async getPaymentMethods() {
        return [
            { value: "VNPAY", label: "VNPay", description: "Thanh toán qua cổng VNPay" },
            { value: "COD", label: "COD", description: "Thanh toán khi nhận hàng" },
        ];
    }

    /**
     * Get payment status options
     */
    static async getPaymentStatuses() {
        return [
            { value: "PENDING", label: "Chờ thanh toán", color: "warning" },
            { value: "SUCCESS", label: "Thành công", color: "success" },
            { value: "FAILED", label: "Thất bại", color: "error" },
        ];
    }

    /**
     * Create a payment transaction record
     */
    static async createPaymentTransaction(data) {
        const { orderId, amount, txnRef, method = "VNPAY", orderInfo } = data;

        return await PaymentRepository.createPayment({
            orderId,
            amount,
            txnRef,
            method,
            status: "PENDING",
            vnp_OrderInfo: orderInfo,
        });
    }

    /**
     * Update payment transaction after VNPAY response
     */
    static async updatePaymentTransaction(data) {
        const {
            txnRef,
            responseCode,
            transactionNo,
            bankCode,
            metadata,
        } = data;

        const status = responseCode === "00" ? "SUCCESS" : "FAILED";
        const paidAt = responseCode === "00" ? new Date() : null;

        return await PaymentRepository.updatePaymentByTxnRef(txnRef, {
            status,
            vnp_ResponseCode: responseCode,
            vnp_TransactionNo: transactionNo,
            paidAt,
            metadata: {
                ...(metadata || {}),
                bankCode,
                updatedAt: new Date().toISOString(),
            },
        });
    }

    /**
     * Get payment by order ID
     */
    static async getPaymentByOrderId(orderId) {
        const payment = await PaymentRepository.findPaymentByOrderId(orderId);

        if (!payment) {
            throw new NotFoundError("Payment not found");
        }

        return payment;
    }

    /**
     * Get payment by transaction reference
     */
    static async getPaymentByTxnRef(txnRef) {
        const payment = await PaymentRepository.findPaymentByTxnRef(txnRef);

        if (!payment) {
            throw new NotFoundError("Payment not found");
        }

        return payment;
    }
}

export default PaymentService;
