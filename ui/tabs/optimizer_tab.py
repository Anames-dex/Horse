"""Optimizer Tab: Analyzes stable and presents ranked best pairs to breed."""

import customtkinter as ctk
from typing import List, Callable
from core.models import Horse
from core.optimizer import find_best_breeding_pairs, OptimizationObjective, BreedingPairRecommendation
from core.genetics import simulate_foal_sample
from ui.theme import (
    COLOR_CARD_BG,
    COLOR_PRIMARY_GREEN,
    COLOR_PRIMARY_HOVER,
    COLOR_HEALTH_RED,
    COLOR_SPEED_BLUE,
    COLOR_JUMP_ORANGE,
    COLOR_GOLD,
    COLOR_MUTED_GRAY,
    FONT_TITLE,
    FONT_SUBTITLE,
    FONT_BODY,
    FONT_BODY_BOLD,
    FONT_SMALL,
    FONT_STAT_VALUE,
)


class OptimizerTab(ctk.CTkFrame):
    def __init__(
        self,
        master,
        get_horses: Callable[[], List[Horse]],
        on_add_foal_to_stable: Callable[[Horse], None],
    ):
        super().__init__(master, fg_color="transparent")
        self.get_horses = get_horses
        self.on_add_foal_to_stable = on_add_foal_to_stable

        self._build_ui()

    def _build_ui(self):
        # Header Controls
        header = ctk.CTkFrame(self, fg_color=COLOR_CARD_BG, corner_radius=10)
        header.pack(fill="x", padx=10, pady=(10, 8))

        top_row = ctk.CTkFrame(header, fg_color="transparent")
        top_row.pack(fill="x", padx=15, pady=(12, 6))

        ctk.CTkLabel(top_row, text="Breeding Engine Matchmaker", font=FONT_TITLE, text_color=COLOR_PRIMARY_GREEN).pack(
            side="left"
        )

        # Version toggle
        self.opt_version = ctk.CTkOptionMenu(
            top_row,
            values=["1.20+ (Modern)", "Pre-1.20 (Legacy)"],
            width=160,
            height=32,
            command=lambda v: self.refresh(),
        )
        self.opt_version.set("1.20+ (Modern)")
        self.opt_version.pack(side="right")
        ctk.CTkLabel(top_row, text="Minecraft Version:", font=FONT_BODY, text_color=COLOR_MUTED_GRAY).pack(
            side="right", padx=8
        )

        # Objective & Filter Controls
        filter_row = ctk.CTkFrame(header, fg_color="transparent")
        filter_row.pack(fill="x", padx=15, pady=(0, 12))

        ctk.CTkLabel(filter_row, text="Breeding Goal:", font=FONT_BODY_BOLD).pack(side="left", padx=(0, 8))
        self.opt_objective = ctk.CTkOptionMenu(
            filter_row,
            values=[
                OptimizationObjective.BALANCED.value,
                OptimizationObjective.SPEED.value,
                OptimizationObjective.JUMP.value,
                OptimizationObjective.HEALTH.value,
                OptimizationObjective.MOBILITY.value,
            ],
            width=240,
            height=32,
            command=lambda v: self.refresh(),
        )
        self.opt_objective.set(OptimizationObjective.BALANCED.value)
        self.opt_objective.pack(side="left", padx=(0, 20))

        # Enforce gender checkbox
        self.chk_gender = ctk.CTkCheckBox(
            filter_row,
            text="Enforce Stallion + Mare",
            font=FONT_BODY,
            command=self.refresh,
        )
        self.chk_gender.pack(side="left", padx=(0, 20))

        # Re-calculate button
        btn_calc = ctk.CTkButton(
            filter_row,
            text="Recalculate",
            font=FONT_BODY_BOLD,
            width=110,
            height=32,
            fg_color=COLOR_PRIMARY_GREEN,
            hover_color=COLOR_PRIMARY_HOVER,
            command=self.refresh,
        )
        btn_calc.pack(side="right")

        # Scrollable area for pair cards
        self.scroll_pairs = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll_pairs.pack(fill="both", expand=True, padx=5, pady=5)

    def refresh(self):
        for w in self.scroll_pairs.winfo_children():
            w.destroy()

        horses = self.get_horses()
        if len(horses) < 2:
            lbl = ctk.CTkLabel(
                self.scroll_pairs,
                text="Need at least 2 horses in your stable to calculate breeding pairs!\nHead over to 'Add Horse' to enter your horses.",
                font=FONT_BODY,
                text_color=COLOR_MUTED_GRAY,
            )
            lbl.pack(pady=50)
            return

        # Map UI objective string to enum
        obj_str = self.opt_objective.get()
        objective = next((obj for obj in OptimizationObjective if obj.value == obj_str), OptimizationObjective.BALANCED)
        version_str = "1.20+" if "1.20+" in self.opt_version.get() else "legacy"
        enforce_gender = bool(self.chk_gender.get())

        pairs = find_best_breeding_pairs(
            horses=horses,
            objective=objective,
            version=version_str,
            limit=15,
            enforce_gender=enforce_gender,
        )

        if not pairs:
            lbl = ctk.CTkLabel(
                self.scroll_pairs,
                text="No compatible pairs found with current filters (check gender tags or add more horses).",
                font=FONT_BODY,
                text_color=COLOR_MUTED_GRAY,
            )
            lbl.pack(pady=40)
            return

        for rec in pairs:
            self._render_pair_card(rec, version_str)

    def _render_pair_card(self, rec: BreedingPairRecommendation, version_str: str):
        card = ctk.CTkFrame(self.scroll_pairs, fg_color=COLOR_CARD_BG, corner_radius=10)
        card.pack(fill="x", pady=8, padx=5)

        # Header: Rank, Names, Score
        header = ctk.CTkFrame(card, fg_color="transparent")
        header.pack(fill="x", padx=14, pady=(12, 4))

        # Rank badge
        rank_colors = {1: "#F1C40F", 2: "#BDC3C7", 3: "#E67E22"}
        rank_color = rank_colors.get(rec.rank, COLOR_PRIMARY_GREEN)

        ctk.CTkLabel(
            header,
            text=f"#{rec.rank}",
            font=("Segoe UI", 16, "bold"),
            text_color=rank_color,
            width=36,
        ).pack(side="left")

        # Parent names
        names_text = f"{rec.horse_a.name}  ×  {rec.horse_b.name}"
        ctk.CTkLabel(header, text=names_text, font=FONT_TITLE, anchor="w").pack(side="left", padx=8)

        # Match Score
        ctk.CTkLabel(
            header,
            text=f"Match Score: {rec.score:.1f}/100",
            font=FONT_STAT_VALUE,
            text_color=COLOR_PRIMARY_GREEN if rec.score >= 80 else COLOR_GOLD,
        ).pack(side="right")

        # Summary Reason
        ctk.CTkLabel(
            card,
            text=f"💡 {rec.summary_reason}",
            font=FONT_SMALL,
            text_color="#B0BEC5",
            anchor="w",
        ).pack(fill="x", padx=14, pady=(0, 8))

        # Foal Expected Stats Display (3 columns)
        stats_box = ctk.CTkFrame(card, fg_color="#20232A", corner_radius=8)
        stats_box.pack(fill="x", padx=14, pady=(0, 8))

        # Column 1: Health
        col_h = ctk.CTkFrame(stats_box, fg_color="transparent")
        col_h.pack(side="left", expand=True, fill="both", padx=8, pady=8)
        ctk.CTkLabel(col_h, text="Expected Health", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            col_h,
            text=f"❤️ {rec.expected_hearts:.1f} Hearts",
            font=FONT_BODY_BOLD,
            text_color=COLOR_HEALTH_RED,
        ).pack()
        ctk.CTkLabel(
            col_h,
            text=f"{rec.prob_beat_both_health*100:.1f}% chance > best parent",
            font=FONT_SMALL,
            text_color=COLOR_MUTED_GRAY,
        ).pack()

        # Column 2: Speed
        col_s = ctk.CTkFrame(stats_box, fg_color="transparent")
        col_s.pack(side="left", expand=True, fill="both", padx=8, pady=8)
        ctk.CTkLabel(col_s, text="Expected Speed", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            col_s,
            text=f"⚡ {rec.expected_speed_bps:.2f} b/s ({rec.expected_speed_100m:.1f}s)",
            font=FONT_BODY_BOLD,
            text_color=COLOR_SPEED_BLUE,
        ).pack()
        ctk.CTkLabel(
            col_s,
            text=f"{rec.prob_beat_both_speed*100:.1f}% chance > best parent (Max: {rec.max_potential_speed_bps:.2f})",
            font=FONT_SMALL,
            text_color="#81D4FA",
        ).pack()

        # Column 3: Jump
        col_j = ctk.CTkFrame(stats_box, fg_color="transparent")
        col_j.pack(side="left", expand=True, fill="both", padx=8, pady=8)
        ctk.CTkLabel(col_j, text="Expected Jump", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            col_j,
            text=f"🦘 {rec.expected_jump_height:.2f} Blocks",
            font=FONT_BODY_BOLD,
            text_color=COLOR_JUMP_ORANGE,
        ).pack()
        ctk.CTkLabel(
            col_j,
            text=f"{rec.prob_beat_both_jump*100:.1f}% chance > best parent (Max: {rec.max_potential_jump_height:.2f}m)",
            font=FONT_SMALL,
            text_color="#FFCC80",
        ).pack()

        # Bottom Action Bar
        act_bar = ctk.CTkFrame(card, fg_color="transparent")
        act_bar.pack(fill="x", padx=14, pady=(4, 12))

        # Result placeholder label for simulated foal
        lbl_sim_res = ctk.CTkLabel(act_bar, text="", font=FONT_BODY, text_color=COLOR_GOLD, anchor="w")
        lbl_sim_res.pack(side="left", fill="x", expand=True)

        def do_simulate():
            foal = simulate_foal_sample(rec.horse_a, rec.horse_b, version=version_str)
            lbl_sim_res.configure(
                text=(
                    f"🎲 Foal Rolled: {foal.hearts:.1f} Hearts | "
                    f"{foal.speed_bps:.2f} b/s ({foal.speed_100m_time:.1f}s) | "
                    f"{foal.jump_height_blocks:.2f}m Jump | {foal.coat_color}"
                )
            )
            # Add 'Adopt to Stable' button if not yet created
            if not hasattr(do_simulate, "adopt_btn"):
                adopt_btn = ctk.CTkButton(
                    act_bar,
                    text="Save Foal to Stable",
                    font=FONT_SMALL,
                    width=130,
                    height=28,
                    fg_color=COLOR_PRIMARY_GREEN,
                    hover_color=COLOR_PRIMARY_HOVER,
                    command=lambda: [self.on_add_foal_to_stable(foal), adopt_btn.configure(state="disabled", text="Saved!")],
                )
                adopt_btn.pack(side="right", padx=(8, 0))
                do_simulate.adopt_btn = adopt_btn

        btn_roll = ctk.CTkButton(
            act_bar,
            text="Roll Simulated Foal",
            font=FONT_SMALL,
            width=140,
            height=28,
            fg_color="#4C566A",
            hover_color="#5E81AC",
            command=do_simulate,
        )
        btn_roll.pack(side="right")
