import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Phone, PhoneOff } from 'lucide-react';
import type { Lead } from '@/types/lead';
import { Button, LinkButton } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { cn, telHref } from '@/lib/utils';

interface CallButtonProps {
  lead: Lead;
  size?: 'sm' | 'md';
  showNumber?: boolean;
  className?: string;
}

/**
 * Call action.
 *
 * The `tel:` href is built strictly from the imported phone number — no number
 * is ever synthesised, and a row without a usable number renders a disabled
 * control instead of a dead link.
 */
export function CallButton({ lead, size = 'sm', showNumber = false, className }: CallButtonProps) {
  const href = telHref(lead.phoneNumber);

  if (!href) {
    return (
      <Tooltip label="No phone number in the imported file">
        <span
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-400',
            className,
          )}
        >
          <PhoneOff className="h-3.5 w-3.5" aria-hidden="true" />
          No number
        </span>
      </Tooltip>
    );
  }

  return (
    <LinkButton
      href={href}
      variant="primary"
      size={size}
      className={className}
      aria-label={`Call ${lead.businessName} on ${lead.phoneNumber}`}
    >
      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
      {showNumber ? lead.phoneNumber : 'Call'}
    </LinkButton>
  );
}

/** Copy-to-clipboard with inline "Copied" confirmation. */
export function CopyPhoneButton({ lead, className }: { lead: Lead; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = useCallback(async () => {
    if (!lead.phoneNumber) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lead.phoneNumber);
      } else {
        // Fallback for non-secure contexts, where the async clipboard is unavailable.
        const field = document.createElement('textarea');
        field.value = lead.phoneNumber;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        document.body.removeChild(field);
      }
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('Could not copy the phone number.', 'error');
    }
  }, [lead.phoneNumber, toast]);

  if (!lead.phoneNumber) return null;

  return (
    <Tooltip label={copied ? 'Copied' : 'Copy phone number'}>
      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        aria-label={`Copy phone number for ${lead.businessName}`}
        className={cn(copied && 'border-emerald-300 bg-emerald-50 text-emerald-700', className)}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </Tooltip>
  );
}

interface EvidenceButtonProps {
  lead: Lead;
  size?: 'sm' | 'md';
  withLabel?: boolean;
  className?: string;
}

/**
 * Opens the imported Google source URL in a new tab.
 *
 * The URL was validated as `http(s)` at import time; `rel="noopener noreferrer"`
 * keeps the opened tab from reaching back into this one.
 */
export function EvidenceButton({
  lead,
  size = 'sm',
  withLabel = true,
  className,
}: EvidenceButtonProps) {
  if (!lead.sourceUrl) {
    return (
      <Tooltip label="No Google evidence link in the imported file">
        <span
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-400',
            className,
          )}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          No link
        </span>
      </Tooltip>
    );
  }

  return (
    <LinkButton
      href={lead.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      size={size}
      className={cn('border border-navy-200', className)}
      aria-label={`Open Google evidence for ${lead.businessName} in a new tab`}
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      {withLabel && <span>Google evidence</span>}
    </LinkButton>
  );
}

/** Rating + review count, rendered as a compact inline pair. */
export function RatingDisplay({ lead, className }: { lead: Lead; className?: string }) {
  if (lead.googleRating === null && lead.googleReviews === null) {
    return <span className={cn('text-sm text-slate-400', className)}>—</span>;
  }

  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      {lead.googleRating !== null && (
        <span className="inline-flex items-baseline gap-1 text-sm font-semibold text-slate-900">
          <span aria-hidden="true" className="text-amber-500">
            ★
          </span>
          {lead.googleRating.toFixed(1)}
        </span>
      )}
      {lead.googleReviews !== null && (
        <span className="text-xs text-slate-500">
          ({lead.googleReviews.toLocaleString('en-AU')})
        </span>
      )}
      <span className="sr-only">
        {lead.googleRating !== null ? `${lead.googleRating.toFixed(1)} stars` : 'No rating'}
        {lead.googleReviews !== null ? ` from ${lead.googleReviews} reviews` : ''}
      </span>
    </span>
  );
}
