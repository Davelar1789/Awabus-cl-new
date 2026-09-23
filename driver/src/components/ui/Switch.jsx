import { cn } from '../../lib/utils.js';

export default function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
