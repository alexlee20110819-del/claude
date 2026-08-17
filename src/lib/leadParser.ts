/**
 * Pure spreadsheet parsing — no DOM, no `File`, no path aliases.
 *
 * This module is deliberately environment-agnostic so it can run in two places
 * from one implementation:
 *
 *   - the browser, via `importer.ts`, when the user uploads a file
 *   - Node, via `scripts/bundle-leads.ts`, when baking leads into a build
 *
 * Keeping it framework-free is what stops the two paths from drifting apart.
 * Imports use explicit `.ts` extensions because Node's native type stripping
 * resolves specifiers literally.
 *
 * Two quirks of the real Queensland workbook drive the logic here:
 *
 *  1. The header row is not row 1. The sheet opens with a title and a
 *     description, so headers land on row 4. We scan for the row that looks
 *     most like a header instead of assuming a position.
 *
 *  2. The "Source / Verification" column contains the text
 *     "Open Google evidence" — the actual Google URL lives in the cell's
 *     *hyperlink*, not its value. Targets are read from the hyperlink map and
 *     XML-decoded, because SheetJS returns them still escaped.
 */

import type * as XLSXNamespace from 'xlsx';
import type { ImportResult, ImportedLead, LeadDataset } from '../types/lead.ts';
import {
  decodeXmlEntities,
  makeLeadKey,
  safeUrl,
  toDisplayString,
  toNumberOrNull,
} from './utils.ts';

export const DATASET_VERSION = 1;
export const PREFERRED_SHEET = 'All Current Leads';

/** The subset of the SheetJS module this file needs. */
type XlsxModule = typeof XLSXNamespace;

/** Hyperlink targets by row index, then column index. */
export type HyperlinkMap = Map<number, Map<number, string>>;

/** Candidate header labels for each field, matched case/space-insensitively. */
const FIELD_ALIASES = {
  rowNumber: ['#', 'no', 'no.', 'row', 'index'],
  businessName: ['business name', 'business', 'company', 'name', 'company name'],
  trade: ['trade / services', 'trade/services', 'trade', 'services', 'industry', 'category'],
  location: ['location', 'suburb', 'city', 'area', 'address'],
  googleRating: ['google rating', 'rating', 'stars', 'score'],
  googleReviews: ['google reviews', 'reviews', 'review count', 'number of reviews'],
  phoneNumber: ['phone number', 'phone', 'mobile', 'contact', 'telephone', 'contact number'],
  websiteOpportunity: [
    'website opportunity signal',
    'website opportunity',
    'opportunity signal',
    'website signal',
    'opportunity',
  ],
  leadSegment: ['lead segment', 'segment', 'category type'],
  researchBatch: ['research batch', 'batch', 'source batch'],
  verificationNotes: [
    'verification notes',
    'qualification notes',
    'qualification / verification notes',
    'notes',
    'verification',
  ],
  sourceUrl: [
    'source / verification',
    'source/verification',
    'source url',
    'source',
    'google source',
    'evidence',
    'google evidence',
    'url',
    'link',
  ],
  importedStatus: ['outreach status', 'status', 'lead status'],
} satisfies Record<string, string[]>;

type FieldName = keyof typeof FIELD_ALIASES;

const REQUIRED_FIELDS: FieldName[] = ['businessName'];

