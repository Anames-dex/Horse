"""Genetics and breeding calculation engine for Minecraft horses.

Supports both:
1. Modern 1.20+ formula (bell curve centered on parents with fair chance to exceed).
2. Legacy pre-1.20 formula (averaging with a 3rd random wild horse).
"""

import math
import random
from dataclasses import dataclass
from typing import Dict, Any, List, Tuple
from core.models import Horse, CoatColor, CoatPattern
from core.conversions import (
    MIN_HEALTH_HP,
    MAX_HEALTH_HP,
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR,
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR,
    speed_attr_to_bps,
    speed_attr_to_time_100m,
    jump_attr_to_height,
    hp_to_hearts,
)


@dataclass
class StatPrediction:
    mean_val: float
    min_val: float
    max_val: float
    p_exceed_best_parent: float  # Probability of beating both parents (0.0 to 1.0)
    p_exceed_worst_parent: float  # Probability of beating the weaker parent (0.0 to 1.0)
    percentile_25: float
    median: float
    percentile_75: float


@dataclass
class BreedingPrediction:
    version: str
    health_hp: StatPrediction
    speed_attr: StatPrediction
    jump_attr: StatPrediction
    # User-friendly display helpers
    hearts: Dict[str, float]
    speed_100m_sec: Dict[str, float]
    speed_bps: Dict[str, float]
    jump_height_blocks: Dict[str, float]
    coat_probabilities: Dict[str, float]
    pattern_probabilities: Dict[str, float]


def irwin_hall_3_cdf(s: float) -> float:
    """Exact CDF of the sum of 3 independent uniform random variables U(0, 1)."""
    if s <= 0.0:
        return 0.0
    if s >= 3.0:
        return 1.0
    if s <= 1.0:
        return (s**3) / 6.0
    if s <= 2.0:
        return ((s**3) - 3.0 * ((s - 1.0) ** 3)) / 6.0
    return ((s**3) - 3.0 * ((s - 1.0) ** 3) + 3.0 * ((s - 2.0) ** 3)) / 6.0


def irwin_hall_3_quantile(p: float) -> float:
    """Numerical inversion of the Irwin-Hall 3 CDF to get quantile values."""
    p = max(0.0001, min(0.9999, p))
    low, high = 0.0, 3.0
    for _ in range(25):
        mid = (low + high) / 2.0
        if irwin_hall_3_cdf(mid) < p:
            low = mid
        else:
            high = mid
    return (low + high) / 2.0


def calculate_1_20_stat_prediction(
    val_a: float, val_b: float, min_limit: float, max_limit: float
) -> StatPrediction:
    """
    Computes exact statistical metrics for a single stat under Minecraft 1.20+ rules.
    Foal = Midpoint + Spread * Roll, where Roll = (s/3 - 0.5) and s ~ IrwinHall(3).
    """
    midpoint = (val_a + val_b) / 2.0
    val_range = max_limit - min_limit
    spread = abs(val_a - val_b) + 0.3 * val_range

    best_parent = max(val_a, val_b)
    worst_parent = min(val_a, val_b)

    # Theoretical min and max possible for foal (before clamping)
    raw_min = midpoint - 0.5 * spread
    raw_max = midpoint + 0.5 * spread
    actual_min = max(min_limit, min(max_limit, raw_min))
    actual_max = max(min_limit, min(max_limit, raw_max))

    # Mean value: E[Roll] = 0, so mean before clamping is midpoint.
    # Due to boundary clamping, we use a lightweight numerical quadrature or analytical integration
    # Since distribution is symmetric around midpoint, if midpoint is within limits, mean ~ midpoint.
    mean_val = max(min_limit, min(max_limit, midpoint))

    # Probability of exceeding target T:
    # Child >= T  <=>  Midpoint + Spread * (s/3 - 0.5) >= T
    # <=> s >= 3 * ((T - Midpoint)/Spread + 0.5)
    def prob_exceed(target: float) -> float:
        if target <= actual_min:
            return 1.0
        if target >= actual_max:
            return 0.0
        if spread <= 1e-7:
            return 1.0 if midpoint > target else 0.0
        req_roll = (target - midpoint) / spread
        req_s = 3.0 * (req_roll + 0.5)
        cdf = irwin_hall_3_cdf(req_s)
        return max(0.0, min(1.0, 1.0 - cdf))

    p_exceed_best = prob_exceed(best_parent)
    p_exceed_worst = prob_exceed(worst_parent)

    # Quantiles (25%, 50%, 75%)
    s_25 = irwin_hall_3_quantile(0.25)
    s_50 = 1.5  # Exact median by symmetry
    s_75 = irwin_hall_3_quantile(0.75)

    def s_to_val(s: float) -> float:
        roll = (s / 3.0) - 0.5
        v = midpoint + spread * roll
        return max(min_limit, min(max_limit, v))

    return StatPrediction(
        mean_val=round(mean_val, 4),
        min_val=round(actual_min, 4),
        max_val=round(actual_max, 4),
        p_exceed_best_parent=round(p_exceed_best, 4),
        p_exceed_worst_parent=round(p_exceed_worst, 4),
        percentile_25=round(s_to_val(s_25), 4),
        median=round(s_to_val(s_50), 4),
        percentile_75=round(s_to_val(s_75), 4),
    )


