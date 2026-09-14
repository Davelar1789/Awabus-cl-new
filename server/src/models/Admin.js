import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { tenantScope } from '../plugins/tenantScope.js';

const adminSchema = new mongoose.Schema(
  {
    // A school can have many admins (one-to-many), so this is just a plain ref,
    // not unique. Superadmins that manage multiple schools are a separate concern
    // (see note below) rather than something this field needs to express.
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },

    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // unique per school
    // Email is deliberately unique ACROSS schools (not compound with `school`) —
    // sign-in has to look an admin up by email before it knows which tenant
    // they belong to, so two admins in different schools can't share one.
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
    avatarUrl: { type: String, default: '' },
    rememberedDevices: [{ type: String }],
  },
  { timestamps: true }
);

adminSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

adminSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.rememberedDevices;
  return obj;
};

// phone only needs to be unique within a school, not globally
adminSchema.index({ school: 1, phone: 1 }, { unique: true });
adminSchema.index({ school: 1, role: 1 });

adminSchema.plugin(tenantScope);

export default mongoose.model('Admin', adminSchema);