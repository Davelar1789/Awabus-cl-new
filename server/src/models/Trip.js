import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema(
  {
    time: { type: String, required: true }, // "06:43"
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const stopSchema = new mongoose.Schema(
  {
    name: String,
    order: Number,
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const studentProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    attendance: {
      type: String,
      enum: ['Present', 'Absent', 'Expected', 'Cancelled'],
      default: 'Expected',
    },
    alertStatus: { type: String, default: 'Not yet alerted' },
    alertTime: { type: String, default: '' },
    dropoffStatus: {
      type: String,
      enum: ['Pending', 'On board', 'Dropped off', 'Not on board', 'Boarding now'],
      default: 'Pending',
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripCode: { type: String, required: true, unique: true }, // TRP-0108
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },

    date: { type: Date, required: true },
    departureTime: { type: String, default: '' },
    arrivalTime: { type: String, default: '' },
    durationMinutes: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Delayed', 'Cancelled', 'Scheduled'],
      default: 'Scheduled',
    },

    stops: [stopSchema],
    timeline: [timelineEventSchema],
    studentProgress: [studentProgressSchema],

    // Live tracking fields for in-progress trips
    liveLocation: {
      lat: Number,
      lng: Number,
      heading: Number,
      updatedAt: Date,
    },
    gpsSignal: { type: String, enum: ['ok', 'lost', 'offline'], default: 'ok' },
    distanceCoveredKm: { type: Number, default: 0 },
    etaMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Trip', tripSchema);
