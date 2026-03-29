"""
Analytics Engine for MindFlow
Calculates personal metrics: consistency score, focus stability, burnout pressure, velocity
Uses linear regression for energy trend forecasting
"""

from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import math

def calculate_consistency_score(checkins: List[Dict]) -> float:
    """
    Consistency score: percentage of days with at least one check-in
    Range: 0-100
    Formula: (days_with_checkins / total_possible_days) * 100
    """
    if not checkins:
        return 0.0
    
    # Get all unique dates from last 30 days
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    # Count unique days that have check-ins
    dates_with_checkins = set()
    for checkin in checkins:
        try:
            checkin_date = datetime.fromisoformat(checkin.get("session_date", "")).date()
            if thirty_days_ago <= checkin_date <= today:
                dates_with_checkins.add(checkin_date)
        except (ValueError, TypeError):
            continue
    
    # Calculate score
    total_possible_days = 30
    days_with_checkins = len(dates_with_checkins)
    score = (days_with_checkins / total_possible_days) * 100
    return min(100, max(0, score))


def calculate_energy_trend(checkins: List[Dict]) -> Tuple[float, float, str]:
    """
    Energy trend using linear regression + forecast
    Returns: (current_avg, predicted_avg_7days_from_now, trend_direction)
    
    Trend direction: "improving", "stable", "declining"
    """
    if not checkins:
        return 0.0, 0.0, "unknown"
    
    # Sort by date
    sorted_checkins = sorted(
        checkins,
        key=lambda x: x.get("session_date", ""),
        reverse=False
    )
    
    # Extract energy levels with dates (last 14 days)
    energy_data = []
    today = datetime.now().date()
    for checkin in sorted_checkins:
        try:
            checkin_date = datetime.fromisoformat(checkin.get("session_date", "")).date()
            energy_level = checkin.get("energy_level", 0)
            if (today - timedelta(days=14)) <= checkin_date <= today and energy_level > 0:
                days_ago = (today - checkin_date).days
                energy_data.append((days_ago, energy_level))
        except (ValueError, TypeError):
            continue
    
    if len(energy_data) < 2:
        current_avg = sum(c.get("energy_level", 0) for c in checkins if c.get("energy_level")) / len(checkins) if checkins else 0
        return current_avg, current_avg, "insufficient_data"
    
    # Linear regression: fit line to (day, energy) data
    n = len(energy_data)
    sum_x = sum(x for x, y in energy_data)
    sum_y = sum(y for x, y in energy_data)
    sum_xx = sum(x * x for x, y in energy_data)
    sum_xy = sum(x * y for x, y in energy_data)
    
    # Calculate slope (m) and intercept (b)
    denominator = (n * sum_xx - sum_x * sum_x)
    if denominator == 0:
        slope = 0
    else:
        slope = (n * sum_xy - sum_x * sum_y) / denominator
    
    intercept = (sum_y - slope * sum_x) / n
    
    # Current average (most recent energy)
    current_avg = energy_data[0][1] if energy_data else 2.0
    
    # Predict 7 days from now
    predicted = intercept + slope * (-7)  # -7 because we stored days_ago (negative time)
    predicted = max(1.0, min(3.0, predicted))  # Clamp to 1-3 range
    
    # Determine trend
    if slope > 0.05:
        trend = "improving"
    elif slope < -0.05:
        trend = "declining"
    else:
        trend = "stable"
    
    return current_avg, predicted, trend


def calculate_focus_stability(checkins: List[Dict]) -> float:
    """
    Focus stability: consistency of energy levels (low variance = high stability)
    Range: 0-100
    Formula: 100 - (std_dev / max_possible * 100)
    """
    if len(checkins) < 2:
        return 50.0  # Default for insufficient data
    
    # Get energy levels from last 30 days
    energy_levels = []
    today = datetime.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    for checkin in checkins:
        try:
            checkin_date = datetime.fromisoformat(checkin.get("session_date", "")).date()
            energy = checkin.get("energy_level", 0)
            if thirty_days_ago <= checkin_date <= today and energy > 0:
                energy_levels.append(energy)
        except (ValueError, TypeError):
            continue
    
    if not energy_levels:
        return 50.0
    
    # Calculate standard deviation
    mean = sum(energy_levels) / len(energy_levels)
    variance = sum((x - mean) ** 2 for x in energy_levels) / len(energy_levels)
    std_dev = math.sqrt(variance)
    
    # Normalize to 0-100 (max std_dev for 1-3 range is about 0.816)
    max_std_dev = 0.816
    stability = 100 - (std_dev / max_std_dev * 100)
    return min(100, max(0, stability))


