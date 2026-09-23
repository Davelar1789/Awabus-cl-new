import { cn } from '../../lib/utils.js';

// Ghana-only phone input: fixed +233 prefix + 9-digit local number.
export default function PhoneInput({ value, onChange, error, placeholder = '55 123 4567', ...props }) {
  return (
    <div
      className={cn(
        'flex h-[52px] items-center overflow-hidden rounded-xl border bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100 dark:bg-navy-light',
        error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'
      )}
    >
      <span className="flex h-full items-center gap-1.5 border-r border-slate-200 px-3.5 text-base font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
        +233
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange?.(e.target.value.replace(/[^\d\s]/g, ''))}
        placeholder={placeholder}
        className="h-full flex-1 bg-transparent px-3.5 text-base text-slate-900 placeholder:text-slate-400 outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        {...props}
      />
    </div>
  );
}
