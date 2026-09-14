import { create } from 'zustand';

// Carries state between the Forgot Password → Verify OTP → Create New Password screens.
export const useResetFlowStore = create((set) => ({
  phone: '',
  resetToken: '',
  setPhone: (phone) => set({ phone }),
  setResetToken: (resetToken) => set({ resetToken }),
  clear: () => set({ phone: '', resetToken: '' }),
}));
