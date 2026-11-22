"""Unit tests for conversions."""

import pytest
from core.conversions import (
    hearts_to_hp,
    hp_to_hearts,
    time_100m_to_bps,
    bps_to_time_100m,
    time_100m_to_speed_attr,
    speed_attr_to_time_100m,
    jump_attr_to_height,
    jump_height_to_attr,
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR,
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR,
)


def test_health_conversions():
    assert hearts_to_hp(7.5) == 15.0
    assert hearts_to_hp(15.0) == 30.0
    assert hp_to_hearts(20.0) == 10.0


def test_speed_conversions():
    # 10.0 seconds for 100 blocks = 10.0 blocks/sec
    assert time_100m_to_bps(10.0) == 10.0
    assert bps_to_time_100m(10.0) == 10.0

    # Max speed ~ 6.86 seconds for 100 blocks
    attr = time_100m_to_speed_attr(6.86)
    assert 0.33 < attr < 0.34

    # Round trip conversion
    t_orig = 9.25
    s_attr = time_100m_to_speed_attr(t_orig)
    t_back = speed_attr_to_time_100m(s_attr)
    assert abs(t_orig - t_back) < 0.05


def test_jump_conversions():
    # Min jump strength 0.4 -> ~1.08 blocks
    h_min = jump_attr_to_height(MIN_JUMP_ATTR)
    assert 1.0 <= h_min <= 1.2

    # Max jump strength 1.0 -> ~5.29 blocks
    h_max = jump_attr_to_height(MAX_JUMP_ATTR)
    assert 5.0 <= h_max <= 5.35

    # Inversion test
    for target_h in [1.5, 2.5, 3.8, 5.0]:
        attr = jump_height_to_attr(target_h)
        h_calc = jump_attr_to_height(attr)
        assert abs(target_h - h_calc) < 0.05
