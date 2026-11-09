import { AuthUser } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      internalCall?: boolean; // true when a trusted service called with the internal key
    }
  }
}

export {};
