import axios from "axios";
import type { ApiErrorBody } from "../types";

export interface ApiErrorInfo {
  message: string;
  status?: number;
  fieldErrors: Record<string, string>;
}

// Turns any thrown value into something the UI can show
export function parseApiError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return {
        message: "Cannot reach the server. Check that the services are running.",
        fieldErrors: {},
      };
    }
    const body = err.response.data as Partial<ApiErrorBody> | undefined;
    const fieldErrors: Record<string, string> = {};
    body?.details?.forEach((d) => {
      if (d.field && !fieldErrors[d.field]) fieldErrors[d.field] = d.message;
    });
    return {
      message: body?.message ?? `Request failed (${err.response.status})`,
      status: err.response.status,
      fieldErrors,
    };
  }
  return { message: "Something went wrong. Please try again.", fieldErrors: {} };
}

// What a rejected thunk gives back through unwrap()
export function toErrorInfo(err: unknown): ApiErrorInfo {
  if (err && typeof err === "object" && "message" in err && "fieldErrors" in err) {
    return err as ApiErrorInfo;
  }
  return parseApiError(err);
}
