"use client";
import { useState } from "react";

// Simple markdown renderer — no external library needed
function renderMarkdown(text) {
  if (!text) return "";

  // Code blocks first (```...```)
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<div class="mf-code-block"><div class="mf-code-lang">${lang || "code"}</div><pre><code>${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre></div>`;
  });

  // Inline code (`...`)
  text = text.replace(/`([^`]+)`/g, '<code class="mf-inline-code">$1</code>');

  // Bold (**...**)
  text = text.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="mf-bold">$1</strong>',
  );

  // Headers (## and #)
  text = text.replace(/^### (.+)$/gm, '<div class="mf-h3">$1</div>');
  text = text.replace(/^## (.+)$/gm, '<div class="mf-h2">$1</div>');
  text = text.replace(/^# (.+)$/gm, '<div class="mf-h1">$1</div>');

  // Bullet points (* or -)
  text = text.replace(
    /^[\*\-] (.+)$/gm,
    '<div class="mf-bullet"><span class="mf-bullet-dot">▸</span>$1</div>',
  );

  // Line breaks
  text = text.replace(/\n\n/g, '<div class="mf-spacer"></div>');
  text = text.replace(/\n/g, "<br/>");

  return text;
}

export default function AiAssistant({ burnoutScore = "Low" }) {
  const [question, setQuestion] = useState("");
  const [codeContext, setCodeContext] = useState("");
  const [mode, setMode] = useState("guide");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!question.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          mode,
          code_context: codeContext,
          burnout_score: burnoutScore,
        }),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        answer: "Error connecting to backend.",
        grounded: false,
        mode_used: mode,
      });
    }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        .mf-ai-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }

        .mf-ai-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
        }

        .mf-ai-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .mf-ai-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .mf-burnout-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .mf-mode-row {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }

        .mf-mode-btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .mf-mode-btn-guide-active {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          color: #818cf8;
          box-shadow: 0 0 20px rgba(99,102,241,0.1);
        }

        .mf-mode-btn-guide-inactive {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.06);
          color: #475569;
        }

        .mf-mode-btn-show-active {
          background: rgba(34,211,238,0.1);
          border-color: rgba(34,211,238,0.3);
          color: #22d3ee;
          box-shadow: 0 0 20px rgba(34,211,238,0.08);
        }

        .mf-mode-btn-show-inactive {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.06);
          color: #475569;
        }

        .mf-mode-btn:hover {
          color: #e2e8f0;
          border-color: rgba(255,255,255,0.15);
        }

        .mf-input-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #334155;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .mf-textarea {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 14px;
          color: #e2e8f0;
          font-size: 14px;
          resize: none;
          outline: none;
          transition: border-color 0.2s ease;
          margin-bottom: 16px;
          font-family: inherit;
          line-height: 1.6;
        }

        .mf-textarea-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #94a3b8;
        }

        .mf-textarea:focus {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.03);
        }

        .mf-submit-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
          border: none;
          text-transform: lowercase;
          margin-bottom: 20px;
        }

        .mf-submit-active {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }

        .mf-submit-active:hover {
          box-shadow: 0 4px 30px rgba(99,102,241,0.5);
          transform: translateY(-1px);
        }

        .mf-submit-loading {
          background: rgba(99,102,241,0.2);
          color: #6366f1;
          cursor: not-allowed;
        }

        /* Response area */
        .mf-response {
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          overflow: hidden;
          animation: mf-fade-in 0.4s ease;
        }

        @keyframes mf-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mf-response-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .mf-response-mode {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #475569;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .mf-grounded-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .mf-grounded-true {
          background: rgba(34,211,238,0.1);
          color: #22d3ee;
          border: 1px solid rgba(34,211,238,0.2);
        }

        .mf-grounded-false {
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          border: 1px solid rgba(99,102,241,0.2);
        }

        .mf-response-body {
          padding: 20px;
          color: #cbd5e1;
          font-size: 14px;
          line-height: 1.8;
          max-height: 500px;
          overflow-y: auto;
        }

        /* Markdown styles */
        .mf-code-block {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          margin: 12px 0;
          overflow: hidden;
        }

        .mf-code-lang {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #475569;
          padding: 6px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.02);
        }

        .mf-code-block pre {
          padding: 16px;
          overflow-x: auto;
          margin: 0;
        }

        .mf-code-block code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          color: #a5f3fc;
          line-height: 1.7;
        }

        .mf-inline-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #a5f3fc;
          background: rgba(34,211,238,0.08);
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid rgba(34,211,238,0.15);
        }

        .mf-bold { color: #f1f5f9; font-weight: 700; }

        .mf-h1, .mf-h2 {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          color: #f1f5f9;
          margin: 16px 0 8px;
        }

        .mf-h1 { font-size: 18px; }
        .mf-h2 { font-size: 16px; }
        .mf-h3 { font-size: 14px; font-weight: 600; color: #e2e8f0; margin: 12px 0 6px; }

        .mf-bullet {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin: 4px 0;
          padding-left: 4px;
        }

        .mf-bullet-dot {
          color: #6366f1;
          font-size: 10px;
          margin-top: 5px;
          flex-shrink: 0;
        }

        .mf-spacer { height: 8px; }
      `}</style>

      <div className="mf-ai-card">
        {/* Header */}
        <div className="mf-ai-header">
          <div className="mf-ai-title">// ai assistant</div>
          <div
            className="mf-burnout-badge"
            style={{
              background:
                burnoutScore === "High"
                  ? "rgba(239,68,68,0.1)"
                  : burnoutScore === "Medium"
                    ? "rgba(245,158,11,0.1)"
                    : "rgba(34,211,238,0.1)",
              color:
                burnoutScore === "High"
                  ? "#ef4444"
                  : burnoutScore === "Medium"
                    ? "#f59e0b"
                    : "#22d3ee",
              border: `1px solid ${
                burnoutScore === "High"
                  ? "rgba(239,68,68,0.2)"
                  : burnoutScore === "Medium"
                    ? "rgba(245,158,11,0.2)"
                    : "rgba(34,211,238,0.2)"
              }`,
            }}
          >
            {burnoutScore === "High"
              ? "😵 adapting for tired mode"
              : burnoutScore === "Medium"
                ? "😐 balanced mode"
                : "🔥 full depth mode"}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mf-mode-row">
          <button
            onClick={() => setMode("guide")}
            className={`mf-mode-btn ${
              mode === "guide"
                ? "mf-mode-btn-guide-active"
                : "mf-mode-btn-guide-inactive"
            }`}
          >
            <span>◈</span> guide me
          </button>
          <button
            onClick={() => setMode("show")}
            className={`mf-mode-btn ${
              mode === "show"
                ? "mf-mode-btn-show-active"
                : "mf-mode-btn-show-inactive"
            }`}
          >
            <span>◉</span> show me
          </button>
        </div>

        {/* Question */}
        <div className="mf-input-label">your question</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="what are you stuck on?"
          className="mf-textarea"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleSubmit();
          }}
        />

        {/* Code */}
        <div className="mf-input-label">code context (optional)</div>
        <textarea
          value={codeContext}
          onChange={(e) => setCodeContext(e.target.value)}
          placeholder="paste your code here..."
          className="mf-textarea mf-textarea-code"
          rows={3}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`mf-submit-btn ${
            loading ? "mf-submit-loading" : "mf-submit-active"
          }`}
        >
          {loading ? "thinking..." : "ask mindflow →"}
        </button>

        {/* Response */}
        {response && (
          <div className="mf-response">
            <div className="mf-response-header">
              <span className="mf-response-mode">
                {response.mode_used === "guide" ? "◈ guide me" : "◉ show me"}
              </span>
              <span
                className={`mf-grounded-badge ${
                  response.grounded ? "mf-grounded-true" : "mf-grounded-false"
                }`}
              >
                {response.grounded ? "◆ doc grounded" : "◇ general guidance"}
              </span>
            </div>
            <div
              className="mf-response-body"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(response.answer),
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
