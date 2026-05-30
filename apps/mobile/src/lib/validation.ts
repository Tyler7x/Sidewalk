export function isValidEmail(email: string): boolean {
  // Intentionally lightweight; server still validates.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type PasswordValidation = {
  ok: boolean;
  message?: string;
};

export function validatePassword(password: string): PasswordValidation {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  return { ok: true };
}

