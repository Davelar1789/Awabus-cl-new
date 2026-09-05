import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import busRoutes from './routes/busRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import guardianRoutes from './routes/guardianRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import driverAppRoutes from './routes/driverAppRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'AwaBus API is running' }));

// Admin Portal API
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/tracking', trackingRoutes);

// Driver App API (mobile client not built yet, API is ready)
app.use('/api/driver-app', driverAppRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
