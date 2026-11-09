import axios from "axios";
import { env } from "../config/env";
import { AppError } from "../types/utils/AppError";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE";
}

const http = axios.create({
  baseURL: env.userServiceUrl,
  timeout: 5000, // never wait forever for another service
  headers: env.internalApiKey ? { "x-internal-api-key": env.internalApiKey } : {},
});

export const userClient = {
  async getUser(id: string): Promise<UserDto> {
    try {
      const res = await http.get(`/api/users/${encodeURIComponent(id)}`);
      return res.data.data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) throw new AppError("Assignee does not exist", 400);
        if (!err.response) throw new AppError("User service unavailable", 503);
      }
      console.error("User service call failed:", err instanceof Error ? err.message : err);
      throw new AppError("User service error", 502);
    }
  },
};
