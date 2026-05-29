import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

import { app, sessionStore } from "../app.js";

// ── password service ──────────────────────────────────────────────────────────
import { hashPassword, verifyPassword } from "../services/password.js";

describe("password service", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).not.toBe("secret123");
    expect(await verifyPassword("secret123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("secret123");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

// ── account model ─────────────────────────────────────────────────────────────
import { toPublic } from "../models/account.js";
import type { Account } from "../models/account.js";

describe("account model", () => {
  const account: Account = {
    id: "1",
    email: "test@example.com",
    passwordHash: "$2a$12$hash",
    verified: false,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01")
  };

  it("toPublic strips passwordHash", () => {
    const pub = toPublic(account);
    expect("passwordHash" in pub).toBe(false);
    expect(pub.email).toBe("test@example.com");
  });
});

// ── session store unit tests ──────────────────────────────────────────────────
import { MemorySessionStore } from "../services/sessionStore.js";

describe("MemorySessionStore", () => {
  let store: MemorySessionStore;

  beforeEach(() => {
    store = new MemorySessionStore();
  });

  it("creates and retrieves a session by sessionId", () => {
    const s = store.create("acc1");
    expect(store.getBySessionId(s.sessionId)).toEqual(s);
  });

  it("retrieves a session by refreshToken", () => {
    const s = store.create("acc1");
    expect(store.getByRefreshToken(s.refreshToken)).toEqual(s);
  });

  it("rotate issues new tokens and invalidates old refreshToken", () => {
    const s = store.create("acc1");
    const rotated = store.rotate(s.sessionId);
    expect(rotated.refreshToken).not.toBe(s.refreshToken);
    expect(store.getByRefreshToken(s.refreshToken)).toBeUndefined();
    expect(store.getByRefreshToken(rotated.refreshToken)).toBeDefined();
  });

  it("revoke removes the session", () => {
    const s = store.create("acc1");
    store.revoke(s.sessionId);
    expect(store.getBySessionId(s.sessionId)).toBeUndefined();
    expect(store.getByRefreshToken(s.refreshToken)).toBeUndefined();
  });

  it("revokeAll removes only sessions for the given account", () => {
    const s1 = store.create("acc1");
    const s2 = store.create("acc1");
    const s3 = store.create("acc2");
    store.revokeAll("acc1");
    expect(store.getBySessionId(s1.sessionId)).toBeUndefined();
    expect(store.getBySessionId(s2.sessionId)).toBeUndefined();
    expect(store.getBySessionId(s3.sessionId)).toBeDefined();
  });
});

// ── register endpoint ─────────────────────────────────────────────────────────

describe("POST /auth/register", () => {
  it("creates an account and returns 201", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "new@example.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe("new@example.com");
    expect(res.body.verified).toBe(false);
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 400 for invalid payload", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "bad-email", password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("returns 409 for duplicate email", async () => {
    await request(app).post("/auth/register").send({ email: "dup@example.com", password: "password123" });
    const res = await request(app).post("/auth/register").send({ email: "dup@example.com", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_TAKEN");
  });
});

// ── login endpoint ────────────────────────────────────────────────────────────

describe("POST /auth/login", () => {
  it("returns accessToken and refreshToken on valid credentials", async () => {
    await request(app).post("/auth/register").send({ email: "login@example.com", password: "password123" });
    const res = await request(app).post("/auth/login").send({ email: "login@example.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.account.email).toBe("login@example.com");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app).post("/auth/login").send({ email: "login@example.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for unknown email", async () => {
    const res = await request(app).post("/auth/login").send({ email: "ghost@example.com", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
});

// ── refresh endpoint ──────────────────────────────────────────────────────────

describe("POST /auth/refresh", () => {
  async function loginUser(email: string): Promise<{ accessToken: string; refreshToken: string }> {
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const res = await request(app).post("/auth/login").send({ email, password: "password123" });
    return res.body;
  }

  it("rotates tokens and returns new pair", async () => {
    const { refreshToken } = await loginUser("refresh1@example.com");
    const res = await request(app).post("/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");
    expect(typeof res.body.refreshToken).toBe("string");
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });

  it("rejects a replayed (already-rotated) refresh token", async () => {
    const { refreshToken } = await loginUser("refresh2@example.com");
    await request(app).post("/auth/refresh").send({ refreshToken });
    const res = await request(app).post("/auth/refresh").send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("returns 401 for an unknown refresh token", async () => {
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "bogus" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});

// ── single-device logout ──────────────────────────────────────────────────────

describe("POST /auth/logout", () => {
  async function loginUser(email: string): Promise<{ accessToken: string; refreshToken: string }> {
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const res = await request(app).post("/auth/login").send({ email, password: "password123" });
    return res.body;
  }

  it("revokes the current session and returns 200", async () => {
    const { accessToken } = await loginUser("logout1@example.com");
    const res = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Session revoked.");
    expect(sessionStore.getBySessionId(accessToken)).toBeUndefined();
  });

  it("leaves other sessions intact", async () => {
    const email = "logout2@example.com";
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const s1 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;
    const s2 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;

    await request(app).post("/auth/logout").set("Authorization", `Bearer ${s1.accessToken}`);

    expect(sessionStore.getBySessionId(s1.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(s2.accessToken)).toBeDefined();
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).post("/auth/logout");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });

  it("returns 404 for an already-revoked session", async () => {
    const { accessToken } = await loginUser("logout3@example.com");
    await request(app).post("/auth/logout").set("Authorization", `Bearer ${accessToken}`);
    const res = await request(app).post("/auth/logout").set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("SESSION_NOT_FOUND");
  });
});

// ── logout-all-sessions ───────────────────────────────────────────────────────

describe("POST /auth/logout/all", () => {
  it("revokes all sessions for the account", async () => {
    const email = "logoutall@example.com";
    await request(app).post("/auth/register").send({ email, password: "password123" });
    const s1 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;
    const s2 = (await request(app).post("/auth/login").send({ email, password: "password123" })).body;

    const res = await request(app)
      .post("/auth/logout/all")
      .set("Authorization", `Bearer ${s1.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All sessions revoked.");
    expect(sessionStore.getBySessionId(s1.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(s2.accessToken)).toBeUndefined();
  });

  it("does not affect sessions of other accounts", async () => {
    const emailA = "logoutall-a@example.com";
    const emailB = "logoutall-b@example.com";
    await request(app).post("/auth/register").send({ email: emailA, password: "password123" });
    await request(app).post("/auth/register").send({ email: emailB, password: "password123" });
    const sA = (await request(app).post("/auth/login").send({ email: emailA, password: "password123" })).body;
    const sB = (await request(app).post("/auth/login").send({ email: emailB, password: "password123" })).body;

    await request(app).post("/auth/logout/all").set("Authorization", `Bearer ${sA.accessToken}`);

    expect(sessionStore.getBySessionId(sA.accessToken)).toBeUndefined();
    expect(sessionStore.getBySessionId(sB.accessToken)).toBeDefined();
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(app).post("/auth/logout/all");
    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_TOKEN");
  });
});
