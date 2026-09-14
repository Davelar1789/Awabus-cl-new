import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Admin from '../models/Admin.js';
import Driver from '../models/Driver.js';

// Protects Admin Portal routes. Expects: Authorization: Bearer <token>
export const protectAdmin = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'admin') {
      res.status(401);
      throw new Error('Not authorized for admin portal');
    }
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      res.status(401);
      throw new Error('Admin account no longer exists');
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token failed or expired');
  }
});

// Protects Driver App routes (server API is ready even though the driver app UI is not built yet).
export const protectDriver = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'driver') {
      res.status(401);
      throw new Error('Not authorized for driver app');
    }
    const driver = await Driver.findById(decoded.id);
    if (!driver) {
      res.status(401);
      throw new Error('Driver account no longer exists');
    }
    req.driver = driver;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token failed or expired');
  }
});
