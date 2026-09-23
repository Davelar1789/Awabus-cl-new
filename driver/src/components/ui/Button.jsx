import { cn } from '../../lib/utils.js';

const VARIANTS = {
  primary: 'bg-trip-600 text-white hover:bg-trip-700 focus-visible:ring-trip-600',
  auth: 'bg-brand-300 text-navy hover:bg-brand-500 hover:text-white focus-visible:ring-brand-400 font-bold',
  outline:
    'border-2 border-brand-600 bg-white text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-500 dark:bg-navy-light dark:text-brand-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-light',
  link: 'text-brand-600 hover:underline dark:text-brand-400 font-semibold h-auto p-0',
};

const SIZES = {
  sm: 'h-10 px-3 text-sm',
  md: 'h-12 px-4 text-base',
  lg: 'h-14 px-6 text-base',
};

export default function Button({
  as: Comp = 'button',
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-navy-dark',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant !== 'link' && SIZES[size],
        VARIANTS[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Comp>
  );
}
