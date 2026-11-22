"""Main Application Window for Minecraft Horse Breeding Companion."""

import customtkinter as ctk
import tkinter.filedialog as filedialog
import tkinter.messagebox as messagebox
from typing import List

from core.models import Horse
from core.storage import HorseStorage
from ui.tabs.stable_tab import StableRosterTab
from ui.tabs.editor_tab import HorseEditorTab
from ui.tabs.optimizer_tab import OptimizerTab
from ui.tabs.simulator_tab import SimulatorTab
from ui.theme import (
    COLOR_BG_DARK,
    COLOR_PRIMARY_GREEN,
    COLOR_PRIMARY_HOVER,
    FONT_TITLE,
)


class HorseBreederApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Appearance
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        self.title("Minecraft Horse Breeding Engine")
        self.geometry("1100x750")
        self.minsize(850, 600)

        # Storage
        self.storage = HorseStorage()
        self.horses: List[Horse] = self.storage.load()

        self._build_layout()

    def _build_layout(self):
        # Main Tabview
        self.tabview = ctk.CTkTabview(
            self,
            segmented_button_selected_color=COLOR_PRIMARY_GREEN,
            segmented_button_selected_hover_color=COLOR_PRIMARY_HOVER,
        )
        self.tabview.pack(fill="both", expand=True, padx=12, pady=10)

        # Add tabs
        self.tab_optimizer = self.tabview.add("Breeding Engine")
        self.tab_stable = self.tabview.add("Stable Roster")
        self.tab_editor = self.tabview.add("Add / Edit Horse")
        self.tab_simulator = self.tabview.add("Breeding Lab")

        # 1. Optimizer View (Breeding Engine)
        self.view_optimizer = OptimizerTab(
            self.tab_optimizer,
            get_horses=lambda: self.horses,
            on_add_foal_to_stable=self.on_add_foal_from_sim,
        )
        self.view_optimizer.pack(fill="both", expand=True)

        # 2. Stable Roster View
        self.view_stable = StableRosterTab(
            self.tab_stable,
            get_horses=lambda: self.horses,
            on_edit_horse=self.on_edit_horse_requested,
            on_delete_horse=self.on_delete_horse_requested,
            on_select_for_breeding=self.on_breed_match_requested,
            on_export_data=self.on_export_requested,
            on_import_data=self.on_import_requested,
        )
        self.view_stable.pack(fill="both", expand=True)

        # 3. Add / Edit Horse View
        self.view_editor = HorseEditorTab(
            self.tab_editor,
            on_save_horse=self.on_save_horse,
            on_cancel_edit=self.on_cancel_edit,
        )
        self.view_editor.pack(fill="both", expand=True)

        # 4. 1-on-1 Simulator View
        self.view_simulator = SimulatorTab(
            self.tab_simulator,
            get_horses=lambda: self.horses,
            on_add_foal_to_stable=self.on_add_foal_from_sim,
        )
        self.view_simulator.pack(fill="both", expand=True)

        # Listen for tab changes
        self.tabview.configure(command=self._on_tab_changed)

        # Initial refresh
        self.refresh_all_views()

    def _on_tab_changed(self):
        curr_tab = self.tabview.get()
        if curr_tab == "Breeding Engine":
            self.view_optimizer.refresh()
        elif curr_tab == "Stable Roster":
            self.view_stable.refresh()
        elif curr_tab == "Breeding Lab":
            self.view_simulator.populate_dropdowns()

    def refresh_all_views(self):
        self.view_optimizer.refresh()
        self.view_stable.refresh()
        self.view_simulator.populate_dropdowns()

    def on_save_horse(self, horse: Horse):
        """Called when a horse is saved from the Editor Tab."""
        existing_idx = next((i for i, h in enumerate(self.horses) if h.id == horse.id), None)
        if existing_idx is not None:
            self.horses[existing_idx] = horse
        else:
            self.horses.append(horse)

        self.storage.save(self.horses)
        self.refresh_all_views()

    def on_cancel_edit(self):
        pass

    def on_edit_horse_requested(self, horse: Horse):
        self.tabview.set("Add / Edit Horse")
        self.view_editor.load_horse_for_edit(horse)

    def on_delete_horse_requested(self, horse: Horse):
        if messagebox.askyesno("Delete Horse", f"Are you sure you want to delete '{horse.name}' from your stable?"):
            self.horses = [h for h in self.horses if h.id != horse.id]
            self.storage.save(self.horses)
            self.refresh_all_views()

    def on_breed_match_requested(self, horse: Horse):
        self.tabview.set("Breeding Lab")
        self.view_simulator.populate_dropdowns(select_horse_a=horse)

    def on_add_foal_from_sim(self, foal: Horse):
        self.horses.append(foal)
        self.storage.save(self.horses)
        self.refresh_all_views()
        messagebox.showinfo("Foal Saved", f"'{foal.name}' has been added to your Stable Roster!")

    def on_export_requested(self):
        path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json")],
            initialfile="my_horses.json",
            title="Export Stable Data",
        )
        if path:
            if self.storage.export_json(path, self.horses):
                messagebox.showinfo("Export Successful", f"Saved {len(self.horses)} horses to:\n{path}")
            else:
                messagebox.showerror("Export Failed", "Could not export horse data to file.")

    def on_import_requested(self):
        path = filedialog.askopenfilename(
            filetypes=[("JSON files", "*.json")],
            title="Import Stable Data",
        )
        if path:
            try:
                imported = self.storage.import_json(path)
                if messagebox.askyesno(
                    "Import Stable",
                    f"Found {len(imported)} horses in file. Replace current stable or merge?\n\nYes = Merge with existing\nNo = Replace current stable",
                ):
                    self.horses.extend(imported)
                else:
                    self.horses = imported
                self.storage.save(self.horses)
                self.refresh_all_views()
                messagebox.showinfo("Import Complete", f"Stable updated! Total horses: {len(self.horses)}")
            except Exception as e:
                messagebox.showerror("Import Error", f"Failed to import file:\n{str(e)}")
