import { z, type ZodTypeAny } from "zod";

export const workspaceConfig = {
  name: "Sidewalk",
  mode: "hackathon-starter",
  authFirstMilestone: "Authentication"
} as const;

export function readServiceEnv<TSchema extends ZodTypeAny>(
  serviceName: string,
  schema: TSchema
): z.infer<TSchema> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment for ${serviceName}: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "root"} ${issue.message}`)
        .join("; ")}`
    );
  }

  return parsed.data;
}
