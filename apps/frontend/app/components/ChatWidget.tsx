"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "Best hijab under PKR 2000?",
  "Show me fancy abayas",
  "What sizes do you have?",
  "Shipping to Karachi?",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Assalamu Alaikum! 💛 I'm your ModestStyle assistant. Ask me about hijabs, abayas, sizes, shipping, or anything about our collection!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setShowQuick(false);
    const userMsg: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Local Next.js API route — no CORS, no cold start issues
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't respond right now. Please try again!",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Apologies, something went wrong! Please WhatsApp us at +92 300 1234567 💛",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-secondary text-white shadow-xl hover:bg-secondary/90 transition-all duration-200 flex items-center justify-center group"
        aria-label="Chat with us"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {/* Pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold-400 rounded-full border-2 border-white animate-pulse" />
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-secondary to-secondary/90 text-white px-4 py-3.5 flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-sm font-bold shadow-sm">
                M
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-secondary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">ModestStyle Assistant</p>
              <p className="text-[11px] text-gold-300/80">Powered by AI • Only for ModestStyle.pk</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition text-white/60 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    M
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-secondary text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                  M
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick replies (show only at start) */}
            {showQuick && messages.length === 1 && !loading && (
              <div className="pt-1">
                <p className="text-[10px] text-gray-400 mb-2 px-1">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] bg-gold-50 border border-gold-200 text-gold-700 px-3 py-1.5 rounded-full hover:bg-gold-100 transition font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex gap-2 flex-shrink-0 bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about hijabs, abayas, sizes…"
              className="flex-1 text-sm px-4 py-2.5 bg-gray-50 rounded-full outline-none focus:ring-2 focus:ring-gold-300 focus:bg-white transition"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center hover:bg-secondary/90 transition disabled:opacity-40 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
