import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import taskRoutes from "./routes/task.routes";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "task-service" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/tasks", taskRoutes);

// These must come last: 404 first, then the error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
