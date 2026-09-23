import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getTripHistory } from '../../api/driverApp.js';
import { formatShortDate } from '../../lib/utils.js';

const STATUS_TONE = { Completed: 'success', Cancelled: 'danger', Delayed: 'warning' };

export default function TripHistory() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['trip-history'], queryFn: () => getTripHistory() });

  const trips = data?.data || [];

  return (
    <div>
      <Header title="Trip history" back />
      <div className="space-y-3 p-4">
        {isLoading ? (
          <PageLoader />
        ) : trips.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <History className="h-7 w-7 text-slate-300" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No completed trips yet</p>
            <p className="text-sm text-slate-400">Your finished trips will show up here.</p>
          </Card>
        ) : (
          trips.map((trip) => (
            <button key={trip._id} onClick={() => navigate(`/trip-history/${trip._id}`)} className="block w-full text-left">
              <Card>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{trip.route?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{trip.bus?.plateNumber}</p>
                  </div>
                  <Badge tone={STATUS_TONE[trip.status] || 'neutral'}>{trip.status}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                  <span>{formatShortDate(trip.date)}</span>
                  <span>{trip.departureTime} — {trip.arrivalTime || '—'}</span>
                </div>
              </Card>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