def calculate_burnout_pressure(checkins: List[Dict], recent_score: str = "Low") -> float:
    """
    Burnout pressure: ratio of high/medium energy states
    Range: 0-100 (higher = more at-risk)
    Also considers recent burnout score
    """
    if not checkins:
        return 0.0
    
    today = datetime.now().date()
    three_months_ago = today - timedelta(days=90)
    
    # Count energy levels in distribution
    energy_1_count = 0
    energy_2_count = 0
    energy_3_count = 0
    
    for checkin in checkins:
        try:
            checkin_date = datetime.fromisoformat(checkin.get("session_date", "")).date()
            energy = checkin.get("energy_level", 0)
            if three_months_ago <= checkin_date <= today and energy > 0:
                if energy == 1:
                    energy_1_count += 1
                elif energy == 2:
                    energy_2_count += 1
                elif energy == 3:
                    energy_3_count += 1
        except (ValueError, TypeError):
            continue
    
    total = energy_1_count + energy_2_count + energy_3_count
    if total == 0:
        return 0.0
    
    # Pressure score: weight lower energy states more heavily
    pressure = ((energy_1_count * 100) + (energy_2_count * 50)) / (total * 100)
    pressure *= 100  # Convert to 0-100 range
    
    # Factor in recent burnout score
    if recent_score == "High":
        pressure += 20
    elif recent_score == "Medium":
        pressure += 10
    
    return min(100, pressure)


def calculate_weekly_velocity(micrologs: List[Dict]) -> Dict[str, int]:
    """
    Weekly velocity: number of wins logged per week
    Returns dict with current_week and last_4_weeks average
    """
    if not micrologs:
        return {"current_week": 0, "trend_avg": 0}
    
    today = datetime.now().date()
    
    # Group by week
    weeks = {}
    for log in micrologs:
        try:
            log_date = datetime.fromisoformat(log.get("log_date", "")).date()
            week_start = log_date - timedelta(days=log_date.weekday())
            week_key = str(week_start)
            
            if week_key not in weeks:
                weeks[week_key] = 0
            weeks[week_key] += 1
        except (ValueError, TypeError):
            continue
    
    # Get current week and previous 4 weeks
    current_week_start = today - timedelta(days=today.weekday())
    current_week_key = str(current_week_start)
    current_week_count = weeks.get(current_week_key, 0)
    
    # Get last 4 weeks average (excluding current)
    week_dates = sorted(weeks.keys(), reverse=True)
    past_weeks = [weeks[w] for w in week_dates[1:5]]  # Skip current, take next 4
    trend_avg = sum(past_weeks) / len(past_weeks) if past_weeks else 0
    
    return {
        "current_week": current_week_count,
        "trend_avg": round(trend_avg, 1)
    }


def generate_personal_metrics(
    checkins: List[Dict],
    micrologs: List[Dict],
    recent_burnout_score: str = "Low"
) -> Dict:
    """
    Generate complete personal analytics report
    """
    consistency = calculate_consistency_score(checkins)
    current_energy, predicted_energy, energy_trend = calculate_energy_trend(checkins)
    focus_stability = calculate_focus_stability(checkins)
    burnout_pressure = calculate_burnout_pressure(checkins, recent_burnout_score)
    weekly_velocity = calculate_weekly_velocity(micrologs)
    
    # Overall wellness score (weighted average of positive indicators)
    overall_score = (
        consistency * 0.25 +
        focus_stability * 0.25 +
        (100 - burnout_pressure) * 0.25 +
        (weekly_velocity["current_week"] / 10) * 25  # Normalize to 0-100
    ) / 100
    overall_score = min(100, max(0, overall_score * 100))
    
    return {
        "consistency_score": round(consistency, 1),
        "focus_stability": round(focus_stability, 1),
        "burnout_pressure": round(burnout_pressure, 1),
        "weekly_velocity": weekly_velocity,
        "energy_trend": {
            "current": round(current_energy, 2),
            "predicted_7d": round(predicted_energy, 2),
            "direction": energy_trend
        },
        "overall_wellness_score": round(overall_score, 1)
    }
