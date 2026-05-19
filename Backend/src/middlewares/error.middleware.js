import ApiError from "../utils/ApiError.js";
import { isProduction } from "../config/env.js";

export const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
    ...(isProduction ? {} : { stack: err.stack }),
  });
};
