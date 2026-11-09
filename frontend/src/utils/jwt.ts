export interface TokenClaims {
  sub?: string;
  role?: string;
  sid?: string;
  iat?: number;
  exp?: number;
}

// A JWT is signed, not encrypted: the middle part is just Base64, so anyone can read it.
// We read it here only to DISPLAY the claims. The server never trusts what the browser reads.
export function decodeJwt(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as TokenClaims;
  } catch {
    return null;
  }
}
