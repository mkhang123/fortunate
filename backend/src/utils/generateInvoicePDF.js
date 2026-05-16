import PDFDocument from "pdfkit";
import path from "path";

const WIN_FONTS = "C:/Windows/Fonts";
const FONT_REGULAR = path.join(WIN_FONTS, "arial.ttf");
const FONT_BOLD    = path.join(WIN_FONTS, "arialbd.ttf");

const BLACK  = "#000000";
const GRAY   = "#6B7280";
const GREEN  = "#16A34A";
const WHITE  = "#FFFFFF";
const STRIPE = "#F9FAFB";

const formatVND = (n) => (n || 0).toLocaleString("vi-VN");

/**
 * Stream PDF hóa đơn trực tiếp vào Express response.
 * @param {object} order - Dữ liệu đơn hàng từ OrderService.findById()
 * @param {object} res   - Express response object
 */
export function generateInvoicePDF(order, res) {

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="hoa-don-${order.id}.pdf"`
    );
    doc.pipe(res);

    const PAGE_W = doc.page.width - 100; // 495pt

    const regular = (size) => doc.font(FONT_REGULAR).fontSize(size);
    const bold    = (size) => doc.font(FONT_BOLD).fontSize(size);

    bold(26).fillColor(BLACK).text("FORTUNATE", 50, 50);
    regular(8).fillColor(GRAY).text("Thời trang tối giản — Tích hợp công nghệ AI", 50, 82);

    bold(18).fillColor(BLACK).text("HÓA ĐƠN", 0, 50, { align: "right" });
    regular(9).fillColor(GRAY)
        .text(`#${String(order.id).padStart(6, "0")}`, 0, 74, { align: "right" })
        .text(`Ngày: ${new Date(order.createdAt).toLocaleDateString("vi-VN")}`, 0, 89, { align: "right" });

    doc.moveTo(50, 108).lineTo(545, 108).strokeColor("#E5E7EB").lineWidth(1).stroke();

    const iY = 122;

    bold(7.5).fillColor(GRAY).text("THÔNG TIN NHẬN HÀNG", 50, iY);
    bold(10).fillColor(BLACK).text(order.receiverName, 50, iY + 14);
    regular(9).fillColor(GRAY)
        .text(`Điện thoại: ${order.receiverPhone}`, 50, iY + 29)
        .text(`Email: ${order.receiverEmail}`, 50, iY + 43)
        .text(
            `Địa chỉ: ${order.shippingAddress}${order.city ? ", " + order.city : ""}`,
            50, iY + 57, { width: 245 }
        );

    const statusLabel = {
        PENDING:   "Chờ thanh toán",
        PAID:      "Đã thanh toán",
        SHIPPED:   "Đang giao hàng",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
    }[order.status] || order.status;

    bold(7.5).fillColor(GRAY).text("TRẠNG THÁI ĐƠN HÀNG", 310, iY);
    bold(10).fillColor(BLACK).text(statusLabel, 310, iY + 14);

    bold(7.5).fillColor(GRAY).text("PHƯƠNG THỨC THANH TOÁN", 310, iY + 42);
    bold(10).fillColor(BLACK).text(order.payment?.method || "COD", 310, iY + 56);

    if (order.notes) {
        bold(7.5).fillColor(GRAY).text("GHI CHÚ", 310, iY + 82);
        regular(9).fillColor(BLACK).text(order.notes, 310, iY + 96, { width: 230 });
    }

    const TABLE_TOP = 255;
    const ROW_H     = 26;
    const COL = { no: 50, name: 75, size: 308, qty: 360, price: 410, total: 475 };

    doc.rect(50, TABLE_TOP, PAGE_W, 22).fill(BLACK);
    bold(8).fillColor(WHITE);
    doc.text("STT",        COL.no,    TABLE_TOP + 7);
    doc.text("SẢN PHẨM",  COL.name,  TABLE_TOP + 7);
    doc.text("SIZE",       COL.size,  TABLE_TOP + 7);
    doc.text("SL",         COL.qty,   TABLE_TOP + 7);
    doc.text("ĐƠN GIÁ",   COL.price, TABLE_TOP + 7);
    doc.text("THÀNH TIỀN", COL.total, TABLE_TOP + 7);

    let rowY = TABLE_TOP + 22;
    const items = order.items || [];

    items.forEach((item, idx) => {
        doc.rect(50, rowY, PAGE_W, ROW_H).fill(idx % 2 === 0 ? WHITE : STRIPE);

        const name      = item.variant?.product?.name || "Sản phẩm";
        const size      = item.variant?.size || "-";
        const unitPrice = formatVND(item.price);
        const lineTotal = formatVND((item.price || 0) * item.quantity);

        regular(9).fillColor(BLACK);
        doc.text(String(idx + 1), COL.no,  rowY + 8);
        doc.text(name,  COL.name,  rowY + 8, { width: 225, lineBreak: false, ellipsis: true });
        doc.text(size,  COL.size,  rowY + 8);
        doc.text(String(item.quantity), COL.qty, rowY + 8);
        doc.text(unitPrice, COL.price, rowY + 8, { width: 60, align: "right" });
        bold(9).fillColor(BLACK)
            .text(lineTotal, COL.total, rowY + 8, { width: 70, align: "right" });

        rowY += ROW_H;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor("#E5E7EB").lineWidth(1).stroke();

    const LX = 350; // label x
    const VX = 450; // value x
    const VW = 95;  // value width

    rowY += 14;
    regular(9).fillColor(GRAY).text("Tạm tính:", LX, rowY);
    regular(9).fillColor(BLACK)
        .text(`${formatVND(order.total)} VNĐ`, VX, rowY, { width: VW, align: "right" });

    rowY += 15;
    regular(9).fillColor(GRAY).text("Phí vận chuyển:", LX, rowY);
    regular(9).fillColor(GREEN)
        .text("Miễn phí", VX, rowY, { width: VW, align: "right" });

    rowY += 9;
    doc.moveTo(LX, rowY).lineTo(545, rowY).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
    rowY += 7;

    doc.rect(LX, rowY, 195, 26).fill(BLACK);
    bold(10.5).fillColor(WHITE).text("TỔNG CỘNG:", LX + 6, rowY + 8);
    bold(10.5).fillColor(WHITE)
        .text(`${formatVND(order.total)} VNĐ`, VX, rowY + 8, { width: VW, align: "right" });

    const FOOTER_Y = 732;
    doc.moveTo(50, FOOTER_Y).lineTo(545, FOOTER_Y)
        .strokeColor("#E5E7EB").lineWidth(1).stroke();

    regular(8).fillColor(GRAY)
        .text("Cảm ơn bạn đã mua sắm tại FORTUNATE!", 50, FOOTER_Y + 10, { align: "center", width: PAGE_W })
        .text("Mọi thắc mắc vui lòng liên hệ qua email hoặc trang web của chúng tôi.", 50, FOOTER_Y + 23, { align: "center", width: PAGE_W })
        .text("© 2026 Fortunate Clothing — Luận văn tốt nghiệp", 50, FOOTER_Y + 36, { align: "center", width: PAGE_W });

    doc.end();
}
