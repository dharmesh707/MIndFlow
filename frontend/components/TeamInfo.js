"use client";
import { useState, useEffect, useRef } from "react";

export default function TeamInfo({ userId }) {
  const [myTeam, setMyTeam] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    fetchMyTeam();
  }, [userId]);

  async function fetchMyTeam() {
    try {
      const res = await fetch(`${apiBase}/api/team/my-team/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMyTeam(data.team);
      }
    } catch (err) {
      console.error("Team fetch failed", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinTeam() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinMsg("");
    try {
      const res = await fetch(`${apiBase}/api/team/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: userId,
          invite_code: joinCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to join");
      setJoinMsg(`✅ Joined ${data.team_name}!`);
      setJoinCode("");
      hasFetched.current = false;
      await fetchMyTeam();
    } catch (err) {
      setJoinMsg(`❌ ${err.message}`);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: "14px",
        padding: "20px",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          color: "#6366f1",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        // my team
      </div>

      {loading ? (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "#334155",
          }}
        >
          loading...
        </div>
      ) : myTeam ? (
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "16px",
              fontWeight: "700",
              color: "#e2e8f0",
              marginBottom: "6px",
            }}
          >
            {myTeam.team_name}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "#475569",
              marginBottom: "14px",
            }}
          >
            {myTeam.member_count} member{myTeam.member_count !== 1 ? "s" : ""} ·
            code: {myTeam.invite_code}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {myTeam.members?.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "#94a3b8",
                  }}
                >
                  {m.email}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    color: m.active_today ? "#22d3ee" : "#334155",
                  }}
                >
                  {m.active_today ? "● active" : "○ away"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              color: "#475569",
              marginBottom: "14px",
            }}
          >
            not in a team yet — enter invite code to join
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinTeam()}
              placeholder="INVITE CODE"
              maxLength={6}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.15em",
                outline: "none",
              }}
            />
            <button
              onClick={handleJoinTeam}
              disabled={joining || !joinCode.trim()}
              style={{
                padding: "8px 16px",
                background:
                  joining || !joinCode.trim()
                    ? "rgba(99,102,241,0.15)"
                    : "#6366f1",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              {joining ? "..." : "join"}
            </button>
          </div>
          {joinMsg && (
            <div
              style={{
                marginTop: "10px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: joinMsg.startsWith("✅") ? "#22d3ee" : "#ef4444",
              }}
            >
              {joinMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
