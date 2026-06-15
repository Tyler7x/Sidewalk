# Contributor Guide

## Project Structure

```text
sidewalk/
├── apps/
│   ├── api/       # Express modular monolith (auth API)
│   ├── web/       # Next.js authentication UI
│   └── mobile/    # Expo / React Native foundation
├── packages/
│   ├── shared/    # Shared types and validation schemas
│   └── stellar/   # Stellar integration scaffold (no blockchain logic yet)
├── docs/          # Environment, testing, and contributor documentation
└── .github/workflows/  # CI pipelines, one per package
```

### Backend modules (`apps/api/src/modules`)

The API is a **modular monolith** organized by business domain, not by
technical layer. Each module owns its controllers, services, validators,
routes, types, and tests:

```text
modules/
  auth/        # registration, login, token issuance
  users/       # user lookups used to support authentication
shared/        # cross-cutting config, database, middleware, errors, logger
```

New backend functionality should be added as a new module under
`src/modules/`, following the same internal structure. Avoid putting business
logic in `shared/` — it is for cross-cutting infrastructure only.

## Coding Standards

- TypeScript strict mode is enabled across all packages.
- Linting: ESLint (flat config) with `typescript-eslint`. Run `pnpm lint`.
- Formatting: Prettier. Run `pnpm exec prettier --write .`.
- Prefer small, focused modules over large multi-purpose files.
- Keep shared abstractions in `packages/shared` minimal — only add things
  that are genuinely used by more than one app.

## Development Workflow

1. Install dependencies: `pnpm install`.
2. Copy `.env.example` files as described in [environment.md](environment.md).
3. Run an app: `pnpm dev:api`, `pnpm dev:web`, or `pnpm dev:mobile`.
4. Run checks before opening a PR:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
   or simply `pnpm check`.

## Contribution Expectations

- Every PR must pass the relevant GitHub Actions workflow(s) in
  `.github/workflows/`.
- New modules/features should include tests covering the behavior they add.
- Keep changes scoped to the module/app they affect — cross-cutting changes
  to `shared/` or `packages/` should be deliberate and documented in the PR
  description.
- Follow the existing modular monolith structure; do not introduce new
  top-level layers (e.g. global `controllers/`, `services/` directories).
