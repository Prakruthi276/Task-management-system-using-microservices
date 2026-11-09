import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/utils/AppError";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error(err); // log the real error, never leak it to the client
  return res.status(500).json({ success: false, message: "Internal server error" });
};
