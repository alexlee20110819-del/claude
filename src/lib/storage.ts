/**
 * localStorage persistence.
 *
 * Two keys are stored independently:
 *
 *   `qld-lead-manager:dataset`    — the imported spreadsheet rows
 *   `qld-lead-manager:management` — the user's own edits, keyed by lead id
 *
 * Splitting them is what lets "Replace Lead File" keep outreach history: the
 * dataset is swapped wholesale while the management map survives, re-attached
 * by `businessName + phone` key.
 *
 * Every read is defensive — a corrupt or hand-edited value must never crash
 * the app, it just falls back to empty state.
 */

import type {
  LeadDataset,
  LeadManagement,
  ManagementMap,
  OutreachStatus,
} from '@/types/lead';
import { OUTREACH_STATUSES } from '@/types/lead';
import { DATASET_VERSION } from './importer';

const DATASET_KEY = 'qld-lead-manager:dataset';
const MANAGEMENT_KEY = 'qld-lead-manager:management';
const FILTERS_KEY = 'qld-lead-manager:filters';

function isStatus(value: unknown): value is OutreachStatus {
  return typeof value === 'string' && (OUTREACH_STATUSES as readonly string[]).includes(value);
}

/** Seed local state from whatever the spreadsheet's own status column said. */
export function defaultManagement(importedStatus = ''): LeadManagement {
  const status: OutreachStatus = isStatus(importedStatus) ? importedStatus : 'Not contacted';
  return {
    status,
    successful: status === 'Successful',
    notes: '',
    lastContacted: '',
    nextFollowUp: '',
    updatedAt: '',
    history: [],
  };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadDataset(): LeadDataset | null {
  const parsed = safeParse<LeadDataset>(localStorage.getItem(DATASET_KEY));
  if (!parsed || !Array.isArray(parsed.leads) || parsed.leads.length === 0) return null;
  if (parsed.version !== DATASET_VERSION) return null;
  return parsed;
}

export function saveDataset(dataset: LeadDataset): void {
  try {
    localStorage.setItem(DATASET_KEY, JSON.stringify(dataset));
  } catch (error) {
    console.error('Could not save the lead file locally (storage may be full).', error);
  }
}

/** Coerce an unknown stored record into a valid `LeadManagement`. */
function normaliseManagement(value: unknown): LeadManagement | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<LeadManagement>;
  const status: OutreachStatus = isStatus(record.status) ? record.status : 'Not contacted';
  return {
    status,
    successful: typeof record.successful === 'boolean' ? record.successful : status === 'Successful',
    notes: typeof record.notes === 'string' ? record.notes : '',
    lastContacted: typeof record.lastContacted === 'string' ? record.lastContacted : '',
    nextFollowUp: typeof record.nextFollowUp === 'string' ? record.nextFollowUp : '',
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : '',
    history: Array.isArray(record.history)
      ? record.history.filter(
          (entry) =>
            entry &&
            typeof entry === 'object' &&
            isStatus((entry as { to?: unknown }).to) &&
            isStatus((entry as { from?: unknown }).from),
        )
      : [],
  };
}

export function loadManagement(): ManagementMap {
  const parsed = safeParse<Record<string, unknown>>(localStorage.getItem(MANAGEMENT_KEY));
  if (!parsed || typeof parsed !== 'object') return {};

  const result: ManagementMap = {};
  for (const [id, value] of Object.entries(parsed)) {
    const normalised = normaliseManagement(value);
    if (normalised) result[id] = normalised;
  }
  return result;
}

export function saveManagement(management: ManagementMap): void {
  try {
    localStorage.setItem(MANAGEMENT_KEY, JSON.stringify(management));
  } catch (error) {
    console.error('Could not save your lead edits locally (storage may be full).', error);
  }
}

export function loadFilters<T>(): T | null {
  return safeParse<T>(localStorage.getItem(FILTERS_KEY));
}

export function saveFilters(filters: unknown): void {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Filter persistence is a convenience — failing to save it is not worth surfacing.
  }
}

/**
 * Drop management records whose lead is no longer present in the dataset, and
 * report how many were carried over. Called after a file replacement so the
 * user gets an honest "42 of 79 leads kept their outreach history" message.
 */
export function reconcileManagement(
  management: ManagementMap,
  leadIds: string[],
): { kept: ManagementMap; matched: number; dropped: number } {
  const idSet = new Set(leadIds);
  const kept: ManagementMap = {};
  let matched = 0;
  let dropped = 0;

  for (const [id, record] of Object.entries(management)) {
    // A record is only worth keeping if the user actually edited it.
    const isUntouched = record.updatedAt === '' && record.notes === '' && !record.successful;

    if (idSet.has(id)) {
      kept[id] = record;
      if (!isUntouched) matched += 1;
    } else if (!isUntouched) {
      dropped += 1;
    }
  }

  return { kept, matched, dropped };
}

export function clearAllData(): void {
  localStorage.removeItem(DATASET_KEY);
  localStorage.removeItem(MANAGEMENT_KEY);
  localStorage.removeItem(FILTERS_KEY);
}

export function clearManagementOnly(): void {
  localStorage.removeItem(MANAGEMENT_KEY);
}
