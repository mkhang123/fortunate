import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Loader2, Send, Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../apis/axiosConfig";

const API_BASE = "http://localhost:4000/api";

/**
 * Parse markdown text thành JSX:
 * - [![alt](img)](url) → ảnh có link
 * - [text](url) → link văn bản
 */
function renderMarkdown(text = "", navigate) {
 if (!text) return null;
 const parts = [];
 const TOKEN = /\[(!?)\[([^\]]*?)\]\(([^)]+?)\)\]\(([^)]+?)\)|\[([^\]]+?)\]\(([^)]+?)\)/g;
 let last = 0;
 let m;
 let key = 0;

 const handleLinkClick = (e, url) => {
 e.preventDefault();
 if (url.startsWith("/")) {
 navigate(url);
 } else {
 window.open(url, "_blank");
 }
 };

 while ((m = TOKEN.exec(text)) !== null) {
 if (m.index > last) {
 parts.push(<span key={key++}>{text.slice(last, m.index)}</span>);
 }
 if (m[1] === "!") {
 // [![alt](img)](url)
 const alt = m[2], imgSrc = m[3], href = m[4];
 parts.push(
 <a key={key++} href={href} onClick={(e) => handleLinkClick(e, href)}
 className="block my-2 rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-all cursor-pointer">
 <img src={imgSrc} alt={alt}
 className="w-full object-cover max-h-40"
 onError={(e) => { e.currentTarget.style.display = "none"; }} />
 </a>
 );
 } else if (m[5] !== undefined) {
 // [text](url)
 const linkText = m[5], href = m[6];
 parts.push(
 <a key={key++} href={href} onClick={(e) => handleLinkClick(e, href)}
 className="text-black underline underline-offset-2 font-medium hover:text-gray-600 cursor-pointer">
 {linkText}
 </a>
 );
 }
 last = m.index + m[0].length;
 }
 if (last < text.length) {
 parts.push(<span key={key++}>{text.slice(last)}</span>);
 }
 return parts;
}

