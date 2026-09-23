import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getTripById } from '../../api/driverApp.js';
import { formatDate, formatClock } from '../../lib/utils.js';

const formatDuration = (minutes) => {
  const h = Math.floor((minutes || 0) / 60);
  const m = (minutes || 0) % 60;
  return formatClock(h * 3600 + m * 60);
};

export default function TripHistoryDetail() {
  const { id } = useParams();
  const { data: trip, isLoading } = useQuery({ queryKey: ['trip', id], queryFn: () => getTripById(id) });

  if (isLoading || !trip) return <PageLoader />;

  const progress = trip.studentProgress || [];

  return (
    <div>
      <Header title={trip.tripCode} back />
      <div className="space-y-4 p-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{trip.route?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{trip.bus?.plateNumber}</p>
            </div>
            <Badge tone={trip.status === 'Completed' ? 'success' : 'danger'}>{trip.status}</Badge>
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <p className="text-slate-400">{formatDate(trip.date)}</p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Departure: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{trip.departureTime || '—'}</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="text-slate-500 dark:text-slate-400">Arrival: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{trip.arrivalTime || '—'}</span>
            </p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Duration: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{formatDuration(trip.durationMinutes)}</span>
            </p>
          </div>
        </Card>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Students ({progress.length})</p>
          <div className="space-y-2">
            {progress.map((p) => (
              <Card key={p.student?._id} className="flex items-center justify-between py-3">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Student'}
                </span>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{p.dropoffStatus}</span>
              </Card>
            ))}
          </div>
        </div>

        {trip.delayBroadcasts?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Delay broadcasts</p>
            <div className="space-y-2">
              {trip.delayBroadcasts.map((b, i) => (
                <Card key={i}>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{b.reason}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{b.message}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Sent to {b.recipientCount} parent{b.recipientCount === 1 ? '' : 's'}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
