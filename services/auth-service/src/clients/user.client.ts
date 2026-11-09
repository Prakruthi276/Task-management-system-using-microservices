import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { UserRecord } from "../types/auth.types";

// Thin HTTP client for the User Service.
// All methods throw AppError so callers don't need to inspect fetch responses.

const base = () => env.userServiceUrl;

// Internal key header sent on every call — user-service requires it on write endpoints
// and on GET /:id so it can skip the JWT check for service-to-service calls.
const internalHeaders = () => ({
  "Content-Type": "application/json",
  "x-internal-api-key": env.internalApiKey,
});

const handleResponse = async <T>(res: Response): Promise<T> => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (body as { message?: string }).message || "User service error";
    throw new AppError(message, res.status);
  }
  return (body as { data: T }).data;
};

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
}

export const userClient = {
  // Called by register: creates the account in the user-service
  async createUser(payload: CreateUserPayload): Promise<UserRecord> {
    const res = await fetch(`${base()}/api/users`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<UserRecord>(res);
  },

  // Called by login: asks the user-service to validate the password and return the user
  async verifyCredentials(email: string, password: string): Promise<UserRecord> {
    const res = await fetch(`${base()}/api/users/verify-credentials`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<UserRecord>(res);
  },

  // Called by refresh: re-checks role and status in case they changed since login
  async getUser(id: string): Promise<UserRecord> {
    const res = await fetch(`${base()}/api/users/${id}`, {
      headers: { "x-internal-api-key": env.internalApiKey },
    });
    return handleResponse<UserRecord>(res);
  },
};
