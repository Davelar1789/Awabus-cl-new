import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react-native';
import Header from '../../../src/components/layout/Header.jsx';
import { Label, Textarea } from '../../../src/components/ui/Input.jsx';
import { OptionField } from '../../../src/components/ui/OptionPicker.jsx';
import Button from '../../../src/components/ui/Button.jsx';
import { PageLoader } from '../../../src/components/ui/Spinner.jsx';
import { getTodaysTrip, sendDelayBroadcast } from '../../../src/api/driverApp.js';
import { colors, radii } from '../../../src/lib/theme.js';

const REASONS = ['Heavy traffic', 'Vehicle breakdown', 'Weather conditions', 'Road closure', 'Other'].map((r) => ({
  value: r,
  label: r,
}));

export default function DelayBroadcast() {
  const { data: trip, isLoading } = useQuery({ queryKey: ['todays-trip'], queryFn: getTodaysTrip });
  const [reason, setReason] = useState(REASONS[0].value);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [message, setMessage] = useState('We expect to be about 25 minutes late.');

  const mutation = useMutation({
    mutationFn: () => sendDelayBroadcast(trip._id, { reason, message }),
    onSuccess: (result) =>
      router.push({
        pathname: '/trip/delay-broadcast-sent',
        params: {
          recipientCount: result.data.recipientCount,
          deliveredCount: result.data.deliveredCount,
          failedCount: result.data.failedCount,
          sentAt: result.data.sentAt,
        },
      }),
  });

  if (isLoading || !trip) return <PageLoader />;

  const attending = (trip.studentProgress || []).filter((p) => p.attendance === 'Present').length;
  const preview = `AwaBus: ${trip.route?.name || 'Your route'} is running late. ${message}`.trim();

  return (
    <View style={{ flex: 1 }}>
      <Header title="Delay broadcast" back />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.iconWrap}>
          <Mail size={28} color={colors.trip600} />
        </View>
        <Text style={styles.title}>Notify attending parents</Text>
        <Text style={styles.subtitle}>Sends one SMS to the parents of the {attending} students attending today.</Text>

        <View style={styles.field}>
          <Label>Delay reason</Label>
          <OptionField
            label="Delay reason"
            value={reason}
            options={REASONS}
            onChange={setReason}
            open={reasonOpen}
            onOpen={() => setReasonOpen(true)}
            onClose={() => setReasonOpen(false)}
          />
        </View>

        <View style={styles.field}>
          <Label>Additional message</Label>
          <Textarea value={message} onChangeText={setMessage} />
        </View>

        <View style={styles.field}>
          <Label>Preview</Label>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{preview}</Text>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <Button loading={mutation.isPending} onPress={() => mutation.mutate()}>
          Send SMS broadcast
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingTop: 24 },
  iconWrap: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.slate900, textAlign: 'center' },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.slate500, textAlign: 'center', marginBottom: 24 },
  field: { marginBottom: 20 },
  previewBox: { backgroundColor: colors.slate100, borderRadius: radii.lg, padding: 14 },
  previewText: { fontSize: 14, color: colors.slate700, lineHeight: 20 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
