/**
 * Built-in preview data.
 *
 * These are fictional businesses with non-routable example phone numbers, so
 * the interface can be demonstrated without loading real contact details. The
 * rows deliberately mimic the shape of the real workbook — including the title
 * and description rows above the header — so the importer's header detection
 * gets exercised by the sample too.
 */

import type { ImportResult } from '@/types/lead';
import { importFromRows } from './importer';

const SAMPLE_ROWS: unknown[][] = [
  ['Sample Queensland Website-Opportunity Leads — Preview Data', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['Fictional businesses for interface preview only. Replace by importing your own file.', '', '', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', '', '', ''],
  [
    '#',
    'Business Name',
    'Trade / Services',
    'Location',
    'Google Rating',
    'Google Reviews',
    'Phone Number',
    'Website Opportunity Signal',
    'Lead Segment',
    'Research Batch',
    'Verification Notes',
    'Source / Verification',
    'Outreach Status',
  ],
  [
    1,
    'Sample Creek Plumbing & Gas',
    'Residential plumbing and gasfitting',
    'Toowoomba City, QLD',
    4.8,
    112,
    '+61 400 000 001',
    'Google panel displayed Add website; no dedicated official website identified',
    'Trade & construction lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=sample+creek+plumbing+toowoomba',
    'Not contacted',
  ],
  [
    2,
    'Example Bay Electrical',
    'Domestic and commercial electrical',
    'Hervey Bay, QLD',
    4.6,
    58,
    '+61 400 000 002',
    'Facebook page only; no standalone website found',
    'Trade & construction lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=example+bay+electrical+hervey+bay',
    'Contacted',
  ],
  [
    3,
    'Demo Street Barber Co.',
    'Barber shop',
    'Townsville City, QLD',
    4.9,
    431,
    '+61 400 000 003',
    'Google panel displayed Add website; bookings handled by phone only',
    'Retained earlier local-service lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=demo+street+barber+townsville',
    'Follow-up',
  ],
  [
    4,
    'Placeholder Roofing Solutions',
    'Roof restoration and gutter replacement',
    'Cairns, QLD',
    4.4,
    27,
    '+61 400 000 004',
    'Directory listing only; no owned domain identified',
    'Trade & construction lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=placeholder+roofing+cairns',
    'Not contacted',
  ],
  [
    5,
    'Testfield Nails & Beauty',
    'Nail salon and beauty treatments',
    'Rockhampton City, QLD',
    4.7,
    203,
    '+61 400 000 005',
    'Google panel displayed Add website; strong review volume',
    'Retained earlier local-service lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=testfield+nails+rockhampton',
    'Successful',
  ],
  [
    6,
    'Mock Valley Fencing',
    'Fencing, gates and retaining walls',
    'Ipswich, QLD',
    4.2,
    16,
    '+61 400 000 006',
    'No website located; enquiries via Google messages',
    'Trade & construction lead',
    'Sample preview batch',
    'Fictional record supplied with the app for preview purposes.',
    'https://www.google.com/search?q=mock+valley+fencing+ipswich',
    'Not a fit',
  ],
];

export function loadSampleDataset(): ImportResult {
  return importFromRows(SAMPLE_ROWS, 'Sample preview data', 'All Current Leads');
}
