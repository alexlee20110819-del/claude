/**
 * Live sync from a published Google Sheet.
 *
 * The app is static and cannot watch a file on your computer, so "automatic"
 * means the sheet lives somewhere fetchable. A Google Sheet published to the
 * web serves CSV with permissive CORS, which is the one path that works from a
 * plain static site with no server and no API key.
 *
 * Parsing reuses `leadParser.ts`, the same code an uploaded file goes through,
 * so a synced sheet and an uploaded workbook cannot disagree.
 *
 * Note that CSV export drops cell hyperlinks: a Google Sheets cell that *links*
 * the words "Open Google evidence" exports as that text and nothing else. The
 * evidence URL therefore has to sit in the sheet as plain text. `leadParser`
 * already falls back to the cell text when it is a URL, so a sheet prepared
 * that way works untouched.
 */

const URL_KEY = 'qld-lead-manager:remote-url';
const SYNC_KEY = 'qld-lead-manager:last-sync';

/**
 * A build-time default, so a deployed site syncs with no per-device setup.
 *
 * Read defensively: `import.meta.env` only exists under Vite, and this module is
 * also imported by Node tooling, where touching it directly would throw.
 */
const BUILT_IN_URL =
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_LEADS_URL?.trim() || null;

export function getRemoteUrl(): string | null {
  try {
    return localStorage.getItem(URL_KEY) ?? BUILT_IN_URL;
  } catch {
    return BUILT_IN_URL;
  }
}

export function setRemoteUrl(url: string): void {
  localStorage.setItem(URL_KEY, url.trim());
}

export function clearRemoteUrl(): void {
  localStorage.removeItem(URL_KEY);
  localStorage.removeItem(SYNC_KEY);
}

/** True when the current URL came from the build rather than this browser. */
export function isBuiltInUrl(): boolean {
  try {
    return localStorage.getItem(URL_KEY) === null && BUILT_IN_URL !== null;
  } catch {
    return BUILT_IN_URL !== null;
  }
}

export function getLastSync(): string {
  try {
    return localStorage.getItem(SYNC_KEY) ?? '';
  } catch {
    return '';
  }
}

export function recordSync(): void {
  try {
    localStorage.setItem(SYNC_KEY, new Date().toISOString());
  } catch {
    // A failed timestamp write is not worth interrupting a successful sync.
  }
}

/**
 * Turn whatever Google Sheets link the user pasted into a CSV endpoint.
 *
 * Handles the three shapes people actually have to hand:
 *   …/spreadsheets/d/e/2PACX-…/pub?output=csv   already correct
 *   …/spreadsheets/d/e/2PACX-…/pubhtml          published, wrong format
 *   …/spreadsheets/d/<id>/edit#gid=0            the normal editing URL
 *
 * Anything else is passed through untouched so a direct CSV link still works.
 */
export function toCsvUrl(input: string): string {
  const raw = input.trim();
  if (!raw) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  if (!url.hostname.endsWith('docs.google.com')) return raw;

  // Already a published CSV export.
  if (url.pathname.includes('/pub') && url.searchParams.get('output') === 'csv') {
    return url.toString();
  }

  // Published, but as a web page — switch the output format.
  if (url.pathname.endsWith('/pubhtml') || url.pathname.endsWith('/pub')) {
    const csv = new URL(url.toString());
    csv.pathname = csv.pathname.replace(/\/pubhtml$/, '/pub');
    csv.searchParams.set('output', 'csv');
    return csv.toString();
  }

  // A normal /spreadsheets/d/<id>/edit link — use the gviz CSV endpoint, which
  // honours the sheet's own sharing setting.
  const idMatch = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
  if (idMatch?.[1] && idMatch[1] !== 'e') {
    const gid = url.hash.match(/gid=(\d+)/)?.[1] ?? url.searchParams.get('gid');
    const gviz = new URL(`https://docs.google.com/spreadsheets/d/${idMatch[1]}/gviz/tq`);
    gviz.searchParams.set('tqx', 'out:csv');
    if (gid) gviz.searchParams.set('gid', gid);
    return gviz.toString();
  }

  return raw;
}

export class RemoteSyncError extends Error {}

/**
 * Fetch the sheet and return its bytes.
 *
 * Google answers an unpublished or unshared sheet with an HTML sign-in page
 * rather than an HTTP error, so the content is sniffed: an HTML body means the
 * link is not actually readable, which is by far the most common setup mistake.
 */
export async function fetchRemoteWorkbook(url: string): Promise<ArrayBuffer> {
  const csvUrl = toCsvUrl(url);

  let response: Response;
  try {
    response = await fetch(csvUrl, { redirect: 'follow', cache: 'no-store' });
  } catch {
    throw new RemoteSyncError(
      'Could not reach the sheet. Check your connection, and that the link is published to the web.',
    );
  }

  if (!response.ok) {
    throw new RemoteSyncError(
      `The sheet link returned ${response.status}. Re-publish it with File → Share → Publish to web → CSV.`,
    );
  }

  const buffer = await response.arrayBuffer();
  const head = new TextDecoder().decode(buffer.slice(0, 200)).trim().toLowerCase();

  if (head.startsWith('<!doctype html') || head.startsWith('<html')) {
    throw new RemoteSyncError(
      'That link returned a web page instead of data. In Google Sheets use File → Share → Publish to web, choose this sheet, and pick Comma-separated values (.csv).',
    );
  }

  if (buffer.byteLength === 0) {
    throw new RemoteSyncError('The sheet came back empty.');
  }

  return buffer;
}
