/**
 * The application's single source of truth.
 *
 * Owns the imported dataset, the local management map, and the filter/sort
 * state, and exposes the small set of actions the UI needs. All persistence
 * happens here so components stay presentational.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Filters,
  ImportResult,
  Lead,
  LeadDataset,
  LeadManagement,
  ManagementMap,
  OutreachStatus,
  SortDirection,
  SortField,
} from '@/types/lead';
import { EMPTY_FILTERS } from '@/types/lead';
import {
  clearAllData,
  defaultManagement,
  loadDataset,
  loadFilters,
  loadManagement,
  reconcileManagement,
  saveDataset,
  saveFilters,
  saveManagement,
} from '@/lib/storage';
import {
  getBundledDataset,
  hasAnyBundledLeads,
  hasEncryptedLeads,
  unlockBundledDataset,
} from '@/lib/bundledLeads';
import { isDueOrOverdue } from '@/lib/utils';

export interface LeadStats {
  total: number;
  notContacted: number;
  contacted: number;
  followUp: number;
  successful: number;
  notAFit: number;
  successRate: number;
  dueFollowUps: number;
}

export interface ReplaceSummary {
  matched: number;
  dropped: number;
  total: number;
}

/** Fields the user can edit directly (status/success have dedicated actions). */
export type EditableField = 'notes' | 'lastContacted' | 'nextFollowUp';

