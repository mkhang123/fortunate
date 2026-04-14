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
  const normalized = message.trim().normalize("NFC"); // giữ NFC cho email/phone regex
  const na = noAccent(message);
  const hasLookupIntent =
    /(?:tra\s*cuu|kiem\s*tra|xem)\s*(?:don|don hang)/i.test(na) ||
    /ma\s*don/i.test(na);

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
  const n = noAccent(message);

  const styleMatch = n.match(
    /(co\s*ban|don\s*gian|duong\s*pho|nang\s*dong|toi\s*gian|the\s*thao|basic|street|sport|classic|minimal)/
  );
  const hasStyleIntent =
    /phong\s*cach|style|theo\s*(gu|kieu)/i.test(n) ||
    /(goi\s*y|mix|phoi).*(bo|set|outfit)/i.test(n);

  if (!hasStyleIntent || !styleMatch) return null;

  const rawStyle = styleMatch[1].replace(/\s+/g, " ");
  const styleMap = {
    "co ban": "Basic",
    "don gian": "Basic",
    "toi gian": "Basic",
    minimal: "Basic",
    basic: "Basic",
    "duong pho": "Street",
    street: "Street",
    "nang dong": "Sport",
    sport: "Sport",
    "the thao": "Sport",
    classic: "Classic",
  };

  return styleMap[rawStyle] || null;
}

/** Hỏi danh sách / gợi ý sản phẩm → nên dùng RAG+AI, không ép luồng 2 outfit. */
function prefersStyleProductListing(message = "") {
  const n = noAccent(message);
  return /\bsan\s*pham\b/.test(n);
}

// ─── SIZE ADVICE INTENT ──────────────────────────────────────────────────────

/** Bỏ dấu tiếng Việt để so regex không bị lệch encoding */
function noAccent(s = "") {
  return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Phát hiện ý định tư vấn size áo / quần.
 * Dùng no-accent để tránh mismatch Unicode NFC/NFD.
 * Trả về "top" | "bottom" | "both" | null
 */
function extractSizeAdviceIntent(message = "") {
  // Bỏ dấu hoàn toàn → loại bỏ mọi nguy cơ encoding mismatch
  const n = noAccent(message);

  const isSizeQuery =
    /tu\s*van\s*size|chon\s*size|size\s*(nao|bao nhieu|phu hop|cho toi|cho minh)|mac\s*size|size\s*(ao|quan)|nen\s*(lay|chon|mac)\s*size|dua\s*vao\s*so\s*do|theo\s*so\s*do|goi\s*y\s*size|tu\s*van\s*kich\s*co|ho\s*tro\s*size|size\s*may/i.test(n);

  if (!isSizeQuery) return null;

  const wantsTop =
    /\bao\b|khoac|thun|so\s*mi|\btop\b|\bt-shirt\b|\btee\b|\bshirt\b|hoodie|jacket|blazer|sweater/i.test(n);
  const wantsBottom =
    /\bquan\b|\bpants?\b|\bjeans?\b|\bshorts?\b|\btrousers?\b|jogger|skirt/i.test(n);

  if (wantsTop && wantsBottom) return "both";
  if (wantsTop) return "top";
  if (wantsBottom) return "bottom";

  // Hỏi size chung (không rõ áo/quần) → tư vấn cả hai
  return "both";
}

const SIZE_ORDER = ["S", "M", "L", "XL"];

/** Tính size cơ bản dựa trên chiều cao + cân nặng */
function getBaseSize(height, weight) {
  // Điểm số: chiều cao (trọng số 60%) + cân nặng (trọng số 40%)
  // Ngưỡng theo bảng size Fortunate (S→M→L→XL)
  const h = Number(height) || 0;
  const w = Number(weight) || 0;

  if (h < 163 || w < 55) return "S";
  if (h < 168 || w < 63) return (h < 165 && w < 58) ? "S" : "M";
  if (h < 174 || w < 71) return "M";
  if (h < 180 || w < 80) return "L";
  return "XL";
}

/** Tăng 1 size (cho áo khoác vì mặc layering) */
function upOneSize(size) {
  const idx = SIZE_ORDER.indexOf(size);
  return idx < SIZE_ORDER.length - 1 ? SIZE_ORDER[idx + 1] : size;
}

/**
 * Tạo phản hồi tư vấn size dựa trên body profile.
 * type: "top" | "bottom" | "both"
 */
function buildSizeAdviceReply(type, bodyProfile) {
  if (!bodyProfile || !bodyProfile.height || !bodyProfile.weight) {
    return (
      "Mình chưa có thông tin chiều cao và cân nặng của bạn. " +
      "Bạn vui lòng cập nhật trong **Trang cá nhân** để mình tư vấn size chính xác hơn nhé!"
    );
  }

  const { height, weight } = bodyProfile;
  const base = getBaseSize(height, weight);
  const jacket = upOneSize(base);

  const lines = [
    `Dựa trên chiều cao **${height} cm** và cân nặng **${weight} kg** của bạn, đây là gợi ý size:`,
    "",
  ];

  if (type === "top" || type === "both") {
    lines.push("**Áo:**");
    lines.push(`- Áo thun: **Size ${base}**`);
    lines.push(`- Áo sơ mi: **Size ${base}**`);
    lines.push(
      `- Áo khoác: **Size ${jacket}** _(lên 1 size so với chuẩn để mặc thoải mái khi layering)_`
    );
  }

  if (type === "both") lines.push("");

  if (type === "bottom" || type === "both") {
    lines.push("**Quần:**");
    lines.push(`- Quần dài: **Size ${base}**`);
    lines.push(`- Quần ngắn: **Size ${base}**`);
  }

  lines.push("");
  lines.push(
    "_Lưu ý: Đây là gợi ý dựa trên chiều cao và cân nặng. " +
    "Nếu bạn có số đo vòng ngực/eo/hông, hãy cập nhật thêm để mình tư vấn chính xác hơn nhé!_"
  );

  return lines.join("\n");
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

  let resEnded = false;
  const sendEvent = (event, data) => {
    if (!resEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const endRes = () => {
    if (!resEnded) { resEnded = true; res.end(); }
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
        endRes();
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
        endRes();
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
        endRes();
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
      endRes();
      return;
    }

    const style = extractStyleIntent(message);
    if (style && !prefersStyleProductListing(message)) {
      const result = await recommendOutfitsByStyle(style);
      sendEvent("chunk", { text: result.text });
      sendEvent("done", { success: true });
      endRes();
      return;
    }

    // --- Tư vấn size áo / quần (không dùng RAG, tính trực tiếp từ body profile) ---
    const sizeIntent = extractSizeAdviceIntent(message);
    if (sizeIntent) {
      await new Promise((r) => setTimeout(r, 800));
      const reply = buildSizeAdviceReply(sizeIntent, bodyProfile);
      sendEvent("chunk", { text: reply });
      sendEvent("done", { success: true });
      endRes();
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
        endRes();
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
          endRes();
          return;
        }
        sendEvent("error", {
          message: "Xin lỗi, trợ lý đang gặp sự cố. Bạn thử lại sau nhé.",
        });
      }
    }
  } catch (error) {
    console.error("Chatbot Error:", error);
    sendEvent("error", { message: "Đã có lỗi xảy ra trong quá trình xử lý câu hỏi." });
  } finally {
    endRes();
  }
};
