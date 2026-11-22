"""Unit tests for genetics and breeding prediction engine."""

import pytest
from core.models import Horse, CoatColor, CoatPattern
from core.genetics import (
    predict_breeding,
    calculate_coat_probabilities,
    simulate_foal_sample,
    irwin_hall_3_cdf,
)


def test_irwin_hall_cdf():
    assert irwin_hall_3_cdf(0.0) == 0.0
    assert irwin_hall_3_cdf(3.0) == 1.0
    assert abs(irwin_hall_3_cdf(1.5) - 0.5) < 1e-5


def test_breeding_prediction_1_20():
    h1 = Horse(name="Fast", hearts=10.0, speed_100m_time=7.5, jump_height_blocks=2.0)
    h2 = Horse(name="Jumper", hearts=12.0, speed_100m_time=11.0, jump_height_blocks=5.0)

    pred = predict_breeding(h1, h2, version="1.20+")
    assert pred.version == "1.20+"

    # Midpoint checks
    assert pred.hearts["mean"] == 11.0
    # Probability of exceeding best parent should be between 0.05 and 0.5
    assert 0.0 <= pred.speed_attr.p_exceed_best_parent <= 0.5
    assert 0.0 <= pred.jump_attr.p_exceed_best_parent <= 0.5

    # Child maximum potential can exceed better parent
    assert pred.speed_bps["max"] >= h1.speed_bps
    assert pred.jump_height_blocks["max"] >= h2.jump_height_blocks


def test_coat_probabilities():
    h1 = Horse(coat_color=CoatColor.WHITE.value, coat_pattern=CoatPattern.NONE.value)
    h2 = Horse(coat_color=CoatColor.BLACK.value, coat_pattern=CoatPattern.WHITEFIELD.value)

    color_probs, pattern_probs = calculate_coat_probabilities(h1, h2)

    # Both parents should have highest odds (~44% + 1.5% = ~46%)
    assert color_probs[CoatColor.WHITE.value] > 0.4
    assert color_probs[CoatColor.BLACK.value] > 0.4
    assert pattern_probs[CoatPattern.NONE.value] > 0.4
    assert pattern_probs[CoatPattern.WHITEFIELD.value] > 0.4


def test_simulate_foal():
    h1 = Horse(name="A", hearts=10.0, speed_100m_time=8.0, jump_height_blocks=3.0)
    h2 = Horse(name="B", hearts=14.0, speed_100m_time=9.0, jump_height_blocks=4.0)

    foal = simulate_foal_sample(h1, h2, version="1.20+")
    assert foal.hearts >= 7.5
    assert foal.hearts <= 15.0
    assert foal.speed_bps > 0
    assert foal.jump_height_blocks > 0
