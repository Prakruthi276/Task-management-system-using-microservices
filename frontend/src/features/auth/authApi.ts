import { authHttp, SessionPayload } from "../../api/http";
import type { ApiEnvelope, User } from "../../types";

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody extends LoginBody {
  name: string;
}

// All HTTP calls for the Auth service live here. Components and slices never call axios directly.
export const authApi = {
  async login(body: LoginBody): Promise<SessionPayload> {
    const res = await authHttp.post<ApiEnvelope<SessionPayload>>("/api/auth/login", body);
    return { accessToken: res.data.data.accessToken, user: res.data.data.user };
  },

  async register(body: RegisterBody): Promise<User> {
    const res = await authHttp.post<ApiEnvelope<User>>("/api/auth/register", body);
    return res.data.data;
  },

  // The refresh token travels in the httpOnly cookie, so there is no body
  async logout(): Promise<void> {
    await authHttp.post("/api/auth/logout");
  },
};
