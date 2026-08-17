/** Small shared helpers. No dependencies beyond the DOM. */

/** Join conditional class names. A tiny stand-in for `clsx`. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * Coerce any imported cell into a safe display string.
 *
 * Spreadsheet content is untrusted: it is rendered as text by React (never via
 * `dangerouslySetInnerHTML`), and this strips control characters that would
 * otherwise let a cell mangle the layout. Leading `=`, `+`, `-` and `@` are
 * left intact for display but the value is never evaluated as a formula.
 */
export function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

/**
 * Decode XML character entities.
 *
 * Hyperlink targets live in the workbook's `.rels` XML, where `&` is stored as
 * `&amp;`. SheetJS hands the target back without decoding it, so a URL like
 * `…?authuser=0&amp;hl=en` would otherwise be opened with a query parameter
 * literally named `amp;hl`. Everything is decoded in a single pass so an
 * escaped entity such as `&amp;lt;` yields `&lt;` rather than `<`.
 */
export function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    const key = entity.toLowerCase();

    if (key.startsWith('#x')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }
    if (key.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : match;
    }

    return NAMED_ENTITIES[key] ?? match;
  });
}

/**
 * Only `http:` and `https:` URLs may become links. Anything else — including
 * `javascript:`, `data:` and relative paths — returns `null` and is rendered
 * as inert text instead.
 */
export function safeUrl(value: unknown): string | null {
  const raw = toDisplayString(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
    return null;
  } catch {
    return null;
  }
}

/** Digits (and a single leading `+`) only — what a `tel:` link accepts. */
export function telHref(phone: string): string | null {
  const raw = toDisplayString(phone);
  if (!raw) return null;
  const plus = raw.trimStart().startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 6) return null;
  return `tel:${plus ? '+' : ''}${digits}`;
}

/** Identity for a lead: business name + phone, normalised. */
export function makeLeadKey(businessName: string, phoneNumber: string): string {
  const name = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const phone = phoneNumber.replace(/\D/g, '');
  return `${name || 'unnamed'}::${phone || 'nophone'}`;
}

export function todayIso(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** `true` when an ISO date is today or in the past. Empty dates are never due. */
export function isDueOrOverdue(isoDate: string): boolean {
  if (!isoDate) return false;
  return isoDate <= todayIso();
}

export function isOverdue(isoDate: string): boolean {
  if (!isoDate) return false;
  return isoDate < todayIso();
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate.length === 10 ? `${isoDate}T00:00:00` : isoDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Relative label for recency columns, e.g. "3 days ago". */
export function formatRelative(iso: string): string {
  if (!iso) return 'Never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Never';
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(iso.slice(0, 10));
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke on the next frame so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
