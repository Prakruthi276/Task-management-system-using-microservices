const jsonBody = (schema: object) => ({
  required: true,
  content: { "application/json": { schema } },
});

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description:
      "Login sets the refresh token as an httpOnly cookie. Refresh and logout read that cookie, so they need no body.",
  },
  servers: [{ url: "http://localhost:5003" }],
  tags: [{ name: "Auth" }],
  components: {
    schemas: {
      Register: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Asha Rao" },
          email: { type: "string", example: "asha@company.com" },
          password: { type: "string", example: "Welcome123" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "asha@company.com" },
          password: { type: "string", example: "Welcome123" },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create an EMPLOYEE account (no tokens, log in afterwards)",
        requestBody: jsonBody({ $ref: "#/components/schemas/Register" }),
        responses: {
          "201": { description: "Account created, now log in" },
          "400": { description: "Validation failed" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in: creates a session, sets httpOnly cookie, returns access token",
        requestBody: jsonBody({ $ref: "#/components/schemas/Login" }),
        responses: {
          "200": { description: "Access token returned in body, refresh token set as cookie" },
          "400": { description: "Validation failed" },
          "401": { description: "Invalid credentials" },
          "403": { description: "Account inactive" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate tokens — reads the httpOnly cookie, no request body needed",
        responses: {
          "200": { description: "New access token in body, rotated refresh token in cookie" },
          "401": { description: "Cookie missing, token invalid/expired, or reuse detected" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoke the session and clear the cookie (idempotent)",
        responses: {
          "200": { description: "Logged out, cookie cleared" },
        },
      },
    },
  },
};
