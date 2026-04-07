"use client";
import { useEffect, useState, useRef } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
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

export default function TeamDashboard() {
  const { user: clerkUser, isLoaded } = useUser();
  const user = clerkUser || { id: "demo_manager", firstName: "Manager" };
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addTeamId, setAddTeamId] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchTeamDashboard();
  }, [isLoaded]);

  async function fetchTeamDashboard() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/api/team/dashboard/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch team data");
      const data = await res.json();
      setTeams(data.teams || []);
      if (data.teams?.length > 0) setAddTeamId(data.teams[0].team_id);
    } catch (err) {
      setError("Could not load team data. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTeam() {
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${apiBase}/api/team/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manager_id: user.id, team_name: teamName }),
      });
      if (!res.ok) throw new Error("Failed to create team");
      setTeamName("");
      await fetchTeamDashboard();
    } catch (err) {
      setError("Could not create team.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember() {
    if (!addEmail.trim() || !addTeamId) return;
    setAddingMember(true);
    setAddMsg("");
    try {
      const res = await fetch(`${apiBase}/api/team/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manager_id: user.id,
          team_id: addTeamId,
          student_email: addEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add member");
      setAddMsg(data.message);
      setAddEmail("");
      await fetchTeamDashboard();
    } catch (err) {
      setAddMsg(err.message);
    } finally {
      setAddingMember(false);
    }
  }

  function getHealthPercent(burnout) {
    if (burnout === "Low") return 85;
    if (burnout === "Medium") return 50;
    if (burnout === "High") return 20;
    return 0;
  }

  function getHealthColor(burnout) {
    if (burnout === "Low") return "#22c55e";
    if (burnout === "Medium") return "#f59e0b";
    if (burnout === "High") return "#ef4444";
    return "#cbd5e1";
  }

  function buildTrendData(member) {
    if (!member.trend || member.trend.length === 0) return [];
    return [...member.trend].reverse().map((entry, i) => ({
      day: entry.session_date?.slice(5) || `D${i + 1}`,
      health: getHealthPercent(entry.burnout_score),
    }));
  }

  function getInitials(email) {
    return email ? email.slice(0, 2).toUpperCase() : "??";
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#0f172a",
              marginBottom: "12px",
            }}
          >
            Loading team data
          </div>
          <div style={{ fontSize: "14px", color: "#64748b" }}>
            Please wait...
          </div>
        </div>
      </div>
    );
  }

  const allMembers = teams.flatMap((t) => t.members || []);
  const totalMembers = allMembers.length;
  const avgHealth =
    totalMembers > 0
      ? Math.round(
          allMembers.reduce(
            (sum, m) => sum + getHealthPercent(m.current_burnout),
            0,
          ) / totalMembers,
        )
      : 0;
  const activeTodayCount = allMembers.filter((m) => m.active_today).length;
  const atRiskCount = allMembers.filter(
    (m) => m.current_burnout === "High",
  ).length;

  return (
    <>
      <style suppressHydrationWarning>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .tw-container { background: #f8fafc; min-height: 100vh; padding: 32px 24px; }
        .tw-inner { max-width: 1400px; margin: 0 auto; }
        .tw-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
        .tw-brand { display: flex; align-items: center; gap: 12px; }
        .tw-brand-dot { width: 10px; height: 10px; background: #6366f1; border-radius: 50%; }
        .tw-title { font-size: 22px; font-weight: 700; color: #0f172a; }
        .tw-tagline { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .tw-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .tw-stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .tw-stat-label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
        .tw-stat-value { font-size: 32px; font-weight: 700; color: #0f172a; line-height: 1; }
        .tw-section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .tw-section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 20px; }
        .tw-section-subtitle { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .tw-form-row { display: flex; gap: 12px; align-items: center; }
        .tw-input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #0f172a; font-family: inherit; outline: none; transition: border-color 0.15s; background: #f8fafc; }
        .tw-input:focus { border-color: #6366f1; background: white; }
        .tw-select { padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #0f172a; font-family: inherit; cursor: pointer; outline: none; background: #f8fafc; }
        .tw-btn { padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
        .tw-btn:hover:not(:disabled) { background: #4f46e5; }
        .tw-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .tw-btn-outline { padding: 8px 16px; background: transparent; color: #6366f1; border: 1px solid #6366f1; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .tw-btn-outline:hover { background: #6366f1; color: white; }
        .tw-invite-box { display: inline-flex; align-items: center; gap: 10px; background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 8px 16px; }
        .tw-invite-code { font-family: 'SF Mono', monospace; font-size: 18px; font-weight: 700; color: #4f46e5; letter-spacing: 0.1em; }
        .tw-members-list { display: flex; flex-direction: column; gap: 12px; }
        .tw-member-row {
          display: flex; align-items: center; gap: 16px;
          padding: 16px 20px; background: #f8fafc;
          border: 1px solid #e2e8f0; border-radius: 10px;
          cursor: pointer; transition: all 0.15s;
        }
        .tw-member-row:hover { border-color: #6366f1; background: white; box-shadow: 0 2px 8px rgba(99,102,241,0.08); }
        .tw-member-row.selected { border-color: #6366f1; background: white; box-shadow: 0 2px 8px rgba(99,102,241,0.12); }
        .tw-avatar { width: 40px; height: 40px; border-radius: 10px; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #4f46e5; flex-shrink: 0; }
        .tw-member-info { flex: 1; min-width: 0; }
        .tw-member-name { font-size: 14px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tw-member-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .tw-health-section { flex: 2; }
        .tw-health-label { font-size: 11px; color: #94a3b8; margin-bottom: 5px; display: flex; justify-content: space-between; }
        .tw-bar-track { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .tw-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .tw-member-stats { display: flex; gap: 20px; flex-shrink: 0; }
        .tw-mini-stat { text-align: center; }
        .tw-mini-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .tw-mini-value { font-size: 13px; font-weight: 700; color: #0f172a; }
        .tw-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
        .tw-detail-panel { position: fixed; right: 0; top: 0; width: 420px; height: 100vh; background: white; border-left: 1px solid #e2e8f0; box-shadow: -4px 0 24px rgba(0,0,0,0.08); padding: 32px; overflow-y: auto; z-index: 1000; animation: slideIn 0.25s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .tw-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.15); z-index: 999; }
        .tw-detail-close { position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; border-radius: 8px; width: 32px; height: 32px; font-size: 18px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; }
        .tw-detail-close:hover { background: #e2e8f0; }
        .tw-detail-avatar { width: 56px; height: 56px; border-radius: 14px; background: #e0e7ff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #4f46e5; margin-bottom: 16px; }
        .tw-detail-name { font-size: 18px; font-weight: 700; color: #0f172a; }
        .tw-detail-email { font-size: 13px; color: #94a3b8; margin-top: 2px; margin-bottom: 24px; }
        .tw-detail-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
        .tw-kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
        .tw-kpi-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .tw-kpi-value { font-size: 20px; font-weight: 700; color: #0f172a; }
        .tw-win-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 14px; margin-bottom: 24px; font-size: 13px; color: #166534; font-style: italic; }
        .tw-chart-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; }
        .tw-message { font-size: 13px; color: #6366f1; margin-top: 12px; padding: 10px 14px; background: #f0f4ff; border-radius: 8px; }
        .tw-error-msg { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; }
        .tw-empty { text-align: center; padding: 48px 20px; color: #94a3b8; font-size: 14px; }
        .tw-team-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        @media (max-width: 900px) {
          .tw-stats { grid-template-columns: repeat(2, 1fr); }
          .tw-member-stats { display: none; }
          .tw-detail-panel { width: 100%; }
        }
      `}</style>

      <div className="tw-container">
        <div className="tw-inner">
          {/* Header */}
          <div className="tw-header">
            <div>
              <div className="tw-brand">
                <div className="tw-brand-dot" />
                <div className="tw-title">MindFlow for Teams</div>
              </div>
              <div className="tw-tagline">Workforce Wellness Intelligence</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                {user?.firstName || "Manager"}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          {/* KPI Stats */}
          <div className="tw-stats">
            <div className="tw-stat-card">
              <div className="tw-stat-label">Team Members</div>
              <div className="tw-stat-value">{totalMembers}</div>
            </div>
            <div className="tw-stat-card">
              <div className="tw-stat-label">Avg Wellness</div>
              <div
                className="tw-stat-value"
                style={{
                  color:
                    avgHealth > 70
                      ? "#22c55e"
                      : avgHealth > 50
                        ? "#f59e0b"
                        : "#ef4444",
                }}
              >
                {avgHealth}%
              </div>
            </div>
            <div className="tw-stat-card">
              <div className="tw-stat-label">Active Today</div>
              <div className="tw-stat-value">{activeTodayCount}</div>
            </div>
            <div
              className="tw-stat-card"
              style={{
                borderLeft:
                  atRiskCount > 0 ? "3px solid #ef4444" : "1px solid #e2e8f0",
              }}
            >
              <div className="tw-stat-label">At Risk</div>
              <div
                className="tw-stat-value"
                style={{ color: atRiskCount > 0 ? "#ef4444" : "#0f172a" }}
              >
                {atRiskCount}
              </div>
            </div>
          </div>

          {error && (
            <div
              className="tw-message tw-error-msg"
              style={{ marginBottom: "20px" }}
            >
              {error}
            </div>
          )}

          {/* Create Team */}
          <div className="tw-section">
            <div className="tw-section-title">Create a New Team</div>
            <div className="tw-form-row">
              <input
                className="tw-input"
                placeholder="Enter team name (e.g. Engineering — Q2)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
              />
              <button
                className="tw-btn"
                onClick={handleCreateTeam}
                disabled={creating || !teamName.trim()}
              >
                {creating ? "Creating..." : "Create Team"}
              </button>
            </div>
          </div>

          {/* Add Member */}
          {teams.length > 0 && (
            <div className="tw-section">
              <div className="tw-section-title">Add Member by Email</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div className="tw-form-row">
                  <select
                    className="tw-select"
                    value={addTeamId}
                    onChange={(e) => setAddTeamId(e.target.value)}
                  >
                    {teams.map((t) => (
                      <option key={t.team_id} value={t.team_id}>
                        {t.team_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tw-form-row">
                  <input
                    className="tw-input"
                    placeholder="member@company.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                  />
                  <button
                    className="tw-btn"
                    onClick={handleAddMember}
                    disabled={addingMember || !addEmail.trim()}
                  >
                    {addingMember ? "Adding..." : "Add Member"}
                  </button>
                </div>
                {addMsg && <div className="tw-message">{addMsg}</div>}
              </div>
            </div>
          )}

          {/* Teams */}
          {teams.length === 0 ? (
            <div className="tw-section">
              <div className="tw-empty">
                No teams yet. Create your first team above to get started.
              </div>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.team_id} className="tw-section">
                <div className="tw-team-header">
                  <div>
                    <div
                      className="tw-section-title"
                      style={{ marginBottom: "8px" }}
                    >
                      {team.team_name}
                    </div>
                    <div className="tw-invite-box">
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Invite Code
                      </span>
                      <span className="tw-invite-code">{team.invite_code}</span>
                      <button
                        className="tw-btn-outline"
                        onClick={() =>
                          navigator.clipboard.writeText(team.invite_code)
                        }
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginBottom: "4px",
                      }}
                    >
                      Team Average
                    </div>
                    <div
                      style={{
                        fontSize: "22px",
                        fontWeight: "700",
                        color: getHealthColor(team.team_average_burnout),
                      }}
                    >
                      {getHealthPercent(team.team_average_burnout)}%
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: getHealthColor(team.team_average_burnout),
                      }}
                    >
                      {team.team_average_burnout} Risk
                    </div>
                  </div>
                </div>

                {team.members.length === 0 ? (
                  <div className="tw-empty">
                    No members yet. Share the invite code above.
                  </div>
                ) : (
                  <div className="tw-members-list">
                    {team.members.map((member) => (
                      <div
                        key={member.student_id}
                        className={`tw-member-row ${selectedMember?.student_id === member.student_id ? "selected" : ""}`}
                        onClick={() =>
                          setSelectedMember(
                            selectedMember?.student_id === member.student_id
                              ? null
                              : member,
                          )
                        }
                      >
                        <div className="tw-avatar">
                          {getInitials(member.email)}
                        </div>
                        <div className="tw-member-info">
                          <div className="tw-member-name">{member.email}</div>
                          <div className="tw-member-meta">
                            <span
                              className="tw-status-dot"
                              style={{
                                background: member.active_today
                                  ? "#22c55e"
                                  : "#cbd5e1",
                              }}
                            />
                            {member.active_today
                              ? "Active today"
                              : "Not checked in"}
                          </div>
                        </div>
                        <div className="tw-health-section">
                          <div className="tw-health-label">
                            <span>Wellness Score</span>
                            <span
                              style={{
                                fontWeight: "700",
                                color: getHealthColor(member.current_burnout),
                              }}
                            >
                              {getHealthPercent(member.current_burnout)}%
                            </span>
                          </div>
                          <div className="tw-bar-track">
                            <div
                              className="tw-bar-fill"
                              style={{
                                width: `${getHealthPercent(member.current_burnout)}%`,
                                background: getHealthColor(
                                  member.current_burnout,
                                ),
                              }}
                            />
                          </div>
                        </div>
                        <div className="tw-member-stats">
                          <div className="tw-mini-stat">
                            <div className="tw-mini-label">Streak</div>
                            <div className="tw-mini-value">
                              🔥 {member.streak}d
                            </div>
                          </div>
                          <div className="tw-mini-stat">
                            <div className="tw-mini-label">Risk</div>
                            <div
                              className="tw-mini-value"
                              style={{
                                color: getHealthColor(member.current_burnout),
                              }}
                            >
                              {member.current_burnout}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* Team Analytics Section */}
      <div className="tw-section" style={{ marginTop: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          <div className="tw-section-title" style={{ marginBottom: 0 }}>
            📊 Team Analytics
          </div>
          <span
            style={{ fontSize: "13px", color: "#6366f1", fontWeight: "600" }}
          >
            {showAnalytics ? "▲ collapse" : "▼ expand"}
          </span>
        </div>

        {showAnalytics && (
          <div style={{ marginTop: "24px" }}>
            {allMembers.length === 0 ? (
              <div className="tw-empty">
                No members yet. Add members to see team analytics.
              </div>
            ) : (
              <>
                {/* Row 1 — Engagement + Distribution */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "20px",
                  }}
                >
                  {/* Team Engagement */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "12px",
                      }}
                    >
                      Team Engagement Today
                    </div>
                    <div
                      style={{
                        fontSize: "48px",
                        fontWeight: "700",
                        color: activeTodayCount > 0 ? "#22c55e" : "#94a3b8",
                        lineHeight: 1,
                      }}
                    >
                      {totalMembers > 0
                        ? Math.round((activeTodayCount / totalMembers) * 100)
                        : 0}
                      %
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#94a3b8",
                        marginTop: "6px",
                      }}
                    >
                      {activeTodayCount} of {totalMembers} members active
                    </div>
                    <div
                      style={{
                        marginTop: "12px",
                        height: "6px",
                        background: "#e2e8f0",
                        borderRadius: "3px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: "3px",
                          background: "#22c55e",
                          width: `${totalMembers > 0 ? (activeTodayCount / totalMembers) * 100 : 0}%`,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Burnout Distribution */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "16px",
                      }}
                    >
                      Burnout Distribution
                    </div>
                    {["Low", "Medium", "High"].map((level) => {
                      const count = allMembers.filter(
                        (m) => m.current_burnout === level,
                      ).length;
                      const pct =
                        totalMembers > 0
                          ? Math.round((count / totalMembers) * 100)
                          : 0;
                      const color =
                        level === "Low"
                          ? "#22c55e"
                          : level === "Medium"
                            ? "#f59e0b"
                            : "#ef4444";
                      return (
                        <div key={level} style={{ marginBottom: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "4px",
                            }}
                          >
                            <span
                              style={{ fontSize: "12px", color: "#64748b" }}
                            >
                              {level} Risk
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color,
                              }}
                            >
                              {count} members ({pct}%)
                            </span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "#e2e8f0",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                borderRadius: "3px",
                                background: color,
                                width: `${pct}%`,
                                transition: "width 0.5s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Row 2 — Member Wellness Comparison */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: "16px",
                    }}
                  >
                    Member Wellness Comparison
                  </div>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(120, allMembers.length * 40)}
                  >
                    <BarChart
                      data={allMembers.map((m) => ({
                        name: m.email.split("@")[0],
                        wellness: getHealthPercent(m.current_burnout),
                        color: getHealthColor(m.current_burnout),
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(val) => [`${val}%`, "Wellness"]}
                      />
                      <Bar dataKey="wellness" radius={[0, 4, 4, 0]}>
                        {allMembers.map((m, i) => (
                          <Cell
                            key={i}
                            fill={getHealthColor(m.current_burnout)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Row 3 — At Risk Alert Panel */}
                {atRiskCount > 0 && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#ef4444",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        marginBottom: "14px",
                      }}
                    >
                      ⚠️ At-Risk Members — Immediate Attention Needed
                    </div>
                    {allMembers
                      .filter((m) => m.current_burnout === "High")
                      .map((member) => (
                        <div
                          key={member.student_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px solid #fecaca",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#0f172a",
                              }}
                            >
                              {member.email}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#94a3b8",
                                marginTop: "2px",
                              }}
                            >
                              Streak: {member.streak}d ·{" "}
                              {member.active_today
                                ? "Active today"
                                : "Not checked in"}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#ef4444",
                              }}
                            >
                              High Risk
                            </div>
                            <div style={{ fontSize: "11px", color: "#ef4444" }}>
                              20% wellness
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Slide-in Detail Panel */}
      {selectedMember && (
        <>
          <div className="tw-overlay" onClick={() => setSelectedMember(null)} />
          <div className="tw-detail-panel">
            <button
              className="tw-detail-close"
              onClick={() => setSelectedMember(null)}
            >
              ×
            </button>

            <div className="tw-detail-avatar">
              {getInitials(selectedMember.email)}
            </div>
            <div className="tw-detail-name">
              {selectedMember.email.split("@")[0]}
            </div>
            <div className="tw-detail-email">{selectedMember.email}</div>

            <div className="tw-detail-kpis">
              <div className="tw-kpi-card">
                <div className="tw-kpi-label">Wellness</div>
                <div
                  className="tw-kpi-value"
                  style={{
                    color: getHealthColor(selectedMember.current_burnout),
                  }}
                >
                  {getHealthPercent(selectedMember.current_burnout)}%
                </div>
              </div>
              <div className="tw-kpi-card">
                <div className="tw-kpi-label">Risk Level</div>
                <div
                  className="tw-kpi-value"
                  style={{
                    color: getHealthColor(selectedMember.current_burnout),
                  }}
                >
                  {selectedMember.current_burnout}
                </div>
              </div>
              <div className="tw-kpi-card">
                <div className="tw-kpi-label">Streak</div>
                <div className="tw-kpi-value">🔥 {selectedMember.streak}d</div>
              </div>
              <div className="tw-kpi-card">
                <div className="tw-kpi-label">Today</div>
                <div
                  className="tw-kpi-value"
                  style={{
                    color: selectedMember.active_today ? "#22c55e" : "#94a3b8",
                  }}
                >
                  {selectedMember.active_today ? "Active" : "Away"}
                </div>
              </div>
            </div>

            {selectedMember.win_today && (
              <div className="tw-win-box">🏆 "{selectedMember.win_today}"</div>
            )}

            <div className="tw-chart-label">7-Day Wellness Trend</div>
            {buildTrendData(selectedMember).length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={buildTrendData(selectedMember)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val}%`, "Wellness"]}
                  />
                  <Bar dataKey="health" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "24px 0",
                }}
              >
                No session data yet for this member
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
