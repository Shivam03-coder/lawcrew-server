import { config } from "dotenv";
config();

export const appEnvConfigs = {
  PORT: process.env.PORT,
  AUTH_EMAIL: process.env.AUTH_EMAIL,
  AUTH_PASS: process.env.AUTH_PASS,
  NEXT_APP_URI: process.env.NEXT_APP_URI,
  SIGNING_SECRET: process.env.SIGNING_SECRET,
  ENCRYPTION_kEY: process.env.ENCRYPTION_kEY,
  ARC_JET_PUBLISHABLE_KEY: process.env.ARC_JET_PUBLISHABLE_KEY,
  AI_PUBLISHABLE_KEY: process.env.AI_PUBLISHABLE_KEY,
};
