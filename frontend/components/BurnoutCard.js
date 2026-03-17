"use client";

export default function BurnoutCard({ score }) {
  const config = {
    Low: {
      accent: "#22d3ee",
      glow: "rgba(34,211,238,0.15)",
      border: "rgba(34,211,238,0.2)",
      label: "LOW",
      message: "You're in a good flow. Keep it up.",
      bar: "100%",
      dot: "#22d3ee",
    },
    Medium: {
      accent: "#f59e0b",
      glow: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.2)",
      label: "MEDIUM",
      message: "Consider a short break soon.",
      bar: "60%",
      dot: "#f59e0b",
    },
    High: {
      accent: "#ef4444",
      glow: "rgba(239,68,68,0.15)",
      border: "rgba(239,68,68,0.2)",
      label: "HIGH",
      message: "High burnout risk. Take a longer break.",
      bar: "25%",
      dot: "#ef4444",
    },
  };

  const c = config[score] || config["Low"];

  return (
    <>
      <style>{`
        .mf-burnout-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .mf-burnout-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
          opacity: 0.6;
        }

        .mf-burnout-glow {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: var(--glow);
          filter: blur(40px);
          pointer-events: none;
        }

        .mf-burnout-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.15em;
          margin-bottom: 16px;
          text-transform: uppercase;
        }

        .mf-burnout-score-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .mf-burnout-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          animation: pulse-dot 2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px var(--accent); }
          50% { opacity: 0.6; box-shadow: 0 0 20px var(--accent); }
        }

        .mf-burnout-score-text {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: -1px;
          line-height: 1;
        }

        .mf-burnout-message {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 20px;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.02em;
        }

        .mf-burnout-bar-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }

        .mf-burnout-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div
        className="mf-burnout-card"
        style={{
          "--accent": c.accent,
          "--glow": c.glow,
          borderColor: c.border,
        }}
      >
        <div className="mf-burnout-glow" />
        <div className="mf-burnout-label">burnout risk</div>
        <div className="mf-burnout-score-row">
          <div className="mf-burnout-dot" />
          <div className="mf-burnout-score-text">{c.label}</div>
        </div>
        <div className="mf-burnout-message">{c.message}</div>
        <div className="mf-burnout-bar-track">
          <div className="mf-burnout-bar-fill" style={{ width: c.bar }} />
        </div>
      </div>
    </>
  );
}
