# """
# MindFlow Cognitive State Classifier
# Research-backed weighted feature classifier for developer cognitive state detection.

# Based on:
# - Müller & Fritz (2015): Typing rhythm correlates with cognitive state
# - Zuger et al. (2018): Backspace ratio + pause frequency predict interruptibility  
# - Lazar et al. (2006): Typing errors spike during frustration

# 4 States: flow | struggling | fatigued | frustrated
# """

from typing import Dict, Tuple
import math


# ─── Research-Backed Feature Weights ───────────────────────────────────────
# Each state has expected ranges for 4 features
# Weights derived from Müller & Fritz (2015) and Zuger et al. (2018)

STATE_PROFILES = {
    "flow": {
        "typing_speed":     {"ideal": 200, "weight": 0.35},  # high speed
        "pause_frequency":  {"ideal": 0.5, "weight": 0.25},  # low pauses
        "backspace_ratio":  {"ideal": 0.08, "weight": 0.20}, # low errors
        "burst_score":      {"ideal": 0.8, "weight": 0.20},  # high bursts
    },
    "struggling": {
        "typing_speed":     {"ideal": 60,  "weight": 0.30},
        "pause_frequency":  {"ideal": 4.0, "weight": 0.35},
        "backspace_ratio":  {"ideal": 0.25, "weight": 0.20},
        "burst_score":      {"ideal": 0.2, "weight": 0.15},
    },
    "fatigued": {
        "typing_speed":     {"ideal": 40,  "weight": 0.40},
        "pause_frequency":  {"ideal": 6.0, "weight": 0.30},
        "backspace_ratio":  {"ideal": 0.10, "weight": 0.15},
        "burst_score":      {"ideal": 0.1, "weight": 0.15},
    },
    "frustrated": {
        "typing_speed":     {"ideal": 150, "weight": 0.20},
        "pause_frequency":  {"ideal": 2.0, "weight": 0.25},
        "backspace_ratio":  {"ideal": 0.40, "weight": 0.40},
        "burst_score":      {"ideal": 0.7, "weight": 0.15},
    },
}

# Max expected values for normalization
FEATURE_RANGES = {
    "typing_speed":    {"min": 0, "max": 400},
    "pause_frequency": {"min": 0, "max": 10},
    "backspace_ratio": {"min": 0, "max": 1},
    "burst_score":     {"min": 0, "max": 1},
}

STATE_MESSAGES = {
    "flow": "You're in deep focus. Protect this state — minimize interruptions.",
    "struggling": "You seem to be working through something difficult. Consider breaking the problem into smaller steps.",
    "fatigued": "Your typing patterns suggest mental fatigue. A 10-minute break could restore 30% of your focus capacity.",
    "frustrated": "High error rate detected. Step away briefly — frustration compounds errors.",
}

STATE_COLORS = {
    "flow": "🟢",
    "struggling": "🟡",
    "fatigued": "🟠",
    "frustrated": "🔴",
}


def normalize(value: float, feature: str) -> float:
    """Normalize a feature value to 0-1 range."""
    min_val = FEATURE_RANGES[feature]["min"]
    max_val = FEATURE_RANGES[feature]["max"]
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def score_against_profile(features: Dict, profile: Dict) -> float:
    """
    Score how closely features match a state profile.
    Uses weighted Euclidean distance — closer = higher score.
    Returns 0-1 where 1 = perfect match.
    """
    total_weighted_distance = 0.0
    total_weight = 0.0

    for feature_name, profile_info in profile.items():
        if feature_name not in features:
            continue

        observed = normalize(features[feature_name], feature_name)
        ideal = normalize(profile_info["ideal"], feature_name)
        weight = profile_info["weight"]

        distance = abs(observed - ideal)
        total_weighted_distance += weight * distance
        total_weight += weight

    if total_weight == 0:
        return 0.0

    avg_distance = total_weighted_distance / total_weight
    # Convert distance to similarity score (1 = perfect, 0 = opposite)
    return max(0.0, 1.0 - avg_distance)


def classify_cognitive_state(
    typing_speed: float,
    pause_frequency: float,
    backspace_ratio: float,
    burst_score: float,
    user_baseline: Dict = None
) -> Dict:
    """
    Main classifier — takes 4 features, returns predicted state + confidence.
    
    Args:
        typing_speed: characters per minute
        pause_frequency: pauses >2s per minute
        backspace_ratio: deletions / total keystrokes (0-1)
        burst_score: typing burst intensity score (0-1)
        user_baseline: optional dict with user's personal averages
    
    Returns:
        {
            state: str,
            confidence: float (0-100),
            scores: dict (all state scores),
            message: str,
            emoji: str,
            features_used: dict
        }
    """
    features = {
        "typing_speed": typing_speed,
        "pause_frequency": pause_frequency,
        "backspace_ratio": backspace_ratio,
        "burst_score": burst_score,
    }

    # Adjust against personal baseline if available
    if user_baseline:
        baseline_speed = user_baseline.get("avg_typing_speed", 150)
        if baseline_speed > 0:
            # Scale typing speed relative to user's own baseline
            features["typing_speed"] = typing_speed / baseline_speed * 150

    # Score against each state profile
    scores = {}
    for state, profile in STATE_PROFILES.items():
        scores[state] = round(score_against_profile(features, profile), 3)

    # Pick best match
    best_state = max(scores, key=scores.get)
    best_score = scores[best_state]

    # Calculate confidence — how much better is best vs second best
    sorted_scores = sorted(scores.values(), reverse=True)
    if len(sorted_scores) >= 2 and sorted_scores[1] > 0:
        confidence = min(100, (sorted_scores[0] / sorted_scores[1]) * 50)
    else:
        confidence = best_score * 100

    return {
        "state": best_state,
        "confidence": round(confidence, 1),
        "scores": scores,
        "message": STATE_MESSAGES[best_state],
        "emoji": STATE_COLORS[best_state],
        "features_used": features,
    }


def compute_burst_score(keystroke_events: list) -> float:
    """
    Compute burst typing score from raw keystroke events.
    Burst = rapid consecutive typing followed by pause.
    High burst score = flow state pattern.
    
    Args:
        keystroke_events: list of {time, chars, isDelete} dicts
    
    Returns:
        burst_score: 0-1
    """
    if len(keystroke_events) < 3:
        return 0.5

    sorted_events = sorted(keystroke_events, key=lambda x: x["time"])
    gaps = []
    for i in range(1, len(sorted_events)):
        gap = sorted_events[i]["time"] - sorted_events[i-1]["time"]
        gaps.append(gap)

    if not gaps:
        return 0.5

    avg_gap = sum(gaps) / len(gaps)
    # Standard deviation of gaps
    variance = sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)
    std_dev = math.sqrt(variance)

    # High std_dev = bursty typing = flow pattern
    # Normalize: std_dev of 2000ms = score 1.0
    burst = min(1.0, std_dev / 2000)
    return round(burst, 3)