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

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "User Service API",
    version: "1.0.0",
    description: "User accounts, roles and account status. Passwords are stored hashed.",
  },
  servers: [{ url: "http://localhost:5001" }],
  tags: [{ name: "Users" }],
  components: {
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
    },
  },
  paths: {
    "/api/users": {
      post: {
        tags: ["Users"],
        summary: "Create a user (password is hashed)",
        requestBody: jsonBody({ $ref: "#/components/schemas/CreateUser" }),
        responses: {
          "201": { description: "User created" },
          "400": { description: "Validation failed" },
          "409": { description: "Email already registered" },
        },
      },
      get: {
        tags: ["Users"],
        summary: "List users with filters and pagination",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "role", in: "query", schema: { type: "string", enum: [...ROLES] } },
          { name: "status", in: "query", schema: { type: "string", enum: [...USER_STATUSES] } },
        ],
        responses: { "200": { description: "Paginated list of users" } },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get a user by ID",
        parameters: [idParam],
        responses: { "200": { description: "User found" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Users"],
        summary: "Update name or role",
        parameters: [idParam],
        requestBody: jsonBody({ $ref: "#/components/schemas/UpdateUser" }),
        responses: { "200": { description: "Updated" }, "404": { description: "Not found" } },
      },
    },
    "/api/users/{id}/status": {
      patch: {
        tags: ["Users"],
        summary: "Activate or deactivate a user",
        parameters: [idParam],
        requestBody: jsonBody({ $ref: "#/components/schemas/UpdateStatus" }),
        responses: {
          "200": { description: "Status updated" },
          "400": { description: "Already in that status" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};
