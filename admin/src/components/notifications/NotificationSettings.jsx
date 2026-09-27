import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Lock } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../ui/Card.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/notifications.js';
import { cn } from '../../lib/utils.js';

/** Account settings card: switch each kind of notification on or off. */
export default function NotificationSettings({ id }) {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getNotificationPreferences,
  });

  const save = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: (prefs) => {
      qc.setQueryData(['notification-preferences'], prefs);
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const toggle = (key) => {
    const muted = data.types.filter((t) => !t.locked && (t.key === key ? t.enabled : !t.enabled)).map((t) => t.key);
    save.mutate(muted);
  };

  return (
    <Card id={id} className="scroll-mt-24">
      <CardHeader
        title="Notifications"
        subtitle="Choose what shows up under the bell at the top of the page. Critical alerts are always on."
      />
      <CardBody className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : isError ? (
          <p className="text-sm text-red-600">Couldn&apos;t load your notification settings.</p>
        ) : (
          data.categories.map((cat) => {
            const types = data.types.filter((t) => t.category === cat.key);
            if (!types.length) return null;
            return (
              <div key={cat.key}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{cat.label}</p>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                  {types.map((t) => (
                    <div key={t.key} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div className="flex items-start gap-3">
                        {t.locked ? (
                          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.description}
                            {t.locked && ' Always on.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={t.enabled}
                        aria-label={t.label}
                        disabled={t.locked || save.isPending}
                        onClick={() => toggle(t.key)}
                        className={cn(
                          'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed',
                          t.enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600',
                          t.locked && 'opacity-60'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                            t.enabled ? 'left-[22px]' : 'left-0.5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
        {save.isError && <p className="text-sm text-red-600">{save.error.message}</p>}
      </CardBody>
    </Card>
  );
}
