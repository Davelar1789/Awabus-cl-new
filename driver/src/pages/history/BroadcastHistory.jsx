import { useQuery } from '@tanstack/react-query';
import { MessageSquare } from 'lucide-react';
import Header from '../../components/layout/Header.jsx';
import Card from '../../components/ui/Card.jsx';
import { PageLoader } from '../../components/ui/Spinner.jsx';
import { getBroadcastHistory } from '../../api/driverApp.js';
import { formatDateTime } from '../../lib/utils.js';

export default function BroadcastHistory() {
  const { data, isLoading } = useQuery({ queryKey: ['broadcast-history'], queryFn: getBroadcastHistory });
  const broadcasts = data || [];

  return (
    <div>
      <Header title="Broadcast history" back />
      <div className="space-y-3 p-4">
        {isLoading ? (
          <PageLoader />
        ) : broadcasts.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <MessageSquare className="h-7 w-7 text-slate-300" />
            <p className="font-bold text-slate-700 dark:text-slate-200">No broadcasts sent yet</p>
            <p className="text-sm text-slate-400">Delay SMS broadcasts you send will show up here.</p>
          </Card>
        ) : (
          broadcasts.map((b, i) => (
            <Card key={i}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{b.reason}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{b.route?.name}</p>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(b.sentAt)}</span>
              </div>
              {b.message && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{b.message}</p>}
              <div className="mt-2 flex gap-4 text-xs text-slate-400">
                <span>Sent to {b.recipientCount}</span>
                <span className="text-emerald-600 dark:text-emerald-400">Delivered {b.deliveredCount}</span>
                {b.failedCount > 0 && <span className="text-red-500">Failed {b.failedCount}</span>}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
