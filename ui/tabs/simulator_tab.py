"""Simulator Tab: Detailed 1-on-1 head-to-head breeding inspection and probability distribution."""

import customtkinter as ctk
from typing import List, Callable, Optional
from core.models import Horse
from core.genetics import predict_breeding, simulate_foal_sample
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


class SimulatorTab(ctk.CTkScrollableFrame):
    def __init__(
        self,
        master,
        get_horses: Callable[[], List[Horse]],
        on_add_foal_to_stable: Callable[[Horse], None],
    ):
        super().__init__(master, fg_color="transparent")
        self.get_horses = get_horses
        self.on_add_foal_to_stable = on_add_foal_to_stable

        self.selected_a_id: Optional[str] = None
        self.selected_b_id: Optional[str] = None

        self._build_ui()

    def _build_ui(self):
        # Header
        lbl_head = ctk.CTkLabel(
            self,
            text="Head-to-Head Breeding Lab",
            font=FONT_TITLE,
            text_color=COLOR_PRIMARY_GREEN,
            anchor="w",
        )
        lbl_head.pack(fill="x", padx=10, pady=(10, 4))

        ctk.CTkLabel(
            self,
            text="Select any two horses from your stable to inspect complete genetic probabilities and coat odds.",
            font=FONT_SMALL,
            text_color=COLOR_MUTED_GRAY,
            anchor="w",
        ).pack(fill="x", padx=10, pady=(0, 12))

        # Parent Selection Bar
        selector_card = ctk.CTkFrame(self, fg_color=COLOR_CARD_BG, corner_radius=10)
        selector_card.pack(fill="x", padx=10, pady=(0, 10))

        row_sel = ctk.CTkFrame(selector_card, fg_color="transparent")
        row_sel.pack(fill="x", padx=15, pady=12)

        # Parent A Dropdown
        col_a = ctk.CTkFrame(row_sel, fg_color="transparent")
        col_a.pack(side="left", expand=True, fill="x", padx=(0, 10))
        ctk.CTkLabel(col_a, text="Parent 1 (Sire/Mare):", font=FONT_BODY_BOLD).pack(anchor="w", pady=(0, 4))
        self.opt_horse_a = ctk.CTkOptionMenu(col_a, values=["(No Horses)"], height=34, command=self._on_parent_changed)
        self.opt_horse_a.pack(fill="x")

        # "X" Icon
        ctk.CTkLabel(row_sel, text="×", font=("Segoe UI", 24, "bold"), text_color=COLOR_GOLD).pack(
            side="left", padx=10
        )

        # Parent B Dropdown
        col_b = ctk.CTkFrame(row_sel, fg_color="transparent")
        col_b.pack(side="left", expand=True, fill="x", padx=(10, 0))
        ctk.CTkLabel(col_b, text="Parent 2 (Sire/Mare):", font=FONT_BODY_BOLD).pack(anchor="w", pady=(0, 4))
        self.opt_horse_b = ctk.CTkOptionMenu(col_b, values=["(No Horses)"], height=34, command=self._on_parent_changed)
        self.opt_horse_b.pack(fill="x")

        # Results Container
        self.res_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.res_frame.pack(fill="both", expand=True, padx=5, pady=5)

    def populate_dropdowns(self, select_horse_a: Optional[Horse] = None, select_horse_b: Optional[Horse] = None):
        horses = self.get_horses()
        if not horses:
            self.opt_horse_a.configure(values=["(No Horses)"])
            self.opt_horse_b.configure(values=["(No Horses)"])
            self.opt_horse_a.set("(No Horses)")
            self.opt_horse_b.set("(No Horses)")
            return

        names = [f"{h.name} ({h.speed_bps:.1f} b/s, {h.jump_height_blocks:.1f}m)" for h in horses]
        self.horse_map = {f"{h.name} ({h.speed_bps:.1f} b/s, {h.jump_height_blocks:.1f}m)": h for h in horses}

        self.opt_horse_a.configure(values=names)
        self.opt_horse_b.configure(values=names)

        if select_horse_a:
            for k, v in self.horse_map.items():
                if v.id == select_horse_a.id:
                    self.opt_horse_a.set(k)
                    break
        elif names:
            self.opt_horse_a.set(names[0])

        if select_horse_b:
            for k, v in self.horse_map.items():
                if v.id == select_horse_b.id:
                    self.opt_horse_b.set(k)
                    break
        elif len(names) > 1:
            self.opt_horse_b.set(names[1])
        elif names:
            self.opt_horse_b.set(names[0])

        self.refresh_calculation()

    def _on_parent_changed(self, value=None):
        self.refresh_calculation()

    def refresh_calculation(self):
        for w in self.res_frame.winfo_children():
            w.destroy()

        if not hasattr(self, "horse_map"):
            return

        name_a = self.opt_horse_a.get()
        name_b = self.opt_horse_b.get()

        h_a = self.horse_map.get(name_a)
        h_b = self.horse_map.get(name_b)

        if not h_a or not h_b:
            return

        if h_a.id == h_b.id:
            lbl_warn = ctk.CTkLabel(
                self.res_frame,
                text="Please select two different horses to breed.",
                font=FONT_BODY,
                text_color=COLOR_GOLD,
            )
            lbl_warn.pack(pady=30)
            return

        pred = predict_breeding(h_a, h_b, version="1.20+")

        # 1. Comparison & Prediction Table Card
        pred_card = ctk.CTkFrame(self.res_frame, fg_color=COLOR_CARD_BG, corner_radius=10)
        pred_card.pack(fill="x", padx=5, pady=5)

        ctk.CTkLabel(
            pred_card,
            text="Genetic Forecast (Minecraft 1.20+)",
            font=FONT_SUBTITLE,
            text_color=COLOR_PRIMARY_GREEN,
            anchor="w",
        ).pack(fill="x", padx=15, pady=(12, 8))

        # 3 stat rows
        # --- Speed ---
        row_s = ctk.CTkFrame(pred_card, fg_color="#20232A", corner_radius=8)
        row_s.pack(fill="x", padx=15, pady=4)
        ctk.CTkLabel(row_s, text="⚡ Movement Speed", font=FONT_BODY_BOLD, text_color=COLOR_SPEED_BLUE, width=150, anchor="w").pack(
            side="left", padx=10, pady=8
        )
        s_info = (
            f"Expected: {pred.speed_bps['mean']:.2f} b/s ({pred.speed_100m_sec['mean']:.1f}s / 100m)   |   "
            f"Range: {pred.speed_bps['min']:.2f} – {pred.speed_bps['max']:.2f} b/s   |   "
            f"Chance > Best Parent: {pred.speed_attr.p_exceed_best_parent*100:.1f}%"
        )
        ctk.CTkLabel(row_s, text=s_info, font=FONT_BODY, text_color="#ECEFF4", anchor="w").pack(
            side="left", fill="x", expand=True
        )

        # --- Jump ---
        row_j = ctk.CTkFrame(pred_card, fg_color="#20232A", corner_radius=8)
        row_j.pack(fill="x", padx=15, pady=4)
        ctk.CTkLabel(row_j, text="🦘 Jump Height", font=FONT_BODY_BOLD, text_color=COLOR_JUMP_ORANGE, width=150, anchor="w").pack(
            side="left", padx=10, pady=8
        )
        j_info = (
            f"Expected: {pred.jump_height_blocks['mean']:.2f} Blocks   |   "
            f"Range: {pred.jump_height_blocks['min']:.2f} – {pred.jump_height_blocks['max']:.2f} Blocks   |   "
            f"Chance > Best Parent: {pred.jump_attr.p_exceed_best_parent*100:.1f}%"
        )
        ctk.CTkLabel(row_j, text=j_info, font=FONT_BODY, text_color="#ECEFF4", anchor="w").pack(
            side="left", fill="x", expand=True
        )

        # --- Health ---
        row_h = ctk.CTkFrame(pred_card, fg_color="#20232A", corner_radius=8)
        row_h.pack(fill="x", padx=15, pady=4)
        ctk.CTkLabel(row_h, text="❤️ Health", font=FONT_BODY_BOLD, text_color=COLOR_HEALTH_RED, width=150, anchor="w").pack(
            side="left", padx=10, pady=8
        )
        h_info = (
            f"Expected: {pred.hearts['mean']:.1f} Hearts ({pred.health_hp.mean_val:.1f} HP)   |   "
            f"Range: {pred.hearts['min']:.1f} – {pred.hearts['max']:.1f} Hearts   |   "
            f"Chance > Best Parent: {pred.health_hp.p_exceed_best_parent*100:.1f}%"
        )
        ctk.CTkLabel(row_h, text=h_info, font=FONT_BODY, text_color="#ECEFF4", anchor="w").pack(
            side="left", fill="x", expand=True
        )

        # 2. Coat Color & Markings Odds
        coat_card = ctk.CTkFrame(self.res_frame, fg_color=COLOR_CARD_BG, corner_radius=10)
        coat_card.pack(fill="x", padx=5, pady=10)

        ctk.CTkLabel(
            coat_card,
            text="Appearance Inheritance Probabilities",
            font=FONT_SUBTITLE,
            text_color=COLOR_GOLD,
            anchor="w",
        ).pack(fill="x", padx=15, pady=(12, 6))

        c_grid = ctk.CTkFrame(coat_card, fg_color="transparent")
        c_grid.pack(fill="x", padx=15, pady=(0, 12))

        # Colors column
        c_left = ctk.CTkFrame(c_grid, fg_color="#20232A", corner_radius=8)
        c_left.pack(side="left", expand=True, fill="both", padx=(0, 8), pady=4)
        ctk.CTkLabel(c_left, text="Coat Color Odds", font=FONT_BODY_BOLD).pack(anchor="w", padx=10, pady=(6, 4))
        for col_name, prob in sorted(pred.coat_probabilities.items(), key=lambda x: x[1], reverse=True):
            ctk.CTkLabel(
                c_left,
                text=f"• {col_name}: {prob*100:.1f}%",
                font=FONT_SMALL,
                text_color=COLOR_PRIMARY_GREEN if prob > 0.3 else COLOR_MUTED_GRAY,
            ).pack(anchor="w", padx=14, pady=1)

        # Patterns column
        c_right = ctk.CTkFrame(c_grid, fg_color="#20232A", corner_radius=8)
        c_right.pack(side="left", expand=True, fill="both", padx=(8, 0), pady=4)
        ctk.CTkLabel(c_right, text="Markings Odds", font=FONT_BODY_BOLD).pack(anchor="w", padx=10, pady=(6, 4))
        for pat_name, prob in sorted(pred.pattern_probabilities.items(), key=lambda x: x[1], reverse=True):
            ctk.CTkLabel(
                c_right,
                text=f"• {pat_name}: {prob*100:.1f}%",
                font=FONT_SMALL,
                text_color=COLOR_PRIMARY_GREEN if prob > 0.3 else COLOR_MUTED_GRAY,
            ).pack(anchor="w", padx=14, pady=1)

        # 3. Interactive Foal Roller
        sim_box = ctk.CTkFrame(self.res_frame, fg_color=COLOR_CARD_BG, corner_radius=10)
        sim_box.pack(fill="x", padx=5, pady=(0, 15))

        sim_head = ctk.CTkFrame(sim_box, fg_color="transparent")
        sim_head.pack(fill="x", padx=15, pady=12)

        ctk.CTkLabel(sim_head, text="Test Breed Trial", font=FONT_SUBTITLE, anchor="w").pack(side="left")

        lbl_sim_out = ctk.CTkLabel(sim_box, text="Click 'Simulate Breed' to test-roll a foal from these parents.", font=FONT_BODY, text_color=COLOR_MUTED_GRAY)
        lbl_sim_out.pack(fill="x", padx=15, pady=(0, 10))

        def roll():
            foal = simulate_foal_sample(h_a, h_b, version="1.20+")
            txt = (
                f"🎲 Foal Result: ❤️ {foal.hearts:.1f} Hearts ({foal.hp:.1f} HP)  |  "
                f"⚡ {foal.speed_bps:.2f} b/s ({foal.speed_100m_time:.1f}s / 100m)  |  "
                f"🦘 {foal.jump_height_blocks:.2f}m Jump\n"
                f"Appearance: {foal.coat_color} with {foal.coat_pattern}"
            )
            lbl_sim_out.configure(text=txt, text_color=COLOR_GOLD)

            if not hasattr(roll, "save_btn"):
                save_btn = ctk.CTkButton(
                    sim_head,
                    text="Save Foal to Stable",
                    font=FONT_SMALL,
                    fg_color=COLOR_PRIMARY_GREEN,
                    hover_color=COLOR_PRIMARY_HOVER,
                    command=lambda: [self.on_add_foal_to_stable(foal), save_btn.configure(state="disabled", text="Saved!")],
                )
                save_btn.pack(side="right")
                roll.save_btn = save_btn

        btn_roll = ctk.CTkButton(
            sim_head,
            text="Simulate Breed (1.20+)",
            font=FONT_BODY_BOLD,
            fg_color="#4C566A",
            hover_color="#5E81AC",
            command=roll,
        )
        btn_roll.pack(side="right", padx=(10, 0))
