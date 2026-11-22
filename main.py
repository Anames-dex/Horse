"""Entry point for Minecraft Horse Breeding Companion."""

import sys
import os

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ui.app import HorseBreederApp


def main():
    app = HorseBreederApp()
    app.mainloop()


if __name__ == "__main__":
    main()
