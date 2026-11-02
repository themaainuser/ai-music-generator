import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),
    AWS_REGION: z.string(),
    S3_BUCKET_NAME: z.string(),
    MODAL_KEY: z.string(),
    MODAL_SECRET: z.string(),
    GENERATE_FROM_DESCRIPTION: z.string().url(),
    GENERATE_FROM_DESCRIBED_LYRICS: z.string().url(),
    GENERATE_FROM_LYRICS: z.string().url(),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().url(),
    POLAR_ACCESS_TOKEN: z.string(),
    POLAR_WEBHOOK_SECRET: z.string(),
  },

  client: {},

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    MODAL_KEY: process.env.MODAL_KEY,
    MODAL_SECRET: process.env.MODAL_SECRET,
    GENERATE_FROM_DESCRIPTION: process.env.GENERATE_FROM_DESCRIPTION,
    GENERATE_FROM_DESCRIBED_LYRICS: process.env.GENERATE_FROM_DESCRIBED_LYRICS,
    GENERATE_FROM_LYRICS: process.env.GENERATE_FROM_LYRICS,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
