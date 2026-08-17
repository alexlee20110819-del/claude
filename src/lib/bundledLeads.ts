/**
 * Optional pre-loaded leads.
 *
 * `scripts/bundle-leads.ts` writes `src/data/bundled-leads.json` to turn this
 * into a personal build that opens straight into a lead list. That file is
 * gitignored and usually absent, so it is picked up with `import.meta.glob`
 * rather than a static import — a missing file resolves to an empty record
 * instead of breaking the build.
 *
 * When no bundled file exists the app behaves exactly as before, starting at
 * the upload screen.
 */

import type { LeadDataset } from '@/types/lead';
import { DATASET_VERSION } from './leadParser';

const modules = import.meta.glob<{ default: unknown }>('../data/bundled-leads.json', {
  eager: true,
});

function readBundled(): LeadDataset | null {
  const entry = Object.values(modules)[0];
  const raw = entry?.default;
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Partial<LeadDataset>;
  if (!Array.isArray(candidate.leads) || candidate.leads.length === 0) return null;
  if (candidate.version !== DATASET_VERSION) {
    console.warn('Bundled leads were built for a different schema version and were ignored.');
    return null;
  }

  return candidate as LeadDataset;
}

const bundled = readBundled();

/** True when this build ships with leads baked in. */
export const hasBundledLeads = bundled !== null;

/**
 * A fresh copy of the bundled dataset.
 *
 * Copied on each call so the imported module object is never mutated by the
 * app's state, and re-stamped with the current time so "imported at" reflects
 * when this browser first loaded it rather than when the build ran.
 */
export function getBundledDataset(): LeadDataset | null {
  if (!bundled) return null;
  return {
    ...bundled,
    importedAt: new Date().toISOString(),
    leads: bundled.leads.map((lead) => ({ ...lead })),
  };
}
