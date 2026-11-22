# Contributing to Horse

Thank you for your interest in contributing. This document outlines development guidelines, code standards, and the pull request submission process.

---

## Development Workflow

1. Fork the repository and clone your fork locally:
   ```bash
   git clone https://github.com/Anames-dex/Horse.git
   cd Horse
   ```

2. Create a dedicated feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Install project dependencies:
   ```bash
   npm install
   ```

4. Launch the development server:
   ```bash
   npm run dev
   ```

---

## Code Quality Standards

- Language: Use strict TypeScript without `any` types where possible.
- Linting and Type Checking: Ensure `npm run build` succeeds without TypeScript compiler errors or unused variables.
- Testing: Add unit tests in `src/engine/` for any new algorithmic calculation or conversion logic. Run tests with `npm run test`.
- Styling: Follow clean, utility-first Tailwind CSS patterns matching the existing dark minimalist palette. Avoid unnecessary decorative fluff or animations that detract from performance.
- Content Policy: Do not introduce emojis in the UI, documentation, or commit messages.

---

## Pull Request Guidelines

- Ensure your branch is rebased on the latest `main`.
- Write clear, imperative commit messages describing the changes (for example, `feat(engine): add custom goal threshold validation`).
- Include a concise summary in your pull request explaining the motivation and changes made.
- Confirm all tests pass locally before submitting.
