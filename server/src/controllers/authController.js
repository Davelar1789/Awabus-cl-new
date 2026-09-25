import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import OtpToken from '../models/OtpToken.js';
import generateToken from '../utils/generateToken.js';
import { generateOtpCode, sendOtpSms, getOtpExpiry } from '../utils/otp.js';
import { tenantContext } from '../utils/tenantContext.js';
import { ghanaPhoneVariants, normalizeGhanaPhone } from '../utils/phone.js';
import { checkPasswordStrength } from '../utils/password.js';

// Wrong guesses allowed per code before a new one has to be requested.
export const MAX_OTP_ATTEMPTS = 5;

// These routes all run before anyone is authenticated, so there's no
// req.school / tenant context yet — finding out *which* school an admin
// belongs to is the whole point of the lookup. That's the one legitimate
// reason to reach for tenantContext.runAsSystem() instead of a normal query:
// it's a deliberate, explicit cross-tenant lookup, not an accidental leak.
// Once an admin is found, `admin.school` goes into the JWT and every
// subsequent request is scoped normally by the withTenant 
const findAdminByEmail = (email) =>
  tenantContext.runAsSystem(async () => {
    console.log('[AUTH] Inside runAsSystem');
    console.log('[AUTH] isSystem:', tenantContext.isSystem());
    console.log('[AUTH] school:', tenantContext.getSchool());

    return Admin.findOne({
      email: email.toLowerCase().trim(),
    });
  });

// Matches numbers stored before phone normalization existed (e.g. "0244...").
const findAdminByPhone = (phone) =>
  tenantContext.runAsSystem(() => Admin.findOne({ phone: { $in: ghanaPhoneVariants(phone) } }));

const saveAdminAsSystem = (admin) => tenantContext.runAsSystem(() => admin.save());

// @desc    Check if an email exists and whether the account has a password set
// @route   POST /api/auth/check-email
// @access  Public
export const checkEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    res.status(404);
    throw new Error('No account found with this email address');
  }

  res.json({
    success: true,
    exists: true,
    hasPassword: Boolean(admin.password),
  });
});

// @desc    Set a password for a first-time account and sign in
// @route   POST /api/auth/set-password
// @access  Public
export const setPassword = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    res.status(404);
    throw new Error('No account found with this email address');
  }

  if (admin.password) {
    res.status(400);
    throw new Error('This account already has a password set');
  }

  const weak = checkPasswordStrength(password, { email: admin.email, name: admin.name });
  if (weak) {
    res.status(400);
    throw new Error(weak);
  }

  admin.password = password;

  if (deviceId && !admin.rememberedDevices.includes(deviceId)) {
    admin.rememberedDevices.push(deviceId);
  }

  await saveAdminAsSystem(admin);

// setPassword
res.json({
  success: true,
  token: generateToken(admin._id, 'admin', { school: admin.school, role: admin.role }),
  admin: admin.toSafeObject(),
});
});

// @desc    Sign in to the Admin Portal
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberDevice, deviceId } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const admin = await findAdminByEmail(email);

  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error('The email or password you entered is incorrect.');
  }

  if (rememberDevice && deviceId && !admin.rememberedDevices.includes(deviceId)) {
    admin.rememberedDevices.push(deviceId);
    await saveAdminAsSystem(admin);
  }

// login
res.json({
  success: true,
  token: generateToken(admin._id, 'admin', { school: admin.school, role: admin.role }),
  admin: admin.toSafeObject(),
});
});

// @desc    Get logged-in admin profile
// @route   GET /api/auth/me
// @access  Private (admin)
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, admin: req.admin.toSafeObject() });
});

// @desc    Request an OTP to begin the password reset flow
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const phone = normalizeGhanaPhone(req.body.phone);
  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }

  const admin = await findAdminByPhone(phone);
  if (!admin) {
    // Avoid leaking account existence; respond the same way either way.
    res.json({ success: true, message: 'If that phone number exists, an OTP has been sent.' });
    return;
  }

  // OtpToken isn't tenant-scoped (no `school` field), so it needs no wrapping.
  const code = generateOtpCode();
  await OtpToken.create({
    phone,
    code,
    purpose: 'password_reset',
    expiresAt: getOtpExpiry(),
  });
  await sendOtpSms(phone, code);

  res.json({ success: true, message: 'A 6-digit verification code has been sent.' });
});

// @desc    Verify the OTP sent to the admin's phone
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = asyncHandler(async (req, res) => {
  const phone = normalizeGhanaPhone(req.body.phone);
  const { code } = req.body;
  if (!phone || !code) {
    res.status(400);
    throw new Error('Phone number and code are required');
  }

  const otp = await OtpToken.findOne({ phone, purpose: 'password_reset', consumed: false }).sort({
    createdAt: -1,
  });

  if (!otp) {
    res.status(400);
    throw new Error("Didn't receive a code? Request a new OTP.");
  }

  if (otp.expiresAt < new Date()) {
    res.status(400);
    throw new Error('The code has expired');
  }

  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    res.status(429);
    throw new Error('Too many incorrect attempts. Request a new code.');
  }

  if (otp.code !== String(code).trim()) {
    otp.attempts += 1;
    await otp.save();
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }

  otp.consumed = true;
  await otp.save();

  const resetToken = jwt.sign({ phone, purpose: 'password_reset' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  res.json({ success: true, resetToken });
});

// @desc    Resend a fresh OTP
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = asyncHandler(async (req, res) => {
  const phone = normalizeGhanaPhone(req.body.phone);
  if (!phone) {
    res.status(400);
    throw new Error('Phone number is required');
  }
  // Only text numbers that belong to an account, same as forgot-password.
  if (!(await findAdminByPhone(phone))) {
    res.json({ success: true, message: 'If that phone number exists, a new code has been sent.' });
    return;
  }
  const code = generateOtpCode();
  await OtpToken.create({ phone, code, purpose: 'password_reset', expiresAt: getOtpExpiry() });
  await sendOtpSms(phone, code);
  res.json({ success: true, message: 'A new verification code has been sent.' });
});

// @desc    Reset password using a verified reset token
// @route   POST /api/auth/reset-password
// @access  Public (requires resetToken from verify-otp)
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    res.status(400);
    throw new Error('Reset token and new password are required');
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (err) {
    res.status(400);
    throw new Error('Reset session expired. Please restart the password reset process.');
  }

  if (payload.purpose !== 'password_reset') {
    res.status(400);
    throw new Error('Invalid reset session');
  }

  const admin = await findAdminByPhone(payload.phone);
  if (!admin) {
    res.status(404);
    throw new Error('Account not found');
  }

  const weak = checkPasswordStrength(newPassword, { email: admin.email, name: admin.name });
  if (weak) {
    res.status(400);
    throw new Error(weak);
  }

  admin.password = newPassword;
  await saveAdminAsSystem(admin);

  res.json({ success: true, message: 'You can now sign in with your new password' });
});
