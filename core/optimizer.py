"""Breeding pair optimizer engine.

Analyzes all candidate pairs in a stable and ranks them based on user objectives:
- Balanced (God-Horse)
- Speed Specialist (Sprinter)
- Jump Specialist (High-Flier)
- Tank (Maximum Health)
- Custom Weighted Objectives
"""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, Tuple, Dict
from itertools import combinations

from core.models import Horse, Gender
from core.genetics import predict_breeding, BreedingPrediction
from core.conversions import (
    MIN_HEALTH_HP,
    MAX_HEALTH_HP,
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR,
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR,
)


class OptimizationObjective(str, Enum):
    BALANCED = "Balanced (God-Horse)"
    SPEED = "Maximum Speed (Sprinter)"
    JUMP = "Maximum Jump (High-Flier)"
    HEALTH = "Maximum Health (Tank)"
    MOBILITY = "Mobility (Speed + Jump)"
    CUSTOM = "Custom Weights"


@dataclass
class BreedingPairRecommendation:
    rank: int
    horse_a: Horse
    horse_b: Horse
    objective: str
    score: float  # 0.0 to 100.0 score
    prediction: BreedingPrediction
    expected_hearts: float
    expected_speed_100m: float
    expected_speed_bps: float
    expected_jump_height: float
    max_potential_speed_bps: float
    max_potential_jump_height: float
    prob_beat_both_speed: float
    prob_beat_both_jump: float
    prob_beat_both_health: float
    summary_reason: str


def are_genders_compatible(h1: Horse, h2: Horse) -> bool:
    """Checks if two horses can breed based on gender tags (if set)."""
    # If either is unspecified, they are compatible
    if h1.gender == Gender.ANY.value or h2.gender == Gender.ANY.value:
        return True
    # If both specified, one must be Stallion and one Mare
    return h1.gender != h2.gender


def score_pair_for_objective(
    prediction: BreedingPrediction,
    horse_a: Horse,
    horse_b: Horse,
    objective: OptimizationObjective,
    weights: Optional[Dict[str, float]] = None,
) -> Tuple[float, str]:
    """
    Computes an optimization score (0-100) and human-readable explanation for a pair.
    """
    # Normalized stats of expected foal (0.0 to 1.0)
    h_norm = (prediction.health_hp.mean_val - MIN_HEALTH_HP) / (MAX_HEALTH_HP - MIN_HEALTH_HP)
    s_norm = (prediction.speed_attr.mean_val - MIN_SPEED_ATTR) / (MAX_SPEED_ATTR - MIN_SPEED_ATTR)
    j_norm = (prediction.jump_attr.mean_val - MIN_JUMP_ATTR) / (MAX_JUMP_ATTR - MIN_JUMP_ATTR)

    # Clamping
    h_norm = max(0.0, min(1.0, h_norm))
    s_norm = max(0.0, min(1.0, s_norm))
    j_norm = max(0.0, min(1.0, j_norm))

    # Bonus for upside potential (exceeding better parent)
    p_speed_beat = prediction.speed_attr.p_exceed_best_parent
    p_jump_beat = prediction.jump_attr.p_exceed_best_parent
    p_health_beat = prediction.health_hp.p_exceed_best_parent

    if objective == OptimizationObjective.SPEED:
        # 70% expected speed, 20% upside chance, 10% balanced support
        base_score = s_norm * 75.0 + (p_speed_beat * 15.0) + (j_norm * 5.0) + (h_norm * 5.0)
        bps = prediction.speed_bps["mean"]
        reason = f"Top speed candidate: {bps:.2f} b/s mean ({p_speed_beat*100:.1f}% chance to exceed best parent)"

    elif objective == OptimizationObjective.JUMP:
        base_score = j_norm * 75.0 + (p_jump_beat * 15.0) + (s_norm * 5.0) + (h_norm * 5.0)
        h_blocks = prediction.jump_height_blocks["mean"]
        reason = f"Top jumper candidate: {h_blocks:.2f} blocks mean ({p_jump_beat*100:.1f}% chance to exceed best parent)"

    elif objective == OptimizationObjective.HEALTH:
        base_score = h_norm * 80.0 + (p_health_beat * 15.0) + (s_norm * 2.5) + (j_norm * 2.5)
        hearts = prediction.hearts["mean"]
        reason = f"Tank candidate: {hearts:.1f} hearts mean ({p_health_beat*100:.1f}% chance to exceed best parent)"

    elif objective == OptimizationObjective.MOBILITY:
        base_score = (s_norm * 45.0) + (j_norm * 45.0) + (h_norm * 10.0)
        bps = prediction.speed_bps["mean"]
        j_h = prediction.jump_height_blocks["mean"]
        reason = f"Excellent exploration mount: {bps:.2f} b/s & {j_h:.2f}m jump"

    elif objective == OptimizationObjective.CUSTOM and weights:
        w_s = weights.get("speed", 0.33)
        w_j = weights.get("jump", 0.33)
        w_h = weights.get("health", 0.34)
        total_w = max(0.001, w_s + w_j + w_h)
        base_score = ((s_norm * w_s) + (j_norm * w_j) + (h_norm * w_h)) / total_w * 100.0
        reason = "Custom weighted objective match"

    else:  # BALANCED
        # 33% each with upside bonus
        raw = (s_norm + j_norm + h_norm) / 3.0 * 85.0
        upside = (p_speed_beat + p_jump_beat + p_health_beat) / 3.0 * 15.0
        base_score = raw + upside
        reason = (
            f"All-Around contender: {prediction.speed_bps['mean']:.1f} b/s, "
            f"{prediction.jump_height_blocks['mean']:.1f}m jump, {prediction.hearts['mean']:.1f} hearts"
        )

    return round(max(0.0, min(100.0, base_score)), 1), reason


