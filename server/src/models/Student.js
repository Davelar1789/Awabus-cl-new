import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentCode: { type: String, required: true, unique: true }, // e.g. ST-2026-089
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dob: Date,
    gender: { type: String, enum: ['Male', 'Female'] },
    classGrade: { type: String, trim: true }, // e.g. "Primary 4B"
    profilePhotoUrl: { type: String, default: '' },

    // Guardian / parent
    primaryGuardian: { type: mongoose.Schema.Types.ObjectId, ref: 'Guardian', default: null },
    secondContactName: { type: String, trim: true },
    secondContactPhone: { type: String, trim: true },
    emergencyInstructions: { type: String, trim: true },

    // Transport assignment
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', default: null },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', default: null },
    pickupPoint: { type: String, trim: true },
    dropoffPoint: { type: String, trim: true },
    pickupTime: { type: String, trim: true }, // "07:15 AM"
    dropoffTime: { type: String, trim: true }, // "03:45 PM"

    // Home location & geofencing
    homeAddress: { type: String, trim: true },
    geofenceRadius: { type: Number, default: 200 },
    lat: Number,
    lng: Number,

    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    todayAttendance: {
      type: String,
      enum: ['Present', 'Absent', 'Pending'],
      default: 'Pending',
    },

    // Lightweight activity feed shown on the student profile page.
    communications: [
      {
        title: String,
        description: String,
        occurredAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

studentSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Student', studentSchema);
