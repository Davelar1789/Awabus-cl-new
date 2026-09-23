import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import { Label, Select, Textarea } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getTodaysTrip, sendDelayBroadcast } from '../../api/driverApp.js';

const REASONS = ['Heavy traffic', 'Vehicle breakdown', 'Weather conditions', 'Road closure', 'Other'];

export default function DelayBroadcast() {
  const navigate = useNavigate();
  const { data: trip, isLoading } = useQuery({ queryKey: ['todays-trip'], queryFn: getTodaysTrip });
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState('We expect to be about 25 minutes late.');

  const mutation = useMutation({
    mutationFn: () => sendDelayBroadcast(trip._id, { reason, message }),
    onSuccess: (data) => navigate('/trip/delay-broadcast/sent', { state: data }),
  });

  if (isLoading || !trip) return <PageLoader />;

  const attending = (trip.studentProgress || []).filter((p) => p.attendance === 'Present').length;
  const preview = `AwaBus: ${trip.route?.name || 'Your route'} is running late. ${message}`.trim();

  return (
    <div>
      <Header title="Delay broadcast" back />
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center pt-4 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-trip-600 dark:bg-brand-500/10">
            <Mail className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Notify attending parents</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sends one SMS to the parents of the {attending} students attending today.
          </p>
        </div>

        <div>
          <Label>Delay reason</Label>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Additional message</Label>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
        </div>

        <div>
          <Label>Preview</Label>
          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700 dark:bg-navy dark:text-slate-300">{preview}</div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-light">
        <Button className="w-full" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Send SMS broadcast
        </Button>
      </div>
    </div>
  );
}
