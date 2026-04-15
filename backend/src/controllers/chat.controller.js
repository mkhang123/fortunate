import { recommendOutfitsByStyle, retrieve, summarize } from "../services/chat.service.js";
import { getFortunateSizeSuggestions } from "../services/size-advice.service.js";
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
  const normalized = message.trim().normalize("NFC");
  const na = noAccent(message);

  const hasLookupIntent =
    /(?:tra\s*cuu|kiem\s*tra|xem|tim)\s*(?:don|don\s*hang)/i.test(na) ||
    /(?:chi\s*tiet|trang\s*thai)\s*(?:don|don\s*hang)/i.test(na) ||
    /ma\s*don/i.test(na) ||
    /\bdon\s*hang\s*(?:so|#)?\s*\d/i.test(na) ||
    /\bdon\s*hang\s*:\s*\d/i.test(na) ||
    /(?:order|tracking)\s*#?\s*\d/i.test(normalized);

  if (!hasLookupIntent) return null;

  let orderId = null;
  const idPatterns = [
    /(?:mã\s*đơn|đơn(?:\s*hàng)?|#|order\s*#?)\s*(?:(?:là|la|=|:|#|-)\s*)?(\d{1,12})/i,
    /(?:đơn|don)\s*(?:hàng|hang)?\s*(?:số|so|#)?\s*(\d{1,12})/i,
    /tra\s*cứu\s*(?:đơn(?:\s*hàng)?\s*)?(\d{1,12})/i,
    /tra\s*cuu\s*(?:don(?:\s*hang)?\s*)?(\d{1,12})/i,
    /#(\d{1,12})\b/,
  ];
  for (const re of idPatterns) {
    const m = normalized.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n > 0) {
        orderId = n;
        break;
      }
    }
  }

  if (!orderId) {
    const nums = normalized.match(/\d{1,12}/g);
    if (nums && nums.length === 1) {
      const n = Number(nums[0]);
      if (n > 0) orderId = n;
    }
  }

  const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = normalized.match(/(?:\+84|0)[\s.\-]?\d(?:[\s.\-]?\d){7,10}/);

  return {
    orderId,
    email: emailMatch ? emailMatch[0].toLowerCase() : "",
    phone: phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "",
  };
}

function formatOrderChatSummary(order, orderLink) {
  const createdAt = new Date(order.createdAt).toLocaleDateString("vi-VN");
  return [
    `Mình đã tìm thấy đơn #${order.id}.`,
    `- Trạng thái: ${order.status}`,
    `- Tổng tiền: ${order.total.toLocaleString("vi-VN")} VNĐ`,
    `- Ngày đặt: ${createdAt}`,
    `- Phương thức: ${order.payment?.method || "Chưa cập nhật"}`,
    `[Xem chi tiết đơn hàng](${orderLink})`,
  ].join("\n");
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

function buildSizeIntro(bodyProfile, chartLabel) {
  const bits = [
    `chiều cao **${bodyProfile.height} cm**`,
    `cân nặng **${bodyProfile.weight} kg**`,
  ];
  if (bodyProfile.chest) bits.push(`vòng ngực **${bodyProfile.chest} cm**`);
  if (bodyProfile.waist) bits.push(`vòng eo **${bodyProfile.waist} cm**`);
  if (bodyProfile.hip) bits.push(`vòng hông **${bodyProfile.hip} cm**`);
  const tail =
    bits.length === 1
      ? bits[0]
      : `${bits.slice(0, -1).join(", ")} và ${bits[bits.length - 1]}`;
  return `Dựa trên ${tail} của bạn (bảng size **${chartLabel}**), đây là gợi ý size:`;
}

/**
 * Tạo phản hồi tư vấn size dựa trên body profile (cùng logic với Gemini).
 * type: "top" | "bottom" | "both"
 */
function buildSizeAdviceReply(type, bodyProfile) {
  if (!bodyProfile || !bodyProfile.height || !bodyProfile.weight) {
    return (
      "Mình chưa có thông tin chiều cao và cân nặng của bạn. " +
      "Bạn vui lòng cập nhật trong **Trang cá nhân** để mình tư vấn size chính xác hơn nhé!"
    );
  }

  const sug = getFortunateSizeSuggestions(bodyProfile);
  const { topBase, bottomBase, jacket, chartLabel } = sug;
  const lines = [buildSizeIntro(bodyProfile, chartLabel), ""];

  if (type === "top" || type === "both") {
    lines.push("**Áo:**");
    lines.push(`- Áo thun: **Size ${topBase}**`);
    lines.push(`- Áo sơ mi: **Size ${topBase}**`);
    lines.push(
      `- Áo khoác: **Size ${jacket}** _(lên 1 size so với chuẩn để mặc thoải mái khi layering)_`
    );
  }

  if (type === "both") lines.push("");

  if (type === "bottom" || type === "both") {
    lines.push("**Quần:**");
    lines.push(`- Quần dài: **Size ${bottomBase}**`);
    lines.push(`- Quần ngắn: **Size ${bottomBase}**`);
  }

  lines.push("");
  lines.push(
    "_Gợi ý theo bảng size Fortunate và các chỉ số đã lưu; thiếu số đo vòng thì có thể lệch form cá nhân._"
  );

  return lines.join("\n");
}

/**
 * Đọc stream Gemini với deadline tổng — tránh for-await treo vô hạn khi API không trả chunk / không kết thúc.
 */
async function drainGeminiStream(stream, onText, overallMs) {
  const iterator = stream[Symbol.asyncIterator]();
  const deadline = Date.now() + overallMs;

  while (true) {
    const remaining = Math.min(45000, Math.max(400, deadline - Date.now()));
    if (remaining <= 400) {
      throw new Error("GEMINI_STREAM_TIMEOUT");
    }

    let nextResult;
    try {
      nextResult = await Promise.race([
        iterator.next(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("GEMINI_STREAM_TIMEOUT")), remaining)
        ),
      ]);
    } catch (e) {
      if (e?.message === "GEMINI_STREAM_TIMEOUT") throw e;
      throw e;
    }

    if (nextResult.done) break;
    const chunk = nextResult.value;
    let text = "";
    try {
      text = typeof chunk?.text === "function" ? chunk.text() : "";
    } catch {
      text = "";
    }
    if (text) onText(text);
  }
}

