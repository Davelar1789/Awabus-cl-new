import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils.js';

export default function Modal({ open, onClose, children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-navy-light sm:rounded-3xl',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
