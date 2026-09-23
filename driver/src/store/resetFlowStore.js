import { create } from 'zustand';

// Carries state between Forgot Password → Verify OTP → Create New Password.
export const useResetFlowStore = create((set) => ({
  phone: '',
  resetToken: '',
  setPhone: (phone) => set({ phone }),
  setResetToken: (resetToken) => set({ resetToken }),
  clear: () => set({ phone: '', resetToken: '' }),
}));