function extractGuestOrderLookupInfo(message = "") {
 const normalized = message.trim();
 const hasLookupIntent =
 /(?:tra\s*cứu|kiểm\s*tra|xem)\s*(?:đơn|đơn hàng)/i.test(normalized) ||
 /mã\s*đơn/i.test(normalized);

 if (!hasLookupIntent) return null;

 const orderIdMatch = normalized.match(
 /(?:mã\s*đơn|đơn(?:\s*hàng)?|#)\s*(?:(?:là|la|=|:|#|-)\s*)?(\d{1,12})/i
 );
 const emailMatch = normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
 const phoneMatch = normalized.match(/(?:\+84|0)[\s.-]?\d(?:[\s.-]?\d){7,10}/);

 return {
 orderId: orderIdMatch ? Number(orderIdMatch[1]) : null,
 email: emailMatch ? emailMatch[0].toLowerCase() : "",
 phone: phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "",
 };
}

export default function ChatAssistant() {
 const [open, setOpen] = useState(false);
 const navigate = useNavigate();
 const [messages, setMessages] = useState([
 {
 role: "assistant",
 text: "Xin chào, mình là trợ lý FORTUNATE. Bạn cần tư vấn size hay gợi ý outfit hôm nay?",
 },
 ]);
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
 const [bodyProfile, setBodyProfile] = useState(null);
 const [isListening, setIsListening] = useState(false);
 const [voiceSupported, setVoiceSupported] = useState(false);
 const recognitionRef = useRef(null);
 const bottomRef = useRef(null);

 // Tự động cuộn xuống cuối khi có tin nhắn mới
 useEffect(() => {
 bottomRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [messages]);

 useEffect(() => {
 const user = JSON.parse(localStorage.getItem("user"));
 if (!user) return;

 api
 .get("/users/me")
 .then((res) => {
 if (res.data?.data?.bodyProfile) setBodyProfile(res.data.data.bodyProfile);
 })
 .catch(() => {});
 }, []);

 // Kiểm tra và khởi tạo Web Speech API
 useEffect(() => {
 const SpeechRecognition =
 window.SpeechRecognition || window.webkitSpeechRecognition;
 if (!SpeechRecognition) return;

 setVoiceSupported(true);
 const recognition = new SpeechRecognition();
 recognition.lang = "vi-VN";
 recognition.continuous = false;
 recognition.interimResults = true;

 let finalTranscript = "";

 recognition.onstart = () => {
 finalTranscript = "";
 setIsListening(true);
 };

 recognition.onresult = (event) => {
 let interim = "";
 for (let i = event.resultIndex; i < event.results.length; i++) {
 const transcript = event.results[i][0].transcript;
 if (event.results[i].isFinal) {
 finalTranscript += transcript;
 } else {
 interim = transcript;
 }
 }
 // Hiển thị interim + final để user thấy realtime
 setInput(finalTranscript + interim);
 };

 recognition.onend = () => {
 setIsListening(false);
 // Giữ lại finalTranscript (không xóa)
 };

 recognition.onerror = (event) => {
 if (event.error !== "no-speech") {
 console.warn("Speech recognition error:", event.error);
 }
 setIsListening(false);
 };

 recognitionRef.current = recognition;

 return () => {
 recognition.abort();
 };
 }, []);

 const toggleVoice = useCallback(() => {
 const recognition = recognitionRef.current;
 if (!recognition) return;

 if (isListening) {
 recognition.stop();
 } else {
 setInput("");
 recognition.start();
 }
 }, [isListening]);

 const handleSend = async () => {
 if (!input.trim() || loading) return;

 const userText = input.trim();
 setMessages((prev) => [...prev, { role: "user", text: userText }]);
 setInput("");
 setLoading(true);

 // Thêm bubble trống của assistant để stream vào đó
 const assistantIndex = messages.length + 1; // sau user msg
 setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

 try {
 const lookup = extractGuestOrderLookupInfo(userText);
 if (lookup?.orderId && lookup?.email && lookup?.phone) {
 const res = await api.get(`/orders/guest/${lookup.orderId}`, {
 params: {
 email: lookup.email,
 phone: lookup.phone,
 },
 });
 const order = res.data?.metadata;
 const createdAt = new Date(order.createdAt).toLocaleDateString("vi-VN");
 const detailLink = `/order-confirmation/${order.id}?email=${encodeURIComponent(
 lookup.email
 )}&phone=${encodeURIComponent(lookup.phone)}`;
 const quickReply = [
 `Mình đã tìm thấy đơn #${order.id}.`,
 `- Trạng thái: ${order.status}`,
 `- Tổng tiền: ${order.total.toLocaleString("vi-VN")} VNĐ`,
 `- Ngày đặt: ${createdAt}`,
 `- Phương thức: ${order.payment?.method || "Chưa cập nhật"}`,
 `[Xem chi tiết đơn hàng](${detailLink})`,
 ].join("\n");
 await new Promise((resolve) => setTimeout(resolve, 1000));

 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text: quickReply,
 };
 return updated;
 });
 return;
 }

 const headers = {
 "Content-Type": "application/json",
 };

 const response = await fetch(`${API_BASE}/chat`, {
 method: "POST",
 headers,
 credentials: "include",
 body: JSON.stringify({ message: userText, bodyProfile }),
 });

 if (!response.ok || !response.body) {
 const errData = await response.json().catch(() => ({}));
 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text: errData.message || "Xin lỗi, trợ lý đang gặp sự cố. Bạn thử lại sau nhé.",
 };
 return updated;
 });
 return;
 }

    // Đọc SSE stream (parse cả event: và data:)
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "chunk"; // event type mặc định
    let receivedAnyText = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop(); // giữ dòng chưa hoàn chỉnh

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          try {
            const payload = JSON.parse(line.slice(5).trim());

            if (currentEvent === "chunk" && payload.text !== undefined) {
              // Đặt flag TRƯỚC khi gọi setMessages (setMessages callback chạy async)
              receivedAnyText = true;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  text: last.text + payload.text,
                };
                return updated;
              });
            } else if (currentEvent === "error" && payload.message) {
              receivedAnyText = true;
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  text: payload.message,
                };
                return updated;
              });
            }
            // waiting: không thay đổi bubble, bỏ qua
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    // Stream đóng mà chưa nhận được dữ liệu nào → kết nối bị gián đoạn
    if (!receivedAnyText) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text: "Kết nối bị gián đoạn. Bạn thử gửi lại câu hỏi nhé!",
        };
        return updated;
      });
    }
  } catch {
 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text: "Xin lỗi, không thể kết nối đến trợ lý. Bạn thử lại sau nhé.",
 };
 return updated;
 });
 } finally {
 setLoading(false);
 }
 };

 const handleKeyDown = (e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 };

 return (
 <>
 {/* Nút mở chat — tránh che nội dung trên mobile */}
 <button
 onClick={() => setOpen(true)}
 className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 rounded-full bg-black text-white p-3.5 sm:p-4 shadow-xl hover:bg-gray-800 transition-all [padding-bottom:max(0.875rem,env(safe-area-inset-bottom,0px))]"
 aria-label="Mở trợ lý chat"
 >
 <MessageCircle className="w-5 h-5" />
 </button>

 {/* Hộp chat — full width gần full trên màn nhỏ */}
 {open && (
 <div className="fixed inset-x-3 bottom-[4.5rem] sm:inset-x-auto sm:left-auto sm:right-6 sm:bottom-24 z-50 flex justify-center sm:justify-end pointer-events-none">
 <div className="pointer-events-auto w-full max-w-[min(100%,24rem)] sm:w-96 h-[min(24rem,calc(100dvh-8rem))] sm:h-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3 border-b bg-black text-white">
 <div>
 <p className="text-xs font-black tracking-[0.3em]">
 Trợ lý FORTUNATE
 </p>
 <p className="text-[10px] text-gray-300">
 Tư vấn size &amp; gợi ý outfit
 </p>
 </div>
 <button
 onClick={() => setOpen(false)}
 className="p-1 rounded-full hover:bg-white/10"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 <div className="flex-1 px-3 py-2 overflow-y-auto space-y-2 text-sm bg-gray-50">
 {messages.map((m, idx) => (
 <div
 key={idx}
 className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
 >
 <div
 className={`max-w-[80%] px-3 py-2 rounded-2xl whitespace-pre-line ${
 m.role === "user"
 ? "bg-black text-white rounded-br-none"
 : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
 }`}
 >
 {m.text
 ? (m.role === "assistant" ? renderMarkdown(m.text, navigate) : m.text)
 : (
 // Hiệu ứng typing khi chưa có text nào
 <span className="flex gap-1 items-center h-4">
 <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
 <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
 <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
 </span>
 )}
 </div>
 </div>
 ))}
 <div ref={bottomRef} />
 </div>

 <div className="border-t bg-white px-3 py-2">
 <div className="flex items-stretch gap-2">
 <textarea
 rows={2}
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder={isListening ? "Đang nghe..." : "Mô tả chiều cao, cân nặng hoặc yêu cầu outfit..."}
 className={`flex-1 text-xs border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 transition-all ${
 isListening
 ? "border-red-400 focus:ring-red-400 bg-red-50"
 : "border-gray-200 focus:ring-black bg-white"
 }`}
 />
 <div className="flex flex-col gap-1.5 shrink-0">
 {/* Nút gửi */}
 <button
 onClick={handleSend}
 disabled={loading || !input.trim()}
 className="flex-1 bg-black text-white px-3 rounded-xl hover:bg-gray-800 disabled:opacity-40 flex items-center justify-center transition-all"
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <Send className="w-4 h-4" />
 )}
 </button>

 {/* Nút mic (chỉ hiện khi trình duyệt hỗ trợ) */}
 {voiceSupported && (
 <button
 onClick={toggleVoice}
 disabled={loading}
 title={isListening ? "Dừng ghi âm" : "Nói yêu cầu"}
 className={`flex-1 px-3 rounded-xl flex items-center justify-center transition-all ${
 isListening
 ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
 : "bg-gray-100 text-gray-600 hover:bg-gray-200"
 } disabled:opacity-40`}
 >
 {isListening ? (
 <MicOff className="w-4 h-4" />
 ) : (
 <Mic className="w-4 h-4" />
 )}
 </button>
 )}
 </div>
 </div>

 {/* Chú thích trạng thái voice */}
 {isListening && (
 <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping inline-block" />
 Đang nghe... Nhấn mic để dừng
 </p>
 )}
 </div>
 </div>
 </div>
 )}
 </>
 );
}
