import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import { Label, FieldError } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { forgotPassword } from '../../api/driverApp.js';
import { useResetFlowStore } from '../../store/resetFlowStore.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const setPhone = useResetFlowStore((s) => s.setPhone);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const digits = value.replace(/\s/g, '');

  const mutation = useMutation({
    mutationFn: () => forgotPassword(`+233${digits}`),
    onSuccess: () => {
      setPhone(`+233${digits}`);
      navigate('/verify-otp');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (digits.length !== 9) {
      setError('Enter a valid 9-digit phone number');
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Forgot password?</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Enter your phone number to receive a 6-digit verification code.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <PhoneInput id="phone" value={value} onChange={setValue} error={Boolean(error)} maxLength={11} />
          <FieldError>{error}</FieldError>
        </div>

        <Button type="submit" variant="auth" className="w-full" loading={mutation.isPending}>
          Send OTP
        </Button>

        <Link to="/sign-in" className="block text-center text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400">
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
