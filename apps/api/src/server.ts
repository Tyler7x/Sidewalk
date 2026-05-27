import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";

import { readServiceEnv } from "@sidewalk/config";
import type { ApiHealth, AuthStatus } from "@sidewalk/types";

const env = readServiceEnv(
  "api",
  z.object({
    PORT: z.coerce.number().default(4000),
    APP_ENV: z.enum(["development", "test", "production"]).default("development"),
    JWT_SECRET: z.string().min(8).default("replace-me"),
    ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
  })
);

const app = express();

app.use(helmet());
app.use(cors({ origin: env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  const payload: ApiHealth = {
    service: "api",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  response.json(payload);
});

app.get("/auth/status", (_request, response) => {
  const payload: AuthStatus = {
    phase: "foundation",
    ready: false,
    nextStep: "Build signup, login, session, and recovery flows in Authentication batch 1."
  };

  response.json(payload);
});

app.listen(env.PORT, () => {
  console.log(`@sidewalk/api listening on http://localhost:${env.PORT}`);
});
