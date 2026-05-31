# Auth PR Contribution Expectations

This guide describes what a complete auth-related pull request should include for the Sidewalk monorepo. It applies to the Authentication milestone and is tailored to the workspaces in this repo.

## All auth PRs

- **Scope**: Keep changes focused. One concern per PR (e.g., a new endpoint, a validation fix, a session behavior change).
- **Types**: Add or update shared request/response shapes in `packages/types/src/auth.ts` before consuming them in API or client workspaces.
- **Env variables**: Document any new environment variable in the relevant `.env.example` and in `AUTH_DECISIONS.md` if it affects policy.
- **Tests**: Extend `apps/api/src/__tests__/auth.test.ts` for any new or changed endpoint behavior. At minimum cover the happy path and the primary error case.
- **Checks**: Run and pass the workspace checks before opening the PR:
  ```bash
  pnpm --filter @sidewalk/api lint
  pnpm --filter @sidewalk/api typecheck
  pnpm --filter @sidewalk/api build
  ```

## API-only changes (`apps/api`)

- Follow the endpoint shape documented in `AUTH_API.md`.
- New endpoints must return `404` when guarded by a feature flag that is disabled.
- Error responses must use the established error code strings (e.g., `VALIDATION_ERROR`, `INVALID_TOKEN`).
- Do not log sensitive values (passwords, raw tokens). Use structured log events for security signals.
- Reference `AUTH_DECISIONS.md` for existing policy decisions before introducing new behavior.

## UI-driven auth changes (`apps/web`, `apps/mobile`)

- Keep API calls in `apps/web/lib/authClient.ts`; do not inline `fetch` calls in page components.
- Surface API errors as user-readable messages in an `auth-error` block with `role="alert"`.
- Include a screenshot or short screen recording for any visible UI change.
- Follow the conventions in `apps/web/AUTH_CONTRIBUTING.md` for web auth screens.

## PR description checklist

Include the following in your PR description:

- What changed and why.
- Which endpoints or UI flows are affected.
- New or updated env variables (if any).
- Test coverage added or extended.
- Screenshot or recording (UI changes only).
- Any known limitations or follow-up work.
