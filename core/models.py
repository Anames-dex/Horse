"""Data models representing Minecraft horses, coats, and stats."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any
import uuid

from core.conversions import (
    hearts_to_hp,
    hp_to_hearts,
    time_100m_to_bps,
    time_100m_to_speed_attr,
    speed_attr_to_bps,
    speed_attr_to_time_100m,
    jump_height_to_attr,
    jump_attr_to_height,
    MIN_HEALTH_HP,
    MAX_HEALTH_HP,
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR,
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR,
)


class CoatColor(str, Enum):
    WHITE = "White"
    CREAMY = "Creamy"
    CHESTNUT = "Chestnut"
    BROWN = "Brown"
    BLACK = "Black"
    GRAY = "Gray"
    DARK_BROWN = "Dark Brown"


class CoatPattern(str, Enum):
    NONE = "None (Plain)"
    WHITE_STOCKINGS = "White Stockings / Blaze"
    WHITEFIELD = "Whitefield (Paint/Splash)"
    WHITE_DOTS = "White Dots (Snowflake)"
    BLACK_DOTS = "Black Dots (Sooty)"


class Gender(str, Enum):
    ANY = "Any / Unspecified"
    STALLION = "Stallion"
    MARE = "Mare"


@dataclass
class Horse:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = "Unnamed Horse"
    hearts: float = 11.0  # Default ~22 HP
    speed_100m_time: float = 10.0  # 10.0 seconds -> 10 b/s
    jump_height_blocks: float = 3.0  # 3.0 blocks
    coat_color: Optional[str] = CoatColor.WHITE.value
    coat_pattern: Optional[str] = CoatPattern.NONE.value
    gender: str = Gender.ANY.value
    notes: str = ""

    @property
    def hp(self) -> float:
        return hearts_to_hp(self.hearts)

    @property
    def speed_bps(self) -> float:
        return time_100m_to_bps(self.speed_100m_time)

    @property
    def speed_attr(self) -> float:
        return time_100m_to_speed_attr(self.speed_100m_time)

    @property
    def jump_attr(self) -> float:
        return jump_height_to_attr(self.jump_height_blocks)

    @property
    def overall_rating(self) -> float:
        """
        Normalized score 0.0 - 100.0 based on how close stats are to wild maximums.
        Each stat weighted equally (Health 33.3%, Speed 33.3%, Jump 33.3%).
        """
        h_norm = max(0.0, min(1.0, (self.hp - MIN_HEALTH_HP) / (MAX_HEALTH_HP - MIN_HEALTH_HP)))
        s_norm = max(0.0, min(1.0, (self.speed_attr - MIN_SPEED_ATTR) / (MAX_SPEED_ATTR - MIN_SPEED_ATTR)))
        j_norm = max(0.0, min(1.0, (self.jump_attr - MIN_JUMP_ATTR) / (MAX_JUMP_ATTR - MIN_JUMP_ATTR)))
        return round((h_norm + s_norm + j_norm) / 3.0 * 100.0, 1)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "hearts": round(self.hearts, 2),
            "speed_100m_time": round(self.speed_100m_time, 2),
            "jump_height_blocks": round(self.jump_height_blocks, 2),
            "coat_color": self.coat_color,
            "coat_pattern": self.coat_pattern,
            "gender": self.gender,
            "notes": self.notes,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Horse":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", "Unnamed Horse"),
            hearts=float(data.get("hearts", 11.0)),
            speed_100m_time=float(data.get("speed_100m_time", 10.0)),
            jump_height_blocks=float(data.get("jump_height_blocks", 3.0)),
            coat_color=data.get("coat_color", CoatColor.WHITE.value),
            coat_pattern=data.get("coat_pattern", CoatPattern.NONE.value),
            gender=data.get("gender", Gender.ANY.value),
            notes=data.get("notes", ""),
        )
