const requiredInProduction = ["DATABASE_URL", "AUTH_SECRET"] as const;

export function validateEnv(): void {
  const isProd = process.env.NODE_ENV === "production";
  const missing = requiredInProduction.filter((key) => !process.env[key]?.trim());
  if (isProd && missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  if (isProd && process.env.CRON_SECRET && process.env.CRON_SECRET.length < 16) {
    throw new Error("CRON_SECRET must be at least 16 characters when set.");
  }
}