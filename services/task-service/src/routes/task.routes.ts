import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createTaskSchema,
  updateStatusSchema,
  updateTaskSchema,
} from "../validators/task.validator";

const router = Router();

// Every task endpoint needs a valid access token
router.use(authenticate);

// Viewing: every role
router.get("/", taskController.getAll);
router.get("/:id", taskController.getById);

// Creating, editing, deleting: admin and manager (service adds ownership check)
router.post("/", requireRole("ADMIN", "MANAGER"), validate(createTaskSchema), taskController.create);
router.put("/:id", requireRole("ADMIN", "MANAGER"), validate(updateTaskSchema), taskController.update);
router.delete("/:id", requireRole("ADMIN", "MANAGER"), taskController.delete);

// Status: every role — the service decides who may change which task
router.patch("/:id/status", validate(updateStatusSchema), taskController.updateStatus);

export default router;
