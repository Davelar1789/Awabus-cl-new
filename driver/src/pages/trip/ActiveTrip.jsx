import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Search } from 'lucide-react';
import TripHeader from '../../components/layout/TripHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { useConnectionStore } from '../../store/connectionStore.js';
import { useOfflineQueueStore } from '../../store/offlineQueueStore.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { getTodaysTrip, markAttendance, pushLocation, endTrip } from '../../api/driverApp.js';
import { cn, timeAgo, formatClock } from '../../lib/utils.js';

const LOCATION_PUSH_INTERVAL_MS = 8000;

export default function ActiveTrip() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isOnline = useConnectionStore((s) => s.isOnline);
  const lastSyncAt = useConnectionStore((s) => s.lastSyncAt);
  const markSynced = useConnectionStore((s) => s.markSynced);
  const enqueue = useOfflineQueueStore((s) => s.enqueue);

  const [elapsed, setElapsed] = useState(0);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const lastPushRef = useRef(0);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['todays-trip'],
    queryFn: getTodaysTrip,
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (trip && trip.status !== 'In Progress' && trip.status !== 'Delayed') {
      navigate('/', { replace: true });
    }
  }, [trip, navigate]);

  useEffect(() => {
    if (!trip?.startedAt) return undefined;
    const started = new Date(trip.startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - started) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [trip?.startedAt]);

  const { position } = useGeolocation(Boolean(trip));

  useEffect(() => {
    if (!position || !trip?._id) return;
    const now = Date.now();
    if (now - lastPushRef.current < LOCATION_PUSH_INTERVAL_MS) return;
    lastPushRef.current = now;

    pushLocation(trip._id, position)
      .then(() => markSynced())
      .catch(() => enqueue({ kind: 'location', tripId: trip._id, payload: position }));
  }, [position, trip?._id, markSynced, enqueue]);

  const scanMutation = useMutation({
    mutationFn: ({ studentId }) => markAttendance(trip._id, studentId, { dropoffStatus: 'On board' }),
    onSuccess: () => {
      markSynced();
      queryClient.invalidateQueries({ queryKey: ['todays-trip'] });
    },
    onError: (_err, { studentId }) => {
      enqueue({ kind: 'scan', tripId: trip._id, studentId, payload: { dropoffStatus: 'On board' } });
      // Reflect the scan optimistically so the driver sees it even offline.
      queryClient.setQueryData(['todays-trip'], (old) =>
        old
          ? {
              ...old,
              studentProgress: old.studentProgress.map((p) =>
                p.student?._id === studentId ? { ...p, dropoffStatus: 'On board', _offline: true } : p
              ),
            }
          : old
      );
    },
  });

  const endMutation = useMutation({
    mutationFn: () => endTrip(trip._id),
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: ['todays-trip'] });
      navigate('/trip/completed', { state: { trip: updatedTrip } });
    },
  });

  const progress = trip?.studentProgress || [];
  const boardedCount = progress.filter((p) => p.dropoffStatus === 'On board' || p.dropoffStatus === 'Dropped off').length;
  const unscanned = progress.filter((p) => p.attendance === 'Present' && p.dropoffStatus === 'Pending');

  const visibleStudents = useMemo(() => {
    if (!search) return progress;
    return progress.filter((p) =>
      `${p.student?.firstName || ''} ${p.student?.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [progress, search]);

  if (isLoading || !trip) return <PageLoader label="Loading trip..." />;

  return (
    <div>
      <TripHeader
        status="Trip active"
        isOnline={isOnline}
        subtitle={`${trip.bus?.plateNumber || ''}, ${trip.route?.name || ''}`}
        elapsedSeconds={elapsed}
      />

      <div className="space-y-4 p-4">
        <Card>
          <p>
            <span className="text-slate-500 dark:text-slate-400">Bus: </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{trip.bus?.plateNumber}</span>
          </p>
          <p>
            <span className="text-slate-500 dark:text-slate-400">Driver: </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {trip.driver ? `${trip.driver.firstName || ''} ${trip.driver.lastName || ''}`.trim() : '—'}
            </span>
          </p>
          <p className="text-sm text-slate-400">
            {new Date(trip.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <span className={cn('flex items-center gap-2 font-bold', isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500')}>
              <span className={cn('h-2.5 w-2.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-slate-400')} />
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-xs text-slate-400">Last sync: {lastSyncAt ? timeAgo(lastSyncAt) : 'never'}</span>
          </div>
          <div className="flex items-center justify-between pt-3 text-sm">
            <span>
              <span className="text-slate-500 dark:text-slate-400">Lat: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {position ? `${position.lat.toFixed(4)}° N` : trip.liveLocation?.lat ? `${trip.liveLocation.lat.toFixed(4)}° N` : '—'}
              </span>
            </span>
            <span>
              <span className="text-slate-500 dark:text-slate-400">Lon: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {position ? `${Math.abs(position.lng).toFixed(4)}° W` : trip.liveLocation?.lng ? `${Math.abs(trip.liveLocation.lng).toFixed(4)}° W` : '—'}
              </span>
            </span>
          </div>
        </Card>

        {!isOnline && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Connection lost. Keep driving. Data will sync when you reconnect.</span>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Trip progress</p>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {boardedCount} of {progress.length} scanned
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-trip-600 transition-all"
              style={{ width: `${progress.length ? (boardedCount / progress.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Students on this trip</p>
            <button onClick={() => setShowSearch((v) => !v)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-navy">
              <Search className="h-4 w-4" />
            </button>
          </div>
          {showSearch && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="mb-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-navy-light"
            />
          )}
          <div className="space-y-2">
            {visibleStudents.map((p) => {
              const boarded = p.dropoffStatus === 'On board' || p.dropoffStatus === 'Dropped off';
              return (
                <button
                  key={p.student?._id}
                  disabled={boarded}
                  onClick={() => scanMutation.mutate({ studentId: p.student?._id })}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left disabled:opacity-100 dark:border-slate-800 dark:bg-navy-light"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Student'}
                  </span>
                  {boarded ? (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Scanned{p._offline || !isOnline ? ' (Offline)' : p.alertTime ? ` at ${p.alertTime}` : ''}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">Tap to scan</span>
                  )}
                </button>
              );
            })}
            {visibleStudents.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No students found.</p>}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-light">
        <Button variant="outline" className="flex-1" onClick={() => navigate('/trip/delay-broadcast')}>
          Delay SMS
        </Button>
        <Button variant="danger" className="flex-1" onClick={() => setEndOpen(true)}>
          End trip
        </Button>
      </div>

      <Modal open={endOpen} onClose={() => setEndOpen(false)}>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">End today's trip?</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You are about to end the current trip.</p>
        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-navy">
          <Row label="Trip duration" value={formatClock(elapsed)} />
          <Row label="Active students" value={`${boardedCount} of ${progress.length}`} />
          <Row label="Bus" value={trip.bus?.plateNumber} />
          <Row label="Route" value={trip.route?.name} />
        </div>
        {unscanned.length > 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
            {unscanned.length} live student{unscanned.length === 1 ? ' has' : 's have'} not been scanned yet. Ending
            now means their trip status will remain incomplete.
          </p>
        )}
        <div className="mt-6 space-y-2.5">
          <Button variant="danger" className="w-full" loading={endMutation.isPending} onClick={() => endMutation.mutate()}>
            Yes, end trip
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setEndOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);
