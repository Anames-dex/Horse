# Horse

A pedigree visualizer and selective breeding optimization engine for Minecraft horses. Built with React, TypeScript, Tailwind CSS, and React Flow.

---

## Overview

Minecraft 1.20 introduced a bell-curve spread mechanic for horse breeding, replacing flat parental averaging with a dynamic variance formula. Because offspring can inherit attributes matching or exceeding parental ceilings, optimal progression requires strategic pairings across foundation stock and previous generations.

Horse models the complete lineage tree of your stable on an interactive canvas and calculates the single optimal pairing to breed next to reach the theoretical game maximums.

---

## Features

- Interactive Pedigree Graph: Full-screen directed acyclic graph mapping lineage across generations with pan, zoom, and minimap controls.
- Dynamic Cross-Generational Matchmaker: Evaluates all living horses across all generations (foundation crosses, backcrosses, sibling crosses) and outputs strictly the single best pairing.
- Real In-Game Asset Visuals: Renders coat colors using offline Minecraft horse textures.
- Measurable Survival Inputs: Input sprint times over a 100-block runway, hurdle clearance in blocks, and visible heart counts.
- Client-Side Persistence: Zero external database requirement. Stored in local storage with JSON import and export options.
- No Hardcoded Stock: Clean slate design where every horse is registered by the player.

---

## Mathematical Specification

### Inheritance Formula (1.20+)

For an attribute $X$ bounded by $[\text{Min}, \text{Max}]$:

$$\text{Midpoint} = \frac{P_A + P_B}{2}$$

$$\text{Spread} = |P_A - P_B| + 0.3 \times (\text{Max} - \text{Min})$$

$$\text{Roll} = \left(\frac{U_1 + U_2 + U_3}{3}\right) - 0.5, \quad U_i \sim \text{Uniform}(0, 1)$$

$$\text{Value} = \text{clamp}(\text{Midpoint} + \text{Spread} \times \text{Roll}, \text{Min}, \text{Max})$$

Probabilities of surpassing parental thresholds are computed analytically via the closed-form Irwin-Hall ($n=3$) cumulative distribution function.

### Jump Trajectory Inversion

In-game jump clearance $y$ (in blocks) is mapped to internal attribute $x \in [0.4, 1.0]$ using trajectory bisection over the game's polynomial:

$$y(x) = -0.1817584952 x^3 + 3.689713992 x^2 + 2.128599134 x - 0.343930367$$

### Ultimate Target Benchmark

- Health: 15.0 Hearts (30.0 HP)
- Speed: 14.57 blocks/second (0.3375 movement speed attribute)
- Jump Height: 5.25 blocks clearance (1.0 jump strength attribute)

---

## In-Game Measurement Setup

1. Speed: Construct a 100-block straight track with pressure plates or a stopwatch. Record elapsed sprint time in seconds (natural range: 6.86s to 20.6s).
2. Jump Height: Stack fences or blocks (1 fence = 1.5 blocks, 2 blocks = 2.0 blocks, 2 fences = 3.0 blocks, 3 fences = 4.5 blocks). Enter highest cleanly cleared hurdle.
3. Health: Count hearts displayed on the HUD when mounted (range: 7.5 to 15.0 hearts).

---

## Project Structure

```text
Horse/
├── src/
│   ├── components/
│   │   ├── tree/               # React Flow pedigree nodes and tree canvas
│   │   ├── stable/             # Horse card components
│   │   ├── forms/              # Registration modal with live unit converters
│   │   └── recommendations/    # Optimal pair spotlight and breeding action
│   ├── engine/
│   │   ├── conversions.ts      # Speed, jump, and health transformations
│   │   ├── genetics.ts         # 1.20+ formula and Irwin-Hall probability CDF
│   │   ├── optimizer.ts        # Cross-generational pairing selector
│   │   ├── horseImages.ts      # Offline texture mapping helper
│   │   ├── engine.test.ts      # Vitest test suite
│   │   └── types.ts            # Type definitions and benchmark constants
│   ├── store/
│   │   └── useHorseStore.ts    # Local storage persistence
│   ├── App.tsx                 # View layout
│   └── main.tsx                # Client root
├── public/horses/              # Offline coat textures
├── electron/
│   └── main.cjs                # Desktop wrapper
└── horse.exe                   # Standalone desktop executable
```

---

## Development and Build Commands

### Install Dependencies
```bash
npm install
```

### Run Web Development Server
```bash
npm run dev
```

### Execute Test Suite
```bash
npm run test
```

### Compile Production Web Build
```bash
npm run build
```

### Launch Desktop Application
```bash
npm run desktop
```

### Package Standalone Executable
```bash
npm run package:exe
```

---

## Contributing

Review [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, testing requirements, and branch workflows.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
