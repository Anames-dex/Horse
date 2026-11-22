"""Horse Add / Edit Form Tab with real-time conversion previews."""

import customtkinter as ctk
from typing import Callable, Optional
from core.models import Horse, CoatColor, CoatPattern, Gender
from core.conversions import (
    hearts_to_hp,
    time_100m_to_bps,
    time_100m_to_speed_attr,
    jump_height_to_attr,
    MIN_HEALTH_HP,
    MAX_HEALTH_HP,
    MIN_SPEED_ATTR,
    MAX_SPEED_ATTR,
    MIN_JUMP_ATTR,
    MAX_JUMP_ATTR,
)
from ui.theme import (
    COLOR_PRIMARY_GREEN,
    COLOR_PRIMARY_HOVER,
    COLOR_HEALTH_RED,
    COLOR_SPEED_BLUE,
    COLOR_JUMP_ORANGE,
    COLOR_MUTED_GRAY,
    COLOR_CARD_BG,
    COLOR_GOLD,
    FONT_TITLE,
    FONT_SUBTITLE,
    FONT_BODY,
    FONT_BODY_BOLD,
    FONT_SMALL,
)


class HorseEditorTab(ctk.CTkScrollableFrame):
    def __init__(self, master, on_save_horse: Callable[[Horse], None], on_cancel_edit: Optional[Callable[[], None]] = None):
        super().__init__(master, fg_color="transparent")
        self.on_save_horse = on_save_horse
        self.on_cancel_edit = on_cancel_edit
        self.editing_horse_id: Optional[str] = None

        self._build_ui()

    def _build_ui(self):
        # Header
        self.lbl_title = ctk.CTkLabel(
            self,
            text="Add New Horse",
            font=FONT_TITLE,
            anchor="w",
            text_color=COLOR_PRIMARY_GREEN,
        )
        self.lbl_title.pack(fill="x", padx=10, pady=(10, 5))

        self.lbl_subtitle = ctk.CTkLabel(
            self,
            text="Enter stats measured in-game. Live conversions will preview blocks/sec and attributes.",
            font=FONT_SMALL,
            text_color=COLOR_MUTED_GRAY,
            anchor="w",
        )
        self.lbl_subtitle.pack(fill="x", padx=10, pady=(0, 15))

        # Main Card Container
        form_card = ctk.CTkFrame(self, fg_color=COLOR_CARD_BG, corner_radius=10)
        form_card.pack(fill="x", padx=10, pady=5)

        # 1. Horse Name
        ctk.CTkLabel(form_card, text="Horse Name / Identifier *", font=FONT_BODY_BOLD, anchor="w").pack(
            fill="x", padx=15, pady=(15, 2)
        )
        self.ent_name = ctk.CTkEntry(form_card, placeholder_text="e.g. Shadowfax, Stallion-1", height=35)
        self.ent_name.pack(fill="x", padx=15, pady=(0, 12))

        # 2. Hearts (Health)
        ctk.CTkLabel(
            form_card, text="Hearts (7.5 to 15.0 Hearts) *", font=FONT_BODY_BOLD, anchor="w", text_color=COLOR_HEALTH_RED
        ).pack(fill="x", padx=15, pady=(2, 2))
        
        row_hearts = ctk.CTkFrame(form_card, fg_color="transparent")
        row_hearts.pack(fill="x", padx=15, pady=(0, 12))

        self.ent_hearts = ctk.CTkEntry(row_hearts, placeholder_text="e.g. 11.5", width=120, height=35)
        self.ent_hearts.pack(side="left")
        self.ent_hearts.bind("<KeyRelease>", self._update_previews)

        self.lbl_hp_preview = ctk.CTkLabel(
            row_hearts, text="= 23.0 Health Points (HP)", font=FONT_BODY, text_color=COLOR_MUTED_GRAY
        )
        self.lbl_hp_preview.pack(side="left", padx=15)

        # 3. Speed (100 blocks in a set time)
        ctk.CTkLabel(
            form_card,
            text="Speed: Time to run 100 blocks (Seconds) *",
            font=FONT_BODY_BOLD,
            anchor="w",
            text_color=COLOR_SPEED_BLUE,
        ).pack(fill="x", padx=15, pady=(2, 2))

        row_speed = ctk.CTkFrame(form_card, fg_color="transparent")
        row_speed.pack(fill="x", padx=15, pady=(0, 12))

        self.ent_speed_time = ctk.CTkEntry(row_speed, placeholder_text="e.g. 8.5", width=120, height=35)
        self.ent_speed_time.pack(side="left")
        self.ent_speed_time.bind("<KeyRelease>", self._update_previews)

        self.lbl_speed_preview = ctk.CTkLabel(
            row_speed, text="= 11.76 blocks/sec (Attribute ~0.272)", font=FONT_BODY, text_color=COLOR_MUTED_GRAY
        )
        self.lbl_speed_preview.pack(side="left", padx=15)

        # 4. Jump Height (in blocks)
        ctk.CTkLabel(
            form_card,
            text="Jump Height (Blocks) *",
            font=FONT_BODY_BOLD,
            anchor="w",
            text_color=COLOR_JUMP_ORANGE,
        ).pack(fill="x", padx=15, pady=(2, 2))

        row_jump = ctk.CTkFrame(form_card, fg_color="transparent")
        row_jump.pack(fill="x", padx=15, pady=(0, 12))

        self.ent_jump_height = ctk.CTkEntry(row_jump, placeholder_text="e.g. 3.5", width=120, height=35)
        self.ent_jump_height.pack(side="left")
        self.ent_jump_height.bind("<KeyRelease>", self._update_previews)

        self.lbl_jump_preview = ctk.CTkLabel(
            row_jump, text="= Clears 3 blocks (Jump Strength ~0.82)", font=FONT_BODY, text_color=COLOR_MUTED_GRAY
        )
        self.lbl_jump_preview.pack(side="left", padx=15)

        # 5. Optional Visuals (Coat Color & Pattern)
        ctk.CTkLabel(form_card, text="Coat & Appearance (Optional)", font=FONT_SUBTITLE, anchor="w", text_color=COLOR_GOLD).pack(
            fill="x", padx=15, pady=(10, 4)
        )

        grid_appearance = ctk.CTkFrame(form_card, fg_color="transparent")
        grid_appearance.pack(fill="x", padx=15, pady=(0, 15))

        # Color
        ctk.CTkLabel(grid_appearance, text="Base Color:", font=FONT_BODY).grid(row=0, column=0, sticky="w", pady=4)
        self.opt_color = ctk.CTkOptionMenu(
            grid_appearance,
            values=[c.value for c in CoatColor],
            width=220,
            height=32,
        )
        self.opt_color.set(CoatColor.WHITE.value)
        self.opt_color.grid(row=0, column=1, padx=(10, 20), pady=4, sticky="w")

        # Pattern
        ctk.CTkLabel(grid_appearance, text="Markings:", font=FONT_BODY).grid(row=0, column=2, sticky="w", pady=4)
        self.opt_pattern = ctk.CTkOptionMenu(
            grid_appearance,
            values=[p.value for p in CoatPattern],
            width=240,
            height=32,
        )
        self.opt_pattern.set(CoatPattern.NONE.value)
        self.opt_pattern.grid(row=0, column=3, padx=(10, 0), pady=4, sticky="w")

        # Gender & Notes
        ctk.CTkLabel(grid_appearance, text="Gender Tag:", font=FONT_BODY).grid(row=1, column=0, sticky="w", pady=8)
        self.opt_gender = ctk.CTkOptionMenu(
            grid_appearance,
            values=[g.value for g in Gender],
            width=220,
            height=32,
        )
        self.opt_gender.set(Gender.ANY.value)
        self.opt_gender.grid(row=1, column=1, padx=(10, 20), pady=8, sticky="w")

        ctk.CTkLabel(grid_appearance, text="Notes:", font=FONT_BODY).grid(row=1, column=2, sticky="w", pady=8)
        self.ent_notes = ctk.CTkEntry(grid_appearance, placeholder_text="Stall location, lineage notes...", width=240, height=32)
        self.ent_notes.grid(row=1, column=3, padx=(10, 0), pady=8, sticky="w")

        # Feedback / Validation message label
        self.lbl_feedback = ctk.CTkLabel(form_card, text="", font=FONT_BODY_BOLD, text_color=COLOR_HEALTH_RED)
        self.lbl_feedback.pack(fill="x", padx=15, pady=(0, 8))

        # Button row
        btn_row = ctk.CTkFrame(form_card, fg_color="transparent")
        btn_row.pack(fill="x", padx=15, pady=(0, 20))

        self.btn_save = ctk.CTkButton(
            btn_row,
            text="Save Horse to Stable",
            font=FONT_BODY_BOLD,
            fg_color=COLOR_PRIMARY_GREEN,
            hover_color=COLOR_PRIMARY_HOVER,
            height=40,
            command=self._on_save_clicked,
        )
        self.btn_save.pack(side="left", padx=(0, 10))

        self.btn_clear = ctk.CTkButton(
            btn_row,
            text="Clear Form",
            font=FONT_BODY,
            fg_color="#4A5160",
            hover_color="#5D6677",
            height=40,
            command=self.clear_form,
        )
        self.btn_clear.pack(side="left")

        # In-game measurement guide panel
        guide_card = ctk.CTkFrame(self, fg_color="#1F232B", corner_radius=10)
        guide_card.pack(fill="x", padx=10, pady=(15, 20))

        ctk.CTkLabel(
            guide_card,
            text="In-Game Measurement Guide",
            font=FONT_SUBTITLE,
            anchor="w",
            text_color=COLOR_GOLD,
        ).pack(fill="x", padx=15, pady=(12, 4))

        guide_text = (
            "• Hearts: Count your horse's hearts while riding (each full heart = 1.0, half heart = 0.5. Range: 7.5 - 15.0 hearts).\n"
            "• Speed: Build a 100-block straight track (cobblestone or dirt) with pressure plates at start & finish. Time the sprint in seconds (e.g. 8.2s).\n"
            "• Jump: Stack blocks or fences (1 fence = 1.5 blocks). Test the highest hurdle your horse cleanly clears (Range: 1.0 - 5.25 blocks)."
        )
        ctk.CTkLabel(
            guide_card,
            text=guide_text,
            font=FONT_SMALL,
            justify="left",
            anchor="w",
            text_color=COLOR_MUTED_GRAY,
        ).pack(fill="x", padx=15, pady=(0, 12))

    def _update_previews(self, event=None):
        # Update HP
        try:
            h_text = self.ent_hearts.get().strip()
            if h_text:
                h = float(h_text)
                hp = hearts_to_hp(h)
                self.lbl_hp_preview.configure(
                    text=f"= {hp:.1f} Health Points (HP)",
                    text_color="#2ECC71" if 15.0 <= hp <= 30.0 else COLOR_HEALTH_RED,
                )
        except ValueError:
            self.lbl_hp_preview.configure(text="Invalid number", text_color=COLOR_HEALTH_RED)

        # Update Speed
        try:
            t_text = self.ent_speed_time.get().strip()
            if t_text:
                t = float(t_text)
                bps = time_100m_to_bps(t)
                attr = time_100m_to_speed_attr(t)
                self.lbl_speed_preview.configure(
                    text=f"= {bps:.2f} blocks/sec (Attribute ~{attr:.4f})",
                    text_color="#2ECC71" if MIN_SPEED_ATTR * 0.95 <= attr <= MAX_SPEED_ATTR * 1.05 else COLOR_MUTED_GRAY,
                )
        except ValueError:
            self.lbl_speed_preview.configure(text="Invalid number", text_color=COLOR_HEALTH_RED)

        # Update Jump
        try:
            j_text = self.ent_jump_height.get().strip()
            if j_text:
                j = float(j_text)
                attr = jump_height_to_attr(j)
                self.lbl_jump_preview.configure(
                    text=f"= Clears {j:.2f} blocks (Jump Strength ~{attr:.4f})",
                    text_color="#2ECC71" if 1.0 <= j <= 5.3 else COLOR_MUTED_GRAY,
                )
        except ValueError:
            self.lbl_jump_preview.configure(text="Invalid number", text_color=COLOR_HEALTH_RED)

    def load_horse_for_edit(self, horse: Horse):
        """Populates the form with existing horse data for editing."""
        self.editing_horse_id = horse.id
        self.lbl_title.configure(text=f"Edit Horse: {horse.name}")
        self.btn_save.configure(text="Update Horse")

        self.ent_name.delete(0, "end")
        self.ent_name.insert(0, horse.name)

        self.ent_hearts.delete(0, "end")
        self.ent_hearts.insert(0, str(horse.hearts))

        self.ent_speed_time.delete(0, "end")
        self.ent_speed_time.insert(0, str(horse.speed_100m_time))

        self.ent_jump_height.delete(0, "end")
        self.ent_jump_height.insert(0, str(horse.jump_height_blocks))

        if horse.coat_color:
            self.opt_color.set(horse.coat_color)
        if horse.coat_pattern:
            self.opt_pattern.set(horse.coat_pattern)
        if horse.gender:
            self.opt_gender.set(horse.gender)

        self.ent_notes.delete(0, "end")
        self.ent_notes.insert(0, horse.notes or "")

        self._update_previews()
        self.lbl_feedback.configure(text="")

    def clear_form(self):
        self.editing_horse_id = None
        self.lbl_title.configure(text="Add New Horse")
        self.btn_save.configure(text="Save Horse to Stable")

        self.ent_name.delete(0, "end")
        self.ent_hearts.delete(0, "end")
        self.ent_speed_time.delete(0, "end")
        self.ent_jump_height.delete(0, "end")
        self.ent_notes.delete(0, "end")

        self.opt_color.set(CoatColor.WHITE.value)
        self.opt_pattern.set(CoatPattern.NONE.value)
        self.opt_gender.set(Gender.ANY.value)

        self.lbl_hp_preview.configure(text="= Health Points (HP)", text_color=COLOR_MUTED_GRAY)
        self.lbl_speed_preview.configure(text="= blocks/sec (Attribute)", text_color=COLOR_MUTED_GRAY)
        self.lbl_jump_preview.configure(text="= Jump Strength", text_color=COLOR_MUTED_GRAY)
        self.lbl_feedback.configure(text="")

        if self.on_cancel_edit:
            self.on_cancel_edit()

    def _on_save_clicked(self):
        name = self.ent_name.get().strip() or "Unnamed Horse"

        try:
            hearts = float(self.ent_hearts.get().strip())
        except ValueError:
            self.lbl_feedback.configure(text="Please enter a valid number for Hearts (e.g. 7.5 to 15.0)")
            return

        try:
            speed_time = float(self.ent_speed_time.get().strip())
            if speed_time <= 0:
                raise ValueError
        except ValueError:
            self.lbl_feedback.configure(text="Please enter a positive time in seconds for the 100-block run (e.g. 8.5)")
            return

        try:
            jump_h = float(self.ent_jump_height.get().strip())
            if jump_h <= 0:
                raise ValueError
        except ValueError:
            self.lbl_feedback.configure(text="Please enter a positive number for Jump Height in blocks (e.g. 3.2)")
            return

        horse = Horse(
            id=self.editing_horse_id or Horse().id,
            name=name,
            hearts=round(hearts, 2),
            speed_100m_time=round(speed_time, 2),
            jump_height_blocks=round(jump_h, 2),
            coat_color=self.opt_color.get(),
            coat_pattern=self.opt_pattern.get(),
            gender=self.opt_gender.get(),
            notes=self.ent_notes.get().strip(),
        )

        self.on_save_horse(horse)
        self.clear_form()
        self.lbl_feedback.configure(text=f"Saved '{horse.name}' to stable!", text_color=COLOR_PRIMARY_GREEN)
