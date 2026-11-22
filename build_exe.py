"""Build script to compile the Minecraft Horse Breeding Companion into a standalone Windows .exe."""

import os
import sys
import subprocess
import shutil

APP_NAME = "HorseBreeder"
MAIN_SCRIPT = "main.py"


def build():
    print(f"[*] Starting PyInstaller build for {APP_NAME}...")

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",  # Produce a single standalone .exe
        "--windowed",  # No console window
        f"--name={APP_NAME}",
        "--collect-all",
        "customtkinter",
        "--clean",
        MAIN_SCRIPT,
    ]

    print(f"[*] Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd)

    if result.returncode == 0:
        print(f"\n[+] Successfully built {APP_NAME}!")
        dist_path = os.path.abspath(os.path.join("dist", APP_NAME, f"{APP_NAME}.exe"))
        print(f"[+] Executable location: {dist_path}")
    else:
        print(f"\n[-] Build failed with exit code {result.returncode}")
        sys.exit(result.returncode)


if __name__ == "__main__":
    build()
