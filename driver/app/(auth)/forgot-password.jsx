import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import AuthLayout from '../../src/components/layout/AuthLayout.jsx';
import PhoneInput from '../../src/components/ui/PhoneInput.jsx';
import { Label, FieldError } from '../../src/components/ui/Input.jsx';
import Button from '../../src/components/ui/Button.jsx';
import { forgotPassword } from '../../src/api/driverApp.js';
import { useResetFlowStore } from '../../src/store/resetFlowStore.js';
import { colors } from '../../src/lib/theme.js';

export default function ForgotPassword() {
  const setPhone = useResetFlowStore((s) => s.setPhone);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const digits = value.replace(/\s/g, '');

  const mutation = useMutation({
    mutationFn: () => forgotPassword(`+233${digits}`),
    onSuccess: () => {
      setPhone(`+233${digits}`);
      router.push('/verify-otp');
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError('');
    if (digits.length !== 9) {
      setError('Enter a valid 9-digit phone number');
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.subtitle}>Enter your phone number to receive a 6-digit verification code.</Text>

      <View style={styles.field}>
        <Label>Phone Number</Label>
        <PhoneInput value={value} onChange={setValue} error={Boolean(error)} maxLength={11} />
        <FieldError>{error}</FieldError>
      </View>

      <Button variant="auth" loading={mutation.isPending} onPress={handleSubmit}>
        Send OTP
      </Button>

      <Link href="/sign-in" style={styles.backLink}>
        Back to sign in
      </Link>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', color: colors.slate900 },
  subtitle: { marginTop: 4, fontSize: 15, color: colors.slate500, marginBottom: 20 },
  field: { marginBottom: 18 },
  backLink: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.slate500,
    fontWeight: '700',
    fontSize: 14,
  },
});
