import moment from "moment";
import crypto from "crypto";
import querystring from "qs";
import { OKResponse } from "../response/success.js";
import { BadRequestError } from "../response/error.js";
import PaymentService from "../services/payment.service.js";
import OrderService from "../services/order.service.js";
import { sortObject } from "../utils/index.js";

class PaymentController {
    /**
     * Get available payment methods
     */
    static async getPaymentMethods(req, res) {
        new OKResponse({
            metadata: await PaymentService.getPaymentMethods(),
        }).send(res);
    }

    /**
     * Get payment status options
     */
    static async getPaymentStatuses(req, res) {
        new OKResponse({
            metadata: await PaymentService.getPaymentStatuses(),
        }).send(res);
    }

    /**
     * Create VNPAY payment URL with validation
     * MOCK VERSION - For demonstration without real VNPAY credentials
     */
    static async createPaymentUrlToVNPay(req, res) {
        try {
            const { orderId, amount } = req.body;
            if (!orderId || !amount) {
                throw new BadRequestError("Missing orderId or amount");
            }
            const order = await OrderService.validateOrderForPayment(
                +orderId,
                +amount
            );

            const createDate = moment(new Date()).format("YYYYMMDDHHmmss");
            const txnRef = orderId + "-" + moment(new Date()).format("HHmmss");
            const orderInfo = "Thanh toan qua VNPay cho don hang voi ma " + orderId;
            await PaymentService.createPaymentTransaction({
                orderId: +orderId,
                amount: +amount,
                txnRef,
                method: "VNPAY",
                orderInfo,
            });

            console.log(`[VNPAY MOCK] Created payment for order ${orderId}, amount: ${amount}`);
            await PaymentService.updatePaymentTransaction({
                txnRef,
                responseCode: "00", // 00 = Success in VNPAY
                transactionNo: "MOCK-" + txnRef,
                bankCode: "MOCK_BANK",
                metadata: {
                    mock: true,
                    note: "Simulated payment for demo purposes"
                }
            });
            await OrderService.updatePaymentStatus(+orderId, "00");

            console.log(`[VNPAY MOCK] Auto-approved payment for order ${orderId}`);
            const mockRedirectUrl = `${process.env.FRONTEND_URL}/order-confirmation/${orderId}?payment=success&mock=true`;

            new OKResponse({
                metadata: {
                    redirectUrl: mockRedirectUrl,
                    txnRef,
                    mock: true,
                    message: "Payment simulated successfully (DEMO MODE)"
                },
            }).send(res);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle VNPAY return callback (browser redirect)
     */
    static async handleVNPayReturn(req, res) {
        try {
            let vnp_Params = req.query;
            const secureHash = vnp_Params["vnp_SecureHash"];

            delete vnp_Params["vnp_SecureHash"];
            delete vnp_Params["vnp_SecureHashType"];

            vnp_Params = sortObject(vnp_Params);

            const secretKey = process.env.VNPAY_HASH_SECRET;
            const orderId = vnp_Params["vnp_TxnRef"].split("-")[0];

            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

            if (secureHash === signed) {
                await OrderService.updatePaymentStatus(
                    +orderId,
                    vnp_Params["vnp_ResponseCode"]
                );

                await PaymentService.updatePaymentTransaction({
                    txnRef: vnp_Params["vnp_TxnRef"],
                    responseCode: vnp_Params["vnp_ResponseCode"],
                    transactionNo: vnp_Params["vnp_TransactionNo"],
                    bankCode: vnp_Params["vnp_BankCode"],
                });

                console.log(
                    `[VNPAY] Return callback - Order ${orderId}, Code: ${vnp_Params["vnp_ResponseCode"]}`
                );
                res.redirect(
                    `${process.env.FRONTEND_URL}/tai-khoan/quan-ly-don-hang/${orderId}?code=${vnp_Params["vnp_ResponseCode"]}`
                );
            } else {
                console.error(`[VNPAY] Invalid signature for order ${orderId}`);
                res.redirect(
                    `${process.env.FRONTEND_URL}/tai-khoan/quan-ly-don-hang/${orderId}?code=97`
                );
            }
        } catch (error) {
            console.error("[VNPAY] Return callback error:", error);
            res.redirect(`${process.env.FRONTEND_URL}/error?message=payment_error`);
        }
    }

    /**
     * Handle VNPAY IPN (Instant Payment Notification)
     * This is critical - ensures payment status is recorded even if user closes browser
     */
    static async handleVNPayIPN(req, res) {
        try {
            let vnp_Params = req.query;
            const secureHash = vnp_Params["vnp_SecureHash"];

            delete vnp_Params["vnp_SecureHash"];
            delete vnp_Params["vnp_SecureHashType"];

            vnp_Params = sortObject(vnp_Params);

            const secretKey = process.env.VNPAY_HASH_SECRET;
            const txnRef = vnp_Params["vnp_TxnRef"];
            const orderId = txnRef.split("-")[0];
            const responseCode = vnp_Params["vnp_ResponseCode"];

            const signData = querystring.stringify(vnp_Params, { encode: false });
            const hmac = crypto.createHmac("sha512", secretKey);
            const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

            if (secureHash === signed) {
                await OrderService.updatePaymentStatus(+orderId, responseCode);

                await PaymentService.updatePaymentTransaction({
                    txnRef,
                    responseCode,
                    transactionNo: vnp_Params["vnp_TransactionNo"],
                    bankCode: vnp_Params["vnp_BankCode"],
                    metadata: {
                        ipn_received: true,
                        ipn_time: new Date().toISOString(),
                    },
                });

                console.log(
                    `[VNPAY] IPN received - Order ${orderId}, Code: ${responseCode}`
                );
                return res.json({ RspCode: "00", Message: "Success" });
            } else {
                console.error(`[VNPAY] IPN invalid signature for order ${orderId}`);
                return res.json({ RspCode: "97", Message: "Invalid signature" });
            }
        } catch (error) {
            console.error("[VNPAY] IPN error:", error);
            return res.json({ RspCode: "99", Message: "Unknown error" });
        }
    }

    /**
     * Query payment status by order ID
     */
    static async queryPaymentStatus(req, res) {
        try {
            const { orderId } = req.params;

            if (!orderId) {
                throw new BadRequestError("Missing orderId");
            }

            const payment = await PaymentService.getPaymentByOrderId(+orderId);

            new OKResponse({
                metadata: payment,
            }).send(res);
        } catch (error) {
            throw error;
        }
    }
}

export default PaymentController;
