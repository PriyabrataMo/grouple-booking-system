// Custom error types for the application

/**
 * Base App Error interface - foundation for all app errors
 */
export interface AppError {
  name: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
  errors?: Record<string, string[]>;
}

/**
 * API Error interface with standardized structure
 */
export interface ApiError extends AppError {
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * API Response Error with typed response data
 */
export interface ApiResponseError {
  name?: string;
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
      details?: Record<string, unknown>;
    };
    status?: number;
  };
  message: string;
}

/**
 * Validation Error for form data
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Standardized Error Response from API
 */
export interface ErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

/**
 * Custom base error class for the application
 */
export class ApplicationError extends Error implements AppError {
  status?: number;
  details?: Record<string, unknown>;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status?: number,
    details?: Record<string, unknown>,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.errors = errors;

    // Maintains proper stack trace for where the error was thrown (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Get standardized error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unknown error occurred";
  }

  // Handle ApplicationError instances
  if (error instanceof ApplicationError) {
    return error.message;
  }

  // Handle ApiResponseError type
  if (typeof error === "object" && error !== null) {
    const err = error as Partial<ApiResponseError>;

    // Try to get error message from response data
    if (err.response?.data?.message) {
      return err.response.data.message;
    }

    // Try to get error message from HTTP status
    if (err.response?.status) {
      switch (err.response.status) {
        case 400:
          return "Bad request - please check your input";
        case 401:
          return "Authentication required - please log in";
        case 403:
          return "You don't have permission to perform this action";
        case 404:
          return "The requested resource was not found";
        case 409:
          return "Conflict with existing data";
        case 422:
          return "Validation error - please check your input";
        case 500:
          return "Server error - please try again later";
        default:
          return err.message || `Error ${err.response.status}`;
      }
    }

    // Fallback to error message
    if (err.message) {
      return err.message;
    }
  }

  // Convert to string for unknown error types
  if (typeof error === "string") {
    return error;
  }

  return "An unknown error occurred";
}

/**
 * Format validation errors for form display
 */
export function formatValidationErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  if (!error) return result;

  if (typeof error === "object" && error !== null) {
    const err = error as ApiResponseError;

    // Extract validation errors if present
    if (err.response?.data?.errors) {
      const errors = err.response.data.errors;

      // Convert array of errors by field to single message
      Object.keys(errors).forEach((field) => {
        if (Array.isArray(errors[field]) && errors[field].length > 0) {
          result[field] = errors[field][0];
        }
      });
    }
  }

  return result;
}

/**
 * Determine if an error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const err = error as ApiResponseError;
    return err.response?.status === 401;
  }
  return false;
}

/**
 * Determine if an error is a permissions error (403)
 */
export function isPermissionError(error: unknown): boolean {
  if (typeof error === "object" && error !== null) {
    const err = error as ApiResponseError;
    return err.response?.status === 403;
  }
  return false;
}
