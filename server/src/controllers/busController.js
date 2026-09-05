import asyncHandler from 'express-async-handler';
import Bus from '../models/Bus.js';
import Driver from '../models/Driver.js';
import Route from '../models/Route.js';
import Student from '../models/Student.js';
import Trip from '../models/Trip.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';

const populateBus = (query) =>
  query
    .populate('assignedRoute', 'routeId name')
    .populate('assignedDriver', 'firstName lastName phone');

// @desc    List buses (search + status filter + pagination) + fleet stats
// @route   GET /api/buses
export const getBuses = asyncHandler(async (req, res) => {
  const { q, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status && status !== 'All') filter.status = status;
  if (q) {
    filter.$or = [
      { plateNumber: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }

  const [buses, total, totalBuses, maintenance, idle] = await Promise.all([
    populateBus(Bus.find(filter)).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Bus.countDocuments(filter),
    Bus.countDocuments(),
    Bus.countDocuments({ status: 'Maintenance' }),
    Bus.countDocuments({ status: 'Idle' }),
  ]);

  // Attach seats filled (student count) per bus for the capacity column.
  const busIds = buses.map((b) => b._id);
  const counts = await Student.aggregate([
    { $match: { bus: { $in: busIds } } },
    { $group: { _id: '$bus', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = buses.map((b) => {
    const obj = b.toObject();
    obj.seatsFilled = countMap.get(String(b._id)) || 0;
    return obj;
  });

  res.json({
    success: true,
    data,
    meta: buildPaginationMeta(total, page, limit),
    stats: { totalBuses, maintenance, idle },
  });
});

// @desc    Get bus profile (specs + recent trips)
// @route   GET /api/buses/:id
export const getBusById = asyncHandler(async (req, res) => {
  const bus = await populateBus(Bus.findById(req.params.id));
  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }
  const recentTrips = await Trip.find({ bus: bus._id })
    .populate('route', 'routeId name')
    .sort({ date: -1 })
    .limit(10);
  res.json({ success: true, data: bus, recentTrips });
});

// @desc    Register a new bus
// @route   POST /api/buses
export const createBus = asyncHandler(async (req, res) => {
  const { plateNumber, name, type, capacity, assignedRoute, assignedDriver, status } = req.body;
  if (!plateNumber || !name || !capacity) {
    res.status(400);
    throw new Error('Plate number, name and capacity are required');
  }

  const bus = await Bus.create({
    plateNumber,
    name,
    type: type || 'Standard',
    capacity,
    assignedRoute: assignedRoute || null,
    assignedDriver: assignedDriver || null,
    status: status || 'Idle',
  });

  if (assignedRoute) await Route.findByIdAndUpdate(assignedRoute, { assignedBus: bus._id });
  if (assignedDriver) await Driver.findByIdAndUpdate(assignedDriver, { assignedBus: bus._id });

  const populated = await populateBus(Bus.findById(bus._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update bus
// @route   PUT /api/buses/:id
export const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }

  const fields = ['plateNumber', 'name', 'type', 'capacity', 'status'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) bus[f] = req.body[f];
  });
  if (req.body.assignedRoute !== undefined) bus.assignedRoute = req.body.assignedRoute || null;
  if (req.body.assignedDriver !== undefined) bus.assignedDriver = req.body.assignedDriver || null;

  await bus.save();

  if (req.body.assignedRoute) await Route.findByIdAndUpdate(req.body.assignedRoute, { assignedBus: bus._id });
  if (req.body.assignedDriver) await Driver.findByIdAndUpdate(req.body.assignedDriver, { assignedBus: bus._id });

  const populated = await populateBus(Bus.findById(bus._id));
  res.json({ success: true, data: populated });
});

// @desc    Delete bus
// @route   DELETE /api/buses/:id
export const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) {
    res.status(404);
    throw new Error('Bus not found');
  }
  await Promise.all([
    Route.updateMany({ assignedBus: bus._id }, { assignedBus: null }),
    Driver.updateMany({ assignedBus: bus._id }, { assignedBus: null }),
    Student.updateMany({ bus: bus._id }, { bus: null }),
  ]);
  await bus.deleteOne();
  res.json({ success: true, message: 'Bus deleted' });
});

// @desc    Options list for selects
// @route   GET /api/buses/meta/options
export const getBusOptions = asyncHandler(async (req, res) => {
  const buses = await Bus.find().select('plateNumber name capacity status').sort({ createdAt: 1 });
  res.json({ success: true, data: buses });
});
