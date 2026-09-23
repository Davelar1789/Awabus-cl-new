import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatTime } from '../../lib/utils.js';

export default function BroadcastSent() {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.data) navigate('/trip/active', { replace: true });
  }, [state, navigate]);

  if (!state?.data) return null;
  const { data } = state;

  return (
    <div>
      <Header title="Delay broadcast" back />
      <div className="flex flex-col items-center px-4 pt-10 text-center">
        <CheckCircle2 className="mb-4 h-16 w-16 text-trip-600" />
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Broadcast sent</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Parents have been notified about the delay.</p>

        <Card className="mt-6 w-full text-left">
          <Row label="Sent to" value={`${data.recipientCount} parent${data.recipientCount === 1 ? '' : 's'}`} />
          <Row label="Delivered" value={`${data.deliveredCount} successful`} />
          <Row label="Failed" value={data.failedCount} />
          <Row label="Sent at" value={formatTime(data.sentAt)} last />
        </Card>
      </div>

      <div className="p-4">
        <Button className="w-full" onClick={() => navigate('/trip/active')}>
          Back to trip
        </Button>
      </div>
    </div>
  );
}

const Row = ({ label, value, last }) => (
  <div className={`flex justify-between py-3 ${last ? '' : 'border-b border-slate-100 dark:border-slate-800'}`}>
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-bold text-slate-800 dark:text-slate-100">{value}</span>
  </div>
);
