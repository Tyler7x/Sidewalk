# Auth API Surface

Base path: `/auth`

## Endpoints

- `POST /auth/register`
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Success: `201 { id, email, verified, createdAt }`
  - Errors: `400 VALIDATION_ERROR`, `409 EMAIL_TAKEN`

- `POST /auth/login`
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Success: `200 { accessToken, refreshToken, account }`
  - Errors: `400 VALIDATION_ERROR`, `401 INVALID_CREDENTIALS`, `403 ACCOUNT_LOCKED`

- `POST /auth/refresh`
  - Body: `{ "refreshToken": "..." }`
  - Success: `200 { accessToken, refreshToken }`
  - Errors: `400 VALIDATION_ERROR`, `401 INVALID_TOKEN`

- `POST /auth/logout`
  - Header: `Authorization: Bearer <accessToken>`
  - Success: `200 { message }`

- `POST /auth/logout/all`
  - Header: `Authorization: Bearer <accessToken>`
  - Success: `200 { message }`

- `POST /auth/verify-email`
  - Body: `{ "token": "..." }`
  - Success: `200 { message }`
  - Errors: `400 VALIDATION_ERROR|INVALID_TOKEN`

- `POST /auth/password-reset/request`
  - Body: `{ "email": "user@example.com" }`
  - Success: `200` privacy-safe message for both known/unknown accounts

- `POST /auth/password-reset/complete`
  - Body: `{ "token": "...", "password": "newpass123" }`
  - Success: `200 { message }`
  - Errors: `400 VALIDATION_ERROR|INVALID_TOKEN`

## Dev-only shortcut

- `POST /auth/dev/seed-user`
  - Available only when both are true:
  - `APP_ENV=development`
  - `ENABLE_DEV_AUTH_SHORTCUTS=true`
  - Returns `404` in all other environments.
  - Use only for local integration setup, not real auth behavior testing.

## Auth Integration Harness

Use `apps/api/src/__tests__/auth.test.ts` as the integration harness.
It already covers registration and login and can be extended for new endpoint flows.
