import dotenv from "dotenv";

dotenv.config();

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const env = {
  port: Number(process.env.PORT) || 4005,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  userServiceUrl: required("USER_SERVICE_URL"),
  internalApiKey: process.env.INTERNAL_API_KEY || "",
};
