import jwt from 'jsonwebtoken';

export const generateToken = (id, type = 'admin') =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export default generateToken;
