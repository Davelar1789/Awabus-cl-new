import express from 'express';
import {
  login,
  getMe,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  checkEmail,
  setPassword,
} from '../controllers/authController.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protectAdmin, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/check-email', checkEmail);
router.post('/set-password', setPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/reset-password', resetPassword);

export default router;
