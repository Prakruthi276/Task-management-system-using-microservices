import { ROLES, USER_STATUSES } from "../types/user.types";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

const jsonBody = (schema: object) => ({
  required: true,
  content: { "application/json": { schema } },
});

const bearerAuth = [{ bearerAuth: [] }];
const internalKey = [{ InternalKey: [] }];

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "User Service API",
    version: "1.0.0",
    description:
      "User accounts, roles and account status. Internal endpoints require x-internal-api-key. User-facing endpoints require a Bearer JWT.",
  },
  servers: [{ url: "http://localhost:5001" }],
  tags: [{ name: "Users" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      InternalKey: { type: "apiKey", in: "header", name: "x-internal-api-key" },
    },
    schemas: {
      CreateUser: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Asha Rao" },
          email: { type: "string", example: "asha@company.com" },
          password: { type: "string", example: "Welcome123" },
          role: { type: "string", enum: [...ROLES], example: "MANAGER" },
        },
      },
      UpdateUser: {
        type: "object",
        properties: {
          name: { type: "string", example: "Asha R" },
          role: { type: "string", enum: [...ROLES] },
        },
      },
      UpdateStatus: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", enum: [...USER_STATUSES] } },
      },
      VerifyCredentials: {
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
    "/api/users": {
      post: {
        tags: ["Users"],
        summary: "Create a user — internal only (called by auth-service at register)",
        security: internalKey,
        requestBody: jsonBody({ $ref: "#/components/schemas/CreateUser" }),
        responses: {
          "201": { description: "User created" },
          "400": { description: "Validation failed" },
          "403": { description: "Missing or invalid internal key" },
          "409": { description: "Email already registered" },
        },
      },
      get: {
        tags: ["Users"],
        summary: "List users with filters and pagination — admin only",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "role", in: "query", schema: { type: "string", enum: [...ROLES] } },
          { name: "status", in: "query", schema: { type: "string", enum: [...USER_STATUSES] } },
        ],
        responses: {
          "200": { description: "Paginated list of users" },
          "401": { description: "Not authenticated" },
          "403": { description: "Not an admin" },
        },
      },
    },
    "/api/users/directory": {
      get: {
        tags: ["Users"],
        summary: "Names only — any logged-in user (use status=ACTIVE for assignee lists)",
        security: bearerAuth,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "status", in: "query", schema: { type: "string", enum: [...USER_STATUSES] } },
        ],
        responses: {
          "200": { description: "Paginated list of id and name" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/api/users/verify-credentials": {
      post: {
        tags: ["Users"],
        summary: "Verify email and password — internal only (called by auth-service at login)",
        security: internalKey,
        requestBody: jsonBody({ $ref: "#/components/schemas/VerifyCredentials" }),
        responses: {
          "200": { description: "Credentials valid, user returned" },
          "400": { description: "Validation failed" },
          "401": { description: "Invalid email or password" },
          "403": { description: "Missing or invalid internal key" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user by ID — internal key, admin, or own profile",
        security: [...bearerAuth, ...internalKey],
        parameters: [idParam],
        responses: {
          "200": { description: "User found" },
          "401": { description: "Not authenticated" },
          "403": { description: "Not allowed" },
          "404": { description: "Not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update name or role — admin only",
        security: bearerAuth,
        parameters: [idParam],
        requestBody: jsonBody({ $ref: "#/components/schemas/UpdateUser" }),
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Not an admin" },
          "404": { description: "Not found" },
          "409": { description: "Would remove last active admin" },
        },
      },
    },
    "/api/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Activate or deactivate a user — admin only",
        security: bearerAuth,
        parameters: [idParam],
        requestBody: jsonBody({ $ref: "#/components/schemas/UpdateStatus" }),
        responses: {
          "200": { description: "Status updated" },
          "400": { description: "Already in that status" },
          "403": { description: "Not an admin" },
          "404": { description: "Not found" },
          "409": { description: "Would remove last active admin" },
        },
      },
    },
  },
};
