"use client";

import { useEffect, useState } from "react";

export default function PersonalReport({ userId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/personal/report?user_id=${encodeURIComponent(userId)}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch report: ${response.statusText}`);
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err.message || "Failed to load personal report");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReport();
    }
  }, [userId]);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const response = await fetch(
        `/api/personal/report/export/csv?user_id=${encodeURIComponent(userId)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindflow_report_${userId}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(`CSV export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportHTML = async () => {
    try {
      setExporting(true);
      setExportError(null);
      const response = await fetch(
        `/api/personal/report/export/html?user_id=${encodeURIComponent(userId)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to export HTML");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindflow_report_${userId}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError(`HTML export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-blue-700">Loading your personal report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600">No report data available yet.</p>
      </div>
    );
  }

  const metrics = report.metrics || {};
  const insights = report.insights || {};
  const dataSummary = report.data_summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Personal Report</h2>
            <p className="text-indigo-100">
              Last 30 days analysis · Generated{" "}
              {new Date(report.generated_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "📊 CSV"}
            </button>
            <button
              onClick={handleExportHTML}
              disabled={exporting}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "📄 PDF"}
            </button>
          </div>
        </div>
        {exportError && (
          <p className="text-red-200 text-sm mt-2">{exportError}</p>
        )}
      </div>

      {/* Overall Wellness Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Wellness Score</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 120 120"
            >
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getWellnessColor(metrics.overall_wellness_score)}
                strokeWidth="8"
                strokeDasharray={`${((metrics.overall_wellness_score || 0) / 100) * 314} 314`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {Math.round(metrics.overall_wellness_score || 0)}
                </div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 mb-4">{insights.summary}</p>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Data Quality:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {dataSummary.data_quality === "sufficient"
                    ? "✓ Sufficient"
                    : "⚠ Limited"}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Check-ins this period:</span>
                <span className="ml-2 font-semibold">
                  {dataSummary.total_checkins}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Wins logged:</span>
                <span className="ml-2 font-semibold">
                  {dataSummary.total_wins}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consistency Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Logging Consistency
          </h4>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(metrics.consistency_score || 0)}%
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${metrics.consistency_score || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Days with check-ins</p>
        </div>

        {/* Focus Stability */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Focus Stability
          </h4>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-green-600">
              {Math.round(metrics.focus_stability || 0)}%
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${metrics.focus_stability || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Energy consistency</p>
        </div>

        {/* Burnout Pressure */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Burnout Pressure
          </h4>
          <div className="flex items-end gap-3">
            <div className="text-3xl font-bold text-orange-600">
              {Math.round(metrics.burnout_pressure || 0)}%
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${metrics.burnout_pressure || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Risk level (higher = more at risk)
          </p>
        </div>

        {/* Weekly Velocity */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Weekly Velocity
          </h4>
          <div className="flex items-end gap-4">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.weekly_velocity?.current_week || 0}
              </div>
              <p className="text-xs text-gray-500">wins this week</p>
            </div>
            <div className="text-sm text-gray-600">
              avg: {metrics.weekly_velocity?.trend_avg || 0} / week
            </div>
          </div>
        </div>
      </div>

      {/* Energy Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Energy Trend</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Energy</p>
            <div className="text-4xl font-bold">
              {getEnergyEmoji(metrics.energy_trend?.current)}
            </div>
            <p className="text-sm text-gray-700 mt-1">
              {metrics.energy_trend?.current?.toFixed(1)} / 3.0
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Trend Direction</p>
              <p className="text-3xl font-bold">
                {getTrendEmoji(metrics.energy_trend?.direction)}
              </p>
              <p className="text-sm capitalize mt-1">
                {metrics.energy_trend?.direction}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Predicted (7 days)</p>
            <div className="text-4xl font-bold">
              {getEnergyEmoji(metrics.energy_trend?.predicted_7d)}
            </div>
            <p className="text-sm text-gray-700 mt-1">
              {metrics.energy_trend?.predicted_7d?.toFixed(1)} / 3.0
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Based on linear regression of your energy levels
        </p>
      </div>

      {/* Strengths and Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {insights.strengths && insights.strengths.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">✓ Strengths</h4>
            <ul className="space-y-1">
              {insights.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-green-800">
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risks */}
        {insights.risks && insights.risks.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">
              ⚠ Areas of Concern
            </h4>
            <ul className="space-y-1">
              {insights.risks.map((risk, idx) => (
                <li key={idx} className="text-sm text-red-800">
                  • {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">
            💡 Recommendations
          </h4>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-800">
                <span className="font-semibold">→</span> {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getWellnessColor(score) {
  if (score >= 70) return "#10b981"; // green
  if (score >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function getEnergyEmoji(level) {
  if (!level) return "?";
  if (level <= 1.5) return "😴"; // depleted
  if (level <= 2.2) return "😐"; // okay
  return "🔥"; // flow
}

function getTrendEmoji(direction) {
  if (direction === "improving") return "📈";
  if (direction === "declining") return "📉";
  return "➡️";
}
