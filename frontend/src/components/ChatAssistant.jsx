import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";

/**
 * Parse markdown text thành JSX:
 * - [![alt](img)](url)  → ảnh có link
 * - [text](url)         → link văn bản
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
  const bottomRef = useRef(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.bodyProfile) setBodyProfile(res.data.bodyProfile);
      })
      .catch(() => {});
  }, []);

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
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
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

              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];

                if (currentEvent === "chunk" && payload.text !== undefined) {
                  // chunk: nối thêm text vào bubble
                  updated[updated.length - 1] = {
                    ...last,
                    text: last.text + payload.text,
                  };
                } else if (currentEvent === "error" && payload.message) {
                  // error: luôn thay thế nội dung bubble (dù có text cũ hay không)
                  updated[updated.length - 1] = {
                    ...last,
                    text: payload.message,
                  };
                }
                // waiting: không thay đổi bubble, bỏ qua
                return updated;
              });
            } catch {
              // ignore parse errors
            }
          }
        }
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
      {/* Nút mở chat */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-black text-white p-4 shadow-xl hover:bg-gray-800 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em]"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Hỏi trợ lý</span>
      </button>

      {/* Hộp chat */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-black text-white">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em]">
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
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mô tả chiều cao, cân nặng hoặc yêu cầu outfit..."
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="mt-2 w-full bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang trả lời...
                </>
              ) : (
                "Gửi"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
