# Minecraft Horse Breeding Engine & Stable Companion 🐎

A lightweight, standalone desktop application to help Minecraft players measure, track, and breed the ultimate "God-Horse".

Built specifically around Minecraft's breeding genetics (featuring full support for **Minecraft 1.20+ Trails & Tales overhaul** and legacy mechanics).

---

## 🌟 Key Features

1. **Breeding Engine Matchmaker ("Tinder for Horses")**:
   - Analyzes your entire stable and tests every candidate pair in milliseconds.
   - Tailored optimization objectives:
     - **Balanced (God-Horse)**: High ratings across health, speed, and jump.
     - **Maximum Speed (Sprinter)**: Recommends pairs with highest expected velocity and upside potential.
     - **Maximum Jump (High-Flier)**: Focuses on clearing maximum block heights (up to 5.25 blocks).
     - **Maximum Health (Tank)**: Targets maximum heart capacity (up to 15 hearts / 30 HP).
     - **Mobility (Speed + Jump)**: Optimized for exploration mounts.
   - Displays exact upside probability: see the exact percentage chance a foal will surpass both parents!

2. **In-Game Friendly Measurements**:
   - **Speedometer**: Measure the time in seconds your horse takes to sprint 100 blocks (e.g. 8.2s). The app instantly converts this into blocks/second and internal movement speed attributes.
   - **Jump Hurdle Gauge**: Enter the height in blocks your horse clears (e.g. 3.5 blocks), with automatic conversion to internal jump strength.
   - **Health**: Enter hearts directly (7.5 to 15.0 hearts, with half-heart support).

3. **Stable Roster Management**:
   - Save as many horses as you want with custom names, gender tags, coat colors, markings, and notes.
   - Filter by name/coat/notes or sort by speed, jump, health, or overall rating.
   - Instant JSON Export & Import to backup or share stables with server friends.

4. **Breeding Lab (1-on-1 Simulator)**:
   - Select any two parents to view side-by-side genetic forecasts, quantiles, and coat appearance odds.
   - Interactive Foal Roller: Test-breed foals and adopt favorites directly into your stable.

5. **Ultra-Lightweight & Fast**:
   - Standalone Windows `.exe` with zero heavy browser engines (uses ~35MB RAM).
   - Analytical closed-form statistical engine (no slow laggy calculations).

---

## 📐 In-Game Measurement Setup

### 1. Speed (100-Block Sprint Track)
1. In Minecraft, build a straight, flat 100-block runway (dirt, stone, or packed ice).
2. Place a pressure plate at block 0 and block 100, or use a stopwatch.
3. Ride your horse at full speed from start to finish and note the time in seconds (e.g., `8.2` seconds).
4. Enter the seconds into the app!

*Speed reference:*
- **Slow Wild Horse**: ~20.6s for 100 blocks (4.86 b/s)
- **Average Wild Horse**: ~10.3s for 100 blocks (9.7 b/s)
- **Fastest Natural Wild Horse**: ~6.86s for 100 blocks (14.57 b/s)

### 2. Jump Height (Hurdle Wall)
1. Build test hurdles out of blocks or fences:
   - 1 block = 1.0m
   - 1 fence = 1.5m
   - 2 blocks = 2.0m
   - 2 fences = 3.0m
   - 3 fences = 4.5m
2. Jump your horse at maximum charge over each hurdle.
3. Enter the highest cleanly cleared height into the app (e.g. `3.5` blocks).

### 3. Hearts (Health)
- Mount your horse and count the hearts shown in your HUD above your hotbar:
- 1 full heart = `1.0`
- 1 half heart = `0.5`
- Natural range: `7.5` to `15.0` hearts.

---

## 🧬 Understanding 1.20+ Genetics

In Minecraft 1.20+, horse stats are calculated as:
$$\text{Midpoint} = \frac{\text{Parent}_A + \text{Parent}_B}{2}$$
$$\text{Spread} = |\text{Parent}_A - \text{Parent}_B| + 0.3 \times \text{Range}$$
$$\text{Roll} = \left(\frac{U_1 + U_2 + U_3}{3}\right) - 0.5$$
$$\text{Foal Value} = \text{clamp}(\text{Midpoint} + \text{Spread} \times \text{Roll}, \text{Min}, \text{Max})$$

*Key Strategy*: Because the spread scales with $|\text{Parent}_A - \text{Parent}_B|$, breeding two horses with complementary strengths (e.g., one super-fast and one super-high jumper) increases the spread variance, unlocking high upside rolls that can break personal records and wild caps!

---

## 🚀 Running the Application

### Option A: Standalone Windows .exe
Run `dist/HorseBreeder.exe` directly. No Python installation required!

### Option B: Running from Source
```powershell
# Clone repo
git clone https://github.com/Anames-dex/Horse.git
cd Horse

# Install dependencies
pip install -r requirements.txt

# Launch app
python main.py
```

### Option C: Build the .exe Yourself
```powershell
python build_exe.py
```

---

## 📂 Project Architecture

```
Horse/
├── core/
│   ├── conversions.py    # Unit converters (hearts, 100m time, jump height, NBT attributes)
│   ├── models.py         # Horse dataclass, coat color & pattern enums
│   ├── genetics.py       # 1.20+ and legacy breeding formulas, probability distribution
│   ├── optimizer.py      # Analytical breeding pair matchmaker & ranking engine
│   └── storage.py        # JSON persistence, sample data, import/export
├── ui/
│   ├── theme.py          # Colors, fonts, and dark theme constants
│   ├── app.py            # Main application window & tab controller
│   └── tabs/
│       ├── optimizer_tab.py  # Breeding engine UI with recommendations
│       ├── stable_tab.py     # Stable roster, search, sorting & cards
│       ├── editor_tab.py     # Add/edit form with real-time conversion previews
│       └── simulator_tab.py  # 1-on-1 breeding lab & appearance inheritance odds
├── tests/                # Automated pytest suite
├── main.py               # Entry point
├── build_exe.py          # PyInstaller packaging script
└── requirements.txt      # Dependency specification
```
