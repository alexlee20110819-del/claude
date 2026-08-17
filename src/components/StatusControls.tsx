import type { OutreachStatus } from '@/types/lead';
import { OUTREACH_STATUSES } from '@/types/lead';
import { cn } from '@/lib/utils';

/** Green is reserved for `Successful`; everything else stays in the neutral/navy family. */
export const STATUS_STYLES: Record<OutreachStatus, { badge: string; dot: string }> = {
  'Not contacted': { badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  Contacted: { badge: 'bg-navy-50 text-navy-800 border-navy-200', dot: 'bg-navy-500' },
  'Follow-up': { badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  Successful: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600' },
  'Not a fit': { badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

export function StatusBadge({ status, className }: { status: OutreachStatus; className?: string }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        style.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
      {status}
    </span>
  );
}

interface StatusSelectProps {
  value: OutreachStatus;
  onChange: (status: OutreachStatus) => void;
  label?: string;
  className?: string;
  id?: string;
}

/**
 * Status selector.
 *
 * A native `<select>` on purpose: it is keyboard- and screen-reader-correct for
 * free, and on mobile it opens the platform picker.
 */
export function StatusSelect({
  value,
  onChange,
  label = 'Outreach status',
  className,
  id,
}: StatusSelectProps) {
  const style = STATUS_STYLES[value];

  return (
    <select
      id={id}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as OutreachStatus)}
      className={cn(
        'h-8 cursor-pointer rounded-lg border px-2 pr-7 text-xs font-medium transition-colors',
        style.badge,
        className,
      )}
    >
      {OUTREACH_STATUSES.map((status) => (
        <option key={status} value={status} className="bg-white text-slate-900">
          {status}
        </option>
      ))}
    </select>
  );
}
