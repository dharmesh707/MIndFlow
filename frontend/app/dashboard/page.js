"use client";
import { useEffect, useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WellnessChatbot from "@/components/WellnessChatbot";
import BurnoutCard from "@/components/BurnoutCard";
import CheckinPopup from "@/components/CheckinPopup";
import MicroLog from "@/components/MicroLog";
import TrendChart from "@/components/TrendChart";
import TeamInfo from "@/components/TeamInfo";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const effectiveUser = user || { id: "demo_dharmesh", firstName: "Dharmesh" };
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState({
    trend_data: [],
    current_streak: 0,
    current_burnout_score: "Low",
  });
  const [showCheckin, setShowCheckin] = useState(false);
  const [burnoutScore, setBurnoutScore] = useState("Low");
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      // no clerk session — fall through using demo_dharmesh
    }

    async function checkRoleAndLoad() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const roleRes = await fetch(
          `${apiBase}/api/team/role/${effectiveUser.id}`,
        );
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          if (roleData.role === "manager") {
            router.push("/team-dashboard");
            return;
          }
        }
      } catch (err) {
        console.error("Role check failed:", err);
      }

      // Only runs for students
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(
          `${apiBase}/api/dashboard?user_id=${effectiveUser.id}`,
        );
        if (!res.ok) throw new Error(`Dashboard API failed with ${res.status}`);
        const data = await res.json();
        setDashboardData({
          trend_data: data?.trend_data || [],
          current_streak: data?.current_streak || 0,
          current_burnout_score: data?.current_burnout_score || "Low",
        });
        setBurnoutScore(data.current_burnout_score || "Low");
      } catch (err) {
        console.error("Dashboard fetch failed", err);
        setDashboardError(
          "Dashboard data is temporarily unavailable. Backend or database may be down.",
        );
        setDashboardData({
          trend_data: [],
          current_streak: 0,
          current_burnout_score: "Low",
        });
      } finally {
        setIsDashboardLoading(false);
      }
    }

    checkRoleAndLoad();
  }, [isLoaded, user]);

  function handleCheckinDone(result) {
    if (result?.burnout_score) {
      setBurnoutScore(result.burnout_score);
    }
  }

  if (!isLoaded || isDashboardLoading) {
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
          letterSpacing: "0.1em",
        }}
      >
        syncing your dashboard...
      </div>
    );
  }

  return (
    <>
      <style suppressHydrationWarning>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080810; color: #e2e8f0; }
        .mf-dashboard {
          min-height: 100vh;
          background: #080810;
          color: #e2e8f0;
          padding: 32px;
          position: relative;
          overflow-x: hidden;
        }
        .mf-dashboard::before {
          content: '';
          position: fixed;
          top: -20%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .mf-dashboard::after {
          content: '';
          position: fixed;
          bottom: -20%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .mf-content { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; }
        .mf-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .mf-logo { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1; }
        .mf-logo span { color: #6366f1; }
        .mf-subtitle { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #475569; margin-top: 6px; letter-spacing: 0.05em; }
        .mf-header-actions { display: flex; align-items: center; gap: 12px; }
        .mf-checkin-btn {
          background: transparent;
          border: 1px solid rgba(99,102,241,0.5);
          color: #6366f1;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .mf-checkin-btn:hover { background: rgba(99,102,241,0.1); border-color: #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.2); }
        .mf-reports-btn {
          background: transparent;
          border: 1px solid rgba(99,102,241,0.5);
          color: #6366f1;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .mf-reports-btn:hover { background: rgba(99,102,241,0.1); border-color: #6366f1; box-shadow: 0 0 20px rgba(99,102,241,0.2); }
        .mf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .mf-grid-full { grid-column: 1 / -1; }
        .mf-error-banner {
          margin-bottom: 20px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.03em;
        }
        @media (max-width: 768px) {
          .mf-grid { grid-template-columns: 1fr; }
          .mf-dashboard { padding: 20px; }
        }
      `}</style>

      <div className="mf-dashboard">
        <div className="mf-content">
          <header className="mf-header">
            <div>
              <div className="mf-logo">
                Mind<span>Flow</span>
              </div>
              <div className="mf-subtitle">
                {`// welcome back, ${effectiveUser?.firstName?.toLowerCase() || "developer"}`}
              </div>
            </div>
            <div className="mf-header-actions">
              <Link href="/analytics" className="mf-reports-btn">
                <span>📊</span> analytics
              </Link>
              <button
                onClick={() => setShowCheckin(true)}
                className="mf-checkin-btn"
              >
                <span>+</span> check in
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </header>

          {dashboardError && (
            <div className="mf-error-banner" role="alert">
              {dashboardError}
            </div>
          )}

          <div className="mf-grid">
            <BurnoutCard score={burnoutScore} />
            <MicroLog
              userId={effectiveUser?.id}
              streak={dashboardData?.current_streak || 0}
            />
            <TeamInfo userId={effectiveUser?.id} />
            <div className="mf-grid-full">
              <TrendChart data={dashboardData?.trend_data || []} />
            </div>
            <div className="mf-grid-full">
              <WellnessChatbot
                userId={effectiveUser?.id}
                burnoutScore={burnoutScore}
              />
            </div>
          </div>
        </div>

        {showCheckin && (
          <CheckinPopup
            userId={effectiveUser?.id}
            onClose={() => setShowCheckin(false)}
            onCheckinDone={handleCheckinDone}
          />
        )}
      </div>
    </>
  );
}
