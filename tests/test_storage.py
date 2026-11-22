"""Unit tests for storage, persistence, and serialization."""

import os
import tempfile
import pytest
from core.models import Horse, CoatColor, CoatPattern, Gender
from core.storage import HorseStorage, get_sample_horses


def test_horse_serialization():
    h = Horse(
        name="TestHorse",
        hearts=12.5,
        speed_100m_time=8.0,
        jump_height_blocks=4.2,
        coat_color=CoatColor.GRAY.value,
        coat_pattern=CoatPattern.WHITE_DOTS.value,
        gender=Gender.STALLION.value,
        notes="Fast grey",
    )
    d = h.to_dict()
    assert d["name"] == "TestHorse"
    assert d["hearts"] == 12.5
    assert d["speed_100m_time"] == 8.0
    assert d["jump_height_blocks"] == 4.2

    h2 = Horse.from_dict(d)
    assert h2.id == h.id
    assert h2.name == h.name
    assert h2.hearts == h.hearts
    assert h2.speed_100m_time == h.speed_100m_time
    assert h2.jump_height_blocks == h.jump_height_blocks
    assert h2.coat_color == h.coat_color
    assert h2.coat_pattern == h.coat_pattern
    assert h2.gender == h.gender


def test_storage_save_load():
    with tempfile.TemporaryDirectory() as tmpdir:
        storage_file = os.path.join(tmpdir, "test_horses.json")
        storage = HorseStorage(filepath=storage_file)

        # Fresh load gives samples
        initial = storage.load()
        assert len(initial) > 0

        # Save custom list
        custom = [Horse(name="Custom1", hearts=14.0), Horse(name="Custom2", hearts=15.0)]
        assert storage.save(custom) is True

        # Load back
        loaded = storage.load()
        assert len(loaded) == 2
        assert loaded[0].name == "Custom1"
        assert loaded[1].name == "Custom2"
