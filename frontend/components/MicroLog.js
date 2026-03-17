"use client";
import { useState } from "react";

export default function MicroLog({ userId, streak }) {
  const [win, setWin] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(streak || 0);

  async function handleLog() {
    if (!win.trim()) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          win_text: win,
          log_date: today,
        }),
      });
      const data = await res.json();
      setCurrentStreak(data.streak_day);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  return (
    <>
      <style>{`
        .mf-micro-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .mf-micro-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
        }
        .mf-micro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mf-micro-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .mf-streak-badge {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
          color: #818cf8;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mf-streak-num {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #6366f1;
        }
        .mf-win-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 14px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
          font-family: inherit;
          line-height: 1.5;
        }
        .mf-win-input::placeholder { color: #334155; }
        .mf-win-input:focus {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.03);
        }
        .mf-log-btn {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
          border: 1px solid rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          text-transform: lowercase;
        }
        .mf-log-btn:hover:not(:disabled) {
          background: rgba(99,102,241,0.2);
          border-color: rgba(99,102,241,0.5);
          box-shadow: 0 0 20px rgba(99,102,241,0.15);
        }
        .mf-log-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mf-win-success {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(34,211,238,0.05);
          border: 1px solid rgba(34,211,238,0.15);
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #22d3ee;
          letter-spacing: 0.05em;
        }
        .mf-win-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 8px #22d3ee;
          flex-shrink: 0;
        }
      `}</style>

      <div className="mf-micro-card">
        <div className="mf-micro-header">
          <div className="mf-micro-label">microlog</div>
          <div className="mf-streak-badge">
            <span>▲</span>
            <span className="mf-streak-num">{currentStreak}</span>
            <span>day streak</span>
          </div>
        </div>

        {submitted ? (
          <div className="mf-win-success">
            <div className="mf-win-dot" />
            win logged. see you tomorrow.
          </div>
        ) : (
          <>
            <input
              value={win}
              onChange={(e) => setWin(e.target.value)}
              placeholder="what was your one win today?"
              className="mf-win-input"
              onKeyDown={(e) => e.key === "Enter" && handleLog()}
            />
            <button
              onClick={handleLog}
              disabled={loading}
              className="mf-log-btn"
            >
              {loading ? "saving..." : "→ log win"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
