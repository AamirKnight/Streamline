import { Router } from 'express';
import { register, login, refreshAccessToken } from '../controllers/authController';

const router = Router();
import { loginRateLimiter } from '../middleware/rateLimitter';

router.post('/login', loginRateLimiter, login);
router.post('/register', register);
router.post('/refresh-token', refreshAccessToken);

export default router;