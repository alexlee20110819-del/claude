/**
 * Optional pre-loaded leads.
 *
 * `scripts/bundle-leads.ts` writes exactly one file — `src/data/bundled-leads.json`
 * — holding either a plain dataset or an encrypted payload, told apart by the
 * `scheme` field.
 *
 * The single filename is deliberate and load-bearing. An earlier version used a
 * separate name for the encrypted file, which meant a stale plaintext file left
 * on a build machine could sit alongside the new encrypted one; `import.meta.glob`
 * embeds every match, so the build shipped readable contact data even though the
 * app only meant to use the ciphertext. With one path, writing the file replaces
 * whatever was there and the bundle can only ever contain the latest content.
 *
 * The file is gitignored and usually absent, so it is picked up with
 * `import.meta.glob` rather than a static import: a missing file resolves to an
 * empty record instead of breaking the build. With nothing bundled, the app
 * behaves exactly as before and starts at the upload screen.
 */

import type { LeadDataset } from '@/types/lead';
import { DATASET_VERSION } from './leadParser';
import { decryptJson, isEncryptedPayload, type EncryptedPayload } from './leadCrypto';

const modules = import.meta.glob<{ default: unknown }>('../data/bundled-leads.json', {
  eager: true,
});

const raw: unknown = Object.values(modules)[0]?.default;

/** Validate a decoded object as a usable dataset. */
function asDataset(value: unknown): LeadDataset | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Partial<LeadDataset>;
  if (!Array.isArray(candidate.leads) || candidate.leads.length === 0) return null;
  if (candidate.version !== DATASET_VERSION) {
    console.warn('Bundled leads were built for a different schema version and were ignored.');
    return null;
  }

  return candidate as LeadDataset;
}

const encryptedBundle: EncryptedPayload | null = isEncryptedPayload(raw) ? raw : null;
const plainBundle: LeadDataset | null = encryptedBundle ? null : asDataset(raw);

/** True when this build ships readable leads that need no password. */
export const hasBundledLeads = plainBundle !== null;

/** True when this build ships leads that need a password before they can be read. */
export const hasEncryptedLeads = encryptedBundle !== null;

/** True when leads are baked in at all, encrypted or not. */
export const hasAnyBundledLeads = hasBundledLeads || hasEncryptedLeads;

/** Re-stamp a dataset as imported now, and deep-copy it away from the module. */
function freshCopy(dataset: LeadDataset): LeadDataset {
  return {
    ...dataset,
    importedAt: new Date().toISOString(),
    leads: dataset.leads.map((lead) => ({ ...lead })),
  };
}

/** A fresh copy of the plaintext bundle, if this build has one. */
export function getBundledDataset(): LeadDataset | null {
  return plainBundle ? freshCopy(plainBundle) : null;
}

/**
 * Decrypt the bundled leads with `password`.
 *
 * Returns `null` when the password is wrong — AES-GCM authentication fails on a
 * bad key, so there is no separate comparison to get wrong, and no way to tell
 * a wrong password from tampered data (both are rejected).
 */
export async function unlockBundledDataset(password: string): Promise<LeadDataset | null> {
  if (!encryptedBundle) return null;

  try {
    const json = await decryptJson(encryptedBundle, password);
    const dataset = asDataset(JSON.parse(json));
    return dataset ? freshCopy(dataset) : null;
  } catch {
    return null;
  }
}
