import { useState } from "react";

export default function CheckinPopup({ userId, onClose, onCheckinDone }) {
  const [energy, setEnergy] = useState(null);
  const [onTrack, setOnTrack] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (energy === null || onTrack === null) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/checkin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            session_date: today,
            checkin_number: 1,
            energy_level: energy,
            on_track: onTrack,
            planned_hours: 2,
            actual_topic: "Study session",
          }),
        },
      );
      const data = await res.json();
      onCheckinDone(data);
      onClose();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const energyOptions = [
    {
      value: 1,
      symbol: "▼",
      label: "depleted",
      color: "#ef4444",
      glow: "rgba(239,68,68,0.15)",
    },
    {
      value: 2,
      symbol: "◆",
      label: "okay",
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.15)",
    },
    {
      value: 3,
      symbol: "▲",
      label: "in flow",
      color: "#22d3ee",
      glow: "rgba(34,211,238,0.15)",
    },
  ];

  return (
    <>
      <style>{`
        .mf-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: mf-overlay-in 0.2s ease;
        }

        @keyframes mf-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .mf-checkin-modal {
          background: #0d0d1a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px;
          width: 420px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: relative;
          overflow: hidden;
          animation: mf-modal-in 0.25s cubic-bezier(0.4,0,0.2,1);
        }

        @keyframes mf-modal-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mf-checkin-modal::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent);
        }

        .mf-checkin-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-align: center;
        }

        .mf-checkin-section-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #334155;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 12px;
          font-weight: 600;
        }

        .mf-energy-row {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .mf-energy-btn {
          flex: 1;
          padding: 16px 8px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }

        .mf-energy-btn:hover {
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.04);
        }

        .mf-energy-symbol {
          font-size: 20px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          line-height: 1;
        }

        .mf-energy-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: lowercase;
        }

        .mf-track-row {
          display: flex;
          gap: 12px;
        }

        .mf-track-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: #475569;
          text-transform: lowercase;
        }

        .mf-track-btn:hover {
          border-color: rgba(255,255,255,0.15);
          color: #e2e8f0;
        }

        .mf-track-yes-active {
          background: rgba(34,211,238,0.08) !important;
          border-color: rgba(34,211,238,0.3) !important;
          color: #22d3ee !important;
        }

        .mf-track-no-active {
          background: rgba(239,68,68,0.08) !important;
          border-color: rgba(239,68,68,0.3) !important;
          color: #ef4444 !important;
        }

        .mf-submit-checkin {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
          border: none;
          text-transform: lowercase;
        }

        .mf-submit-ready {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
        }

        .mf-submit-ready:hover {
          box-shadow: 0 4px 30px rgba(99,102,241,0.5);
          transform: translateY(-1px);
        }

        .mf-submit-disabled {
          background: rgba(255,255,255,0.04);
          color: #334155;
          cursor: not-allowed;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .mf-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: #334155;
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          line-height: 1;
          padding: 4px 8px;
          border-radius: 4px;
          transition: color 0.2s;
        }

        .mf-close-btn:hover {
          color: #94a3b8;
        }
      `}</style>

      <div
        className="mf-overlay"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="mf-checkin-modal">
          <button className="mf-close-btn" onClick={onClose}>
            ×
          </button>

          <div className="mf-checkin-title">// session check-in</div>

          {/* Energy */}
          <div>
            <div className="mf-checkin-section-label">how's your energy?</div>
            <div className="mf-energy-row">
              {energyOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setEnergy(opt.value)}
                  className="mf-energy-btn"
                  style={
                    energy === opt.value
                      ? {
                          background: opt.glow,
                          borderColor: opt.color,
                          boxShadow: `0 0 20px ${opt.glow}`,
                        }
                      : {}
                  }
                >
                  <span
                    className="mf-energy-symbol"
                    style={{
                      color: energy === opt.value ? opt.color : "#334155",
                    }}
                  >
                    {opt.symbol}
                  </span>
                  <span
                    className="mf-energy-label"
                    style={{
                      color: energy === opt.value ? opt.color : "#475569",
                    }}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* On Track */}
          <div>
            <div className="mf-checkin-section-label">still on track?</div>
            <div className="mf-track-row">
              <button
                onClick={() => setOnTrack(true)}
                className={`mf-track-btn ${onTrack === true ? "mf-track-yes-active" : ""}`}
              >
                ◆ yes
              </button>
              <button
                onClick={() => setOnTrack(false)}
                className={`mf-track-btn ${onTrack === false ? "mf-track-no-active" : ""}`}
              >
                ◇ no
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || energy === null || onTrack === null}
            className={`mf-submit-checkin ${
              loading || energy === null || onTrack === null
                ? "mf-submit-disabled"
                : "mf-submit-ready"
            }`}
          >
            {loading ? "saving..." : "submit check-in →"}
          </button>
        </div>
      </div>
    </>
  );
}
