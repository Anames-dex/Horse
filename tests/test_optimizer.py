"""Unit tests for the breeding optimizer engine."""

import pytest
from core.models import Horse, Gender
from core.optimizer import (
    find_best_breeding_pairs,
    OptimizationObjective,
    are_genders_compatible,
)
from core.storage import get_sample_horses


def test_gender_compatibility():
    h_stallion = Horse(gender=Gender.STALLION.value)
    h_mare = Horse(gender=Gender.MARE.value)
    h_any = Horse(gender=Gender.ANY.value)

    assert are_genders_compatible(h_stallion, h_mare)
    assert not are_genders_compatible(h_stallion, h_stallion)
    assert are_genders_compatible(h_stallion, h_any)


def test_optimizer_ranking():
    samples = get_sample_horses()
    recs_balanced = find_best_breeding_pairs(samples, objective=OptimizationObjective.BALANCED)
    assert len(recs_balanced) > 0
    # Top ranked should have highest score
    assert recs_balanced[0].score >= recs_balanced[1].score
    assert recs_balanced[0].rank == 1

    # Speed objective should favor fast horses (Shadowfax, Midnight)
    recs_speed = find_best_breeding_pairs(samples, objective=OptimizationObjective.SPEED)
    top_pair = recs_speed[0]
    names = {top_pair.horse_a.name, top_pair.horse_b.name}
    assert "Shadowfax" in names or "Midnight" in names

    # Jump objective should favor high jumpers (Pegasus, Midnight)
    recs_jump = find_best_breeding_pairs(samples, objective=OptimizationObjective.JUMP)
    top_jump_pair = recs_jump[0]
    jump_names = {top_jump_pair.horse_a.name, top_jump_pair.horse_b.name}
    assert "Pegasus" in jump_names or "Midnight" in jump_names
