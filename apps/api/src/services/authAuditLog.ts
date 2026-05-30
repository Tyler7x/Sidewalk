import type { Request } from "express";

export type AuthAction =
  | "register"
  | "login"
  | "logout"
  | "verify_email"
  | "password_reset_request"
  | "password_reset_complete";

export function authAuditLog(
  req: Request,
  action: AuthAction,
  outcome: "success" | "failure",
  metadata: Record<string, unknown> = {}
): void {
  const payload = {
    event: "auth.audit",
    action,
    outcome,
    requestId: req.header("x-request-id") ?? "none",
    ip: req.ip ?? "unknown",
    timestamp: new Date().toISOString(),
    ...metadata
  };
  console.info(JSON.stringify(payload));
}
