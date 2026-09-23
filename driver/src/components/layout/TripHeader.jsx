import { formatClock } from '../../lib/utils.js';
import { cn } from '../../lib/utils.js';

export default function TripHeader({ status, isOnline, subtitle, elapsedSeconds }) {
  return (
    <header className="safe-top sticky top-0 z-30 bg-trip-600 px-4 pb-4 pt-3 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold">{status}</h1>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                isOnline ? 'bg-white/25' : 'bg-black/25'
              )}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>
        </div>
        <p className="text-2xl font-extrabold tabular-nums">{formatClock(elapsedSeconds)}</p>
      </div>
    </header>
  );
}
