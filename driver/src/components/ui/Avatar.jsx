import { initials, cn } from '../../lib/utils.js';

export default function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' };
  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizes[size], className)} />;
  }
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full bg-brand-500 font-bold text-white',
        sizes[size],
        className
      )}
    >
      {initials(name) || '?'}
    </span>
  );
}
