"""Conversion utilities between in-game measurements, friendly units, and internal Minecraft attributes."""

import math

# Constants for Minecraft Horse Attributes (Vanilla Java Edition)
MIN_HEALTH_HP = 15.0  # 7.5 hearts
MAX_HEALTH_HP = 30.0  # 15.0 hearts

MIN_SPEED_ATTR = 0.1125
MAX_SPEED_ATTR = 0.3375
SPEED_CONVERSION_FACTOR = 43.17  # blocks_per_sec = speed_attr * 43.17

MIN_JUMP_ATTR = 0.4
MAX_JUMP_ATTR = 1.0


# --- Health Conversions ---
def hearts_to_hp(hearts: float) -> float:
    """Converts hearts (e.g. 7.5 - 15.0) to Health Points (15.0 - 30.0)."""
    return round(float(hearts) * 2.0, 2)


def hp_to_hearts(hp: float) -> float:
    """Converts Health Points (15.0 - 30.0) to hearts (7.5 - 15.0)."""
    return round(float(hp) / 2.0, 2)


# --- Speed Conversions ---
def time_100m_to_bps(time_sec: float) -> float:
    """Converts time in seconds to traverse 100 blocks into blocks per second (b/s)."""
    if time_sec <= 0:
        return 0.0
    return round(100.0 / float(time_sec), 3)


def bps_to_time_100m(bps: float) -> float:
    """Converts blocks per second (b/s) into time in seconds to traverse 100 blocks."""
    if bps <= 0:
        return 0.0
    return round(100.0 / float(bps), 2)


def bps_to_speed_attr(bps: float) -> float:
    """Converts blocks per second to internal Minecraft movement_speed attribute."""
    return float(bps) / SPEED_CONVERSION_FACTOR


def speed_attr_to_bps(attr: float) -> float:
    """Converts internal Minecraft movement_speed attribute to blocks per second."""
    return round(float(attr) * SPEED_CONVERSION_FACTOR, 3)


def time_100m_to_speed_attr(time_sec: float) -> float:
    """Direct conversion from 100-block time (seconds) to internal speed attribute."""
    bps = time_100m_to_bps(time_sec)
    return bps_to_speed_attr(bps)


def speed_attr_to_time_100m(attr: float) -> float:
    """Direct conversion from internal speed attribute to 100-block time (seconds)."""
    bps = speed_attr_to_bps(attr)
    return bps_to_time_100m(bps)


# --- Jump Height Conversions ---
def jump_attr_to_height(attr: float) -> float:
    """
    Converts internal jump_strength attribute (0.4 to 1.0) into approximate jump height in blocks.
    Polynomial derived from Minecraft trajectory physics:
    y = -0.1817584952*x^3 + 3.689713992*x^2 + 2.128599134*x - 0.343930367
    """
    x = float(attr)
    height = (-0.1817584952 * (x**3)) + (3.689713992 * (x**2)) + (2.128599134 * x) - 0.343930367
    return round(max(0.0, height), 2)


def jump_height_to_attr(height: float) -> float:
    """
    Inverts jump height in blocks back to internal jump_strength attribute using bisection.
    """
    target = float(height)
    if target <= jump_attr_to_height(MIN_JUMP_ATTR):
        return MIN_JUMP_ATTR
    if target >= jump_attr_to_height(MAX_JUMP_ATTR):
        return MAX_JUMP_ATTR

    low = MIN_JUMP_ATTR
    high = MAX_JUMP_ATTR
    for _ in range(30):
        mid = (low + high) / 2.0
        h_mid = jump_attr_to_height(mid)
        if h_mid < target:
            low = mid
        else:
            high = mid
    return round((low + high) / 2.0, 4)
