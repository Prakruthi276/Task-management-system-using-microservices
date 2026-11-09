import dotenv from "dotenv";

dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 5003,
  nodeEnv: process.env.NODE_ENV || "development",
  userServiceUrl: process.env.USER_SERVICE_URL || "http://localhost:5001",

  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  accessTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS) || 900,

  jwtRefreshSecret: required("JWT_REFRESH_SECRET"),
  refreshTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS) || 604800,

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  internalApiKey: required("INTERNAL_API_KEY"),
};
