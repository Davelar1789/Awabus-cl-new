import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const Label = ({ children, htmlFor, className }) => (
  <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-bold text-slate-800 dark:text-slate-200', className)}>
    {children}
  </label>
);

export const FieldError = ({ children }) =>
  children ? <p className="mt-1.5 text-xs font-medium text-red-500">{children}</p> : null;

const baseInputClasses =
  'w-full rounded-xl border bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:bg-navy-light dark:text-slate-100 dark:placeholder:text-slate-500';

export const Input = forwardRef(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      baseInputClasses,
      'h-[52px]',
      error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const PasswordInput = forwardRef(({ className, error, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={cn(
          baseInputClasses,
          'h-[52px] pr-11',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700',
          className
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export const Textarea = forwardRef(({ className, error, rows = 3, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    className={cn(
      baseInputClasses,
      'py-3',
      error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700',
      className
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      baseInputClasses,
      'h-[52px] appearance-none bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>\')] bg-[length:18px] bg-[right_0.85rem_center] bg-no-repeat pr-10',
      error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 dark:border-slate-700',
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';

export default Input;
