"""
Report generation and export service for MindFlow
Supports CSV and HTML exports of personal and team analytics reports
"""

from datetime import datetime
from typing import Dict, List
import csv
import io

def generate_csv_personal_report(
    user_name: str,
    metrics: Dict,
    insights: Dict,
    checkins: List[Dict],
    micrologs: List[Dict]
) -> str:
    """
    Generate CSV export of personal report
    Returns CSV string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([f"MindFlow Personal Report - {user_name}"])
    writer.writerow([f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    writer.writerow([])
    
    # Summary Metrics
    writer.writerow(["SUMMARY METRICS"])
    writer.writerow(["Metric", "Value"])
    writer.writerow(["Overall Wellness Score", f"{metrics.get('overall_wellness_score', 0)}/100"])
    writer.writerow(["Consistency Score", f"{metrics.get('consistency_score', 0)}%"])
    writer.writerow(["Focus Stability", f"{metrics.get('focus_stability', 0)}%"])
    writer.writerow(["Burnout Pressure", f"{metrics.get('burnout_pressure', 0)}%"])
    writer.writerow([])
    
    # Energy Trend
    energy = metrics.get("energy_trend", {})
    writer.writerow(["ENERGY TREND"])
    writer.writerow(["Indicator", "Value"])
    writer.writerow(["Current Energy Level", f"{energy.get('current', 0)}/3.0"])
    writer.writerow(["Predicted (7 days)", f"{energy.get('predicted_7d', 0)}/3.0"])
    writer.writerow(["Trend Direction", energy.get("direction", "unknown")])
    writer.writerow([])
    
    # Weekly Velocity
    velocity = metrics.get("weekly_velocity", {})
    writer.writerow(["WEEKLY VELOCITY"])
    writer.writerow(["Week", "Wins Logged"])
    writer.writerow(["This Week", velocity.get("current_week", 0)])
    writer.writerow(["Trend Average", f"{velocity.get('trend_avg', 0)}/week"])
    writer.writerow([])
    
    # Top Wins
    if micrologs:
        writer.writerow(["RECENT WINS"])
        writer.writerow(["Date", "Win"])
        for microlog in micrologs[:10]:
            writer.writerow([
                microlog.get("log_date", ""),
                microlog.get("win_text", "")
            ])
        writer.writerow([])
    
    # Check-in History
    if checkins:
        writer.writerow(["RECENT CHECK-INS"])
        writer.writerow(["Date", "Energy Level", "On Track", "Burnout Score"])
        for checkin in checkins[:10]:
            writer.writerow([
                checkin.get("session_date", ""),
                checkin.get("energy_level", ""),
                "Yes" if checkin.get("on_track") else "No",
                checkin.get("burnout_score", "")
            ])
        writer.writerow([])
    
    # Insights
    writer.writerow(["INSIGHTS & RECOMMENDATIONS"])
    writer.writerow(["Category", "Item"])
    for strength in insights.get("strengths", []):
        writer.writerow(["Strength", strength])
    for risk in insights.get("risks", []):
        writer.writerow(["Area of Concern", risk])
    for rec in insights.get("recommendations", []):
        writer.writerow(["Recommendation", rec])
    
    return output.getvalue()


def generate_html_personal_report(
    user_name: str,
    metrics: Dict,
    insights: Dict,
    checkins: List[Dict],
    micrologs: List[Dict]
) -> str:
    """
    Generate HTML export of personal report for PDF printing
    """
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MindFlow Personal Report - {user_name}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }}
        .header {{
            border-bottom: 3px solid #4f46e5;
            margin-bottom: 20px;
            padding-bottom: 20px;
        }}
        h1 {{
            color: #111;
            margin-bottom: 5px;
            font-size: 28px;
        }}
        .subtitle {{
            color: #666;
            font-size: 13px;
        }}
        h2 {{
            color: #1f2937;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 18px;
            border-left: 4px solid #4f46e5;
            padding-left: 10px;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }}
        .metric-card {{
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 15px;
            background: #f9fafb;
        }}
        .metric-label {{
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }}
        .metric-value {{
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
        }}
        .metric-detail {{
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }}
        .wellness-score {{
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 10px;
        }}
        .wellness-score .metric-label {{
            color: rgba(255,255,255,0.8);
        }}
        .wellness-score .metric-value {{
            color: white;
            font-size: 48px;
        }}
        .section {{
            margin-bottom: 25px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }}
        th {{
            background: #f3f4f6;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            border-bottom: 2px solid #e5e7eb;
        }}
        td {{
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
        }}
        tr:last-child td {{
            border-bottom: none;
        }}
        .insight-item {{
            margin: 10px 0;
            padding: 12px;
            border-left: 4px solid #e5e7eb;
            background: #fafafa;
            font-size: 13px;
        }}
        .insight-item.strength {{
            border-left-color: #10b981;
            background: #ecfdf5;
        }}
        .insight-item.risk {{
            border-left-color: #ef4444;
            background: #fef2f2;
        }}
        .insight-item.recommendation {{
            border-left-color: #3b82f6;
            background: #eff6ff;
        }}
        .insight-label {{
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            color: #555;
        }}
        .energy-emoji {{
            font-size: 32px;
            margin-right: 10px;
        }}
        .energy-info {{
            display: inline-block;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #999;
        }}
        @media print {{
            body {{
                padding: 0;
            }}
            .no-print {{
                display: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MindFlow Personal Report</h1>
            <p class="subtitle">Generated {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            <p class="subtitle">User: {user_name}</p>
        </div>

        <h2>Overall Wellness</h2>
        <div class="metrics-grid">
            <div class="wellness-score">
                <div class="metric-label">Overall Wellness Score</div>
                <div class="metric-value">{metrics.get('overall_wellness_score', 0):.0f}</div>
                <div class="metric-detail">out of 100</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Consistency</div>
                <div class="metric-value">{metrics.get('consistency_score', 0):.0f}%</div>
                <div class="metric-detail">Days with check-ins</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Focus Stability</div>
                <div class="metric-value">{metrics.get('focus_stability', 0):.0f}%</div>
                <div class="metric-detail">Energy consistency</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Burnout Pressure</div>
                <div class="metric-value">{metrics.get('burnout_pressure', 0):.0f}%</div>
                <div class="metric-detail">Risk level</div>
            </div>
        </div>

        <h2>Energy Trend Analysis</h2>
        <div class="section">
"""
    
    # Add energy trend info
    energy = metrics.get("energy_trend", {})
    energy_emojis = {1: "😴", 2: "😐", 3: "🔥"}
    current_emoji = energy_emojis.get(int(energy.get('current', 2)), "🤔")
    predicted_emoji = energy_emojis.get(int(energy.get('predicted_7d', 2)), "🤔")
    
    html += f"""
            <p>
                <span class="energy-emoji">{current_emoji}</span>
                <span class="energy-info">
                    <strong>Current Energy:</strong> {energy.get('current', 0):.1f}/3.0<br/>
                    <strong>Trend:</strong> {energy.get('direction', 'unknown').upper()}
                </span>
            </p>
            <p style="margin-top: 10px;">
                <span class="energy-emoji">{predicted_emoji}</span>
                <span class="energy-info">
                    <strong>Predicted (7 days):</strong> {energy.get('predicted_7d', 0):.1f}/3.0
                </span>
            </p>
        </div>

        <h2>Weekly Activity</h2>
        <div class="section">
"""
    
    # Weekly velocity
    velocity = metrics.get("weekly_velocity", {})
    html += f"""
            <p><strong>Wins This Week:</strong> {velocity.get('current_week', 0)}</p>
            <p><strong>Weekly Average:</strong> {velocity.get('trend_avg', 0)} wins/week</p>
        </div>
"""
    
    # Recent wins
    if micrologs:
        html += """
        <h2>Recent Wins</h2>
        <div class="section">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Win</th>
                        <th>Streak</th>
                    </tr>
                </thead>
                <tbody>
"""
        for ml in micrologs[:7]:
            html += f"""
                    <tr>
                        <td>{ml.get('log_date', '')}</td>
                        <td>{ml.get('win_text', '')}</td>
                        <td>Day {ml.get('streak_day', 1)}</td>
                    </tr>
"""
        html += """
                </tbody>
            </table>
        </div>
"""
    
    # Insights section
    if insights.get('strengths') or insights.get('risks') or insights.get('recommendations'):
        html += "<h2>Key Insights</h2><div class=\"section\">"
        
        for s in insights.get('strengths', []):
            html += f'<div class="insight-item strength"><div class="insight-label">✓ Strength</div>{s}</div>'
        
        for r in insights.get('risks', []):
            html += f'<div class="insight-item risk"><div class="insight-label">⚠ Concern</div>{r}</div>'
        
        for rec in insights.get('recommendations', []):
            html += f'<div class="insight-item recommendation"><div class="insight-label">💡 Recommendation</div>{rec}</div>'
        
        html += "</div>"
    
    html += """
        <div class="footer">
            <p>This report is based on your activity over the last 30 days.</p>
            <p>For more detailed analysis and team comparisons, visit your dashboard.</p>
        </div>
    </div>
</body>
</html>
"""
    
    return html
