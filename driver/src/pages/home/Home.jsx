import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useConnectionStore } from '../../store/connectionStore.js';
import { getTodaysTrip, markAttendance, startTrip } from '../../api/driverApp.js';
import { formatDate } from '../../lib/utils.js';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const driver = useAuthStore((s) => s.driver);
  const isOnline = useConnectionStore((s) => s.isOnline);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: trip, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['todays-trip'],
    queryFn: getTodaysTrip,
  });

  useEffect(() => {
    if (trip?.status === 'In Progress' || trip?.status === 'Delayed') {
      navigate('/trip/active', { replace: true });
    }
  }, [trip, navigate]);

  const toggleMutation = useMutation({
    mutationFn: ({ studentId, attendance }) => markAttendance(trip._id, studentId, { attendance }),
    onMutate: async ({ studentId, attendance }) => {
      await queryClient.cancelQueries({ queryKey: ['todays-trip'] });
      const previous = queryClient.getQueryData(['todays-trip']);
      queryClient.setQueryData(['todays-trip'], (old) =>
        old
          ? {
              ...old,
              studentProgress: old.studentProgress.map((p) =>
                p.student?._id === studentId ? { ...p, attendance } : p
              ),
            }
          : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['todays-trip'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todays-trip'] }),
  });

  const startMutation = useMutation({
    mutationFn: () => startTrip(trip._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todays-trip'] });
      navigate('/trip/active');
    },
  });

  if (isLoading) return <PageLoader label="Loading today's trip..." />;

  if (isError) {
    return (
      <div>
        <Header title="AwaBus Driver" />
        <div className="p-4">
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="font-bold text-slate-800 dark:text-slate-100">Couldn't load your trip</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{error.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div>
        <Header title="AwaBus Driver" />
        <div className="p-4">
          <Card className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <p className="font-bold text-slate-800 dark:text-slate-100">No trip assigned yet</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              You don't have a bus or route assigned. Contact your school admin to get set up.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const progress = trip.studentProgress || [];
  const total = progress.length;
  const attending = progress.filter((p) => p.attendance === 'Present').length;
  const absent = progress.filter((p) => p.attendance === 'Absent').length;

  return (
    <div>
      <Header title="AwaBus Driver" />
      <div className="space-y-5 p-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{driver?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Primary Driver</p>
            </div>
            <Badge tone={isOnline ? 'success' : 'neutral'}>{isOnline ? 'Online' : 'Offline'}</Badge>
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
            <p>
              <span className="text-slate-500 dark:text-slate-400">Bus: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{trip.bus?.plateNumber}</span>
            </p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Route: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{trip.route?.name}</span>
            </p>
            <p className="text-slate-400">{formatDate(trip.date)}</p>
          </div>
        </Card>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Attendance Summary</p>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{total}</p>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total</p>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50 text-center dark:border-emerald-900 dark:bg-emerald-500/10">
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{attending}</p>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Attending</p>
            </Card>
            <Card className="border-red-200 bg-red-50 text-center dark:border-red-900 dark:bg-red-500/10">
              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400">{absent}</p>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">Absent</p>
            </Card>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Student List</p>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">tap to change</span>
          </div>
          <div className="space-y-2">
            {progress.map((p) => (
              <button
                key={p.student?._id}
                onClick={() =>
                  toggleMutation.mutate({
                    studentId: p.student?._id,
                    attendance: p.attendance === 'Present' ? 'Absent' : 'Present',
                  })
                }
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left dark:border-slate-800 dark:bg-navy-light"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.student ? `${p.student.firstName} ${p.student.lastName}` : 'Student'}
                </span>
                <Badge tone={p.attendance === 'Present' ? 'success' : 'danger'}>
                  {p.attendance === 'Present' ? 'Attending' : 'Not attending'}
                </Badge>
              </button>
            ))}
            {progress.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">No students assigned to this route yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-navy-light">
        <Button className="w-full" onClick={() => setConfirmOpen(true)} disabled={total === 0}>
          Start trip
        </Button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Start today's trip?</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You are about to start the morning trip.</p>
        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm dark:bg-navy">
          <Row label="Attending Students" value={attending} />
          <Row label="Bus" value={trip.bus?.plateNumber} />
          <Row label="Route" value={trip.route?.name} />
        </div>
        <div className="mt-6 space-y-2.5">
          <Button className="w-full" loading={startMutation.isPending} onClick={() => startMutation.mutate()}>
            Yes, start trip
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setConfirmOpen(false)}>
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
