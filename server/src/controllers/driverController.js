import asyncHandler from 'express-async-handler';
import Driver from '../models/Driver.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

const populateDriver = (query) =>
  query
    .populate('assignedBus', 'plateNumber name capacity')
    .populate('assignedRoute', 'routeId name');

// @desc    List drivers (search + pagination)
// @route   GET /api/drivers
export const getDrivers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query, 8);

  const filter = {};
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { licenseNumber: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    populateDriver(Driver.find(filter)).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Driver.countDocuments(filter),
  ]);

  res.json({ success: true, data: drivers, meta: buildPaginationMeta(total, page, limit) });
});

// @desc    Get driver profile (details + assignment history)
// @route   GET /api/drivers/:id
export const getDriverById = asyncHandler(async (req, res) => {
  const driver = await populateDriver(
    Driver.findById(req.params.id).populate({
      path: 'assignmentHistory.bus',
      select: 'plateNumber name',
    }).populate({
      path: 'assignmentHistory.route',
      select: 'routeId name',
    })
  );
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  res.json({ success: true, data: driver });
});

// @desc    Mock DVLA license validation (step 3 of the Add Driver wizard)
// @route   POST /api/drivers/validate-license
export const validateLicense = asyncHandler(async (req, res) => {
  const { licenseNumber, licenseExpiry } = req.body;

  if (!licenseNumber) {
    res.status(400);
    throw new Error('License number is required');
  }

  const errors = {};
  if (/invalid/i.test(licenseNumber)) {
    errors.licenseNumber = 'License number not found in DVLA database.';
  }
  if (licenseExpiry && new Date(licenseExpiry) < new Date()) {
    errors.licenseExpiry = "The entered driver's license has expired.";
  }

  const existing = await Driver.findOne({ licenseNumber });
  if (existing) {
    errors.licenseNumber = 'This license number is already registered to another driver.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(200).json({
      success: true,
      valid: false,
      message: 'DVLA records indicate mismatching or expired details for the provided license number.',
      errors,
    });
  }

  res.json({ success: true, valid: true, message: 'DVLA Verified' });
});

// @desc    Create driver (final step of Add Driver wizard)
// @route   POST /api/drivers
export const createDriver = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    dob,
    gender,
    profilePhotoUrl,
    licenseNumber,
    licenseExpiry,
    licenseClass,
    licenseValidation,
    assignedBus,
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    residentialAddress,
    status,
  } = req.body;

  if (!firstName || !lastName || !phone || !licenseNumber) {
    res.status(400);
    throw new Error('First name, last name, phone and license number are required');
  }
  if (!assignedBus) {
    res.status(400);
    throw new Error('A driver must be assigned to a bus — register a bus first if none exist yet');
  }

  const bus = await Bus.findById(assignedBus);
  if (!bus) {
    res.status(400);
    throw new Error('Selected bus was not found');
  }
  if (!bus.assignedRoute) {
    res.status(400);
    throw new Error('This bus is not yet assigned to a route — assign it to a route before assigning a driver');
  }

  // The driver's route is derived from the bus, not chosen independently —
  // a bus can only ever be on one route (enforced at bus creation), so this
  // is always correct and can never drift out of sync with the bus.
  const assignedRoute = bus.assignedRoute;

  const driver = await Driver.create({
    firstName,
    lastName,
    phone,
    email,
    dob,
    gender,
    profilePhotoUrl,
    licenseNumber,
    licenseExpiry,
    licenseClass,
    licenseValidation: licenseValidation || { status: 'verified', message: 'DVLA Verified', checkedAt: new Date() },
    assignedBus,
    assignedRoute,
    assignmentHistory: [{ bus: assignedBus, route: assignedRoute, from: new Date(), status: 'Active' }],
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    residentialAddress,
    status: status || 'Active',
  });

  await Bus.findByIdAndUpdate(assignedBus, { assignedDriver: driver._id });
  await Route.findByIdAndUpdate(assignedRoute, { assignedDriver: driver._id });

  const populated = await populateDriver(Driver.findById(driver._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update driver
// @route   PUT /api/drivers/:id
export const updateDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }

  const fields = [
    'firstName',
    'lastName',
    'phone',
    'email',
    'dob',
    'gender',
    'profilePhotoUrl',
    'licenseNumber',
    'licenseExpiry',
    'licenseClass',
    'emergencyContactName',
    'emergencyContactRelation',
    'emergencyContactPhone',
    'residentialAddress',
    'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) driver[f] = req.body[f];
  });

  const previousBus = driver.assignedBus ? String(driver.assignedBus) : null;
  const previousRoute = driver.assignedRoute ? String(driver.assignedRoute) : null;
  let busChanged = false;

  if (req.body.assignedBus !== undefined) {
    const newBusId = req.body.assignedBus || null;
    if (newBusId) {
      const bus = await Bus.findById(newBusId);
      if (!bus) {
        res.status(400);
        throw new Error('Selected bus was not found');
      }
      if (!bus.assignedRoute) {
        res.status(400);
        throw new Error('This bus is not yet assigned to a route — assign it to a route before assigning a driver');
      }
      driver.assignedBus = newBusId;
      // Derived from the bus, same as on creation — never chosen independently.
      driver.assignedRoute = bus.assignedRoute;
    } else {
      driver.assignedBus = null;
      driver.assignedRoute = null;
    }
    busChanged = newBusId !== previousBus;
  }

  await driver.save();

  if (busChanged) {
    if (previousBus) await Bus.findByIdAndUpdate(previousBus, { assignedDriver: null });
    if (previousRoute) await Route.findByIdAndUpdate(previousRoute, { assignedDriver: null });
    if (driver.assignedBus) {
      await Bus.findByIdAndUpdate(driver.assignedBus, { assignedDriver: driver._id });
      await Route.findByIdAndUpdate(driver.assignedRoute, { assignedDriver: driver._id });
    }
  }

  const populated = await populateDriver(Driver.findById(driver._id));
  res.json({ success: true, data: populated });
});

// @desc    Delete driver
// @route   DELETE /api/drivers/:id
export const deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    res.status(404);
    throw new Error('Driver not found');
  }
  await Promise.all([
    Bus.updateMany({ assignedDriver: driver._id }, { assignedDriver: null }),
    Route.updateMany({ assignedDriver: driver._id }, { assignedDriver: null }),
  ]);
  await driver.deleteOne();
  res.json({ success: true, message: 'Driver deleted' });
});

// @desc    Options list for selects (also used by Register Bus driver search)
// @route   GET /api/drivers/meta/options
export const getDriverOptions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { licenseNumber: { $regex: q, $options: 'i' } },
    ];
  }
  const drivers = await Driver.find(filter)
    .select('firstName lastName phone licenseNumber status assignedBus')
    .sort({ createdAt: 1 })
    .limit(50);
  res.json({ success: true, data: drivers });
});
