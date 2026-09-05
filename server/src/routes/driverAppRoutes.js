import express from 'express';
import {
  driverLogin,
  getDriverMe,
  getTodaysTrip,
  startTrip,
  endTrip,
  pushLocation,
  markAttendance,
} from '../controllers/driverAppController.js';
import { protectDriver } from '../middleware/auth.js';

const router = express.Router();

// Public
router.post('/auth/login', driverLogin);

// Protected (driver app UI is not built yet, but the API contract is ready)
router.get('/me', protectDriver, getDriverMe);
router.get('/trips/today', protectDriver, getTodaysTrip);
router.post('/trips/:id/start', protectDriver, startTrip);
router.post('/trips/:id/end', protectDriver, endTrip);
router.post('/trips/:id/location', protectDriver, pushLocation);
router.post('/trips/:id/students/:studentId/attendance', protectDriver, markAttendance);

export default router;
