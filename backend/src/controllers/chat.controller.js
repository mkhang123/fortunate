import { retrieve, summarize } from "../services/chat.service.js";

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
    msg.includes("GenerateRequestsPerDayPerProjectPerModel")
  );
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
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("rate") ||
        errMsg.includes("retry");

      if (errMsg.includes("chưa được cấu hình API key")) {
        sendEvent("error", { message: "Chatbot chưa được cấu hình API key." });
      } else {
        sendEvent("error", {
          message: isQuota
            ? "Trợ lý đang bận quá, bạn vui lòng thử lại sau ít phút nhé 🙏"
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
