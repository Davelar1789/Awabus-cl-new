import express from 'express';
import {
  login,
  getMe,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
} from '../controllers/authController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protectAdmin, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);

export default router;
