import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import { PasswordInput, Label, FieldError } from '../../components/ui/Input.jsx';
import Checkbox from '../../components/ui/Checkbox.jsx';
import Button from '../../components/ui/Button.jsx';
import { login as loginApi } from '../../api/auth.js';
import { useAuthStore } from '../../store/authStore.js';

export default function SignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const digits = phone.replace(/\s/g, '');
  const phoneValid = digits.length === 0 || digits.length === 9;

  const mutation = useMutation({
    mutationFn: () =>
      loginApi({
        phone: `+233${digits}`,
        password,
        rememberDevice: remember,
        deviceId: 'web-admin-portal',
      }),
    onSuccess: (data) => {
      setAuth(data);
      setSuccess(true);
      setTimeout(() => navigate('/'), 900);
    },
    onError: (err) => setFormError(err.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (digits.length !== 9) {
      setFormError('Enter a valid 9-digit phone number');
      return;
    }
    if (!password) {
      setFormError('Please enter your password');
      return;
    }
    mutation.mutate();
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-12 text-center">
          <CheckCircle2 className="mb-4 h-14 w-14 text-brand-500" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign in successful</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Taking you to the AwaBus Admin Portal...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Sign in</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Sign in to manage and monitor bus operations
      </p>

      {formError && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <PhoneInput
            id="phone"
            value={phone}
            onChange={setPhone}
            error={!phoneValid}
            maxLength={11}
          />
          <FieldError>{!phoneValid ? 'Enter a valid 9-digit phone number' : ''}</FieldError>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox checked={remember} onChange={setRemember} label="Remember this device" />
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="auth" className="w-full" loading={mutation.isPending}>
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          By signing in, you agree to our <span className="font-semibold text-slate-700 dark:text-slate-300">Terms and conditions</span>
        </p>
      </form>
    </AuthLayout>
  );
}
