import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import OtpInput from '../../components/ui/OtpInput.jsx';
import Button from '../../components/ui/Button.jsx';
import { verifyOtp, resendOtp } from '../../api/driverApp.js';
import { useResetFlowStore } from '../../store/resetFlowStore.js';

const maskPhone = (phone = '') => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return phone;
  const last2 = digits.slice(-2);
  const first = digits.slice(0, digits.length - 6);
  return `+${first.slice(0, 3)} ${first.slice(3, 5)} *** ** ${last2}`;
};

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { phone, setResetToken } = useResetFlowStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!phone) navigate('/forgot-password');
  }, [phone, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(phone, code),
    onSuccess: (data) => {
      setResetToken(data.resetToken);
      navigate('/reset-password');
    },
    onError: (err) => setError(err.message),
  });

  const resendMutation = useMutation({
    mutationFn: () => resendOtp(phone),
    onSuccess: () => setCooldown(30),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }
    verifyMutation.mutate();
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Verify your phone</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Enter the 6-digit verification code sent to {maskPhone(phone)}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <OtpInput value={code} onChange={setCode} error={Boolean(error)} />
        {error && <p className="text-center text-xs font-medium text-red-500">{error}</p>}

        <button
          type="button"
          disabled={cooldown > 0 || resendMutation.isPending}
          onClick={() => resendMutation.mutate()}
          className="block w-full text-center text-sm font-semibold text-brand-600 hover:underline disabled:text-slate-400 disabled:no-underline dark:text-brand-400"
        >
          {cooldown > 0 ? `Didn't receive a code? Request OTP (${cooldown}s)` : "Didn't receive a code? Request OTP"}
        </button>

        <Button type="submit" variant="auth" className="w-full" loading={verifyMutation.isPending}>
          Verify OTP
        </Button>

        <Link to="/sign-in" className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400">
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