export function useLeads() {
  const [dataset, setDataset] = useState<LeadDataset | null>(null);
  const [management, setManagement] = useState<ManagementMap>({});
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sortField, setSortField] = useState<SortField>('businessName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Saved leads always win. A personal build with leads baked in only seeds
    // them on a browser that has nothing stored yet, so a later "Replace lead
    // file" import is never silently reverted to the bundled copy.
    setDataset(loadDataset() ?? getBundledDataset());
    setManagement(loadManagement());
    const storedFilters = loadFilters<Filters>();
    if (storedFilters) setFilters({ ...EMPTY_FILTERS, ...storedFilters });
    setIsReady(true);
  }, []);

  // The save effects are gated on `isReady` *state*, not a ref. A ref set inside
  // the hydration effect would already be true when these effects run in the
  // same commit — and they would persist the still-empty initial state straight
  // over what was just loaded. `isReady` only becomes true on the following
  // render, by which point the loaded values are in state.
  useEffect(() => {
    if (!isReady || !dataset) return;
    saveDataset(dataset);
  }, [isReady, dataset]);

  useEffect(() => {
    if (!isReady) return;
    saveManagement(management);
  }, [isReady, management]);

  useEffect(() => {
    if (!isReady) return;
    saveFilters(filters);
  }, [isReady, filters]);

  /** Imported rows joined with their local management state. */
  const leads: Lead[] = useMemo(() => {
    if (!dataset) return [];
    return dataset.leads.map((imported) => ({
      ...imported,
      ...(management[imported.id] ?? defaultManagement(imported.importedStatus)),
    }));
  }, [dataset, management]);

  const stats: LeadStats = useMemo(() => {
    const total = leads.length;
    let notContacted = 0;
    let contacted = 0;
    let followUp = 0;
    let successful = 0;
    let notAFit = 0;
    let dueFollowUps = 0;

    for (const lead of leads) {
      switch (lead.status) {
        case 'Not contacted':
          notContacted += 1;
          break;
        case 'Contacted':
          contacted += 1;
          break;
        case 'Follow-up':
          followUp += 1;
          break;
        case 'Successful':
          successful += 1;
          break;
        case 'Not a fit':
          notAFit += 1;
          break;
      }
      if (isDueOrOverdue(lead.nextFollowUp) && lead.status !== 'Successful') dueFollowUps += 1;
    }

    // Success rate is measured against leads actually worked, not the whole list.
    const worked = total - notContacted;
    const successRate = worked > 0 ? Math.round((successful / worked) * 100) : 0;

    return { total, notContacted, contacted, followUp, successful, notAFit, successRate, dueFollowUps };
  }, [leads]);

  const tradeOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.trade).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [leads],
  );

  const locationOptions = useMemo(
    () => [...new Set(leads.map((lead) => lead.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    const searchDigits = term.replace(/\D/g, '');

    const matches = leads.filter((lead) => {
      if (term) {
        const haystack = [lead.businessName, lead.trade, lead.location, lead.phoneNumber]
          .join(' ')
          .toLowerCase();
        const phoneDigits = lead.phoneNumber.replace(/\D/g, '');
        const textHit = haystack.includes(term);
        const phoneHit = searchDigits.length >= 3 && phoneDigits.includes(searchDigits);
        if (!textHit && !phoneHit) return false;
      }

      if (filters.statuses.length > 0 && !filters.statuses.includes(lead.status)) return false;
      if (filters.successful !== null && lead.successful !== filters.successful) return false;
      if (filters.trades.length > 0 && !filters.trades.includes(lead.trade)) return false;
      if (filters.locations.length > 0 && !filters.locations.includes(lead.location)) return false;

      if (filters.minRating !== null) {
        if (lead.googleRating === null || lead.googleRating < filters.minRating) return false;
      }
      if (filters.minReviews !== null) {
        if (lead.googleReviews === null || lead.googleReviews < filters.minReviews) return false;
      }
      if (filters.maxReviews !== null) {
        if (lead.googleReviews === null || lead.googleReviews > filters.maxReviews) return false;
      }

      if (filters.tradeAndConstructionOnly && !isTradeLead(lead)) return false;

      return true;
    });

    const direction = sortDirection === 'asc' ? 1 : -1;

    return matches.sort((a, b) => {
      // Leads missing the sort key always sink to the bottom, in both
      // directions — an unrated lead is never the "top rated" result.
      const aMissing = isMissingSortValue(a, sortField);
      const bMissing = isMissingSortValue(b, sortField);
      if (aMissing !== bMissing) return aMissing ? 1 : -1;

      const compared = compareLeads(a, b, sortField);
      // Fall back to name so the order is stable when the key ties.
      if (compared === 0) return a.businessName.localeCompare(b.businessName);
      return compared * direction;
    });
  }, [leads, filters, sortField, sortDirection]);

  /** Apply a management patch to one lead and stamp `updatedAt`. */
  const patchLead = useCallback(
    (leadId: string, patch: Partial<LeadManagement>, importedStatus = '') => {
      setManagement((current) => {
        const existing = current[leadId] ?? defaultManagement(importedStatus);
        const next: LeadManagement = {
          ...existing,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
        return { ...current, [leadId]: next };
      });
    },
    [],
  );

  /**
   * Status changes and the success tick are two views of one state, so they are
   * updated together:
   *   - moving to `Successful` ticks the box
   *   - moving away from `Successful` unticks it
   */
  const setStatus = useCallback(
    (lead: Lead, status: OutreachStatus) => {
      if (status === lead.status) return;
      const entry = { at: new Date().toISOString(), from: lead.status, to: status };
      patchLead(
        lead.id,
        {
          status,
          successful: status === 'Successful',
          history: [entry, ...lead.history].slice(0, 50),
        },
        lead.importedStatus,
      );
    },
    [patchLead],
  );

  /**
   * Ticking the box promotes the lead to `Successful`; unticking drops it back
   * to `Follow-up`, which the user can immediately override with the selector.
   */
  const setSuccessful = useCallback(
    (lead: Lead, successful: boolean) => {
      const status: OutreachStatus = successful ? 'Successful' : 'Follow-up';
      if (successful === lead.successful) return;
      const entry = { at: new Date().toISOString(), from: lead.status, to: status };
      patchLead(
        lead.id,
        {
          successful,
          status,
          history: [entry, ...lead.history].slice(0, 50),
        },
        lead.importedStatus,
      );
    },
    [patchLead],
  );

  const updateField = useCallback(
    (lead: Lead, field: EditableField, value: string) => {
      patchLead(lead.id, { [field]: value }, lead.importedStatus);
    },
    [patchLead],
  );

  /** First import — no previous dataset to reconcile against. */
  const importDataset = useCallback((result: ImportResult) => {
    setDataset(result.dataset);
    setManagement((current) => {
      const ids = result.dataset.leads.map((lead) => lead.id);
      return reconcileManagement(current, ids).kept;
    });
  }, []);

  /**
   * Replace the lead file, carrying outreach state across on matching
   * business name + phone number.
   */
  const replaceDataset = useCallback(
    (result: ImportResult): ReplaceSummary => {
      const ids = result.dataset.leads.map((lead) => lead.id);
      const { kept, matched, dropped } = reconcileManagement(management, ids);
      setDataset(result.dataset);
      setManagement(kept);
      return { matched, dropped, total: result.dataset.leads.length };
    },
    [management],
  );

  /**
   * Decrypt bundled leads with a password. Returns false on a wrong password so
   * the unlock screen can say so without the caller inspecting errors.
   */
  const unlockLeads = useCallback(async (password: string): Promise<boolean> => {
    const unlocked = await unlockBundledDataset(password);
    if (!unlocked) return false;
    setDataset(unlocked);
    return true;
  }, []);

  /**
   * Clear every local edit. On a build with leads baked in this restores the
   * bundled list rather than emptying the app, so a reset never leaves a
   * personal instance with nothing to work.
   */
  const resetAll = useCallback(() => {
    clearAllData();
    setDataset(getBundledDataset());
    setManagement({});
    setFilters(EMPTY_FILTERS);
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const toggleSort = useCallback(
    (field: SortField) => {
      setSortField((currentField) => {
        if (currentField === field) {
          setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
          return currentField;
        }
        // Dates and counts are most useful highest-first on the first click.
        setSortDirection(
          field === 'googleRating' || field === 'googleReviews' || field === 'updatedAt'
            ? 'desc'
            : 'asc',
        );
        return field;
      });
    },
    [],
  );

  const hasActiveFilters = useMemo(() => !isEmptyFilters(filters), [filters]);

  return {
    isReady,
    hasBundledLeads: hasAnyBundledLeads,
    hasEncryptedLeads,
    unlockLeads,
    dataset,
    leads,
    filteredLeads,
    stats,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    sortField,
    sortDirection,
    toggleSort,
    tradeOptions,
    locationOptions,
    setStatus,
    setSuccessful,
    updateField,
    importDataset,
    replaceDataset,
    resetAll,
  };
}

/**
 * Trade & construction detection.
 *
 * Prefers the workbook's own `Lead Segment` value and falls back to keyword
 * matching on the trade description for files that lack the column.
 */
const TRADE_KEYWORDS = [
  'plumb',
  'electric',
  'roof',
  'carpen',
  'build',
  'construct',
  'renovat',
  'fenc',
  'concret',
  'paint',
  'tiling',
  'tiler',
  'floor',
  'landscap',
  'excavat',
  'gasfit',
  'handyman',
  'maintenance',
  'wall',
  'plaster',
  'glazing',
  'waterproof',
  'shed',
  'pergola',
  'demolition',
  'air conditioning',
  'hvac',
  'solar',
  'bricklay',
  'cabinet',
  'joinery',
  'gutter',
  'pest',
  'earthwork',
  'scaffold',
];

export function isTradeLead(lead: Lead): boolean {
  if (lead.leadSegment) {
    const segment = lead.leadSegment.toLowerCase();
    if (segment.includes('trade') || segment.includes('construction')) return true;
    // An explicit non-trade segment is authoritative — do not keyword-guess past it.
    if (segment.includes('local-service') || segment.includes('local service')) return false;
  }
  const trade = lead.trade.toLowerCase();
  return TRADE_KEYWORDS.some((keyword) => trade.includes(keyword));
}

function compareLeads(a: Lead, b: Lead, field: SortField): number {
  switch (field) {
    case 'businessName':
      return a.businessName.localeCompare(b.businessName);
    case 'location':
      return a.location.localeCompare(b.location);
    case 'googleRating':
      return compareNullableNumbers(a.googleRating, b.googleRating);
    case 'googleReviews':
      return compareNullableNumbers(a.googleReviews, b.googleReviews);
    case 'nextFollowUp':
      return compareNullableStrings(a.nextFollowUp, b.nextFollowUp);
    case 'updatedAt':
      return compareNullableStrings(a.updatedAt, b.updatedAt);
  }
}

/**
 * Whether a lead has no value for the active sort key. Checked before the
 * direction multiplier is applied so blanks stay at the bottom either way.
 */
function isMissingSortValue(lead: Lead, field: SortField): boolean {
  switch (field) {
    case 'businessName':
      return lead.businessName === '';
    case 'location':
      return lead.location === '';
    case 'googleRating':
      return lead.googleRating === null;
    case 'googleReviews':
      return lead.googleReviews === null;
    case 'nextFollowUp':
      return lead.nextFollowUp === '';
    case 'updatedAt':
      return lead.updatedAt === '';
  }
}

function compareNullableNumbers(a: number | null, b: number | null): number {
  if (a === null || b === null) return 0;
  return a - b;
}

function compareNullableStrings(a: string, b: string): number {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

function isEmptyFilters(filters: Filters): boolean {
  return (
    filters.search.trim() === '' &&
    filters.statuses.length === 0 &&
    filters.successful === null &&
    filters.trades.length === 0 &&
    filters.locations.length === 0 &&
    filters.minRating === null &&
    filters.minReviews === null &&
    filters.maxReviews === null &&
    !filters.tradeAndConstructionOnly
  );
}
