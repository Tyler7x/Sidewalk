import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type {
  ApiHealth,
  AuthStatus,
  RegisterResponse,
  LoginResponse,
  RefreshResponse,
  LogoutResponse,
  AuthErrorResponse
} from "@sidewalk/types";
import type { Account } from "./models/account.js";
import { toPublic } from "./models/account.js";
import { hashPassword, verifyPassword } from "./services/password.js";
import { MemorySessionStore } from "./services/sessionStore.js";

const env = readServiceEnv(
  "api",
  z.object({
    PORT: z.coerce.number().default(4000),
    APP_ENV: z.enum(["development", "test", "production"]).default("development"),
    JWT_SECRET: z.string().min(8).default("replace-me"),
    ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
  })
);

export const app: Express = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// ── Shared stores ─────────────────────────────────────────────────────────────
const accounts = new Map<string, Account>();
let nextId = 1;
export const sessionStore = new MemorySessionStore();

// ── Helpers ───────────────────────────────────────────────────────────────────

function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ── Health / status ───────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  const payload: ApiHealth = { service: "api", status: "ok", timestamp: new Date().toISOString() };
  res.json(payload);
});

app.get("/auth/status", (_req, res) => {
  const payload: AuthStatus = {
    phase: "foundation",
    ready: false,
    nextStep: "Build signup, login, session, and recovery flows in Authentication batch 1."
  };
  res.json(payload);
});

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const refreshSchema = z.object({ refreshToken: z.string().min(1) });

// ── Register ──────────────────────────────────────────────────────────────────

app.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  if ([...accounts.values()].some((a) => a.email === email)) {
    const err: AuthErrorResponse = { code: "EMAIL_TAKEN", message: "Email already registered." };
    res.status(409).json(err);
    return;
  }

  const now = new Date();
  const account: Account = {
    id: String(nextId++),
    email,
    passwordHash: await hashPassword(password),
    verified: false,
    createdAt: now,
    updatedAt: now
  };
  accounts.set(account.id, account);

  const pub = toPublic(account);
  const body: RegisterResponse = { id: pub.id, email: pub.email, verified: pub.verified, createdAt: pub.createdAt.toISOString() };
  res.status(201).json(body);
});

// ── Login ─────────────────────────────────────────────────────────────────────

app.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const { email, password } = parsed.data;
  const account = [...accounts.values()].find((a) => a.email === email);
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    const err: AuthErrorResponse = { code: "INVALID_CREDENTIALS", message: "Invalid email or password." };
    res.status(401).json(err);
    return;
  }

  const session = sessionStore.create(account.id);
  const body: LoginResponse = {
    accessToken: session.sessionId,
    refreshToken: session.refreshToken,
    account: { id: account.id, email: account.email, verified: account.verified }
  };
  res.status(200).json(body);
});

// ── Refresh ───────────────────────────────────────────────────────────────────

app.post("/auth/refresh", (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    const err: AuthErrorResponse = { code: "VALIDATION_ERROR", message: parsed.error.issues[0].message };
    res.status(400).json(err);
    return;
  }

  const existing = sessionStore.getByRefreshToken(parsed.data.refreshToken);
  if (!existing) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Refresh token is invalid or already used." };
    res.status(401).json(err);
    return;
  }

  const rotated = sessionStore.rotate(existing.sessionId);
  const body: RefreshResponse = { accessToken: rotated.sessionId, refreshToken: rotated.refreshToken };
  res.status(200).json(body);
});

// ── Logout (single device) ────────────────────────────────────────────────────

app.post("/auth/logout", (req, res) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." };
    res.status(401).json(err);
    return;
  }

  const session = sessionStore.getBySessionId(token);
  if (!session) {
    const err: AuthErrorResponse = { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." };
    res.status(404).json(err);
    return;
  }

  sessionStore.revoke(session.sessionId);
  const body: LogoutResponse = { message: "Session revoked." };
  res.status(200).json(body);
});

// ── Logout all sessions ───────────────────────────────────────────────────────

app.post("/auth/logout/all", (req, res) => {
  const token = bearerToken(req.headers.authorization);
  if (!token) {
    const err: AuthErrorResponse = { code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." };
    res.status(401).json(err);
    return;
  }

  const session = sessionStore.getBySessionId(token);
  if (!session) {
    const err: AuthErrorResponse = { code: "SESSION_NOT_FOUND", message: "Session not found or already revoked." };
    res.status(404).json(err);
    return;
  }

  sessionStore.revokeAll(session.accountId);
  const body: LogoutResponse = { message: "All sessions revoked." };
  res.status(200).json(body);
});

export { env };
