import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, requireRole } from "../middleware/auth.middleware";
import { internalOrAuthenticated, requireAdminSelfOrInternal } from "../middleware/access.middleware";
import { requireInternalKey } from "../middleware/internalKey.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  verifyCredentialsSchema,
} from "../validators/user.validator";

const router = Router();

// Internal only: called by the Auth service, never by a browser
router.post("/", requireInternalKey, validate(createUserSchema), userController.create);
router.post(
  "/verify-credentials",
  requireInternalKey,
  validate(verifyCredentialsSchema),
  userController.verifyCredentials
);

// Any logged-in user: id + name only. Must be declared before /:id
router.get("/directory", authenticate, userController.getDirectory);

// Admin only: full user list
router.get("/", authenticate, requireRole("ADMIN"), userController.getAll);

// A service (internal key), an admin, or the user looking at their own record
router.get("/:id", internalOrAuthenticated, requireAdminSelfOrInternal, userController.getById);

// Admin only: the most sensitive endpoints
router.put("/:id", authenticate, requireRole("ADMIN"), validate(updateUserSchema), userController.update);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  validate(updateStatusSchema),
  userController.updateStatus
);

export default router;
