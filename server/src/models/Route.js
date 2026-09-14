import mongoose from 'mongoose';

const stopSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    routeId: { type: String, required: true, unique: true }, // e.g. RT-001
    name: { type: String, required: true, trim: true }, // e.g. West Legon - Ashongman
    assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    stops: [stopSchema],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

routeSchema.virtual('studentCount').get(function studentCount() {
  return this.students?.length || 0;
});

routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

export default mongoose.model('Route', routeSchema);
