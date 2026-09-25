import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import { isValidPhone, toLocalPhone } from '../../lib/phone.js';
import { Label, FieldError } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { forgotPassword } from '../../api/auth.js';
import { useResetFlowStore } from '../../store/resetFlowStore.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const setPhone = useResetFlowStore((s) => s.setPhone);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const phone = toLocalPhone(value);

  const mutation = useMutation({
    mutationFn: () => forgotPassword(phone),
    onSuccess: () => {
      setPhone(phone);
      navigate('/verify-otp');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!isValidPhone(value)) {
      setError('Enter a 10-digit number starting with 0, e.g. 024 412 3456');
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Forgot password?</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Enter your phone number to receive a 6-digit verification code.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput id="phone" value={value} onChange={setValue} error={Boolean(error)} />
          <FieldError>{error}</FieldError>
        </div>

        <Button type="submit" variant="auth" className="w-full" loading={mutation.isPending}>
          Send OTP
        </Button>

        <Link
          to="/sign-in"
          className="block text-center text-sm font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-300"
        >
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
