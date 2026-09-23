import { cn } from '../../lib/utils.js';

const TONE_CLASSES = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  danger: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300',
  brand: 'bg-white/15 text-white',
};

export default function Badge({ children, tone = 'success', className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', TONE_CLASSES[tone], className)}>
      {children}
    </span>
  );
}
