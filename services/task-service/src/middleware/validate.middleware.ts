import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../types/utils/AppError";

export const validate =
  (schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new AppError("Validation failed", 400, details));
    }

    req.body = result.data; // cleaned data (trimmed, defaults applied)
    next();
  };
