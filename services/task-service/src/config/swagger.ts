import { TASK_PRIORITIES, TASK_STATUSES } from "../types/task.types";

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export const swaggerSpec = {
  openapi: "3.0.0",
  security: [{ bearerAuth: [] }],
  info: {
    title: "Task Service API",
    version: "1.0.0",
    description:
      "Status flow: TODO → IN_PROGRESS → TO_BE_TESTED → TESTING_IN_PROGRESS → DONE. All endpoints require a Bearer access token.",
  },
  servers: [{ url: "http://localhost:4005" }],
  tags: [{ name: "Tasks" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: [...TASK_PRIORITIES] },
          status: { type: "string", enum: [...TASK_STATUSES] },
          assigneeId: { type: "string", format: "uuid" },
          createdBy: { type: "string", format: "uuid" },
          dueDate: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateTask: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Build login page" },
          description: { type: "string", example: "Create the login UI" },
          priority: { type: "string", enum: [...TASK_PRIORITIES], example: "HIGH" },
          assigneeId: { type: "string", format: "uuid", example: "00000000-0000-0000-0000-000000000001" },
          dueDate: { type: "string", example: "2026-11-30T10:00:00.000Z" },
        },
      },
    },
  },
  paths: {
    "/api/tasks": {
      post: {
        tags: ["Tasks"],
        summary: "Create a task (starts as TODO)",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateTask" } },
          },
        },
        responses: {
          "201": { description: "Task created" },
          "400": { description: "Validation failed" },
        },
      },
      get: {
        tags: ["Tasks"],
        summary: "List tasks with optional filters",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: [...TASK_STATUSES] } },
          { name: "priority", in: "query", schema: { type: "string", enum: [...TASK_PRIORITIES] } },
          { name: "assigneeId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "List of tasks" } },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Tasks"],
        summary: "Get a task by ID",
        parameters: [idParam],
        responses: { "200": { description: "Task found" }, "404": { description: "Not found" } },
      },
      put: {
        tags: ["Tasks"],
        summary: "Update task details (not status)",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateTask" } },
          },
        },
        responses: { "200": { description: "Updated" }, "404": { description: "Not found" } },
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        parameters: [idParam],
        responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/tasks/{id}/status": {
      patch: {
        tags: ["Tasks"],
        summary: "Move task to the next status in the workflow",
        parameters: [idParam],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: [...TASK_STATUSES], example: "IN_PROGRESS" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Status updated" },
          "400": { description: "Invalid status transition" },
          "404": { description: "Not found" },
        },
      },
    },
  },
};
