# Repository Guidelines

## Project Structure & Module Organization
This repository contains a Vite + Vue 3 + TypeScript plugin project (`ui-context-grab`) plus a local demo app.

- `src/lib/`: library entry (`index.ts`) and exported plugin surface.
- `src/vite.ts`: core Vite plugin implementation and HTML/client injection logic.
- `src/client/`: browser runtime entry and initialization (`index.ts`, `init.ts`).
- `src/ui/`: UI behavior for highlight, floating trigger, and selection popover.
- `src/adapters/`: framework-specific context extraction (currently Vue).
- `public/` and `src/assets/`: static assets for demo/runtime visuals.
- `dist/`: built library artifacts (`.mjs`, `.cjs`, `.d.ts`). Treat as generated output.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: run the Vite dev server (plugin injection is active in serve mode).
- `pnpm build`: build distributable library bundles and type declarations.
- `pnpm build:lib`: bundle library only via `vite.lib.config.ts`.
- `pnpm build:types`: emit declaration files from `tsconfig.lib.json`.
- `pnpm build:demo`: type-check and build demo app assets.
- `pnpm preview`: preview the built demo.

Example flow: `pnpm install && pnpm dev` for local debugging, then `pnpm build` before publishing.

## Coding Style & Naming Conventions
- Language: TypeScript (ESM), Vue SFC for demo components.
- Indentation: 2 spaces; keep imports grouped and ordered by origin.
- File naming: kebab-case for runtime/UI modules (for example, `floating-trigger.ts`), `index.ts` for public entry points.
- Prefer small, focused modules under `src/ui`, `src/client`, and `src/adapters`.
- Keep strict compiler hygiene: avoid unused locals/params and switch fallthroughs (enforced in `tsconfig.app.json`).

## Testing Guidelines
No dedicated test framework is currently configured. Validate changes with:
1. `pnpm build` (library + types must pass).
2. `pnpm build:demo` (demo compile/type-check must pass).
3. Manual smoke test in `pnpm dev` (toggle trigger, hover highlight, click collect flow).

## Commit & Pull Request Guidelines
Git history is not available in this workspace snapshot, so follow Conventional Commits:
- `feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`, `chore: ...`.

PRs should include:
1. Scope summary and motivation.
2. Commands run for verification (for example, `pnpm build`, `pnpm build:demo`).
3. Screenshots/GIFs for UI behavior changes (`src/ui/*`, demo pages).
4. Linked issue/task ID when applicable.