function normaliseHeader(value: unknown): string {
  return toDisplayString(value).toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Find the header row by scoring each of the first 25 rows on how many of its
 * cells match a known header alias. The best-scoring row with at least two
 * matches wins; otherwise we assume row 0.
 */
function findHeaderRow(rows: unknown[][]): number {
  const allAliases = new Set(Object.values(FIELD_ALIASES).flat());
  let bestRow = 0;
  let bestScore = 0;

  const limit = Math.min(rows.length, 25);
  for (let r = 0; r < limit; r += 1) {
    const row = rows[r];
    if (!row) continue;
    let score = 0;
    for (const cell of row) {
      const header = normaliseHeader(cell);
      if (header && allAliases.has(header)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }

  return bestScore >= 2 ? bestRow : 0;
}

/** Map each field to the column index that best matches one of its aliases. */
function mapColumns(headerRow: unknown[]): Partial<Record<FieldName, number>> {
  const mapping: Partial<Record<FieldName, number>> = {};
  const taken = new Set<number>();
  const headers = headerRow.map(normaliseHeader);

  // Two passes: exact alias matches first, then loose "contains" matches, so a
  // column named exactly "Notes" cannot steal the slot for "Verification Notes".
  //
  // Within each pass the *alias* order decides, not the column order. A sheet
  // can carry more than one plausible column for a field — a "Google Evidence"
  // column holding link text beside a "Source URL" column holding the real URL —
  // and scanning headers left to right would take whichever came first. Trying
  // aliases in order instead means the most specific name always wins, wherever
  // it sits in the sheet.
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [FieldName, string[]][]) {
    for (const alias of aliases) {
      const index = headers.findIndex((h, i) => h !== '' && !taken.has(i) && h === alias);
      if (index >= 0) {
        mapping[field] = index;
        taken.add(index);
        break;
      }
    }
  }

  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [FieldName, string[]][]) {
    if (mapping[field] !== undefined) continue;
    for (const alias of aliases) {
      const index = headers.findIndex((h, i) => h !== '' && !taken.has(i) && h.includes(alias));
      if (index >= 0) {
        mapping[field] = index;
        taken.add(index);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Resolve the Google evidence URL for a row: prefer the hyperlink on the source
 * column, then a URL sitting in the cell text, then any hyperlink elsewhere in
 * the row, and finally any URL-looking cell.
 */
function resolveSourceUrl(
  rowLinks: Map<number, string> | undefined,
  sourceCol: number | undefined,
  rowValues: unknown[],
): string | null {
  if (rowLinks && sourceCol !== undefined) {
    const target = safeUrl(rowLinks.get(sourceCol));
    if (target) return target;
  }

  if (sourceCol !== undefined) {
    const fromText = safeUrl(rowValues[sourceCol]);
    if (fromText) return fromText;
  }

  if (rowLinks) {
    for (const target of rowLinks.values()) {
      const valid = safeUrl(target);
      if (valid) return valid;
    }
  }

  for (const value of rowValues) {
    const fromAnyCell = safeUrl(value);
    if (fromAnyCell) return fromAnyCell;
  }

  return null;
}

export interface BuildOptions {
  rows: unknown[][];
  hyperlinks: HyperlinkMap;
  sheetName: string;
  fileName: string;
  isSample?: boolean;
}

export function buildDataset({
  rows,
  hyperlinks,
  sheetName,
  fileName,
  isSample = false,
}: BuildOptions): ImportResult {
  const warnings: string[] = [];

  const headerIndex = findHeaderRow(rows);
  const headerRow = rows[headerIndex] ?? [];
  const columns = mapColumns(headerRow);

  const missingRequired = REQUIRED_FIELDS.filter((field) => columns[field] === undefined);
  if (missingRequired.length > 0) {
    throw new Error(
      `Could not find a "Business Name" column in "${sheetName}". Check that the sheet has a header row.`,
    );
  }

  const optionalMissing = (Object.keys(FIELD_ALIASES) as FieldName[]).filter(
    (field) => columns[field] === undefined && field !== 'rowNumber',
  );
  if (optionalMissing.length > 0) {
    warnings.push(`Columns not found and left blank: ${optionalMissing.join(', ')}.`);
  }

  const pick = (row: unknown[], field: FieldName): unknown => {
    const index = columns[field];
    return index === undefined ? '' : row[index];
  };

  const leads: ImportedLead[] = [];
  const seenIds = new Map<string, number>();
  let skipped = 0;

  for (let r = headerIndex + 1; r < rows.length; r += 1) {
    const row = rows[r];
    if (!row) continue;

    const businessName = toDisplayString(pick(row, 'businessName'));
    if (!businessName) {
      // Blank or spacer row — silently ignore truly empty ones.
      if (row.some((cell) => toDisplayString(cell) !== '')) skipped += 1;
      continue;
    }

    const phoneNumber = toDisplayString(pick(row, 'phoneNumber'));
    const baseId = makeLeadKey(businessName, phoneNumber);

    // Guarantee uniqueness even if the file has genuine duplicate rows.
    const seenCount = seenIds.get(baseId) ?? 0;
    seenIds.set(baseId, seenCount + 1);
    const id = seenCount === 0 ? baseId : `${baseId}::${seenCount + 1}`;

    leads.push({
      id,
      rowNumber: toNumberOrNull(pick(row, 'rowNumber')),
      businessName,
      trade: toDisplayString(pick(row, 'trade')),
      location: toDisplayString(pick(row, 'location')),
      googleRating: toNumberOrNull(pick(row, 'googleRating')),
      googleReviews: toNumberOrNull(pick(row, 'googleReviews')),
      phoneNumber,
      websiteOpportunity: toDisplayString(pick(row, 'websiteOpportunity')),
      leadSegment: toDisplayString(pick(row, 'leadSegment')),
      researchBatch: toDisplayString(pick(row, 'researchBatch')),
      verificationNotes: toDisplayString(pick(row, 'verificationNotes')),
      sourceUrl: resolveSourceUrl(hyperlinks.get(r), columns.sourceUrl, row),
      importedStatus: toDisplayString(pick(row, 'importedStatus')),
      sourceSheet: sheetName,
    });
  }

  if (skipped > 0) {
    warnings.push(`${skipped} row(s) skipped because they had no business name.`);
  }

  if (leads.length === 0) {
    throw new Error(`No lead rows found in "${sheetName}".`);
  }

  const withoutUrl = leads.filter((lead) => !lead.sourceUrl).length;
  if (withoutUrl > 0) {
    warnings.push(`${withoutUrl} lead(s) have no valid Google evidence link.`);
  }

  const dataset: LeadDataset = {
    version: DATASET_VERSION,
    fileName,
    importedAt: new Date().toISOString(),
    sheetName,
    isSample,
    leads,
  };

  return { dataset, warnings };
}

/**
 * Parse a whole workbook (or CSV) buffer into a dataset.
 *
 * SheetJS is passed in rather than imported so the browser build can load it
 * lazily and Node can import it eagerly, without this module depending on
 * either strategy.
 */
export function parseWorkbook(
  XLSX: XlsxModule,
  data: ArrayBuffer | Uint8Array,
  fileName: string,
): ImportResult {
  const workbook = XLSX.read(data, {
    type: data instanceof Uint8Array ? 'buffer' : 'array',
    // Do not evaluate or retain formulas — imported content is display data only.
    cellFormula: false,
    cellHTML: false,
    cellDates: true,
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error('That file has no worksheets.');
  }

  // Prefer the documented worksheet, else the first one that has any content.
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === PREFERRED_SHEET.toLowerCase()) ??
    workbook.SheetNames.find((name) => workbook.Sheets[name]?.['!ref'] !== undefined) ??
    workbook.SheetNames[0]!;

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error(`Worksheet "${sheetName}" could not be read.`);
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: true,
    defval: '',
    raw: true,
  });

  // Collect hyperlink targets up front — `sheet_to_json` only returns values,
  // and the Google evidence URLs live exclusively on the cell hyperlinks.
  const hyperlinks: HyperlinkMap = new Map();
  const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');
  for (let r = range.s.r; r <= range.e.r; r += 1) {
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      const target = cell?.l?.Target;
      if (typeof target !== 'string') continue;
      const rowMap = hyperlinks.get(r) ?? new Map<number, string>();
      rowMap.set(c, decodeXmlEntities(target));
      hyperlinks.set(r, rowMap);
    }
  }

  return buildDataset({ rows, hyperlinks, sheetName, fileName });
}
