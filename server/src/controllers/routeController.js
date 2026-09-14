import asyncHandler from 'express-async-handler';
import Route from '../models/Route.js';
import Bus from '../models/Bus.js';
import Driver from '../models/Driver.js';
import Student from '../models/Student.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { nextSequentialCode } from '../utils/idGenerator.js';

const populateRoute = (query) =>
  query
    .populate('assignedDriver', 'firstName lastName phone')
    .populate('assignedBus', 'plateNumber name capacity')
    .populate('students', 'firstName lastName studentCode');

// @desc    List routes (search + status filter + pagination)
// @route   GET /api/routes
export const getRoutes = asyncHandler(async (req, res) => {
  const { q, status } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { routeId: { $regex: q, $options: 'i' } },
      { name: { $regex: q, $options: 'i' } },
    ];
  }

  const [routes, total] = await Promise.all([
    populateRoute(Route.find(filter)).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Route.countDocuments(filter),
  ]);

  res.json({ success: true, data: routes, meta: buildPaginationMeta(total, page, limit) });
});

// @desc    Get single route
// @route   GET /api/routes/:id
export const getRouteById = asyncHandler(async (req, res) => {
  const route = await populateRoute(Route.findById(req.params.id));
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }
  res.json({ success: true, data: route });
});

// @desc    Create route
// @route   POST /api/routes
export const createRoute = asyncHandler(async (req, res) => {
  const { name, assignedBus, assignedDriver, students, stops, status } = req.body;
  if (!name) {
    res.status(400);
    throw new Error('Route name is required');
  }

  const routeId = await nextSequentialCode(Route, 'routeId', 'RT-', 3);

  const route = await Route.create({
    routeId,
    name,
    assignedBus: assignedBus || null,
    assignedDriver: assignedDriver || null,
    students: students || [],
    stops: stops || [],
    status: status || 'Active',
  });

  if (assignedBus) await Bus.findByIdAndUpdate(assignedBus, { assignedRoute: route._id });
  if (assignedDriver) await Driver.findByIdAndUpdate(assignedDriver, { assignedRoute: route._id });
  if (students?.length) await Student.updateMany({ _id: { $in: students } }, { route: route._id });

  const populated = await populateRoute(Route.findById(route._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update route
// @route   PUT /api/routes/:id
export const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }

  const { name, assignedBus, assignedDriver, students, stops, status } = req.body;
  if (name !== undefined) route.name = name;
  if (assignedBus !== undefined) route.assignedBus = assignedBus || null;
  if (assignedDriver !== undefined) route.assignedDriver = assignedDriver || null;
  if (students !== undefined) route.students = students;
  if (stops !== undefined) route.stops = stops;
  if (status !== undefined) route.status = status;

  await route.save();

  if (assignedBus) await Bus.findByIdAndUpdate(assignedBus, { assignedRoute: route._id });
  if (assignedDriver) await Driver.findByIdAndUpdate(assignedDriver, { assignedRoute: route._id });
  if (students?.length) await Student.updateMany({ _id: { $in: students } }, { route: route._id });

  const populated = await populateRoute(Route.findById(route._id));
  res.json({ success: true, data: populated });
});

// @desc    Delete route
// @route   DELETE /api/routes/:id
export const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) {
    res.status(404);
    throw new Error('Route not found');
  }
  await Promise.all([
    Bus.updateMany({ assignedRoute: route._id }, { assignedRoute: null }),
    Driver.updateMany({ assignedRoute: route._id }, { assignedRoute: null }),
    Student.updateMany({ route: route._id }, { route: null }),
  ]);
  await route.deleteOne();
  res.json({ success: true, message: 'Route deleted' });
});

// @desc    Lightweight options list for selects (id + name + status)
// @route   GET /api/routes/meta/options
export const getRouteOptions = asyncHandler(async (req, res) => {
  const routes = await Route.find().select('routeId name status').sort({ createdAt: 1 });
  res.json({ success: true, data: routes });
});
