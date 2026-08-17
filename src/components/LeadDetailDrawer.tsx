import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, History, Lightbulb, MapPin, Phone, ShieldCheck, Tag } from 'lucide-react';
import type { EditableField } from '@/hooks/useLeads';
import type { Lead, OutreachStatus } from '@/types/lead';
import { Modal } from '@/components/ui/Modal';
import { Checkbox, TextInput, Textarea } from '@/components/ui/Field';
import { StatusSelect } from '@/components/StatusControls';
import { CallButton, CopyPhoneButton, EvidenceButton, RatingDisplay } from '@/components/LeadActions';
import { cn, formatDateTime, isDueOrOverdue, isOverdue } from '@/lib/utils';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (lead: Lead, status: OutreachStatus) => void;
  onSuccessChange: (lead: Lead, successful: boolean) => void;
  onFieldChange: (lead: Lead, field: EditableField, value: string) => void;
}

/**
 * Full lead detail panel.
 *
 * Notes are held in local component state and committed on blur so every
 * keystroke does not write to localStorage.
 */
export function LeadDetailDrawer({
  lead,
  onClose,
  onStatusChange,
  onSuccessChange,
  onFieldChange,
}: LeadDetailDrawerProps) {
  const [noteDraft, setNoteDraft] = useState('');

  // Re-seed the draft whenever a different lead is opened.
  useEffect(() => {
    setNoteDraft(lead?.notes ?? '');
  }, [lead?.id, lead?.notes]);

  if (!lead) return null;

  const commitNotes = () => {
    if (noteDraft !== lead.notes) onFieldChange(lead, 'notes', noteDraft);
  };

  const followUpDue = isDueOrOverdue(lead.nextFollowUp) && !lead.successful;

  return (
    <Modal
      open={lead !== null}
      onClose={() => {
        commitNotes();
        onClose();
      }}
      title={lead.businessName}
      description={[lead.trade, lead.location].filter(Boolean).join(' · ') || undefined}
      variant="drawer"
    >
      <div className="flex flex-col gap-5">
        {/* Success + status, the two controls that drive everything else. */}
        <section
          className={cn(
            'rounded-xl border p-3.5',
            lead.successful ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-slate-50',
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Checkbox
              checked={lead.successful}
              onChange={(checked) => onSuccessChange(lead, checked)}
              label="Successful lead"
              className={cn('font-medium', lead.successful && '[&_label]:text-emerald-800')}
            />
            <StatusSelect
              value={lead.status}
              onChange={(status) => onStatusChange(lead, status)}
              label={`Outreach status for ${lead.businessName}`}
              className="h-9 text-sm"
            />
          </div>
        </section>

        {/* Primary actions. */}
        <section className="flex flex-wrap items-center gap-2">
          <CallButton lead={lead} size="md" showNumber />
          <CopyPhoneButton lead={lead} />
          <EvidenceButton lead={lead} size="md" />
        </section>

        {/* Imported facts. */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem icon={Phone} label="Phone number" value={lead.phoneNumber} />
          <DetailItem
            icon={ShieldCheck}
            label="Google rating"
            custom={<RatingDisplay lead={lead} />}
          />
          <DetailItem icon={Tag} label="Trade / services" value={lead.trade} />
          <DetailItem icon={MapPin} label="Location" value={lead.location} />
          <DetailItem icon={Tag} label="Lead segment" value={lead.leadSegment} />
          <DetailItem icon={Tag} label="Research batch" value={lead.researchBatch} />
        </dl>

        {lead.websiteOpportunity && (
          <section className="rounded-xl border border-navy-200 bg-navy-50/60 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-800">
              <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
              Website opportunity signal
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-900">{lead.websiteOpportunity}</p>
          </section>
        )}

        {lead.verificationNotes && (
          <section className="rounded-xl border border-slate-200 p-3.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Qualification / verification notes
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{lead.verificationNotes}</p>
          </section>
        )}

        {/* Editable outreach state. */}
        <section className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Your outreach record
          </h3>

          <Textarea
            label="Outreach notes"
            rows={5}
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            onBlur={commitNotes}
            placeholder="What was discussed, who you spoke to, what to do next…"
            hint="Saved automatically when you click away."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput
              label="Last contacted"
              type="date"
              value={lead.lastContacted}
              onChange={(event) => onFieldChange(lead, 'lastContacted', event.target.value)}
            />
            <TextInput
              label="Next follow-up"
              type="date"
              value={lead.nextFollowUp}
              onChange={(event) => onFieldChange(lead, 'nextFollowUp', event.target.value)}
            />
          </div>

          {followUpDue && (
            <p
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium',
                isOverdue(lead.nextFollowUp)
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-800',
              )}
            >
              <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isOverdue(lead.nextFollowUp)
                ? 'This follow-up is overdue.'
                : 'This follow-up is due today.'}
            </p>
          )}

          <p className="text-xs text-slate-500">
            Last updated: <span className="font-medium">{formatDateTime(lead.updatedAt)}</span>
          </p>
        </section>

        {lead.history.length > 0 && (
          <section className="rounded-xl border border-slate-200 p-3.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              Status history
            </h3>
            <ol className="mt-2 flex flex-col gap-1.5">
              {lead.history.slice(0, 8).map((entry) => (
                <li key={entry.at} className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
                  <span className="text-slate-400">{formatDateTime(entry.at)}</span>
                  <span className="text-slate-500">{entry.from}</span>
                  <span aria-hidden="true" className="text-slate-300">
                    →
                  </span>
                  <span className="font-medium text-navy-800">{entry.to}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className="text-xs text-slate-400">
          Imported from “{lead.sourceSheet}”
          {lead.rowNumber !== null && ` · row ${lead.rowNumber}`}
        </p>
      </div>
    </Modal>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  custom,
}: {
  icon: typeof Phone;
  label: string;
  value?: string;
  custom?: ReactNode;
}) {
  if (!custom && !value) return null;

  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">{custom ?? value}</dd>
    </div>
  );
}
