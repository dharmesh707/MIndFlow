import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function TrendChart({ data }) {
  const chartData = data.map((entry) => ({
    date: entry.session_date?.slice(5),
    energy: entry.energy_level,
  }));

  const energyLabels = { 1: "depleted", 2: "okay", 3: "flow" };

  return (
    <>
      <style>{`
        .mf-trend-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px;
          position: relative;
          overflow: hidden;
        }
        .mf-trend-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent);
        }
        .mf-trend-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .mf-trend-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        .mf-trend-legend {
          display: flex;
          gap: 16px;
        }
        .mf-legend-item {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #334155;
          letter-spacing: 0.08em;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .mf-legend-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .mf-trend-empty {
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: #334155;
          letter-spacing: 0.05em;
          padding: 40px 0;
          text-align: center;
        }
      `}</style>

      <div className="mf-trend-card">
        <div className="mf-trend-header">
          <div className="mf-trend-label">7-day energy trend</div>
          <div className="mf-trend-legend">
            <div className="mf-legend-item">
              <div
                className="mf-legend-dot"
                style={{ background: "#ef4444" }}
              />
              depleted
            </div>
            <div className="mf-legend-item">
              <div
                className="mf-legend-dot"
                style={{ background: "#f59e0b" }}
              />
              okay
            </div>
            <div className="mf-legend-item">
              <div
                className="mf-legend-dot"
                style={{ background: "#22d3ee" }}
              />
              flow
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="mf-trend-empty">
            // no session data yet. start a session to see your trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.1)"
                tick={{
                  fontSize: 10,
                  fill: "#334155",
                  fontFamily: "JetBrains Mono",
                }}
              />
              <YAxis
                domain={[1, 3]}
                stroke="rgba(255,255,255,0.1)"
                tick={{
                  fontSize: 10,
                  fill: "#334155",
                  fontFamily: "JetBrains Mono",
                }}
                tickFormatter={(v) => energyLabels[v] || v}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(8,8,16,0.95)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "8px",
                  fontFamily: "JetBrains Mono",
                  fontSize: "11px",
                  color: "#94a3b8",
                }}
                formatter={(value) => [energyLabels[value] || value, "energy"]}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
                activeDot={{ fill: "#22d3ee", r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}
