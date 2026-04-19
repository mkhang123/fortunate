import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Loader2, Send, Mic, MicOff, GripHorizontal } from "lucide-react";
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
 const normalizedText = String(text).replace(/\*\*/g, "").replace(/_(.*?)_/g, "$1");
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

 while ((m = TOKEN.exec(normalizedText)) !== null) {
 if (m.index > last) {
 parts.push(<span key={key++}>{normalizedText.slice(last, m.index)}</span>);
 }
 if (m[1] === "!") {
 // [![alt](img)](url)
 const alt = m[2], imgSrc = m[3], href = m[4];
 parts.push(
 <a key={key++} href={href} onClick={(e) => handleLinkClick(e, href)}
 className="block my-2 bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-gray-300 transition-all cursor-pointer">
 <img src={imgSrc} alt={alt}
 className="w-full h-40 object-contain p-2"
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
 if (last < normalizedText.length) {
 parts.push(<span key={key++}>{normalizedText.slice(last)}</span>);
 }
 return parts;
}

function noAccentLookup(s = "") {
 return String(s)
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .toLowerCase();
}

function extractOrderLookupInfo(message = "") {
 const normalized = message.trim();
 const na = noAccentLookup(message);

 const hasLookupIntent =
 /(?:tra\s*cứu|kiểm\s*tra|xem|tìm)\s*(?:đơn|đơn\s*hàng)/i.test(normalized) ||
 /(?:chi\s*tiết|trạng\s*thái)\s*(?:đơn|đơn\s*hàng)/i.test(normalized) ||
 /mã\s*đơn/i.test(normalized) ||
 /\bđơn\s*hàng\s*(?:số|#)?\s*\d/i.test(normalized) ||
 /\bđơn\s*hàng\s*:\s*\d/i.test(normalized) ||
 /(?:order|tracking)\s*#?\s*\d/i.test(normalized) ||
 /(?:tra\s*cuu|kiem\s*tra|xem|tim)\s*(?:don|don\s*hang)/i.test(na) ||
 /(?:chi\s*tiet|trang\s*thai)\s*(?:don|don\s*hang)/i.test(na) ||
 /ma\s*don/i.test(na) ||
 /\bdon\s*hang\s*(?:so|#)?\s*\d/i.test(na);

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
 const phoneMatch = normalized.match(/(?:\+84|0)[\s.-]?\d(?:[\s.-]?\d){7,10}/);

 return {
 orderId,
 email: emailMatch ? emailMatch[0].toLowerCase() : "",
 phone: phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "",
 };
}

// Kích thước mặc định và giới hạn resize
const DEFAULT_W = 352; // 22rem
const DEFAULT_H = 384; // 24rem (96 * 4)
const MIN_W = 280;
const MIN_H = 280;
const MAX_W = 700;
const MAX_H = 720;

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

 // --- Resize state ---
 const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
 const resizing = useRef(null); // { startX, startY, startW, startH, edge }

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

 // --- Resize handlers ---
 const onResizeMouseDown = useCallback((e, edge) => {
 e.preventDefault();
 resizing.current = {
 startX: e.clientX,
 startY: e.clientY,
 startW: size.w,
 startH: size.h,
 edge,
 };

 const onMove = (ev) => {
 if (!resizing.current) return;
 const { startX, startY, startW, startH, edge } = resizing.current;
 const dx = ev.clientX - startX;
 const dy = ev.clientY - startY;

 let newW = startW;
 let newH = startH;

 if (edge === "left" || edge === "corner") {
 newW = Math.min(MAX_W, Math.max(MIN_W, startW - dx));
 }
 if (edge === "top" || edge === "corner") {
 newH = Math.min(MAX_H, Math.max(MIN_H, startH - dy));
 }

 setSize({ w: newW, h: newH });
 };

 const onUp = () => {
 resizing.current = null;
 window.removeEventListener("mousemove", onMove);
 window.removeEventListener("mouseup", onUp);
 };

 window.addEventListener("mousemove", onMove);
 window.addEventListener("mouseup", onUp);
 }, [size]);

 // Touch resize
 const onResizeTouchStart = useCallback((e, edge) => {
 const touch = e.touches[0];
 resizing.current = {
 startX: touch.clientX,
 startY: touch.clientY,
 startW: size.w,
 startH: size.h,
 edge,
 };

 const onMove = (ev) => {
 if (!resizing.current) return;
 const t = ev.touches[0];
 const { startX, startY, startW, startH, edge } = resizing.current;
 const dx = t.clientX - startX;
 const dy = t.clientY - startY;

 let newW = startW;
 let newH = startH;

 if (edge === "left" || edge === "corner") {
 newW = Math.min(MAX_W, Math.max(MIN_W, startW - dx));
 }
 if (edge === "top" || edge === "corner") {
 newH = Math.min(MAX_H, Math.max(MIN_H, startH - dy));
 }

 setSize({ w: newW, h: newH });
 };

 const onEnd = () => {
 resizing.current = null;
 window.removeEventListener("touchmove", onMove);
 window.removeEventListener("touchend", onEnd);
 };

 window.addEventListener("touchmove", onMove, { passive: true });
 window.addEventListener("touchend", onEnd);
 }, [size]);

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
 const lookup = extractOrderLookupInfo(userText);
 if (lookup?.orderId) {
 let order = null;
 let detailLink = "";

 try {
 const res = await api.get(`/orders/${lookup.orderId}`);
 order = res.data?.metadata;
 detailLink = `/my-orders/${order.id}`;
 } catch {
 order = null;
 }

 if (!order && lookup.email && lookup.phone) {
 try {
 const res = await api.get(`/orders/guest/${lookup.orderId}`, {
 params: {
 email: lookup.email,
 phone: lookup.phone,
 },
 });
 order = res.data?.metadata;
 detailLink = `/order-confirmation/${order.id}?email=${encodeURIComponent(
 lookup.email
 )}&phone=${encodeURIComponent(lookup.phone)}`;
 } catch {
 order = null;
 }
 }

 if (order) {
 const createdAt = new Date(order.createdAt).toLocaleDateString("vi-VN");
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

 const needGuestVerify = lookup && !localStorage.getItem("user");
 const failText = needGuestVerify
 ? "Để tra cứu theo **mã đơn**, bạn **đăng nhập** tài khoản đã đặt hàng, hoặc gửi thêm **email** và **SĐT** nhận hàng (như lúc đặt), ví dụ: `mã đơn 123, email a@b.com, sdt 0901234567`."
 : "Không tìm thấy đơn hoặc đơn không thuộc tài khoản của bạn. Nếu là **đơn khách**, gửi kèm **email** và **SĐT** đặt hàng.";

 await new Promise((resolve) => setTimeout(resolve, 600));
 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text: failText,
 };
 return updated;
 });
 return;
 }

 if (lookup && !lookup.orderId) {
 await new Promise((resolve) => setTimeout(resolve, 400));
 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text:
 "Bạn gửi giúp mình **mã đơn** (số đơn), ví dụ: `tra cứu đơn 123` hoặc `mã đơn 123`. Nếu đã **đăng nhập**, chỉ cần mã đơn là được.",
 };
 return updated;
 });
 return;
 }

 const headers = {
 "Content-Type": "application/json",
 };

 const chatAbort = new AbortController();
 const chatTimeoutMs = 150000;
 const chatTimeoutId = setTimeout(() => chatAbort.abort(), chatTimeoutMs);

 let response;
 try {
 response = await fetch(`${API_BASE}/chat`, {
 method: "POST",
 headers,
 credentials: "include",
 signal: chatAbort.signal,
 body: JSON.stringify({ message: userText, bodyProfile }),
 });
 } finally {
 clearTimeout(chatTimeoutId);
 }

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
 } catch (err) {
 const isAbort = err?.name === "AbortError";
 setMessages((prev) => {
 const updated = [...prev];
 updated[updated.length - 1] = {
 role: "assistant",
 text: isAbort
 ? "Phản hồi quá lâu hoặc kết nối bị gián đoạn. Bạn thử gửi lại câu hỏi (ngắn gọn hơn) hoặc kiểm tra backend đang chạy nhé."
 : "Xin lỗi, không thể kết nối đến trợ lý. Bạn thử lại sau nhé.",
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

 {/* Hộp chat có thể resize */}
 {open && (
 <div
 className="fixed z-50"
 style={{
 right: '1.5rem',
 bottom: '6rem',
 width: `${size.w}px`,
 height: `${size.h}px`,
 }}
 >
 {/* Handle resize: cạnh trên */}
 <div
 onMouseDown={(e) => onResizeMouseDown(e, "top")}
 onTouchStart={(e) => onResizeTouchStart(e, "top")}
 className="absolute top-0 left-4 right-4 h-2 cursor-n-resize z-10 flex items-center justify-center group"
 title="Kéo để thay đổi chiều cao"
 >
 <div className="w-10 h-1 rounded-full bg-gray-300 group-hover:bg-gray-500 transition-colors" />
 </div>

 {/* Handle resize: cạnh trái */}
 <div
 onMouseDown={(e) => onResizeMouseDown(e, "left")}
 onTouchStart={(e) => onResizeTouchStart(e, "left")}
 className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize z-10"
 title="Kéo để thay đổi chiều rộng"
 />

 {/* Handle resize: góc trên-trái */}
 <div
 onMouseDown={(e) => onResizeMouseDown(e, "corner")}
 onTouchStart={(e) => onResizeTouchStart(e, "corner")}
 className="absolute top-0 left-0 w-5 h-5 cursor-nw-resize z-20 flex items-center justify-center group"
 title="Kéo để thay đổi kích thước"
 >
 <GripHorizontal className="w-3 h-3 text-gray-400 group-hover:text-gray-600 rotate-45 transition-colors" />
 </div>

 {/* Nội dung chatbox */}
 <div className="w-full h-full bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b bg-black text-white shrink-0">
 <div>
 <p className="text-xs font-black tracking-normal">
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

 {/* Messages */}
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
 : "bg-amber-50 text-gray-900 border border-amber-200 shadow-sm rounded-bl-none"
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

 {/* Input area */}
 <div className="border-t bg-white px-3 py-2 shrink-0">
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
