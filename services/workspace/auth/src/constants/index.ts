export const ERROR_MESSAGES = {
  INVALID_EMAIL: 'Invalid email format',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_PASSWORD: 'Invalid email or password',
  INVALID_TOKEN: 'Invalid or expired token',
  UNAUTHORIZED: 'Unauthorized - Please login',
  FORBIDDEN: 'Forbidden - Insufficient permissions',
  VALIDATION_ERROR: 'Validation error',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  EMAIL_NOT_VERIFIED: 'Please verify your email first',
  PASSWORD_RESET_SENT: 'If that email exists, a reset link has been sent',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  PROFILE_UPDATED: 'Profile updated successfully',
};

export const SUCCESS_MESSAGES = {
  REGISTRATION_SUCCESS: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};