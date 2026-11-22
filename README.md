# Equine Pedigree Engine

An interactive pedigree visualizer, lineage tracker, and selective breeding optimization engine for Minecraft horses. Built with React, TypeScript, Tailwind CSS, and directed graph visualization to model genetic inheritance and determine the optimal generational pairings required to produce a theoretically maxed horse.

---

## Overview

In Minecraft 1.20+, horse breeding mechanics were revised to replace flat averaging with a dynamic spread distribution centered around parental attributes. While this revision enabled progressive multi-generational breeding, identifying optimal pairings across foundation stock, descendants, and cross-generational backcrosses remains computationally complex.

Equine Pedigree Engine resolves this by maintaining a complete genealogical graph of your stable and computing the exact statistical distance between candidate foal outcomes and the theoretical game-engine ceiling.

The engine evaluates all candidate combinations across all available generations and presents strictly the single optimal pairing to breed next.

---

## Core Capabilities

### 1. Interactive Pedigree Tree (Directed Acyclic Graph)
- Real-time rendering of breeding lineage across Generation 0 (foundation stock), Generation 1, and subsequent descendants.
- Parentage relationship mapping with directional connections from Sire and Dam to offspring.
- Dynamic layout engine grouping nodes by generational depth with zoom, pan, and minimap navigation.
- Visual highlighting of the active optimal breeding pair directly on the graph canvas.

### 2. Cross-Generational Optimization Engine
- Analyzes all candidate pairs within the stable across all generations, including:
  - Foundation crosses (Gen 0 x Gen 0)
  - Direct backcrosses (Parent x Offspring)
  - Grandparent backcrosses (Grandparent x Offspring)
  - Sibling and half-sibling crosses
  - Inter-lineage multi-generational crosses
- Evaluates candidate pairs against the theoretical maximum ceiling:
  - Health: 15.0 Hearts (30.0 HP)
  - Speed: 14.57 blocks/second (0.3375 internal movement speed attribute)
  - Jump Height: 5.25 blocks clearance (1.0 internal jump strength attribute)
- Ranks candidates by Euclidean distance reduction to the ultimate goal, supplemented by the 1.20+ spread upside factor.
- Outputs exclusively the single optimal pairing with detailed expected value forecasts and win probabilities.

### 3. Practical In-Game Measurement Inputs
- Movement Speed: Input measured sprint time in seconds across a standard 100-block flat track. The engine automatically calculates blocks per second and internal attribute values.
- Jump Height: Input maximum cleanly cleared obstacle height in blocks. Inverted via trajectory polynomial bisection into the internal jump strength attribute.
- Health: Input observed hearts directly (7.5 to 15.0 hearts, supporting half-heart increments).

### 4. Dynamic Data Persistence
- Client-side storage via local storage with JSON export and import capabilities.
- Dynamic data modeling with zero hardcoded stable entities.

---

## Mathematical Formulation

### 1. Genetic Roll Mechanics (Minecraft 1.20+)

For any given attribute $X$ with legal domain $[\text{Min}, \text{Max}]$:

$$\text{Midpoint} = \frac{P_A + P_B}{2}$$

$$\text{Spread} = |P_A - P_B| + 0.3 \times (\text{Max} - \text{Min})$$

$$\text{Roll} = \left(\frac{U_1 + U_2 + U_3}{3}\right) - 0.5, \quad U_i \sim \text{Uniform}(0, 1)$$

$$\text{Foal Attribute} = \text{clamp}(\text{Midpoint} + \text{Spread} \times \text{Roll}, \text{Min}, \text{Max})$$

Because $\text{Roll}$ follows an Irwin-Hall distribution with $n=3$ shifted by $-0.5$, cumulative distribution probabilities ($P(\text{Foal} \ge T)$) are computed in closed form using the piecewise cubic spline CDF, providing exact probabilities without Monte Carlo noise.

### 2. Jump Height Trajectory Inversion

Jump height $y$ (in blocks) is mapped to internal attribute $x \in [0.4, 1.0]$ via the trajectory polynomial:

$$y(x) = -0.1817584952 x^3 + 3.689713992 x^2 + 2.128599134 x - 0.343930367$$

The engine determines the required internal attribute $x$ from in-game obstacle clearance $y$ via binary search inversion to within $10^{-4}$ tolerance.

---

## Technology Stack

- Language: TypeScript 5.6
- Framework: React 18
- Build Tool: Vite 5.4
- Graph Visualization: React Flow (@xyflow/react)
- Styling: Tailwind CSS
- Testing: Vitest
- Desktop Runtime: Electron

---

## Project Structure

```text
horse-pedigree-engine/
├── src/
│   ├── components/
│   │   ├── tree/               # React Flow pedigree nodes and tree canvas
│   │   ├── stable/             # Horse card grid and detailed metrics
│   │   ├── forms/              # Horse registration modal and live converters
│   │   └── recommendations/    # Single optimal pair spotlight and forecast
│   ├── engine/
│   │   ├── conversions.ts      # Unit transformations (100m sprint, jump, HP)
│   │   ├── genetics.ts         # Irwin-Hall distribution and 1.20+ inheritance
│   │   ├── optimizer.ts        # Cross-generational candidate pair selector
│   │   ├── engine.test.ts      # Vitest automated test suite
│   │   └── types.ts            # Domain entity interfaces and goal constants
│   ├── store/
│   │   └── useHorseStore.ts    # State management and local storage persistence
│   ├── App.tsx                 # Main layout and view mode controller
│   ├── index.css               # Base Tailwind stylesheets
│   └── main.tsx                # Client application root
├── electron/
│   └── main.cjs                # Electron desktop wrapper
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0 or higher)
- npm (v9.0 or higher)

### Installation
```bash
git clone https://github.com/Anames-dex/Horse.git
cd Horse
npm install
```

### Development Server
```bash
npm run dev
```

### Production Web Build
```bash
npm run build
```

### Running as Desktop Application
```bash
npm run desktop
```

### Running Test Suite
```bash
npm run test
```
