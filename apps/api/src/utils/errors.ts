/**
 * Custom API error classes for consistent error handling
 */

// Base API Error class that all our custom errors will extend
export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]> | undefined;
  details?: Record<string, any> | undefined;

  constructor(
    message: string,
    status: number = 500,
    errors?: Record<string, string[]> | undefined,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errors = errors;
    this.details = details;

    // Maintains proper stack trace for where the error was thrown (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Method to format the error for API response
  toJSON() {
    return {
      message: this.message,
      status: this.status,
      ...(this.errors && { errors: this.errors }),
      ...(this.details && { details: this.details }),
      timestamp: new Date().toISOString(),
    };
  }
}

// 400 Bad Request - For validation errors
export class BadRequestError extends ApiError {
  constructor(
    message: string = "Bad Request",
    errors?: Record<string, string[]>,
    details?: Record<string, any>
  ) {
    super(message, 400, errors, details);
  }
}

// 401 Unauthorized - For authentication errors
export class UnauthorizedError extends ApiError {
  constructor(
    message: string = "Authentication required",
    details?: Record<string, any>
  ) {
    super(message, 401, undefined, details);
  }
}

// 403 Forbidden - For authorization errors
export class ForbiddenError extends ApiError {
  constructor(
    message: string = "Permission denied",
    details?: Record<string, any>
  ) {
    super(message, 403, undefined, details);
  }
}

// 404 Not Found - For resource not found errors
export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource", details?: Record<string, any>) {
    super(`${resource} not found`, 404, undefined, details);
  }
}

// 409 Conflict - For resource conflicts (e.g., duplicate entries)
export class ConflictError extends ApiError {
  constructor(
    message: string = "Resource already exists",
    details?: Record<string, any>
  ) {
    super(message, 409, undefined, details);
  }
}

// 422 Unprocessable Entity - For semantic validation errors
export class ValidationError extends ApiError {
  constructor(
    message: string = "Validation error",
    errors?: Record<string, string[]>,
    details?: Record<string, any>
  ) {
    super(message, 422, errors, details);
  }
}

// 500 Internal Server Error - For unexpected server errors
export class InternalServerError extends ApiError {
  constructor(
    message: string = "Internal Server Error",
    details?: Record<string, any>
  ) {
    super(message, 500, undefined, details);
  }
}

// Factory function to create error objects from generic errors
export const createApiError = (err: unknown): ApiError => {
  if (err instanceof ApiError) {
    return err;
  }

  // Handle Sequelize errors
  if (err && typeof err === "object" && "name" in err) {
    const error = err as any;

    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err: any) => {
        if (!errors[err.path]) {
          errors[err.path] = [];
        }
        if (errors[err.path]) {
          (errors[err.path] as string[]).push(err.message);
        }
      });

      return new ValidationError("Validation error", errors, {
        type: error.name,
      });
    }

    if (error.name === "SequelizeDatabaseError") {
      return new InternalServerError("Database error", {
        originalError: error.original?.message || error.message,
      });
    }

    if (error.name === "SequelizeConnectionError") {
      return new InternalServerError("Database connection error");
    }
  }

  // Default to InternalServerError for unknown errors
  return new InternalServerError(
    err instanceof Error ? err.message : "Unknown error"
  );
};

// Global error handler middleware for Express
export const errorHandler = (err: Error, _req: any, res: any, _next: any) => {
  console.error("Error:", err);

  // Convert error to ApiError
  const apiError = createApiError(err);

  // Log detailed error info in non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.error({
      message: apiError.message,
      stack: apiError.stack,
      details: apiError.details,
      errors: apiError.errors,
    });
  }

  // Return JSON response with error details
  return res.status(apiError.status).json(apiError.toJSON());
};
