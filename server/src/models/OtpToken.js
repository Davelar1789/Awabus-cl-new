import mongoose from 'mongoose';

const otpTokenSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },
    code: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['password_reset', 'driver_password_reset'],
      default: 'password_reset',
    },
    expiresAt: { type: Date, required: true },
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

otpTokenSchema.index({ phone: 1, purpose: 1 });

export default mongoose.model('OtpToken', otpTokenSchema);
