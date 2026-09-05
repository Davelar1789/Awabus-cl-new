import asyncHandler from 'express-async-handler';
import Student from '../models/Student.js';
import Guardian from '../models/Guardian.js';
import Route from '../models/Route.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { nextYearCode } from '../utils/idGenerator.js';

const populateStudent = (query) =>
  query
    .populate('primaryGuardian')
    .populate('route', 'routeId name')
    .populate({
      path: 'bus',
      select: 'plateNumber name assignedDriver',
      populate: { path: 'assignedDriver', select: 'firstName lastName' },
    });

// @desc    List students (search + pagination) + directory stats
// @route   GET /api/students
export const getStudents = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const { page, limit, skip } = getPagination(req.query, 8);

  const filter = {};
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { studentCode: { $regex: q, $options: 'i' } },
    ];
  }

  const [students, total, totalStudents, male, female, guardianCount] = await Promise.all([
    populateStudent(Student.find(filter)).sort({ createdAt: 1 }).skip(skip).limit(limit),
    Student.countDocuments(filter),
    Student.countDocuments(),
    Student.countDocuments({ gender: 'Male' }),
    Student.countDocuments({ gender: 'Female' }),
    Guardian.countDocuments(),
  ]);

  res.json({
    success: true,
    data: students,
    meta: buildPaginationMeta(total, page, limit),
    stats: { totalStudents, male, female, guardianCount },
  });
});

// @desc    Get student profile
// @route   GET /api/students/:id
export const getStudentById = asyncHandler(async (req, res) => {
  const student = await populateStudent(Student.findById(req.params.id));
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json({ success: true, data: student });
});

// @desc    Create student (final step of Add Student wizard)
// @route   POST /api/students
export const createStudent = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    dob,
    gender,
    classGrade,
    profilePhotoUrl,
    guardian, // { id? , firstName, lastName, relation, phone, email }
    secondContactName,
    secondContactPhone,
    emergencyInstructions,
    route,
    bus,
    pickupPoint,
    dropoffPoint,
    pickupTime,
    dropoffTime,
    homeAddress,
    geofenceRadius,
    lat,
    lng,
  } = req.body;

  if (!firstName || !lastName) {
    res.status(400);
    throw new Error('First name and last name are required');
  }

  let guardianId = guardian?.id || null;
  if (!guardianId && guardian?.phone) {
    const created = await Guardian.create({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relation: guardian.relation || 'Guardian',
      phone: guardian.phone,
      email: guardian.email,
    });
    guardianId = created._id;
  }

  const studentCode = await nextYearCode(Student, 'studentCode', 'ST', new Date().getFullYear(), 3);

  const student = await Student.create({
    studentCode,
    firstName,
    lastName,
    dob,
    gender,
    classGrade,
    profilePhotoUrl,
    primaryGuardian: guardianId,
    secondContactName,
    secondContactPhone,
    emergencyInstructions,
    route: route || null,
    bus: bus || null,
    pickupPoint,
    dropoffPoint,
    pickupTime,
    dropoffTime,
    homeAddress,
    geofenceRadius,
    lat,
    lng,
  });

  if (route) await Route.findByIdAndUpdate(route, { $addToSet: { students: student._id } });

  const populated = await populateStudent(Student.findById(student._id));
  res.status(201).json({ success: true, data: populated });
});

// @desc    Update student (also used by the geofence-picker Edit Student screen)
// @route   PUT /api/students/:id
export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const fields = [
    'firstName',
    'lastName',
    'dob',
    'gender',
    'classGrade',
    'profilePhotoUrl',
    'secondContactName',
    'secondContactPhone',
    'emergencyInstructions',
    'pickupPoint',
    'dropoffPoint',
    'pickupTime',
    'dropoffTime',
    'homeAddress',
    'geofenceRadius',
    'lat',
    'lng',
    'status',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) student[f] = req.body[f];
  });

  if (req.body.route !== undefined) {
    if (student.route && String(student.route) !== String(req.body.route)) {
      await Route.findByIdAndUpdate(student.route, { $pull: { students: student._id } });
    }
    student.route = req.body.route || null;
    if (req.body.route) await Route.findByIdAndUpdate(req.body.route, { $addToSet: { students: student._id } });
  }
  if (req.body.bus !== undefined) student.bus = req.body.bus || null;

  if (req.body.guardian) {
    const g = req.body.guardian;
    if (g.id) {
      await Guardian.findByIdAndUpdate(g.id, {
        firstName: g.firstName,
        lastName: g.lastName,
        phone: g.phone,
        email: g.email,
      });
      student.primaryGuardian = g.id;
    } else if (g.phone) {
      const created = await Guardian.create({
        firstName: g.firstName,
        lastName: g.lastName,
        relation: g.relation || 'Guardian',
        phone: g.phone,
        email: g.email,
      });
      student.primaryGuardian = created._id;
    }
  }

  await student.save();

  const populated = await populateStudent(Student.findById(student._id));
  res.json({ success: true, data: populated });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  if (student.route) await Route.findByIdAndUpdate(student.route, { $pull: { students: student._id } });
  await student.deleteOne();
  res.json({ success: true, message: 'Student deleted' });
});

// @desc    Options list for selects / route builder multi-select search
// @route   GET /api/students/meta/options
export const getStudentOptions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
      { studentCode: { $regex: q, $options: 'i' } },
    ];
  }
  const students = await Student.find(filter)
    .select('firstName lastName studentCode classGrade route')
    .sort({ createdAt: 1 })
    .limit(50);
  res.json({ success: true, data: students });
});
