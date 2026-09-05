// Driver App API (mobile) — the AwaBus driver app UI itself has not been built yet,
// but the backend surface it will talk to is ready here so the mobile client
// (in /driver) can be wired up without further server changes.

import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import Driver from '../models/Driver.js';
import Trip from '../models/Trip.js';
import Bus from '../models/Bus.js';
import generateToken from '../utils/generateToken.js';

// @desc    Driver app sign in
// @route   POST /api/driver-app/auth/login
export const driverLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400);
    throw new Error('Phone number and password are required');
  }

  const driver = await Driver.findOne({ phone }).select('+password');
  if (!driver || !driver.password) {
    res.status(401);
    throw new Error('Invalid phone number or password');
  }
  const match = await bcrypt.compare(password, driver.password);
  if (!match) {
    res.status(401);
    throw new Error('Invalid phone number or password');
  }

  res.json({
    success: true,
    token: generateToken(driver._id, 'driver'),
    driver: { id: driver._id, name: `${driver.firstName} ${driver.lastName}`, phone: driver.phone },
  });
});

// @desc    Get logged-in driver profile + assignment
// @route   GET /api/driver-app/me
export const getDriverMe = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver._id)
    .populate('assignedBus', 'plateNumber name capacity')
    .populate('assignedRoute', 'routeId name stops');
  res.json({ success: true, data: driver });
});

// @desc    Get today's scheduled/active trip for the logged-in driver
// @route   GET /api/driver-app/trips/today
export const getTodaysTrip = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const trip = await Trip.findOne({
    driver: req.driver._id,
    date: { $gte: start, $lte: end },
  })
    .populate('route', 'routeId name stops')
    .populate('bus', 'plateNumber name capacity')
    .populate('studentProgress.student', 'firstName lastName studentCode');

  res.json({ success: true, data: trip });
});

// @desc    Start a trip
// @route   POST /api/driver-app/trips/:id/start
export const startTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  trip.status = 'In Progress';
  trip.departureTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  trip.timeline.push({
    time: trip.departureTime,
    title: 'Trip started',
    description: 'Departure from main bus lot, vehicle check passed.',
  });
  await trip.save();
  await Bus.findByIdAndUpdate(trip.bus, { status: 'Active', gpsSignal: 'ok' });

  req.app.get('io')?.emit('trip:started', { tripId: trip._id, busId: trip.bus });
  res.json({ success: true, data: trip });
});

// @desc    End a trip
// @route   POST /api/driver-app/trips/:id/end
export const endTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }
  trip.status = 'Completed';
  trip.arrivalTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  await trip.save();
  await Bus.findByIdAndUpdate(trip.bus, { status: 'Idle' });

  req.app.get('io')?.emit('trip:ended', { tripId: trip._id, busId: trip.bus });
  res.json({ success: true, data: trip });
});

// @desc    Push a GPS location update while a trip is in progress
// @route   POST /api/driver-app/trips/:id/location
export const pushLocation = asyncHandler(async (req, res) => {
  const { lat, lng, heading } = req.body;
  if (lat === undefined || lng === undefined) {
    res.status(400);
    throw new Error('lat and lng are required');
  }

  const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  const location = { lat, lng, heading: heading || 0, updatedAt: new Date() };
  trip.liveLocation = location;
  trip.gpsSignal = 'ok';
  await trip.save();
  await Bus.findByIdAndUpdate(trip.bus, { lastKnownLocation: location, gpsSignal: 'ok' });

  req.app.get('io')?.emit('bus:location', { tripId: trip._id, busId: trip.bus, location });
  res.json({ success: true, data: location });
});

// @desc    Mark a student's attendance/drop-off status for the active trip
// @route   POST /api/driver-app/trips/:id/students/:studentId/attendance
export const markAttendance = asyncHandler(async (req, res) => {
  const { attendance, dropoffStatus } = req.body;
  const trip = await Trip.findOne({ _id: req.params.id, driver: req.driver._id });
  if (!trip) {
    res.status(404);
    throw new Error('Trip not found');
  }

  const progress = trip.studentProgress.find((p) => String(p.student) === req.params.studentId);
  if (!progress) {
    res.status(404);
    throw new Error('Student is not on this trip roster');
  }
  if (attendance) progress.attendance = attendance;
  if (dropoffStatus) progress.dropoffStatus = dropoffStatus;
  progress.alertStatus = 'Alert sent';
  progress.alertTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  await trip.save();
  req.app.get('io')?.emit('trip:studentUpdate', { tripId: trip._id, studentId: req.params.studentId, progress });
  res.json({ success: true, data: progress });
});
