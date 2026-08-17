/**
 * Check a built bundle for readable lead data before it is deployed.
 *
 * Written after a real incident: because the encrypted bundle used a different
 * filename from the plaintext one, a stale plaintext file on the build machine
 * was embedded alongside the ciphertext, and a build that was supposed to be
 * password-gated shipped readable phone numbers. The filename collision is
 * fixed, but a build artefact is the only thing that actually proves what got
 * shipped — so this greps the real output for the real values.
 *
 *   node scripts/verify-build.ts --password "secret"   # encrypted bundle
 *   node scripts/verify-build.ts                       # no bundle expected
 *
 * Exits non-zero if any bundled business name or phone number appears in the
 * built JavaScript.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LeadDataset } from '../src/types/lead.ts';
import { decryptJson, isEncryptedPayload } from '../src/lib/leadCrypto.ts';

const here = dirname(fileURLToPath(import.meta.url));
const BUNDLE = resolve(here, '../src/data/bundled-leads.json');
const DIST = resolve(here, '../dist');

const args = process.argv.slice(2);
const passwordIndex = args.indexOf('--password');
const password = passwordIndex >= 0 ? args[passwordIndex + 1] : undefined;

function ok(message: string): void {
  console.log(`  PASS  ${message}`);
}

function fail(message: string): never {
  console.error(`\n  FAIL  ${message}\n`);
  process.exit(1);
}

if (!existsSync(DIST)) fail(`No build found at ${DIST}. Run a build first.`);

const distFiles = readdirSync(join(DIST, 'assets'))
  .filter((name) => name.endsWith('.js') || name.endsWith('.css'))
  .map((name) => ({ name, text: readFileSync(join(DIST, 'assets', name), 'utf8') }));

if (distFiles.length === 0) fail('No JS or CSS assets found in the build.');

if (!existsSync(BUNDLE)) {
  // Nothing bundled: assert the build really is lead-free.
  ok('No bundled lead file present.');
  console.log(`\n  Checked ${distFiles.length} asset(s). Nothing to verify.\n`);
  process.exit(0);
}

const raw: unknown = JSON.parse(readFileSync(BUNDLE, 'utf8'));

let dataset: LeadDataset;

if (isEncryptedPayload(raw)) {
  if (!password) {
    fail('The bundle is encrypted. Pass --password "…" so its contents can be checked.');
  }
  ok('Bundled lead file is encrypted.');
  let json: string;
  try {
    json = await decryptJson(raw, password);
  } catch {
    fail('That password does not decrypt the bundle.');
  }
  dataset = JSON.parse(json) as LeadDataset;
} else {
  dataset = raw as LeadDataset;
  console.log('  WARN  Bundled lead file is PLAINTEXT — expect it to appear in the build.');
}

// Check every business name and phone number, not a sample: one leaked record
// is a leaked record.
const needles: string[] = [];
for (const lead of dataset.leads) {
  if (lead.businessName) needles.push(lead.businessName);
  if (lead.phoneNumber) needles.push(lead.phoneNumber);
}

const leaks: string[] = [];
for (const file of distFiles) {
  for (const needle of needles) {
    if (needle.length >= 6 && file.text.includes(needle)) {
      leaks.push(`${file.name}: ${needle}`);
    }
  }
}

console.log(`\n  Scanned ${distFiles.length} asset(s) for ${needles.length} values.`);

if (leaks.length > 0) {
  console.error('\n  Readable lead data found in the build:');
  for (const leak of leaks.slice(0, 10)) console.error(`    ${leak}`);
  if (leaks.length > 10) console.error(`    …and ${leaks.length - 10} more`);
  fail(
    `${leaks.length} leaked value(s). Do NOT deploy this build to a public URL.\n` +
      '        Re-run bundle-leads with --password, then rebuild.',
  );
}

ok('No bundled business name or phone number appears in the built output.');
console.log('\n  Safe to deploy.\n');
