# Web Auth Contributor Notes

This guide documents the current conventions for auth UI work in `apps/web`.

## Where auth screens live

- Add route pages under `apps/web/app/*` (example: `forgot-password`, `reset-password`, `verify-email`, `session-expired`).
- Keep route page files focused on UI state and form interactions.
- Reuse shared CSS utility classes from `apps/web/app/globals.css` (`auth-card`, `auth-form`, `auth-input`, `auth-error`, `auth-button`).

## Client and data-fetching pattern

- Keep API calls in `apps/web/lib/authClient.ts`.
- Page components should call auth client helpers rather than inlining repeated `fetch` behavior.
- Keep token/session helpers centralized (`saveTokens`, `clearTokens`, `refreshSession`, `getAuthHeader`) so auth behavior stays consistent.

## Validation and error handling

- Do lightweight client checks in page forms (example: password confirm match).
- Surface API errors as user-readable messages in an `auth-error` block with `role="alert"`.
- Preserve explicit unhappy-path states (example: invalid reset token flow).

## Shared contracts

- Use types from `packages/types/src/auth.ts` through `@sidewalk/types`.
- New auth request/response shapes should be added in `packages/types` first, then consumed by web/API workspaces.

## Testing and verification

- Preferred checks for web auth changes:
  - `pnpm --filter @sidewalk/web lint`
  - `pnpm --filter @sidewalk/web typecheck`
  - `pnpm --filter @sidewalk/web build`
- If a check fails due to pre-existing issues, note the exact failure and keep change scope small.

## Adding a new auth screen

1. Add route page in `apps/web/app`.
2. Add or extend auth client helper in `apps/web/lib/authClient.ts`.
3. Reuse shared auth classes in `globals.css`.
4. Reuse shared contract types from `@sidewalk/types`.
5. Run web checks and document results in PR.
