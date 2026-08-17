import { CalendarClock, MapPin } from 'lucide-react';
import type { Lead, OutreachStatus } from '@/types/lead';
import { Checkbox } from '@/components/ui/Field';
import { StatusSelect } from '@/components/StatusControls';
import { CallButton, CopyPhoneButton, EvidenceButton, RatingDisplay } from '@/components/LeadActions';
import { cn, formatRelative, isDueOrOverdue, isOverdue } from '@/lib/utils';

interface LeadCardListProps {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: OutreachStatus) => void;
  onSuccessChange: (lead: Lead, successful: boolean) => void;
}

/** Compact card layout used below the `lg` breakpoint. */
export function LeadCardList({
  leads,
  onOpenLead,
  onStatusChange,
  onSuccessChange,
}: LeadCardListProps) {
  return (
    <ul className="flex flex-col gap-2.5 lg:hidden">
      {leads.map((lead) => {
        const followUpDue = isDueOrOverdue(lead.nextFollowUp) && !lead.successful;

        return (
          <li
            key={lead.id}
            className={cn(
              'rounded-xl border bg-white p-3.5 shadow-card',
              lead.successful ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200',
            )}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={lead.successful}
                onChange={(checked) => onSuccessChange(lead, checked)}
                label={`Mark ${lead.businessName} as successful`}
                srOnlyLabel
                className="mt-0.5"
              />

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onOpenLead(lead)}
                  className="block w-full text-left"
                >
                  <span
                    className={cn(
                      'block text-sm font-semibold leading-snug text-navy-900 underline-offset-2 hover:underline',
                      lead.successful && 'text-emerald-800',
                    )}
                  >
                    {lead.businessName}
                  </span>
                </button>

                <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{lead.trade || '—'}</p>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {lead.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="line-clamp-1">{lead.location}</span>
                    </span>
                  )}
                  <RatingDisplay lead={lead} />
                </div>

                {followUpDue && (
                  <p
                    className={cn(
                      'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                      isOverdue(lead.nextFollowUp) ? 'text-red-600' : 'text-amber-600',
                    )}
                  >
                    <CalendarClock className="h-3 w-3" aria-hidden="true" />
                    Follow-up {isOverdue(lead.nextFollowUp) ? 'overdue' : 'due today'}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <CallButton lead={lead} className="flex-1 justify-center" />
              <CopyPhoneButton lead={lead} />
              <EvidenceButton lead={lead} withLabel={false} className="px-2.5" />
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <StatusSelect
                value={lead.status}
                onChange={(status) => onStatusChange(lead, status)}
                label={`Outreach status for ${lead.businessName}`}
              />
              <span className="text-xs text-slate-400">{formatRelative(lead.updatedAt)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
