import express from 'express';
import {
  checkDriverPhone,
  setDriverPassword,
  driverLogin,
  driverForgotPassword,
  driverVerifyOtp,
  driverResendOtp,
  driverResetPassword,
  getDriverMe,
  getTodaysTrip,
  startTrip,
  endTrip,
  pushLocation,
  markAttendance,
  sendDelayBroadcast,
  getTripHistory,
  getTripByIdForDriver,
  getBroadcastHistory,
  getDriverNotifications,
} from '../controllers/driverAppController.js';
import { protectDriver } from '../middleware/auth.js';
import { authLimits } from '../middleware/rateLimit.js';

const router = express.Router();

// Public
router.post('/auth/check-phone', ...authLimits.lookup, checkDriverPhone);
router.post('/auth/set-password', ...authLimits.signIn, setDriverPassword);
router.post('/auth/login', ...authLimits.signIn, driverLogin);
router.post('/auth/forgot-password', ...authLimits.sendCode('phone'), driverForgotPassword);
router.post('/auth/verify-otp', ...authLimits.checkCode, driverVerifyOtp);
router.post('/auth/resend-otp', ...authLimits.sendCode('phone'), driverResendOtp);
router.post('/auth/reset-password', ...authLimits.checkCode, driverResetPassword);

// Protected
router.get('/me', protectDriver, getDriverMe);
router.get('/notifications', protectDriver, getDriverNotifications);
router.get('/trips/today', protectDriver, getTodaysTrip);
router.get('/trips', protectDriver, getTripHistory);
router.get('/trips/:id', protectDriver, getTripByIdForDriver);
router.post('/trips/:id/start', protectDriver, startTrip);
router.post('/trips/:id/end', protectDriver, endTrip);
router.post('/trips/:id/location', protectDriver, pushLocation);
router.post('/trips/:id/students/:studentId/attendance', protectDriver, markAttendance);
router.post('/trips/:id/delay-broadcast', protectDriver, sendDelayBroadcast);
router.get('/broadcasts', protectDriver, getBroadcastHistory);

export default router;
