// Validation utility functions for input fields

/**
 * Password strength requirements:
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export const isStrongPassword = (password: string): boolean => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  return (
    minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
  );
};

/**
 * Get detailed password strength feedback
 */
export const getPasswordStrengthFeedback = (password: string): string[] => {
  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    feedback.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    feedback.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    feedback.push("Password must contain at least one special character");
  }

  return feedback;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate username (alphanumeric, underscore, 3-20 chars)
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * Sanitize input to prevent XSS attacks (basic implementation)
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
};
