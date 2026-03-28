import { recommendOutfitsByStyle, retrieve, summarize } from "../services/chat.service.js";
import OrderService from "../services/order.service.js";

// Helper: check rate limit error and get wait time (seconds)
function getRateLimitWait(err) {
  const msg = err?.message || "";
  const match = msg.match(/Please retry in ([\d.]+)s/i);
  return match ? parseFloat(match[1]) : null;
}

// Helper: check if daily/project quota is exhausted (retrying won't help)
function isDailyQuotaExhausted(err) {
  const msg = err?.message || "";
  return (
    msg.includes("PerDay") ||
    msg.includes("GenerateRequestsPerDayPerProjectPerModel") ||
    msg.toLowerCase().includes("quota exceeded") ||
    msg.includes("generate_content_free_tier_requests") ||
    msg.includes("generate_content_free_tier_input_token_count") ||
    msg.includes("limit: 0")
  );
}

function extractOrderLookupInfo(message = "") {
  const normalized = message.trim();
  const hasLookupIntent =
    /(?:tra\s*cứu|kiểm\s*tra|xem)\s*(?:đơn|đơn hàng)/i.test(normalized) ||
    /mã\s*đơn/i.test(normalized);

  if (!hasLookupIntent) return null;

  const orderIdMatch = normalized.match(
    /(?:mã\s*đơn|đơn(?:\s*hàng)?|#)\s*(?:(?:là|la|=|:|#|-)\s*)?(\d{1,12})/i
  );
  const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = normalized.match(/(?:\+84|0)[\s.\-]?\d(?:[\s.\-]?\d){7,10}/);

  return {
    orderId: orderIdMatch ? Number(orderIdMatch[1]) : null,
    email: emailMatch ? emailMatch[0].toLowerCase() : "",
    phone: phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "",
  };
}

function extractStyleIntent(message = "") {
  const normalized = String(message || "").toLowerCase();
  // Ưu tiên cụm dài (vd. "cơ bản") trước từ ngắn để khớp đúng
  const styleMatch = normalized.match(
    /(cơ\s*bản|đơn\s*giản|đường\s*phố|năng\s*động|tối\s*giản|thể\s*thao|basic|street|sport|classic|minimal)/
  );
  const hasStyleIntent =
    /phong\s*cách|style|theo\s*(?:gu|kiểu)/i.test(normalized) ||
    /(gợi ý|goi y|mix|phối|phoi).*(bộ|set|outfit)/i.test(normalized);

  if (!hasStyleIntent || !styleMatch) return null;

  const rawStyle = styleMatch[1].replace(/\s+/g, " ");
  const styleMap = {
    "cơ bản": "Basic",
    "đơn giản": "Basic",
    "tối giản": "Basic",
    minimal: "Basic",
    basic: "Basic",
    "đường phố": "Street",
    street: "Street",
    "năng động": "Sport",
    sport: "Sport",
    "thể thao": "Sport",
    classic: "Classic",
  };

  return styleMap[rawStyle] || null;
}

/** Hỏi danh sách / gợi ý sản phẩm → nên dùng RAG+AI (giống "gợi ý sản phẩm street"), không ép luồng 2 outfit. */
function prefersStyleProductListing(message = "") {
  const n = String(message || "").toLowerCase();
  return /\bsản\s*phẩm\b|\bsan\s*pham\b/.test(n);
}

function buildLocalFallbackReply(hits = []) {
  if (!Array.isArray(hits) || hits.length === 0) {
    return (
      "Hiện API AI đang hết quota nên mình chưa thể tư vấn chi tiết ngay. " +
      "Bạn thử lại sau hoặc vào trang Mua sắm để xem sản phẩm mới nhé."
    );
  }

  const top = hits.slice(0, 4);
  const lines = [
    "API AI đang tạm hết quota, mình gợi ý nhanh một số sản phẩm phù hợp trong shop:",
    "",
  ];

  for (const p of top) {
    const price = Number(p.price || 0).toLocaleString("vi-VN");
    const url = `/product/${p.slug}`;
    if (Array.isArray(p.images) && p.images[0]) {
      lines.push(`[![${p.name}](${p.images[0]})](${url})`);
      lines.push(`[${p.name} - ${price} VNĐ](${url})`);
    } else {
      lines.push(`[${p.name} - ${price} VNĐ](${url})`);
    }
  }

  lines.push("");
  lines.push("Bạn có thể nhắn thêm phong cách (Basic/Street/Sport) để mình gợi ý outfit trực tiếp.");
  return lines.join("\n");
}

export const handleChat = async (req, res) => {
  const { message, bodyProfile } = req.body || {};
  
  if (!message || typeof message !== "string") {
    res.status(400).json({ success: false, message: "Thiếu nội dung câu hỏi (message)." });
    return;
  }

  // --- Setup SSE headers ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const orderLookup = extractOrderLookupInfo(message);
    if (orderLookup) {
      if (!orderLookup.orderId || !orderLookup.email || !orderLookup.phone) {
        sendEvent("chunk", {
          text:
            "Mình có thể tra cứu đơn hàng cho bạn. Vui lòng gửi đủ theo mẫu: `mã đơn 1234, email abc@gmail.com, sđt 0901234567`.",
        });
        sendEvent("done", { success: true });
        res.end();
        return;
      }

      let order;
      try {
        order = await OrderService.findById(orderLookup.orderId);
      } catch {
        sendEvent("chunk", {
          text: "Không tìm thấy đơn hàng tương ứng. Bạn kiểm tra lại mã đơn giúp mình nhé.",
        });
        sendEvent("done", { success: true });
        res.end();
        return;
      }
      const orderEmail = (order.receiverEmail || "").trim().toLowerCase();
      const orderPhone = (order.receiverPhone || "").replace(/\s/g, "");

      if (orderEmail !== orderLookup.email || orderPhone !== orderLookup.phone) {
        sendEvent("chunk", {
          text:
            "Mình chưa xác thực được đơn hàng này. Bạn kiểm tra lại mã đơn, email và số điện thoại đã dùng khi đặt hàng nhé.",
        });
        sendEvent("done", { success: true });
        res.end();
        return;
      }

      const orderLink =
        `${process.env.FRONTEND_URL}/order-confirmation/${order.id}` +
        `?email=${encodeURIComponent(orderLookup.email)}&phone=${encodeURIComponent(orderLookup.phone)}`;
      const createdAt = new Date(order.createdAt).toLocaleDateString("vi-VN");
      const summary = [
        `Mình đã tìm thấy đơn #${order.id}.`,
        `- Trạng thái: ${order.status}`,
        `- Tổng tiền: ${order.total.toLocaleString("vi-VN")} VNĐ`,
        `- Ngày đặt: ${createdAt}`,
        `- Phương thức: ${order.payment?.method || "Chưa cập nhật"}`,
        `[Xem chi tiết đơn hàng](${orderLink})`,
      ].join("\n");

      sendEvent("chunk", { text: summary });
      sendEvent("done", { success: true });
      res.end();
      return;
    }

    const style = extractStyleIntent(message);
    if (style && !prefersStyleProductListing(message)) {
      const result = await recommendOutfitsByStyle(style);
      sendEvent("chunk", { text: result.text });
      sendEvent("done", { success: true });
      res.end();
      return;
    }

    // 1. Retrieve products mapped to user intent (RAG)
    const hits = await retrieve(message, 6);

    // 2. Send context to AI via stream with retry mechanism
    const MAX_RETRIES = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const streamResult = await summarize(hits, message, bodyProfile);

        for await (const chunk of streamResult.stream) {
          const text = chunk.text();
          if (text) {
            sendEvent("chunk", { text });
          }
        }

        // Successfully ended stream
        sendEvent("done", { success: true });
        res.end();
        return;

      } catch (err) {
        lastError = err;
        console.error(`[Chat] Gemini API Error:`, err.message || err);
        const waitSecs = getRateLimitWait(err);

        // Hết quota ngày → không retry, break ngay
        if (isDailyQuotaExhausted(err)) {
          console.warn("[Chat] Daily quota exhausted. Skipping retries.");
          break;
        }

        if (waitSecs && attempt < MAX_RETRIES) {
          const waitMs = Math.ceil(waitSecs * 1000) + 500;
          console.log(`[Chat] Rate limited. Retrying after ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          
          sendEvent("waiting", { message: "Đang xử lý, vui lòng chờ..." });
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        break;
      }
    }

    // Handle end error
    if (lastError) {
      const errMsg = lastError.message || "";
      const isQuota =
        errMsg.includes("quota") ||
        errMsg.includes("Too Many Requests") ||
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("rate") ||
        errMsg.includes("retry");

      if (errMsg.includes("chưa được cấu hình API key")) {
        sendEvent("error", { message: "Chatbot chưa được cấu hình API key." });
      } else {
        if (isQuota) {
          sendEvent("chunk", { text: buildLocalFallbackReply(hits) });
          sendEvent("done", { success: true });
          res.end();
          return;
        }
        sendEvent("error", {
          message: isQuota
            ? "API chatbot đang hết quota. Bạn kiểm tra gói/giới hạn Gemini hoặc đổi API key rồi thử lại nhé."
            : "Xin lỗi, trợ lý đang gặp sự cố. Bạn thử lại sau nhé.",
        });
      }
    }
  } catch (error) {
    console.error("Chatbot Error:", error);
    sendEvent("error", { message: "Đã có lỗi xảy ra trong quá trình xử lý câu hỏi." });
  } finally {
    res.end();
  }
};