def calculate_legacy_stat_prediction(
    val_a: float, val_b: float, min_limit: float, max_limit: float
) -> StatPrediction:
    """Computes statistical metrics under legacy pre-1.20 rules: (Parent_A + Parent_B + Wild) / 3."""
    best_parent = max(val_a, val_b)
    worst_parent = min(val_a, val_b)
    wild_mean = (min_limit + max_limit) / 2.0
    mean_val = (val_a + val_b + wild_mean) / 3.0

    actual_min = (val_a + val_b + min_limit) / 3.0
    actual_max = (val_a + val_b + max_limit) / 3.0

    # Probability of exceeding best parent
    # (P_A + P_B + W) / 3 >= best_parent <=> W >= 3 * best_parent - (P_A + P_B)
    req_wild = 3.0 * best_parent - (val_a + val_b)
    if req_wild <= min_limit:
        p_best = 1.0
    elif req_wild >= max_limit:
        p_best = 0.0
    else:
        # Wild distribution is bell-shaped or uniform depending on stat; approximate with uniform
        p_best = (max_limit - req_wild) / (max_limit - min_limit)

    req_wild_worst = 3.0 * worst_parent - (val_a + val_b)
    if req_wild_worst <= min_limit:
        p_worst = 1.0
    elif req_wild_worst >= max_limit:
        p_worst = 0.0
    else:
        p_worst = (max_limit - req_wild_worst) / (max_limit - min_limit)

    return StatPrediction(
        mean_val=round(mean_val, 4),
        min_val=round(actual_min, 4),
        max_val=round(actual_max, 4),
        p_exceed_best_parent=round(max(0.0, min(1.0, p_best)), 4),
        p_exceed_worst_parent=round(max(0.0, min(1.0, p_worst)), 4),
        percentile_25=round((actual_min * 2 + mean_val) / 3.0, 4),
        median=round(mean_val, 4),
        percentile_75=round((actual_max * 2 + mean_val) / 3.0, 4),
    )


def calculate_coat_probabilities(horse_a: Horse, horse_b: Horse) -> Tuple[Dict[str, float], Dict[str, float]]:
    """Calculates inheritance odds for coat colors and markings."""
    all_colors = [c.value for c in CoatColor]
    all_patterns = [p.value for p in CoatPattern]

    color_a = horse_a.coat_color or CoatColor.WHITE.value
    color_b = horse_b.coat_color or CoatColor.WHITE.value

    color_probs = {c: 0.0 for c in all_colors}
    # 1/9 random roll evenly split among all 7 colors
    for c in all_colors:
        color_probs[c] += (1.0 / 9.0) / 7.0

    # 4/9 from Parent A, 4/9 from Parent B
    color_probs[color_a] += 4.0 / 9.0
    color_probs[color_b] += 4.0 / 9.0

    # Normalize colors
    total_c = sum(color_probs.values())
    color_probs = {k: round(v / total_c, 4) for k, v in color_probs.items() if round(v / total_c, 4) > 0.0}

    # Patterns
    pattern_a = horse_a.coat_pattern or CoatPattern.NONE.value
    pattern_b = horse_b.coat_pattern or CoatPattern.NONE.value

    pattern_probs = {p: 0.0 for p in all_patterns}
    # 1/9 random roll evenly split among all 5 patterns
    for p in all_patterns:
        pattern_probs[p] += (1.0 / 9.0) / 5.0

    pattern_probs[pattern_a] += 4.0 / 9.0
    pattern_probs[pattern_b] += 4.0 / 9.0

    total_p = sum(pattern_probs.values())
    pattern_probs = {k: round(v / total_p, 4) for k, v in pattern_probs.items() if round(v / total_p, 4) > 0.0}

    return color_probs, pattern_probs


