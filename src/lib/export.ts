/**
 * CSV export of the current filtered view.
 *
 * The original uploaded workbook is never touched — this builds a fresh CSV in
 * memory from the joined lead records and hands it to the browser as a download.
 */

import type { Lead } from '@/types/lead';
import { downloadBlob } from './utils';

const COLUMNS: Array<{ header: string; value: (lead: Lead) => string }> = [
  { header: 'Business Name', value: (l) => l.businessName },
  { header: 'Trade / Services', value: (l) => l.trade },
  { header: 'Location', value: (l) => l.location },
  { header: 'Google Rating', value: (l) => (l.googleRating === null ? '' : String(l.googleRating)) },
  { header: 'Google Reviews', value: (l) => (l.googleReviews === null ? '' : String(l.googleReviews)) },
  { header: 'Phone Number', value: (l) => l.phoneNumber },
  { header: 'Website Opportunity Signal', value: (l) => l.websiteOpportunity },
  { header: 'Lead Segment', value: (l) => l.leadSegment },
  { header: 'Research Batch', value: (l) => l.researchBatch },
  { header: 'Verification Notes', value: (l) => l.verificationNotes },
  { header: 'Source URL', value: (l) => l.sourceUrl ?? '' },
  // Local management fields.
  { header: 'Outreach Status', value: (l) => l.status },
  { header: 'Successful', value: (l) => (l.successful ? 'Yes' : 'No') },
  { header: 'Outreach Notes', value: (l) => l.notes },
  { header: 'Last Contacted', value: (l) => l.lastContacted },
  { header: 'Next Follow-up', value: (l) => l.nextFollowUp },
  { header: 'Last Updated', value: (l) => l.updatedAt },
];

/** Phone-shaped values: `+61 7 3872 6750`, `(07) 3872 6750`, `0412-349-198`. */
const PHONE_LIKE = /^[+(]?[\d\s()+\-.]{5,}$/;

/**
 * Decide whether a field needs a leading apostrophe to stop a spreadsheet
 * evaluating it as a formula on open (CSV injection).
 *
 * The naive rule — guard anything starting with `=`, `+`, `-` or `@` — would
 * prefix every `+61…` phone number in the export, which is the one column the
 * user most needs to read back cleanly. Phone-shaped values contain only digits
 * and dialling punctuation, so they cannot form a formula and are left alone.
 */
function needsFormulaGuard(value: string): boolean {
  if (!/^[=+\-@\t\r]/.test(value)) return false;
  return !PHONE_LIKE.test(value);
}

function escapeCsv(value: string): string {
  const guarded = needsFormulaGuard(value) ? `'${value}` : value;
  if (/["\n\r,]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export function buildCsv(leads: Lead[]): string {
  const lines = [COLUMNS.map((column) => escapeCsv(column.header)).join(',')];

  for (const lead of leads) {
    lines.push(COLUMNS.map((column) => escapeCsv(column.value(lead))).join(','));
  }

  return lines.join('\r\n');
}

export function exportLeadsToCsv(leads: Lead[]): string {
  const csv = buildCsv(leads);
  // The BOM keeps Excel happy with UTF-8 business names.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `queensland-leads-${stamp}.csv`;
  downloadBlob(blob, fileName);
  return fileName;
}
