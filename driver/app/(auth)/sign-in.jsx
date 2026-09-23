import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, WifiOff } from 'lucide-react-native';
import AuthLayout from '../../src/components/layout/AuthLayout.jsx';
import PhoneInput from '../../src/components/ui/PhoneInput.jsx';
import { PasswordInput, Label } from '../../src/components/ui/Input.jsx';
import Button from '../../src/components/ui/Button.jsx';
import { login as loginApi } from '../../src/api/driverApp.js';
import { useAuthStore } from '../../src/store/authStore.js';
import { colors, radii } from '../../src/lib/theme.js';

const MAX_TRIES = 5;

export default function SignIn() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // { kind: 'credentials' | 'network', message }
  const [triesLeft, setTriesLeft] = useState(MAX_TRIES);

  const digits = phone.replace(/\s/g, '');

  const mutation = useMutation({
    mutationFn: () => loginApi(`+233${digits}`, password),
    onSuccess: async (data) => {
      await setAuth(data);
      router.replace('/');
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

  const handleSubmit = () => {
    setError(null);
    if (digits.length !== 9 || !password) return;
    mutation.mutate();
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <View style={styles.field}>
        <Label>Phone Number</Label>
        <PhoneInput value={phone} onChange={setPhone} maxLength={11} />
      </View>

      <View style={styles.field}>
        <Label>Password</Label>
        <PasswordInput value={password} onChangeText={setPassword} placeholder="••••••••" />
      </View>

      {error && (
        <View style={[styles.banner, error.kind === 'network' ? styles.bannerNeutral : styles.bannerError]}>
          {error.kind === 'network' ? (
            <WifiOff size={16} color={colors.slate600} />
          ) : (
            <AlertCircle size={16} color={colors.red600} />
          )}
          <Text style={[styles.bannerText, error.kind === 'network' ? styles.bannerTextNeutral : styles.bannerTextError]}>
            {error.message}
          </Text>
        </View>
      )}

      <Link href="/forgot-password" style={styles.forgotLink}>
        Forgot password?
      </Link>

      <Button variant="auth" loading={mutation.isPending} disabled={triesLeft === 0} onPress={handleSubmit}>
        {mutation.isPending ? 'Signing you in...' : 'Login'}
      </Button>

      <Text style={styles.terms}>
        By signing in, you agree to our <Text style={styles.termsLink}>Terms and Conditions.</Text>
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.slate900,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: colors.slate500,
    marginBottom: 20,
  },
  field: {
    marginBottom: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  bannerError: {
    backgroundColor: colors.red50,
    borderColor: '#fecaca',
  },
  bannerNeutral: {
    backgroundColor: colors.slate50,
    borderColor: colors.slate200,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  bannerTextError: {
    color: colors.red600,
  },
  bannerTextNeutral: {
    color: colors.slate600,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    color: colors.brand600,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 20,
  },
  terms: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    color: colors.slate500,
  },
  termsLink: {
    fontWeight: '700',
    color: colors.slate700,
    textDecorationLine: 'underline',
  },
});
