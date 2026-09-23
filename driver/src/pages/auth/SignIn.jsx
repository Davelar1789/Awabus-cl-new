import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, WifiOff } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout.jsx';
import PhoneInput from '../../components/ui/PhoneInput.jsx';
import { PasswordInput, Label } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { login as loginApi } from '../../api/driverApp.js';
import { useAuthStore } from '../../store/authStore.js';

const MAX_TRIES = 5;

export default function SignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // { kind: 'credentials' | 'network', message }
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES);

  const digits = phone.replace(/\s/g, '');

  const mutation = useMutation({
    mutationFn: () => loginApi(`+233${digits}`, password),
    onSuccess: (data) => {
      setAuth(data);
      navigate('/', { replace: true });
    },
    onError: (err) => {
      if (err.isNetworkError) {
        setError({ kind: 'network', message: err.message });
        return;
      }
      const remaining = Math.max(triesLeft - 1, 0);
      setTriesLeft(remaining);
      setError({
        kind: 'credentials',
        message:
          remaining > 0
            ? `Wrong phone number or password. You have ${remaining} ${remaining === 1 ? 'try' : 'tries'} left.`
            : 'Too many failed attempts. Please try again later or reset your password.',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (digits.length !== 9 || !password) return;
    mutation.mutate();
  };

  return (
    <AuthLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Welcome back</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Sign in to continue</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <PhoneInput id="phone" value={phone} onChange={setPhone} maxLength={11} />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && (
          <div
            className={
              error.kind === 'network'
                ? 'flex items-start gap-2.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-navy-light dark:text-slate-300'
                : 'flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400'
            }
          >
            {error.kind === 'network' ? (
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {error.message}
          </div>
        )}

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="auth"
          className="w-full"
          loading={mutation.isPending}
          disabled={triesLeft === 0}
        >
          {mutation.isPending ? 'Signing you in...' : 'Login'}
        </Button>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          By signing in, you agree to our{' '}
          <span className="font-semibold text-slate-700 underline dark:text-slate-300">Terms and Conditions.</span>
        </p>
      </form>
    </AuthLayout>
  );
}
