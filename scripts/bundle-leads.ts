/**
 * Bake a lead spreadsheet into the build.
 *
 * Produces `src/data/bundled-leads.json`, which the app loads as its starting
 * dataset when the browser has nothing saved yet. This is what turns the app
 * into a personal instance that opens straight into your leads instead of an
 * upload screen.
 *
 *   node scripts/bundle-leads.ts <path-to-spreadsheet> [--label "My leads"]
 *   node scripts/bundle-leads.ts --clear
 *
 * Parsing goes through `src/lib/leadParser.ts` — the very same code the browser
 * uses on upload — so a bundled build and an uploaded file cannot disagree.
 *
 * IMPORTANT: the generated file contains real business contact data. It is
 * gitignored on purpose. Only deploy a bundled build to a site that is
 * password-protected or otherwise access-controlled.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../src/lib/leadParser.ts';
import { encryptJson } from '../src/lib/leadCrypto.ts';

const here = dirname(fileURLToPath(import.meta.url));
/**
 * One output path for both plain and encrypted bundles. Using a second filename
 * for the encrypted variant once let a stale plaintext file survive on a build
 * machine and get embedded alongside the ciphertext — a single path makes that
 * impossible, because writing it replaces whatever was there.
 */
const OUTPUT = resolve(here, '../src/data/bundled-leads.json');
/** Written by an older version; removed on sight so it can never be picked up. */
const LEGACY_ENCRYPTED = resolve(here, '../src/data/bundled-leads.enc.json');

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.includes('--clear')) {
  const removed = [OUTPUT, LEGACY_ENCRYPTED].filter((path) => existsSync(path));
  for (const path of removed) rmSync(path);
  if (removed.length > 0) {
    for (const path of removed) console.log(`  Removed ${path}`);
    console.log('  The next build will start from the upload screen again.\n');
  } else {
    console.log('  Nothing to clear — no bundled leads present.\n');
  }
  process.exit(0);
}

const labelIndex = args.indexOf('--label');
const label = labelIndex >= 0 ? args[labelIndex + 1] : undefined;
const passwordIndex = args.indexOf('--password');
const password = passwordIndex >= 0 ? args[passwordIndex + 1] : undefined;
const valueIndexes = new Set([labelIndex + 1, passwordIndex + 1].filter((i) => i > 0));
const inputPath = args.find((arg, i) => !arg.startsWith('--') && !valueIndexes.has(i));

if (passwordIndex >= 0 && !password) {
  fail('--password needs a value, e.g. --password "my-password"');
}

if (!inputPath) {
  fail(
    'Usage: node scripts/bundle-leads.ts <file> [--label "Name"] [--password "secret"]\n' +
      '       node scripts/bundle-leads.ts --clear',
  );
}

const absoluteInput = resolve(process.cwd(), inputPath);
if (!existsSync(absoluteInput)) fail(`File not found: ${absoluteInput}`);

const buffer = readFileSync(absoluteInput);
const { dataset, warnings } = parseWorkbook(XLSX, buffer, label ?? inputPath.split('/').pop()!);

mkdirSync(dirname(OUTPUT), { recursive: true });

// Clear a file left by an older version of this script before writing.
if (existsSync(LEGACY_ENCRYPTED)) rmSync(LEGACY_ENCRYPTED);

const payload = password ? await encryptJson(JSON.stringify(dataset), password) : dataset;
writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

const withUrl = dataset.leads.filter((lead) => lead.sourceUrl).length;
const withPhone = dataset.leads.filter((lead) => lead.phoneNumber).length;

console.log(`\n  Bundled ${dataset.leads.length} leads from "${dataset.sheetName}"`);
console.log(`    ${withPhone} with a phone number`);
console.log(`    ${withUrl} with a Google evidence link`);
for (const warning of warnings) console.log(`    note: ${warning}`);
if (password) {
  console.log(`\n  Wrote ${OUTPUT} (encrypted: AES-GCM, PBKDF2-SHA256)`);
  console.log('  The build ships ciphertext: visitors must enter the password to read');
  console.log('  any lead data. Keep the password somewhere safe — it is not recoverable');
  console.log('  from the bundle.\n');
} else {
  console.log(`\n  Wrote ${OUTPUT}`);
  console.log('  WARNING: this is PLAINTEXT contact data and will be readable by anyone');
  console.log('  who can load the site. Deploy it only behind access control, or re-run');
  console.log('  with --password to encrypt it.\n');
}
