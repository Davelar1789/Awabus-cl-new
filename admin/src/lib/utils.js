import { clsx } from 'clsx';

export const cn = (...args) => clsx(...args);

export const formatDate = (value, opts = {}) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...opts });
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDate(date)}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

export const timeAgo = (value) => {
  if (!value) return '—';
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

// jane.doe@school.com -> j*******@school.com
export const maskEmail = (email = '') => email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 1))}${c}`);

export const maskPhone = (phone = '') => {
  // +233 24 *** ** 83
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const last2 = digits.slice(-2);
  const first = digits.slice(0, digits.length - 6);
  return `+${first.slice(0, 3)} ${first.slice(3, 5)} *** ** ${last2}`;
};

export const genderLabel = (g) => g || '—';

export const statusToneMap = {
  Active: 'success',
  Present: 'success',
  Completed: 'neutral',
  Verified: 'success',
  Idle: 'neutral',
  Pending: 'neutral',
  Expected: 'neutral',
  'In Progress': 'success',
  'In Transit': 'success',
  Delayed: 'danger',
  Absent: 'danger',
  Cancelled: 'danger',
  Failed: 'danger',
  Maintenance: 'warning',
  Inactive: 'neutral',
  Offline: 'neutral',
};
