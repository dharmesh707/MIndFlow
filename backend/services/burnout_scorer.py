def calculate_burnout_score(checkins: list) -> dict:
    if not checkins:
        return {"burnout_score": "Low", "message": ""}

    energy_levels = [c["energy_level"] for c in checkins]
    on_track_flags = [c["on_track"] for c in checkins]

    # Check last energy level - if in flow, always Low
    if energy_levels[-1] == 3:
        return {"burnout_score": "Low", "message": ""}

    # Count consecutive energy 1s from the end
    consecutive_depleted = 0
    for level in reversed(energy_levels):
        if level == 1:
            consecutive_depleted += 1
        else:
            break

    # Count how many times on_track was False
    off_track_count = sum(1 for flag in on_track_flags if flag == False)

    # High burnout conditions
    if consecutive_depleted >= 3 or off_track_count >= 2:
        return {
            "burnout_score": "High",
            "message": "Your focus has dropped significantly. A longer break or stopping the session may help more than pushing through."
        }

    # Medium burnout conditions
    if consecutive_depleted >= 2:
        return {
            "burnout_score": "Medium",
            "message": "Consider taking a 15 minute break away from the screen."
        }

    return {"burnout_score": "Low", "message": ""}