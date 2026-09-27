import mongoose from 'mongoose';
import { normalizePhones } from '../plugins/normalizePhones.js';
import { LANGUAGE_CODES, DEFAULT_LANGUAGE } from '../utils/languages.js';

const guardianSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    relation: {
      type: String,
      enum: ['Father', 'Mother', 'Guardian', 'Sibling', 'Other'],
      default: 'Guardian',
    },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    // Language for automated voice calls and the phone line (see utils/languages.js).
    preferredLanguage: { type: String, enum: LANGUAGE_CODES, default: DEFAULT_LANGUAGE },
  },
  { timestamps: true }
);

guardianSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

guardianSchema.set('toJSON', { virtuals: true });
guardianSchema.set('toObject', { virtuals: true });

guardianSchema.plugin(normalizePhones, { paths: ['phone'] });
export default mongoose.model('Guardian', guardianSchema);
