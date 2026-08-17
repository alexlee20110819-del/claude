import { ArrowDown, ArrowUp, ArrowUpDown, CalendarClock } from 'lucide-react';
import type { Lead, OutreachStatus, SortDirection, SortField } from '@/types/lead';
import { Checkbox } from '@/components/ui/Field';
import { Tooltip } from '@/components/ui/Tooltip';
import { StatusSelect } from '@/components/StatusControls';
import { CallButton, CopyPhoneButton, EvidenceButton, RatingDisplay } from '@/components/LeadActions';
import { cn, formatDate, formatRelative, isDueOrOverdue, isOverdue } from '@/lib/utils';

interface LeadTableProps {
  leads: Lead[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onOpenLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: OutreachStatus) => void;
  onSuccessChange: (lead: Lead, successful: boolean) => void;
}

const COLUMNS: Array<{ label: string; field?: SortField; className?: string }> = [
  { label: 'Successful', className: 'w-14' },
  { label: 'Business', field: 'businessName' },
  { label: 'Trade / services' },
  { label: 'Location', field: 'location' },
  { label: 'Google', field: 'googleRating' },
  { label: 'Call', className: 'w-40' },
  { label: 'Evidence', className: 'w-40' },
  { label: 'Status', className: 'w-40' },
  { label: 'Updated', field: 'updatedAt', className: 'w-32' },
];

export function LeadTable({
  leads,
  sortField,
  sortDirection,
  onSort,
  onOpenLead,
  onStatusChange,
  onSuccessChange,
}: LeadTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card lg:block">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Queensland website-opportunity leads. Select a business name to open its full detail
            panel.
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {COLUMNS.map((column) => {
                const isSorted = column.field !== undefined && sortField === column.field;
                const SortIcon = !isSorted ? ArrowUpDown : sortDirection === 'asc' ? ArrowUp : ArrowDown;

                return (
                  <th
                    key={column.label}
                    scope="col"
                    aria-sort={
                      isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined
                    }
                    className={cn(
                      'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500',
                      column.className,
                    )}
                  >
                    {column.field ? (
                      <button
                        type="button"
                        onClick={() => onSort(column.field!)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded transition-colors hover:text-navy-800',
                          isSorted && 'text-navy-800',
                        )}
                      >
                        {column.label}
                        <SortIcon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                onOpenLead={onOpenLead}
                onStatusChange={onStatusChange}
                onSuccessChange={onSuccessChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadTableRow({
  lead,
  onOpenLead,
  onStatusChange,
  onSuccessChange,
}: {
  lead: Lead;
  onOpenLead: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: OutreachStatus) => void;
  onSuccessChange: (lead: Lead, successful: boolean) => void;
}) {
  const followUpDue = isDueOrOverdue(lead.nextFollowUp) && !lead.successful;

  return (
    <tr
      className={cn(
        'border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/80',
        lead.successful && 'bg-emerald-50/60 hover:bg-emerald-50',
      )}
    >
      <td className="px-3 py-2.5">
        <Tooltip label={lead.successful ? 'Successful lead' : 'Mark as successful'}>
          <Checkbox
            checked={lead.successful}
            onChange={(checked) => onSuccessChange(lead, checked)}
            label={`Mark ${lead.businessName} as successful`}
            srOnlyLabel
          />
        </Tooltip>
      </td>

      <td className="max-w-[22rem] px-3 py-2.5">
        <button
          type="button"
          onClick={() => onOpenLead(lead)}
          className="group block max-w-full text-left"
        >
          <span
            className={cn(
              'block truncate text-sm font-semibold text-navy-900 underline-offset-2 group-hover:text-navy-700 group-hover:underline',
              lead.successful && 'text-emerald-800',
            )}
          >
            {lead.businessName}
          </span>
          {followUpDue && (
            <span
              className={cn(
                'mt-0.5 inline-flex items-center gap-1 text-xs font-medium',
                isOverdue(lead.nextFollowUp) ? 'text-red-600' : 'text-amber-600',
              )}
            >
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              {isOverdue(lead.nextFollowUp) ? 'Overdue' : 'Due today'}
            </span>
          )}
        </button>
      </td>

      <td className="max-w-[18rem] px-3 py-2.5">
        <span className="block truncate text-sm text-slate-600" title={lead.trade}>
          {lead.trade || '—'}
        </span>
      </td>

      <td className="max-w-[12rem] px-3 py-2.5">
        <span className="block truncate text-sm text-slate-600" title={lead.location}>
          {lead.location || '—'}
        </span>
      </td>

      <td className="px-3 py-2.5">
        <RatingDisplay lead={lead} />
      </td>

      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <CallButton lead={lead} />
          <CopyPhoneButton lead={lead} />
        </div>
      </td>

      <td className="px-3 py-2.5">
        <EvidenceButton lead={lead} />
      </td>

      <td className="px-3 py-2.5">
        <StatusSelect
          value={lead.status}
          onChange={(status) => onStatusChange(lead, status)}
          label={`Outreach status for ${lead.businessName}`}
        />
      </td>

      <td className="px-3 py-2.5">
        <span className="text-xs text-slate-500" title={formatDate(lead.updatedAt.slice(0, 10))}>
          {formatRelative(lead.updatedAt)}
        </span>
      </td>
    </tr>
  );
}
