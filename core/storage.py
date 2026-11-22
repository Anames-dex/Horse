"""Persistence and file I/O for horse stables."""

import json
import os
from typing import List
from core.models import Horse, CoatColor, CoatPattern, Gender


DEFAULT_STORAGE_FILE = "horses.json"


def get_sample_horses() -> List[Horse]:
    """Provides a balanced sample roster of horses with varied stats for initial testing."""
    return [
        Horse(
            name="Shadowfax",
            hearts=14.0,  # 28 HP (High health)
            speed_100m_time=7.5,  # 13.33 b/s (Very fast)
            jump_height_blocks=3.2,
            coat_color=CoatColor.WHITE.value,
            coat_pattern=CoatPattern.NONE.value,
            gender=Gender.STALLION.value,
            notes="Fast runner, great coat",
        ),
        Horse(
            name="Pegasus",
            hearts=10.5,  # 21 HP
            speed_100m_time=10.2,  # 9.8 b/s (Average)
            jump_height_blocks=4.8,  # Near max jump!
            coat_color=CoatColor.CREAMY.value,
            coat_pattern=CoatPattern.WHITE_STOCKINGS.value,
            gender=Gender.MARE.value,
            notes="Super jumper",
        ),
        Horse(
            name="Goliath",
            hearts=15.0,  # 30 HP (Max wild health!)
            speed_100m_time=11.5,  # 8.7 b/s
            jump_height_blocks=2.4,
            coat_color=CoatColor.DARK_BROWN.value,
            coat_pattern=CoatPattern.BLACK_DOTS.value,
            gender=Gender.STALLION.value,
            notes="Tank horse, maximum hearts",
        ),
        Horse(
            name="Midnight",
            hearts=12.0,  # 24 HP
            speed_100m_time=8.2,  # 12.2 b/s (Fast)
            jump_height_blocks=4.1,  # High jump
            coat_color=CoatColor.BLACK.value,
            coat_pattern=CoatPattern.NONE.value,
            gender=Gender.MARE.value,
            notes="Balanced all-around contender",
        ),
        Horse(
            name="Buttercup",
            hearts=9.0,  # 18 HP
            speed_100m_time=12.0,  # 8.3 b/s
            jump_height_blocks=1.8,
            coat_color=CoatColor.CHESTNUT.value,
            coat_pattern=CoatPattern.WHITEFIELD.value,
            gender=Gender.MARE.value,
            notes="Starter wild capture",
        ),
    ]


class HorseStorage:
    def __init__(self, filepath: str = DEFAULT_STORAGE_FILE):
        self.filepath = filepath

    def load(self) -> List[Horse]:
        if not os.path.exists(self.filepath):
            # Return sample horses on fresh start
            samples = get_sample_horses()
            self.save(samples)
            return samples

        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
            return [Horse.from_dict(item) for item in data]
        except Exception:
            return get_sample_horses()

    def save(self, horses: List[Horse]) -> bool:
        try:
            data = [h.to_dict() for h in horses]
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    def export_json(self, export_path: str, horses: List[Horse]) -> bool:
        try:
            data = [h.to_dict() for h in horses]
            with open(export_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    def import_json(self, import_path: str) -> List[Horse]:
        with open(import_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return [Horse.from_dict(item) for item in data]
