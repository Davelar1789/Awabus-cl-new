import mongoose from 'mongoose';

const busSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true }, // e.g. "Bus A (Yellow Submarine)"
    type: {
      type: String,
      enum: ['Cruiser', 'Coaster', 'Standard', 'Mini'],
      default: 'Standard',
    },
    capacity: { type: Number, required: true },
    assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    status: { type: String, enum: ['Active', 'Idle', 'Maintenance'], default: 'Idle' },
    // Live GPS state used by the Live Tracking screen / driver app
    lastKnownLocation: {
      lat: Number,
      lng: Number,
      heading: Number,
      updatedAt: Date,
    },
    gpsSignal: { type: String, enum: ['ok', 'lost', 'offline'], default: 'offline' },
  },
  { timestamps: true }
);

busSchema.virtual('seatsFilled').get(function seatsFilled() {
  return this._seatsFilled || 0;
});

busSchema.set('toJSON', { virtuals: true });
busSchema.set('toObject', { virtuals: true });

export default mongoose.model('Bus', busSchema);
