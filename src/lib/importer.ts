/**
 * Browser-side import.
 *
 * All parsing lives in `leadParser.ts`, which is environment-agnostic so the
 * same code path also runs in Node when leads are baked into a build. This file
 * only adds the browser concerns: reading a `File`, and loading SheetJS on
 * demand — it is by far the heaviest dependency and the dashboard never needs
 * it after the initial import.
 */

import type { ImportResult } from '@/types/lead';
import { buildDataset, parseWorkbook } from './leadParser';

export { DATASET_VERSION } from './leadParser';

/** Parse a user-selected `.xlsx` / `.xls` / `.csv` file into a dataset. */
export async function importLeadFile(file: File): Promise<ImportResult> {
  const [buffer, XLSX] = await Promise.all([file.arrayBuffer(), import('xlsx')]);
  return parseWorkbook(XLSX, buffer, file.name);
}

/** Build a dataset from in-memory rows — used for the built-in sample data. */
export function importFromRows(
  rows: unknown[][],
  fileName: string,
  sheetName: string,
): ImportResult {
  return buildDataset({
    rows,
    hyperlinks: new Map(),
    sheetName,
    fileName,
    isSample: true,
  });
}

/**
 * Parse an already-fetched workbook or CSV buffer — used by the live sheet
 * sync, which has bytes rather than a `File`.
 */
export async function importRemoteWorkbook(
  data: ArrayBuffer,
  label: string,
): Promise<ImportResult> {
  const XLSX = await import('xlsx');
  return parseWorkbook(XLSX, data, label);
}
