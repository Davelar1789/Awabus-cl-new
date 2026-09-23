import { cn } from '../../lib/utils.js';

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-navy-light',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