def find_best_breeding_pairs(
    horses: List[Horse],
    objective: OptimizationObjective = OptimizationObjective.BALANCED,
    version: str = "1.20+",
    limit: int = 10,
    weights: Optional[Dict[str, float]] = None,
    enforce_gender: bool = False,
) -> List[BreedingPairRecommendation]:
    """
    Evaluates all unique pairs of horses in the stable and returns the top recommendations.
    Super fast analytical evaluation (handles 1,000s of pairs in milliseconds).
    """
    if len(horses) < 2:
        return []

    recommendations: List[BreedingPairRecommendation] = []

    for h1, h2 in combinations(horses, 2):
        if enforce_gender and not are_genders_compatible(h1, h2):
            continue

        pred = predict_breeding(h1, h2, version=version)
        score, reason = score_pair_for_objective(pred, h1, h2, objective, weights)

        rec = BreedingPairRecommendation(
            rank=0,  # Assigned after sorting
            horse_a=h1,
            horse_b=h2,
            objective=objective.value,
            score=score,
            prediction=pred,
            expected_hearts=pred.hearts["mean"],
            expected_speed_100m=pred.speed_100m_sec["mean"],
            expected_speed_bps=pred.speed_bps["mean"],
            expected_jump_height=pred.jump_height_blocks["mean"],
            max_potential_speed_bps=pred.speed_bps["max"],
            max_potential_jump_height=pred.jump_height_blocks["max"],
            prob_beat_both_speed=pred.speed_attr.p_exceed_best_parent,
            prob_beat_both_jump=pred.jump_attr.p_exceed_best_parent,
            prob_beat_both_health=pred.health_hp.p_exceed_best_parent,
            summary_reason=reason,
        )
        recommendations.append(rec)

    # Sort descending by score
    recommendations.sort(key=lambda r: r.score, reverse=True)

    # Assign ranks
    for idx, r in enumerate(recommendations[:limit], start=1):
        r.rank = idx

    return recommendations[:limit]
