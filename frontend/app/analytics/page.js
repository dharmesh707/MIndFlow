"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const user = clerkUser || { id: "test_user_dharmesh", firstName: "Dharmesh" };
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const [cognitiveHistory, setCognitiveHistory] = useState([]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!isLoaded) return;
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchReport() {
      try {
        const res = await fetch(
          `${apiBase}/api/personal/report?user_id=${user.id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setReport(data);
        try {
          const cogRes = await fetch(
            `${apiBase}/api/cognitive/history/vscode_user`,
          );
          const cogData = await cogRes.json();
          setCognitiveHistory(cogData.history || []);
        } catch (err) {
          console.log("No cognitive history yet");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [isLoaded]);

  function getScoreColor(score) {
    if (score >= 70) return "#22d3ee";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  }

  function getPressureColor(pressure) {
    if (pressure >= 70) return "#ef4444";
    if (pressure >= 40) return "#f59e0b";
    return "#22d3ee";
  }

  if (!isLoaded || loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080810",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6366f1",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "14px",
        }}
      >
        loading your analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080810",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "14px",
        }}
      >
        error: {error}
      </div>
    );
  }

  const metrics = report?.metrics || {};
  const insights = report?.insights || {};
  const summary = report?.data_summary || {};

  const wellnessScore = metrics.overall_wellness_score || 0;
  const consistencyScore = metrics.consistency_score || 0;
  const focusStability = metrics.focus_stability || 0;
  const burnoutPressure = metrics.burnout_pressure || 0;
  const energyTrend = metrics.energy_trend || {};
  const velocity = metrics.weekly_velocity || {};

  const energyChartData = [
    { label: "Current", value: ((energyTrend.current || 0) / 3) * 100 },
    { label: "Predicted", value: ((energyTrend.predicted_7d || 0) / 3) * 100 },
  ];

  const velocityData = [
    { week: "Avg", wins: velocity.trend_avg || 0 },
    { week: "This week", wins: velocity.current_week || 0 },
  ];

  const cognitiveColors = {
    flow: "#22d3ee",
    struggling: "#f59e0b",
    fatigued: "#f97316",
    frustrated: "#ef4444",
  };

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; }
        .an-page { min-height: 100vh; background: #080810; color: #e2e8f0; padding: 32px; }
        .an-content { max-width: 1200px; margin: 0 auto; }
        .an-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .an-logo { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #fff; }
        .an-logo span { color: #6366f1; }
        .an-subtitle { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #475569; margin-top: 6px; }
        .an-back-btn {
          background: transparent; border: 1px solid rgba(99,102,241,0.5);
          color: #6366f1; padding: 8px 16px; border-radius: 8px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          font-weight: 600; cursor: pointer; text-decoration: none;
          display: flex; align-items: center; gap: 6px;
        }
        .an-back-btn:hover { background: rgba(99,102,241,0.1); }
        .an-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .an-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .an-grid-full { margin-bottom: 20px; }
        .an-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(99,102,241,0.15); border-radius: 14px; padding: 24px; }
        .an-card-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #6366f1; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px; }
        .an-wellness-circle { display: flex; align-items: center; gap: 32px; }
        .an-score-big { font-family: 'Syne', sans-serif; font-size: 64px; font-weight: 800; line-height: 1; }
        .an-score-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; margin-top: 4px; }
        .an-score-summary { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #94a3b8; line-height: 1.6; }
        .an-metric-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .an-metric-label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; letter-spacing: 0.05em; }
        .an-metric-value { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; }
        .an-bar-track { height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
        .an-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
        .an-data-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.05em; }
        .an-insight-item { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #94a3b8; margin-bottom: 6px; padding-left: 12px; border-left: 2px solid rgba(99,102,241,0.3); }
        .an-direction-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
        .an-cog-card { flex: 1; min-width: 120px; border-radius: 10px; padding: 16px; text-align: center; }
        @media (max-width: 768px) {
          .an-grid-2, .an-grid-3 { grid-template-columns: 1fr; }
          .an-page { padding: 20px; }
        }
      `}</style>

      <div className="an-page">
        <div className="an-content">
          {/* Header */}
          <div className="an-header">
            <div>
              <div className="an-logo">
                Mind<span>Flow</span>
              </div>
              <div className="an-subtitle">
                {`// analytics — ${user?.firstName?.toLowerCase() || "developer"}`}
              </div>
            </div>
            <Link href="/dashboard" className="an-back-btn">
              ← dashboard
            </Link>
          </div>

          {/* Row 1 — Wellness Score + Energy Trend */}
          <div className="an-grid-2">
            <div className="an-card">
              <div className="an-card-title">// overall wellness score</div>
              <div className="an-wellness-circle">
                <div>
                  <div
                    className="an-score-big"
                    style={{ color: getScoreColor(wellnessScore) }}
                  >
                    {Math.round(wellnessScore)}
                  </div>
                  <div className="an-score-label">out of 100</div>
                  <div style={{ marginTop: "12px" }}>
                    <span
                      className="an-data-badge"
                      style={{
                        background:
                          summary.data_quality === "sufficient"
                            ? "rgba(34,211,238,0.1)"
                            : "rgba(245,158,11,0.1)",
                        color:
                          summary.data_quality === "sufficient"
                            ? "#22d3ee"
                            : "#f59e0b",
                        border: `1px solid ${summary.data_quality === "sufficient" ? "rgba(34,211,238,0.3)" : "rgba(245,158,11,0.3)"}`,
                      }}
                    >
                      {summary.data_quality === "sufficient"
                        ? "✓ sufficient data"
                        : "⚠ limited data"}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="an-score-summary">{insights.summary}</div>
                  <div
                    style={{ marginTop: "16px", display: "flex", gap: "16px" }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: "#475569",
                        }}
                      >
                        CHECK-INS
                      </div>
                      <div
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: "#e2e8f0",
                        }}
                      >
                        {summary.total_checkins || 0}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: "#475569",
                        }}
                      >
                        WINS
                      </div>
                      <div
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: "22px",
                          fontWeight: "700",
                          color: "#e2e8f0",
                        }}
                      >
                        {summary.total_wins || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">// energy trend forecast</div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#475569",
                    }}
                  >
                    CURRENT
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#22d3ee",
                    }}
                  >
                    {energyTrend.current?.toFixed(1) || "—"}
                    <span style={{ fontSize: "14px", color: "#475569" }}>
                      /3.0
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#475569",
                    }}
                  >
                    7-DAY FORECAST
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "28px",
                      fontWeight: "700",
                      color: "#6366f1",
                    }}
                  >
                    {energyTrend.predicted_7d?.toFixed(1) || "—"}
                    <span style={{ fontSize: "14px", color: "#475569" }}>
                      /3.0
                    </span>
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#475569",
                    }}
                  >
                    DIRECTION
                  </div>
                  <div style={{ marginTop: "6px" }}>
                    <span
                      className="an-direction-badge"
                      style={{
                        background:
                          energyTrend.direction === "improving"
                            ? "rgba(34,211,238,0.1)"
                            : energyTrend.direction === "declining"
                              ? "rgba(239,68,68,0.1)"
                              : "rgba(99,102,241,0.1)",
                        color:
                          energyTrend.direction === "improving"
                            ? "#22d3ee"
                            : energyTrend.direction === "declining"
                              ? "#ef4444"
                              : "#6366f1",
                      }}
                    >
                      {energyTrend.direction === "improving"
                        ? "↑ improving"
                        : energyTrend.direction === "declining"
                          ? "↓ declining"
                          : "→ stable"}
                    </span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={energyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#475569"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                    }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1117",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                    }}
                    formatter={(val) => [`${Math.round(val)}%`, "Energy"]}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 2 — 3 Metric Cards */}
          <div className="an-grid-3">
            <div className="an-card">
              <div className="an-card-title">// logging consistency</div>
              <div className="an-metric-row">
                <div className="an-metric-label">score</div>
                <div
                  className="an-metric-value"
                  style={{ color: getScoreColor(consistencyScore) }}
                >
                  {Math.round(consistencyScore)}%
                </div>
              </div>
              <div className="an-bar-track">
                <div
                  className="an-bar-fill"
                  style={{
                    width: `${consistencyScore}%`,
                    background: getScoreColor(consistencyScore),
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "#475569",
                }}
              >
                days with check-ins / 30 days
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">// focus stability</div>
              <div className="an-metric-row">
                <div className="an-metric-label">score</div>
                <div
                  className="an-metric-value"
                  style={{ color: getScoreColor(focusStability) }}
                >
                  {Math.round(focusStability)}%
                </div>
              </div>
              <div className="an-bar-track">
                <div
                  className="an-bar-fill"
                  style={{
                    width: `${focusStability}%`,
                    background: getScoreColor(focusStability),
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "#475569",
                }}
              >
                energy consistency — low variance = high score
              </div>
            </div>

            <div className="an-card">
              <div className="an-card-title">// burnout pressure</div>
              <div className="an-metric-row">
                <div className="an-metric-label">risk level</div>
                <div
                  className="an-metric-value"
                  style={{ color: getPressureColor(burnoutPressure) }}
                >
                  {Math.round(burnoutPressure)}%
                </div>
              </div>
              <div className="an-bar-track">
                <div
                  className="an-bar-fill"
                  style={{
                    width: `${burnoutPressure}%`,
                    background: getPressureColor(burnoutPressure),
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "#475569",
                }}
              >
                higher = more at risk — target below 40%
              </div>
            </div>
          </div>

          {/* Row 3 — Weekly Velocity */}
          <div className="an-grid-full">
            <div className="an-card">
              <div className="an-card-title">
                // weekly velocity — wins logged
              </div>
              <div
                style={{ display: "flex", gap: "32px", marginBottom: "16px" }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#475569",
                    }}
                  >
                    THIS WEEK
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "32px",
                      fontWeight: "800",
                      color: "#22d3ee",
                    }}
                  >
                    {velocity.current_week || 0}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "#475569",
                    }}
                  >
                    4-WEEK AVG
                  </div>
                  <div
                    style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: "32px",
                      fontWeight: "800",
                      color: "#6366f1",
                    }}
                  >
                    {velocity.trend_avg || 0}
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={velocityData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                  />
                  <XAxis
                    dataKey="week"
                    stroke="#475569"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1117",
                      border: "1px solid rgba(99,102,241,0.3)",
                      borderRadius: "8px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="wins" radius={[4, 4, 0, 0]}>
                    <Cell fill="#22d3ee" />
                    <Cell fill="#6366f1" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row 4 — Insights */}
          <div className="an-grid-3">
            <div className="an-card">
              <div className="an-card-title">// strengths</div>
              {insights.strengths?.length > 0 ? (
                insights.strengths.map((s, i) => (
                  <div
                    key={i}
                    className="an-insight-item"
                    style={{
                      color: "#22d3ee",
                      borderLeftColor: "rgba(34,211,238,0.4)",
                    }}
                  >
                    {s}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  log more check-ins to see strengths
                </div>
              )}
            </div>
            <div className="an-card">
              <div className="an-card-title">// areas of concern</div>
              {insights.risks?.length > 0 ? (
                insights.risks.map((r, i) => (
                  <div
                    key={i}
                    className="an-insight-item"
                    style={{
                      color: "#fca5a5",
                      borderLeftColor: "rgba(239,68,68,0.4)",
                    }}
                  >
                    {r}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  no risks detected
                </div>
              )}
            </div>
            <div className="an-card">
              <div className="an-card-title">// recommendations</div>
              {insights.recommendations?.length > 0 ? (
                insights.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="an-insight-item"
                    style={{
                      color: "#a5b4fc",
                      borderLeftColor: "rgba(99,102,241,0.4)",
                    }}
                  >
                    → {r}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "#334155",
                  }}
                >
                  keep logging to get recommendations
                </div>
              )}
            </div>
          </div>

          {/* Row 5 — Cognitive State ML Analysis */}
          {cognitiveHistory.length > 0 && (
            <div className="an-grid-full">
              <div className="an-card">
                <div className="an-card-title">
                  // cognitive state — ml pattern analysis
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginBottom: "16px",
                  }}
                >
                  {["flow", "struggling", "fatigued", "frustrated"].map(
                    (state) => {
                      const count = cognitiveHistory.filter(
                        (h) => h.predicted_state === state,
                      ).length;
                      const pct = Math.round(
                        (count / cognitiveHistory.length) * 100,
                      );
                      return (
                        <div
                          key={state}
                          style={{
                            flex: 1,
                            minWidth: "120px",
                            background: `${cognitiveColors[state]}11`,
                            border: `1px solid ${cognitiveColors[state]}33`,
                            borderRadius: "10px",
                            padding: "16px",
                            textAlign: "center",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              color: "#475569",
                              marginBottom: "6px",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {state.toUpperCase()}
                          </div>
                          <div
                            style={{
                              fontFamily: "'Syne', sans-serif",
                              fontSize: "32px",
                              fontWeight: "800",
                              color: cognitiveColors[state],
                            }}
                          >
                            {pct}%
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              color: "#334155",
                              marginTop: "4px",
                            }}
                          >
                            {count} session{count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    color: "#334155",
                  }}
                >
                  based on {cognitiveHistory.length} keystroke analysis sessions
                  · müller & fritz (2015) · zuger et al. (2018) weighted
                  classifier
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
