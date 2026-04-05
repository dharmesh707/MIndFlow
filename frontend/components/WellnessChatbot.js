"use client";
import { useState, useRef, useEffect } from "react";

export default function WellnessChatbot({ userId, burnoutScore }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I'm your MindFlow wellness advisor. I can see your burnout scores, energy patterns, and cognitive states. Ask me anything about your productivity or wellbeing.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/api/wellness-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: userMessage,
          history: messages.slice(-5),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Could not reach backend. Make sure it's running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "How am I doing this week?",
    "Should I take a break now?",
    "Why is my burnout risk rising?",
    "How can I improve my streak?",
  ];

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        height: "520px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "#6366f1",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            // wellness advisor
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "#334155",
              marginTop: "4px",
            }}
          >
            personalized · data-driven · context-aware
          </div>
        </div>
        <div
          style={{
            padding: "4px 12px",
            borderRadius: "20px",
            background:
              burnoutScore === "High"
                ? "rgba(239,68,68,0.1)"
                : burnoutScore === "Medium"
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(34,211,238,0.1)",
            border: `1px solid ${burnoutScore === "High" ? "rgba(239,68,68,0.3)" : burnoutScore === "Medium" ? "rgba(245,158,11,0.3)" : "rgba(34,211,238,0.3)"}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color:
              burnoutScore === "High"
                ? "#ef4444"
                : burnoutScore === "Medium"
                  ? "#f59e0b"
                  : "#22d3ee",
            fontWeight: "700",
          }}
        >
          {burnoutScore || "Low"} risk
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          paddingRight: "4px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius:
                  msg.role === "user"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                background:
                  msg.role === "user"
                    ? "rgba(99,102,241,0.15)"
                    : "rgba(255,255,255,0.04)",
                border:
                  msg.role === "user"
                    ? "1px solid rgba(99,102,241,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: "1.6",
                color: msg.role === "user" ? "#a5b4fc" : "#cbd5e1",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "12px 12px 12px 4px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                color: "#475569",
              }}
            >
              analyzing your data...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only show if only 1 message (initial) */}
      {messages.length === 1 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginBottom: "12px",
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              style={{
                padding: "5px 10px",
                borderRadius: "20px",
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.25)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "#6366f1",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseOver={(e) =>
                (e.target.style.background = "rgba(99,102,241,0.1)")
              }
              onMouseOut={(e) => (e.target.style.background = "transparent")}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="ask about your wellness or productivity..."
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 16px",
            background:
              loading || !input.trim() ? "rgba(99,102,241,0.15)" : "#6366f1",
            border: "none",
            borderRadius: "8px",
            color: loading || !input.trim() ? "#475569" : "white",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            fontWeight: "700",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {loading ? "..." : "→"}
        </button>
      </div>
    </div>
  );
}
