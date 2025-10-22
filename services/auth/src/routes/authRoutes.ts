import { Router } from 'express';
import { 
  register, 
  login, 
  refreshAccessToken,
  getProfile,
  updateProfile,
  verifyEmail,
  requestPasswordReset,
  resetPassword
} from '../controllers/authController';

import { authenticate } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimitter';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh-token', refreshAccessToken);
router.post('/verify-email', verifyEmail);

// Protected routes (require authentication)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);


// Add these routes:
router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;