def predict_breeding(horse_a: Horse, horse_b: Horse, version: str = "1.20+") -> BreedingPrediction:
    """Predicts breeding outcomes between two parent horses."""
    if version == "1.20+":
        health_pred = calculate_1_20_stat_prediction(
            horse_a.hp, horse_b.hp, MIN_HEALTH_HP, MAX_HEALTH_HP
        )
        speed_pred = calculate_1_20_stat_prediction(
            horse_a.speed_attr, horse_b.speed_attr, MIN_SPEED_ATTR, MAX_SPEED_ATTR
        )
        jump_pred = calculate_1_20_stat_prediction(
            horse_a.jump_attr, horse_b.jump_attr, MIN_JUMP_ATTR, MAX_JUMP_ATTR
        )
    else:
        health_pred = calculate_legacy_stat_prediction(
            horse_a.hp, horse_b.hp, MIN_HEALTH_HP, MAX_HEALTH_HP
        )
        speed_pred = calculate_legacy_stat_prediction(
            horse_a.speed_attr, horse_b.speed_attr, MIN_SPEED_ATTR, MAX_SPEED_ATTR
        )
        jump_pred = calculate_legacy_stat_prediction(
            horse_a.jump_attr, horse_b.jump_attr, MIN_JUMP_ATTR, MAX_JUMP_ATTR
        )

    color_probs, pattern_probs = calculate_coat_probabilities(horse_a, horse_b)

    # Conversions for user-friendly display
    hearts = {
        "mean": hp_to_hearts(health_pred.mean_val),
        "min": hp_to_hearts(health_pred.min_val),
        "max": hp_to_hearts(health_pred.max_val),
        "median": hp_to_hearts(health_pred.median),
    }

    speed_bps = {
        "mean": speed_attr_to_bps(speed_pred.mean_val),
        "min": speed_attr_to_bps(speed_pred.min_val),
        "max": speed_attr_to_bps(speed_pred.max_val),
        "median": speed_attr_to_bps(speed_pred.median),
    }

    speed_100m_sec = {
        "mean": speed_attr_to_time_100m(speed_pred.mean_val),
        "min_fastest": speed_attr_to_time_100m(speed_pred.max_val),  # Fastest speed = lowest time
        "max_slowest": speed_attr_to_time_100m(speed_pred.min_val),
        "median": speed_attr_to_time_100m(speed_pred.median),
    }

    jump_height_blocks = {
        "mean": jump_attr_to_height(jump_pred.mean_val),
        "min": jump_attr_to_height(jump_pred.min_val),
        "max": jump_attr_to_height(jump_pred.max_val),
        "median": jump_attr_to_height(jump_pred.median),
    }

    return BreedingPrediction(
        version=version,
        health_hp=health_pred,
        speed_attr=speed_pred,
        jump_attr=jump_pred,
        hearts=hearts,
        speed_100m_sec=speed_100m_sec,
        speed_bps=speed_bps,
        jump_height_blocks=jump_height_blocks,
        coat_probabilities=color_probs,
        pattern_probabilities=pattern_probs,
    )


def simulate_foal_sample(horse_a: Horse, horse_b: Horse, version: str = "1.20+") -> Horse:
    """Generates a single random simulated foal according to the exact Minecraft rules."""
    if version == "1.20+":
        def roll_stat(va: float, vb: float, vmin: float, vmax: float) -> float:
            midpoint = (va + vb) / 2.0
            spread = abs(va - vb) + 0.3 * (vmax - vmin)
            roll = (random.random() + random.random() + random.random()) / 3.0 - 0.5
            return max(vmin, min(vmax, midpoint + spread * roll))

        hp = roll_stat(horse_a.hp, horse_b.hp, MIN_HEALTH_HP, MAX_HEALTH_HP)
        speed = roll_stat(horse_a.speed_attr, horse_b.speed_attr, MIN_SPEED_ATTR, MAX_SPEED_ATTR)
        jump = roll_stat(horse_a.jump_attr, horse_b.jump_attr, MIN_JUMP_ATTR, MAX_JUMP_ATTR)
    else:
        # Legacy
        wild_hp = 15.0 + random.randint(0, 7) + random.randint(0, 8)
        wild_speed = (0.45 + random.random() * 0.3 + random.random() * 0.3 + random.random() * 0.3) * 0.25
        wild_jump = 0.4 + random.random() * 0.2 + random.random() * 0.2 + random.random() * 0.2

        hp = (horse_a.hp + horse_b.hp + wild_hp) / 3.0
        speed = (horse_a.speed_attr + horse_b.speed_attr + wild_speed) / 3.0
        jump = (horse_a.jump_attr + horse_b.jump_attr + wild_jump) / 3.0

    # Coat inheritance
    r_color = random.random()
    if r_color < 4.0 / 9.0:
        color = horse_a.coat_color
    elif r_color < 8.0 / 9.0:
        color = horse_b.coat_color
    else:
        color = random.choice([c.value for c in CoatColor])

    r_pattern = random.random()
    if r_pattern < 4.0 / 9.0:
        pattern = horse_a.coat_pattern
    elif r_pattern < 8.0 / 9.0:
        pattern = horse_b.coat_pattern
    else:
        pattern = random.choice([p.value for p in CoatPattern])

    return Horse(
        name=f"Foal of {horse_a.name} & {horse_b.name}",
        hearts=hp_to_hearts(hp),
        speed_100m_time=speed_attr_to_time_100m(speed),
        jump_height_blocks=jump_attr_to_height(jump),
        coat_color=color,
        coat_pattern=pattern,
        gender="Any / Unspecified",
        notes="Simulated offspring",
    )
