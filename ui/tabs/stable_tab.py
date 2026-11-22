"""Stable Roster Tab: Displays, filters, sorts, and manages all horses."""

import customtkinter as ctk
from typing import List, Callable, Optional
from core.models import Horse
from ui.theme import (
    COLOR_CARD_BG,
    COLOR_CARD_HOVER,
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


class StableRosterTab(ctk.CTkFrame):
    def __init__(
        self,
        master,
        get_horses: Callable[[], List[Horse]],
        on_edit_horse: Callable[[Horse], None],
        on_delete_horse: Callable[[Horse], None],
        on_select_for_breeding: Callable[[Horse], None],
        on_export_data: Callable[[], None],
        on_import_data: Callable[[], None],
    ):
        super().__init__(master, fg_color="transparent")
        self.get_horses = get_horses
        self.on_edit_horse = on_edit_horse
        self.on_delete_horse = on_delete_horse
        self.on_select_for_breeding = on_select_for_breeding
        self.on_export_data = on_export_data
        self.on_import_data = on_import_data

        self._build_ui()

    def _build_ui(self):
        # Top toolbar
        toolbar = ctk.CTkFrame(self, fg_color="transparent")
        toolbar.pack(fill="x", padx=10, pady=(10, 8))

        # Search bar
        self.ent_search = ctk.CTkEntry(
            toolbar,
            placeholder_text="Search horses by name, coat, notes...",
            width=280,
            height=34,
        )
        self.ent_search.pack(side="left", padx=(0, 10))
        self.ent_search.bind("<KeyRelease>", lambda e: self.refresh())

        # Sort Dropdown
        ctk.CTkLabel(toolbar, text="Sort by:", font=FONT_BODY, text_color=COLOR_MUTED_GRAY).pack(side="left", padx=(5, 5))
        self.opt_sort = ctk.CTkOptionMenu(
            toolbar,
            values=[
                "Overall Rating",
                "Fastest Speed (b/s)",
                "Highest Jump (Blocks)",
                "Max Health (Hearts)",
                "Name (A-Z)",
            ],
            width=180,
            height=34,
            command=lambda v: self.refresh(),
        )
        self.opt_sort.set("Overall Rating")
        self.opt_sort.pack(side="left", padx=(0, 15))

        # Export & Import Buttons
        btn_export = ctk.CTkButton(
            toolbar,
            text="Export JSON",
            font=FONT_SMALL,
            width=90,
            height=34,
            fg_color="#3B4252",
            hover_color="#4C566A",
            command=self.on_export_data,
        )
        btn_export.pack(side="right", padx=(5, 0))

        btn_import = ctk.CTkButton(
            toolbar,
            text="Import JSON",
            font=FONT_SMALL,
            width=90,
            height=34,
            fg_color="#3B4252",
            hover_color="#4C566A",
            command=self.on_import_data,
        )
        btn_import.pack(side="right", padx=(5, 0))

        # Stable Stats Summary Banner
        self.summary_banner = ctk.CTkFrame(self, fg_color=COLOR_CARD_BG, corner_radius=8, height=45)
        self.summary_banner.pack(fill="x", padx=10, pady=(0, 8))
        self.lbl_summary = ctk.CTkLabel(
            self.summary_banner,
            text="Total Horses: 0 | Fastest: 0.0 b/s | Best Jump: 0.0m",
            font=FONT_BODY_BOLD,
            text_color=COLOR_GOLD,
        )
        self.lbl_summary.pack(pady=10)

        # Scrollable container for horse cards
        self.cards_scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.cards_scroll.pack(fill="both", expand=True, padx=5, pady=5)

    def refresh(self):
        # Clear existing cards
        for widget in self.cards_scroll.winfo_children():
            widget.destroy()

        horses = self.get_horses()

        if not horses:
            lbl_empty = ctk.CTkLabel(
                self.cards_scroll,
                text="No horses in stable. Click 'Add Horse' tab to register your first horse!",
                font=FONT_BODY,
                text_color=COLOR_MUTED_GRAY,
            )
            lbl_empty.pack(pady=40)
            self.lbl_summary.configure(text="Total Horses: 0")
            return

        # Update Summary Banner
        fastest_h = max(horses, key=lambda h: h.speed_bps)
        jumper_h = max(horses, key=lambda h: h.jump_height_blocks)
        tank_h = max(horses, key=lambda h: h.hearts)
        self.lbl_summary.configure(
            text=(
                f"Stable Size: {len(horses)} Horses   •   "
                f"⚡ Fastest: {fastest_h.name} ({fastest_h.speed_bps:.2f} b/s)   •   "
                f"🦘 Best Jump: {jumper_h.name} ({jumper_h.jump_height_blocks:.2f}m)   •   "
                f"❤️ Tank: {tank_h.name} ({tank_h.hearts:.1f} hearts)"
            )
        )

        # Filter by search
        search_query = self.ent_search.get().strip().lower()
        filtered = [
            h
            for h in horses
            if (
                search_query in h.name.lower()
                or (h.coat_color and search_query in h.coat_color.lower())
                or (h.coat_pattern and search_query in h.coat_pattern.lower())
                or (h.notes and search_query in h.notes.lower())
            )
        ]

        # Sort
        sort_choice = self.opt_sort.get()
        if sort_choice == "Overall Rating":
            filtered.sort(key=lambda h: h.overall_rating, reverse=True)
        elif sort_choice == "Fastest Speed (b/s)":
            filtered.sort(key=lambda h: h.speed_bps, reverse=True)
        elif sort_choice == "Highest Jump (Blocks)":
            filtered.sort(key=lambda h: h.jump_height_blocks, reverse=True)
        elif sort_choice == "Max Health (Hearts)":
            filtered.sort(key=lambda h: h.hearts, reverse=True)
        elif sort_choice == "Name (A-Z)":
            filtered.sort(key=lambda h: h.name.lower())

        # Render cards
        for horse in filtered:
            self._render_horse_card(horse)

    def _render_horse_card(self, horse: Horse):
        card = ctk.CTkFrame(self.cards_scroll, fg_color=COLOR_CARD_BG, corner_radius=10)
        card.pack(fill="x", pady=6, padx=5)

        # Header: Name, gender, rating
        top_row = ctk.CTkFrame(card, fg_color="transparent")
        top_row.pack(fill="x", padx=12, pady=(10, 4))

        # Horse name & appearance tag
        coat_str = f"{horse.coat_color or 'Unknown'} • {horse.coat_pattern or 'None'}"
        if horse.gender and horse.gender != "Any / Unspecified":
            coat_str += f" ({horse.gender})"

        ctk.CTkLabel(top_row, text=horse.name, font=FONT_TITLE, anchor="w").pack(side="left")
        ctk.CTkLabel(top_row, text=f" [{coat_str}]", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY, anchor="w").pack(
            side="left", padx=8
        )

        # Rating Badge
        rating_color = (
            "#2ECC71"
            if horse.overall_rating >= 75
            else ("#F39C12" if horse.overall_rating >= 50 else COLOR_MUTED_GRAY)
        )
        ctk.CTkLabel(
            top_row,
            text=f"Rating: {horse.overall_rating}%",
            font=FONT_STAT_VALUE,
            text_color=rating_color,
        ).pack(side="right")

        # Stats Row (3 Columns: Health, Speed, Jump)
        stats_row = ctk.CTkFrame(card, fg_color="#20232A", corner_radius=6)
        stats_row.pack(fill="x", padx=12, pady=6)

        # Health
        f_h = ctk.CTkFrame(stats_row, fg_color="transparent")
        f_h.pack(side="left", expand=True, fill="both", padx=8, pady=6)
        ctk.CTkLabel(f_h, text="Health", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            f_h,
            text=f"❤️ {horse.hearts:.1f} Hearts ({horse.hp:.1f} HP)",
            font=FONT_BODY_BOLD,
            text_color=COLOR_HEALTH_RED,
        ).pack()

        # Speed
        f_s = ctk.CTkFrame(stats_row, fg_color="transparent")
        f_s.pack(side="left", expand=True, fill="both", padx=8, pady=6)
        ctk.CTkLabel(f_s, text="Speed", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            f_s,
            text=f"⚡ {horse.speed_bps:.2f} b/s ({horse.speed_100m_time:.1f}s / 100m)",
            font=FONT_BODY_BOLD,
            text_color=COLOR_SPEED_BLUE,
        ).pack()

        # Jump
        f_j = ctk.CTkFrame(stats_row, fg_color="transparent")
        f_j.pack(side="left", expand=True, fill="both", padx=8, pady=6)
        ctk.CTkLabel(f_j, text="Jump Height", font=FONT_SMALL, text_color=COLOR_MUTED_GRAY).pack()
        ctk.CTkLabel(
            f_j,
            text=f"🦘 {horse.jump_height_blocks:.2f} Blocks",
            font=FONT_BODY_BOLD,
            text_color=COLOR_JUMP_ORANGE,
        ).pack()

        # Notes if any
        if horse.notes:
            ctk.CTkLabel(
                card,
                text=f"Notes: {horse.notes}",
                font=FONT_SMALL,
                text_color=COLOR_MUTED_GRAY,
                anchor="w",
            ).pack(fill="x", padx=14, pady=(0, 4))

        # Bottom Actions row
        act_row = ctk.CTkFrame(card, fg_color="transparent")
        act_row.pack(fill="x", padx=12, pady=(4, 10))

        btn_breed = ctk.CTkButton(
            act_row,
            text="Breed Match",
            font=FONT_SMALL,
            width=100,
            height=28,
            fg_color=COLOR_PRIMARY_GREEN,
            hover_color=COLOR_PRIMARY_HOVER,
            command=lambda h=horse: self.on_select_for_breeding(h),
        )
        btn_breed.pack(side="left", padx=(0, 8))

        btn_edit = ctk.CTkButton(
            act_row,
            text="Edit",
            font=FONT_SMALL,
            width=70,
            height=28,
            fg_color="#4C566A",
            hover_color="#5E81AC",
            command=lambda h=horse: self.on_edit_horse(h),
        )
        btn_edit.pack(side="left", padx=(0, 8))

        btn_del = ctk.CTkButton(
            act_row,
            text="Delete",
            font=FONT_SMALL,
            width=70,
            height=28,
            fg_color="#BF616A",
            hover_color="#D08770",
            command=lambda h=horse: self.on_delete_horse(horse),
        )
        btn_del.pack(side="right")
