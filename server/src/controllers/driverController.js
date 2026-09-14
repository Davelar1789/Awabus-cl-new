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
    assignedRoute,
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
    assignedBus: assignedBus || null,
    assignedRoute: assignedRoute || null,
    assignmentHistory: assignedBus
      ? [{ bus: assignedBus, route: assignedRoute || null, from: new Date(), status: 'Active' }]
      : [],
    emergencyContactName,
    emergencyContactRelation,
    emergencyContactPhone,
    residentialAddress,
    status: status || 'Active',
  });

  if (assignedBus) await Bus.findByIdAndUpdate(assignedBus, { assignedDriver: driver._id });
  if (assignedRoute) await Route.findByIdAndUpdate(assignedRoute, { assignedDriver: driver._id });

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
  if (req.body.assignedBus !== undefined) driver.assignedBus = req.body.assignedBus || null;
  if (req.body.assignedRoute !== undefined) driver.assignedRoute = req.body.assignedRoute || null;

  await driver.save();

  if (req.body.assignedBus) await Bus.findByIdAndUpdate(req.body.assignedBus, { assignedDriver: driver._id });
  if (req.body.assignedRoute) await Route.findByIdAndUpdate(req.body.assignedRoute, { assignedDriver: driver._id });

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
