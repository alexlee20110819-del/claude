import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  label: string;
  children: ReactElement;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * Lightweight tooltip for icon-only controls.
 *
 * Shows on hover *and* keyboard focus, and is wired to the trigger with
 * `aria-describedby` so assistive technology announces it too. The trigger
 * should still carry its own accessible name (`aria-label`).
 */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps): ReactNode {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 animate-fade-in whitespace-nowrap rounded-md bg-navy-950 px-2 py-1 text-xs font-medium text-white shadow-lg',
            side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
