import type { AuthErrorCode } from "@sidewalk/types";

export function friendlyAuthMessage(code: AuthErrorCode): string {
  switch (code) {
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect.";
    case "ACCOUNT_UNVERIFIED":
      return "Your account is not verified yet. Check your inbox for the verification email.";
    case "ACCOUNT_LOCKED":
      return "Your account is temporarily locked due to repeated login failures. Please try again later.";
    case "RATE_LIMITED":
      return "Too many attempts. Please wait a bit and try again.";
    case "TOKEN_EXPIRED":
      return "This link has expired. Request a new password reset email.";
    case "INVALID_TOKEN":
      return "This link is invalid. Request a new password reset email.";
    case "VALIDATION_ERROR":
      return "Please check your details and try again.";
    case "EMAIL_TAKEN":
      return "This email is already registered.";
    case "SESSION_NOT_FOUND":
      return "Your session has expired. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function privacySafeResetMessage(): string {
  return "If an account exists for that email, you’ll receive a password reset link shortly.";
}

