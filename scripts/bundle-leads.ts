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

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(here, '../src/data/bundled-leads.json');

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);

if (args.includes('--clear')) {
  if (existsSync(OUTPUT)) {
    rmSync(OUTPUT);
    console.log(`  Removed ${OUTPUT}`);
    console.log('  The next build will start from the upload screen again.\n');
  } else {
    console.log('  Nothing to clear — no bundled leads present.\n');
  }
  process.exit(0);
}

const labelIndex = args.indexOf('--label');
const label = labelIndex >= 0 ? args[labelIndex + 1] : undefined;
const inputPath = args.find((arg, i) => !arg.startsWith('--') && i !== labelIndex + 1);

if (!inputPath) {
  fail(
    'Usage: node scripts/bundle-leads.ts <path-to-spreadsheet> [--label "My leads"]\n' +
      '       node scripts/bundle-leads.ts --clear',
  );
}

const absoluteInput = resolve(process.cwd(), inputPath);
if (!existsSync(absoluteInput)) fail(`File not found: ${absoluteInput}`);

const buffer = readFileSync(absoluteInput);
const { dataset, warnings } = parseWorkbook(XLSX, buffer, label ?? inputPath.split('/').pop()!);

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

const withUrl = dataset.leads.filter((lead) => lead.sourceUrl).length;
const withPhone = dataset.leads.filter((lead) => lead.phoneNumber).length;

console.log(`\n  Bundled ${dataset.leads.length} leads from "${dataset.sheetName}"`);
console.log(`    ${withPhone} with a phone number`);
console.log(`    ${withUrl} with a Google evidence link`);
for (const warning of warnings) console.log(`    note: ${warning}`);
console.log(`\n  Wrote ${OUTPUT}`);
console.log('  This file holds real contact data and is gitignored. Deploy only to a');
console.log('  password-protected site.\n');
