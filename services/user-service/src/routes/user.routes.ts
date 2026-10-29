import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { validate } from "../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
} from "../validators/user.validator";

const router = Router();

router.post("/", validate(createUserSchema), userController.create);
router.get("/", userController.getAll);
router.get("/:id", userController.getById);
router.put("/:id", validate(updateUserSchema), userController.update);
router.patch("/:id/status", validate(updateStatusSchema), userController.updateStatus);

export default router;
