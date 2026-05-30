# Mobile deep links

This app registers the `sidewalk` scheme (see `apps/mobile/app.json`).

## Password reset completion

When a user opens the password reset email on a phone, the mobile app should be able to receive the reset token and route to the reset completion screen.

Supported formats:

- `sidewalk://reset-password?token=<TOKEN>`
- `sidewalk://auth/reset-password?token=<TOKEN>`
- `sidewalk://reset-password/<TOKEN>`

Notes:

- The UI never reveals whether an email address is registered during reset requests.
- Tokens are treated as opaque strings.

