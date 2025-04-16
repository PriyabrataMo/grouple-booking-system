// Custom error types for the application

/**
 * Base API Error interface
 */
export interface ApiError {
  status?: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * API Response Error with typed data
 */
export interface ApiResponseError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
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
 * Get error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return "An unknown error occurred";
  }

  // Handle ApiResponseError type
  if (typeof error === "object" && error !== null) {
    const err = error as Partial<ApiResponseError>;

    // Try to get error message from response data
    if (err.response?.data?.message) {
      return err.response.data.message;
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
