import type { LucideIcon } from 'lucide-react';
import {
  CalendarClock,
  CircleSlash,
  PhoneCall,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import type { Filters, OutreachStatus } from '@/types/lead';
import { EMPTY_FILTERS } from '@/types/lead';
import type { LeadStats } from '@/hooks/useLeads';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  stats: LeadStats;
  filters: Filters;
  onFilterByStatus: (status: OutreachStatus | null) => void;
}

interface CardDefinition {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
  /** Status this card filters to when clicked, if any. */
  status: OutreachStatus | null;
  caption?: string;
}

/**
 * Summary cards double as one-click status filters — the fastest way into a
 * work queue ("show me the 12 follow-ups"). Cards without a status (Total,
 * Success Rate) clear the status filter instead.
 */
export function SummaryCards({ stats, filters, onFilterByStatus }: SummaryCardsProps) {
  const cards: CardDefinition[] = [
    {
      key: 'total',
      label: 'Total leads',
      value: stats.total.toLocaleString('en-AU'),
      icon: Users,
      accent: 'text-navy-700 bg-navy-50',
      status: null,
    },
    {
      key: 'new',
      label: 'Not contacted',
      value: stats.notContacted.toLocaleString('en-AU'),
      icon: Target,
      accent: 'text-slate-600 bg-slate-100',
      status: 'Not contacted',
    },
    {
      key: 'contacted',
      label: 'Contacted',
      value: stats.contacted.toLocaleString('en-AU'),
      icon: PhoneCall,
      accent: 'text-navy-700 bg-navy-50',
      status: 'Contacted',
    },
    {
      key: 'followup',
      label: 'Follow-up',
      value: stats.followUp.toLocaleString('en-AU'),
      icon: CalendarClock,
      accent: 'text-amber-700 bg-amber-50',
      status: 'Follow-up',
      caption: stats.dueFollowUps > 0 ? `${stats.dueFollowUps} due now` : undefined,
    },
    {
      key: 'successful',
      label: 'Successful',
      value: stats.successful.toLocaleString('en-AU'),
      icon: Trophy,
      accent: 'text-emerald-700 bg-emerald-50',
      status: 'Successful',
    },
    {
      key: 'notafit',
      label: 'Not a fit',
      value: stats.notAFit.toLocaleString('en-AU'),
      icon: CircleSlash,
      accent: 'text-slate-500 bg-slate-100',
      status: 'Not a fit',
    },
    {
      key: 'rate',
      label: 'Success rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      accent: 'text-emerald-700 bg-emerald-50',
      status: null,
      caption: 'of leads worked',
    },
  ];

  const activeStatus =
    filters.statuses.length === 1 ? filters.statuses[0] : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const isActive = card.status !== null && activeStatus === card.status;
        const Icon = card.icon;

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilterByStatus(isActive ? null : card.status)}
            aria-pressed={card.status === null ? undefined : isActive}
            className={cn(
              'group flex flex-col items-start gap-1.5 rounded-xl border bg-white p-3 text-left shadow-card transition-all hover:border-navy-300 hover:shadow-panel sm:gap-2 sm:p-3.5',
              isActive ? 'border-navy-500 ring-1 ring-navy-500' : 'border-slate-200',
            )}
          >
            {/* Icon and value share a line so the cards stay short on phones. */}
            <span className="flex items-center gap-2">
              <span className={cn('rounded-lg p-1.5', card.accent)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-xl font-semibold tabular-nums tracking-tight text-navy-950 sm:text-2xl">
                {card.value}
              </span>
            </span>
            <span className="text-xs font-medium leading-tight text-slate-500">
              {card.label}
              {card.caption && (
                <span
                  className={cn(
                    'mt-0.5 block font-normal',
                    card.key === 'followup' && stats.dueFollowUps > 0
                      ? 'text-amber-600'
                      : 'text-slate-400',
                  )}
                >
                  {card.caption}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Build the filter patch a summary card click should apply. */
export function statusFilterPatch(status: OutreachStatus | null, current: Filters): Filters {
  if (status === null) return { ...current, statuses: [], successful: null };
  return { ...current, statuses: [status], successful: null };
}

export { EMPTY_FILTERS };
