# Auth PR Review Checklist

A quick checklist for reviewing authentication pull requests in the Sidewalk monorepo. Use it alongside the diff — it is not a substitute for reading the code.

## Secrets and sensitive data

- [ ] No passwords, raw tokens, or secrets appear in logs, responses, or comments.
- [ ] New env variables are documented in `.env.example` and `AUTH_DECISIONS.md`.
- [ ] Feature-flagged behavior returns `404` when the flag is off.

## Input validation and error handling

- [ ] All inputs are validated before use (email format, password length, token presence).
- [ ] Error responses use established error code strings (`VALIDATION_ERROR`, `INVALID_TOKEN`, etc.).
- [ ] Unknown-account paths return generic responses (no user enumeration).
- [ ] Rate-limited and locked-account paths behave consistently with existing policy.

## Auth logic and session behavior

- [ ] Token issuance, rotation, and revocation follow the patterns in `AUTH_API.md`.
- [ ] Refresh token reuse is handled (reuse signal logged, session invalidated).
- [ ] Password reset completion revokes all existing sessions.
- [ ] New behavior is consistent with decisions recorded in `AUTH_DECISIONS.md`.

## Shared contracts

- [ ] New or changed request/response shapes are defined in `packages/types/src/auth.ts`.
- [ ] No auth type is duplicated across workspaces.

## Tests

- [ ] `apps/api/src/__tests__/auth.test.ts` is extended for new or changed endpoint behavior.
- [ ] Happy path and at least one error case are covered.
- [ ] No test relies on `ENABLE_DEV_AUTH_SHORTCUTS` behavior in non-dev assertions.

## Client changes (web / mobile)

- [ ] API calls go through `apps/web/lib/authClient.ts`, not inlined in components.
- [ ] Errors surface in an `auth-error` block with `role="alert"`.
- [ ] A screenshot or recording is included for visible UI changes.

## General

- [ ] Workspace checks pass (`lint`, `typecheck`, `build`).
- [ ] PR scope is focused — one concern per PR.
- [ ] PR description explains what changed, why, and what was tested.
