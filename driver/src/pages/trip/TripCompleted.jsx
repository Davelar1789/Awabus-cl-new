import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatClock, formatDateTime } from '../../lib/utils.js';

const formatDuration = (minutes) => {
  const h = Math.floor((minutes || 0) / 60);
  const m = (minutes || 0) % 60;
  return formatClock(h * 3600 + m * 60);
};

export default function TripCompleted() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.trip) navigate('/', { replace: true });
  }, [state, navigate]);

  if (!state?.trip) return null;
  const trip = state.trip;

  const progress = trip.studentProgress || [];
  const attending = progress.filter((p) => p.attendance === 'Present').length;
  const unresolved = progress.filter(
    (p) => p.attendance === 'Present' && p.dropoffStatus !== 'On board' && p.dropoffStatus !== 'Dropped off'
  ).length;
  const broadcasts = trip.delayBroadcasts || [];
  const totalRecipients = broadcasts.reduce((sum, b) => sum + (b.recipientCount || 0), 0);

  return (
    <div>
      <div className="safe-top flex flex-col items-center bg-trip-600 px-4 pb-8 pt-10 text-center text-white">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
          <CheckCheck className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-extrabold">Trip completed</h1>
        <p className="mt-1 text-white/80">Nice work. Every parent has been notified.</p>
      </div>

      <div className="space-y-4 p-4">
        <Card>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Trip performance summary</p>
          <Row label="Trip duration" value={formatDuration(trip.durationMinutes)} />
          <Row label="Students on trip" value={attending} />
          <Row label="Alerts / check" value={unresolved} />
          <Row label="Delay broadcasts" value={broadcasts.length ? `${broadcasts.length} sent to ${totalRecipients} parents` : '0'} />
          <Row label="Trip ended" value={formatDateTime(trip.endedAt || trip.date)} last />
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          All offline events and background tasks successfully synchronized with the central school management
          server.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <Button className="w-full" onClick={() => navigate('/')}>
          Back to home
        </Button>
        <Button variant="link" className="mx-auto flex justify-center" onClick={() => navigate('/trip-history')}>
          View trip history
        </Button>
      </div>
    </div>
  );
}

const Row = ({ label, value, last }) => (
  <div className={`flex justify-between py-2.5 ${last ? '' : 'border-b border-slate-100 dark:border-slate-800'}`}>
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);
