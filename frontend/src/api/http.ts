import axios from "axios";
import type { ApiEnvelope, User } from "../types";

const AUTH_URL = import.meta.env.VITE_AUTH_URL ?? "http://localhost:5003";

export interface SessionPayload {
  accessToken: string;
  user: User;
}

// The store is plugged in from main.tsx. This avoids a circular import
// (the store imports slices, and slices import this file).
interface HttpHooks {
  onSessionRefreshed: (session: SessionPayload) => void;
}

let hooks: HttpHooks = {
  onSessionRefreshed: () => undefined,
};

export const configureHttp = (next: HttpHooks) => {
  hooks = next;
};

// Auth service client.
// withCredentials lets the browser send and store the httpOnly refresh cookie.
export const authHttp = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true,
  timeout: 10000,
});

// Single-flight refresh: if two parts of the app ask for a refresh at the same moment,
// only ONE request is sent. This matters because refresh tokens rotate, and a second call
// with the old cookie would look like token theft and end the session.
let refreshPromise: Promise<SessionPayload> | null = null;

export const refreshSession = (): Promise<SessionPayload> => {
  if (!refreshPromise) {
    refreshPromise = authHttp
      .post<ApiEnvelope<SessionPayload>>("/api/auth/refresh")
      .then((res) => {
        const session = { accessToken: res.data.data.accessToken, user: res.data.data.user };
        hooks.onSessionRefreshed(session);
        return session;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};
