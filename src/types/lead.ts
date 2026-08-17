/**
 * Core domain types.
 *
 * The model is split deliberately into two halves:
 *
 *  - `ImportedLead`  — read-only facts that came out of the spreadsheet.
 *  - `LeadManagement` — everything the user edits locally (status, notes, dates).
 *
 * Keeping them separate is what makes "Replace Lead File" safe: a new import
 * swaps the `ImportedLead` half while the `LeadManagement` half is re-attached
 * by matching key. It is also the seam where a database-backed version would
 * slot in — `LeadManagement` records are the only rows that would need writing.
 */

export const OUTREACH_STATUSES = [
  'Not contacted',
  'Contacted',
  'Follow-up',
  'Successful',
  'Not a fit',
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

/** Facts imported from the spreadsheet. Treated as display data only. */
export interface ImportedLead {
  /** Stable identity derived from business name + phone. See `makeLeadKey`. */
  id: string;
  rowNumber: number | null;
  businessName: string;
  trade: string;
  location: string;
  googleRating: number | null;
  googleReviews: number | null;
  phoneNumber: string;
  websiteOpportunity: string;
  leadSegment: string;
  researchBatch: string;
  verificationNotes: string;
  /** Only ever an http(s) URL, or `null`. Validated at import time. */
  sourceUrl: string | null;
  /** Status as it appeared in the file — the seed for local management state. */
  importedStatus: string;
  /** Worksheet the row came from, useful when a workbook has several tabs. */
  sourceSheet: string;
}

/** Locally-owned, user-editable state for a lead. */
export interface LeadManagement {
  status: OutreachStatus;
  successful: boolean;
  notes: string;
  /** ISO date string (yyyy-mm-dd) or empty. */
  lastContacted: string;
  /** ISO date string (yyyy-mm-dd) or empty. */
  nextFollowUp: string;
  /** ISO timestamp of the last local edit, or empty if never touched. */
  updatedAt: string;
  /** Newest-first audit trail of status transitions. */
  history: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  at: string;
  from: OutreachStatus;
  to: OutreachStatus;
}

/** An imported lead joined with its local management state — what the UI renders. */
export interface Lead extends ImportedLead, LeadManagement {}

export interface LeadDataset {
  /** Schema version, so a future migration can detect old payloads. */
  version: number;
  fileName: string;
  importedAt: string;
  sheetName: string;
  /** True when the rows are the built-in preview sample rather than a real import. */
  isSample: boolean;
  leads: ImportedLead[];
}

export type ManagementMap = Record<string, LeadManagement>;

export interface ImportResult {
  dataset: LeadDataset;
  /** Non-fatal problems worth surfacing (skipped rows, missing columns). */
  warnings: string[];
}

export type SortField =
  | 'businessName'
  | 'googleRating'
  | 'googleReviews'
  | 'location'
  | 'nextFollowUp'
  | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export interface Filters {
  search: string;
  statuses: OutreachStatus[];
  /** `null` = no filter, `true` = successful only, `false` = not successful. */
  successful: boolean | null;
  trades: string[];
  locations: string[];
  minRating: number | null;
  minReviews: number | null;
  maxReviews: number | null;
  tradeAndConstructionOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  search: '',
  statuses: [],
  successful: null,
  trades: [],
  locations: [],
  minRating: null,
  minReviews: null,
  maxReviews: null,
  tradeAndConstructionOnly: false,
};