function buildLocalFallbackReply(hits = []) {
  if (!Array.isArray(hits) || hits.length === 0) {
    return (
      "Phản hồi từ AI đang chậm hoặc tạm không khả dụng. " +
      "Bạn thử lại sau hoặc vào trang Mua sắm để xem sản phẩm nhé."
    );
  }

  const top = hits.slice(0, 4);
  const lines = [
    "Mình gợi ý nhanh một số sản phẩm phù hợp trong shop (AI tạm chậm hoặc hết quota):",
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
      if (!orderLookup.orderId) {
        sendEvent("chunk", {
          text:
            "Bạn gửi giúp mình **mã đơn** (số đơn), ví dụ: `tra cứu đơn 123` hoặc `mã đơn 123`. " +
            "Nếu đã **đăng nhập**, chỉ cần mã đơn là được.",
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

      const userId = req.user ? Number(req.user.id) : NaN;
      const isAdmin = req.user?.role === "ADMIN";
      const ownsOrder = Number.isFinite(userId) && order.userId === userId;

      if (ownsOrder || isAdmin) {
        const orderLink = `${process.env.FRONTEND_URL}/my-orders/${order.id}`;
        sendEvent("chunk", { text: formatOrderChatSummary(order, orderLink) });
        sendEvent("done", { success: true });
        endRes();
        return;
      }

      const orderEmail = (order.receiverEmail || "").trim().toLowerCase();
      const orderPhone = (order.receiverPhone || "").replace(/\s/g, "");

      if (orderLookup.email && orderLookup.phone) {
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
        sendEvent("chunk", { text: formatOrderChatSummary(order, orderLink) });
        sendEvent("done", { success: true });
        endRes();
        return;
      }

      sendEvent("chunk", {
        text:
          "Để tra cứu theo **mã đơn**, bạn **đăng nhập** tài khoản đã đặt hàng — mình sẽ hiển thị đơn ngay. " +
          "Nếu đặt **khách không tài khoản**, gửi thêm **email** và **SĐT** nhận hàng (trùng lúc đặt), ví dụ: `mã đơn 123, email a@b.com, sdt 0901234567`.",
      });
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
    const streamBudgetMs = Number(process.env.CHAT_STREAM_MS) || 75000;
    const summarizeBudgetMs = Number(process.env.CHAT_SUMMARIZE_MS) || 45000;
    let lastError = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const streamResult = await Promise.race([
          summarize(hits, message, bodyProfile),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("GEMINI_STREAM_TIMEOUT")), summarizeBudgetMs)
          ),
        ]);
        let streamHadChunk = false;

        try {
          await drainGeminiStream(
            streamResult.stream,
            (text) => {
              streamHadChunk = true;
              sendEvent("chunk", { text });
            },
            streamBudgetMs
          );
        } catch (inner) {
          if (inner?.message === "GEMINI_STREAM_TIMEOUT" && streamHadChunk) {
            sendEvent("done", { success: true });
            endRes();
            return;
          }
          throw inner;
        }

        sendEvent("done", { success: true });
        endRes();
        return;
      } catch (err) {
        lastError = err;
        console.error(`[Chat] Gemini API Error:`, err.message || err);
        const waitSecs = getRateLimitWait(err);

        if (err?.message === "GEMINI_STREAM_TIMEOUT") {
          console.warn("[Chat] Gemini stream timeout, falling back if possible.");
          break;
        }

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
      const isStreamTimeout = errMsg.includes("GEMINI_STREAM_TIMEOUT");

      if (errMsg.includes("chưa được cấu hình API key")) {
        sendEvent("error", { message: "Chatbot chưa được cấu hình API key." });
      } else {
        if (isQuota || isStreamTimeout) {
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
