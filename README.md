# Queensland Lead Manager

A local-first lead-management dashboard for working through Queensland website-development
leads: open the Google Business evidence, call the business, record what happened, and mark
which leads converted.

Everything runs in your browser. There is no server, no database, no API key, and no sign-in —
your spreadsheet is read locally and your edits are saved in `localStorage`.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed URL (http://localhost:5173 by default).

Other scripts:

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | Start the dev server with hot reload                       |
| `npm run build`        | Typecheck and build the production bundle                  |
| `npm run build:public` | Build with any bundled leads **removed** first (see below) |
| `npm run bundle:leads` | Bake a spreadsheet into the build (see below)              |
| `npm run verify:build` | Check a build for readable lead data before deploying      |
| `npm run preview`      | Serve the production build locally                         |
| `npm run typecheck`    | Run TypeScript with no emit                                |

## Importing your leads

On first launch you get an upload area. Drop in `queensland_current_website_leads.xlsx`
(or any `.xlsx` / `.xls` / `.csv` file), or press **Choose file**.

- The **`All Current Leads`** worksheet is used when the workbook has one; otherwise the first
  sheet with content is read. CSV files are read directly.
- **The header row is found automatically.** The Queensland workbook opens with a title and a
  description, so its headers sit on row 4 — you do not need to clean the file first.
- **Google evidence URLs are pulled from the cell hyperlinks.** In the workbook the
  `Source / Verification` cells display the text "Open Google evidence" while the real URL is
  attached as a link, so reading the cell text alone would lose it.
- Columns are matched by name, with common aliases accepted, and map to: business name,
  trade/services, location, Google rating, Google reviews, phone number, website opportunity
  signal, lead segment, research batch, verification notes, source URL and outreach status.
  Any column that is missing is simply left blank and reported after import.

Not ready to load real data? Press **Preview with sample data** for six fictional businesses
that exercise the whole interface.

### Replacing the file later

**Replace lead file** in the header imports a newer spreadsheet. A confirmation screen explains
the rule before anything changes:

> Leads in the new file whose **business name and phone number** match a current lead keep their
> status, success tick, notes and follow-up dates. Any edited lead that is not in the new file is
> removed along with its notes.

Your original spreadsheet is never modified — the app only ever reads it.

## Working leads

- **Success checkbox** on every row. Ticking it sets the status to `Successful`; unticking it
  moves the lead back to `Follow-up`, which you can immediately change with the status selector.
  Setting the status to `Successful` ticks the box. Successful leads are tinted green.
- **Status selector** with `Not contacted`, `Contacted`, `Follow-up`, `Successful`, `Not a fit`.
  Every change raises a confirmation toast and is added to the lead's status history.
- **Call** opens a `tel:` link built from the imported number, with a separate copy button that
  confirms with "Copied". No phone number that is not in your spreadsheet is ever used.
- **Google evidence** opens the imported source URL in a new tab
  (`target="_blank"`, `rel="noopener noreferrer"`).
- **Click the business name** to open the detail panel: full contact data, the website-opportunity
  signal, qualification notes, editable outreach notes, last-contacted and next-follow-up dates,
  and the status history.
- Leads whose next follow-up is today or earlier are flagged **Due today** / **Overdue** on the
  row and in the detail panel. The flag is hidden once a lead is marked successful.
- Summary cards double as filters — click **Follow-up** to see just those leads.
- **Export current view** writes the filtered leads to CSV, including your status, success flag,
  notes, last-contacted, next-follow-up and last-updated values.

## Personal builds: baking leads in

By default the app starts at the upload screen and holds no data. You can instead build a
**personal instance** that opens straight into your lead list on any device, with no import step:

```bash
# Encrypted — safe to put on a public URL (recommended)
npm run bundle:leads -- path/to/leads.xlsx --password "your-password"

# Plaintext — only ever behind a login
npm run bundle:leads -- path/to/leads.xlsx

npm run build:private
npm run verify:build -- --password "your-password"   # confirms nothing leaked
```

This writes `src/data/bundled-leads.json`, which the app loads as its starting dataset. Parsing
goes through the same `src/lib/leadParser.ts` the browser uses on upload, so a bundled build and
an uploaded file can never disagree.

### Encrypted bundles

With `--password`, the lead data is encrypted (AES-GCM, PBKDF2-SHA256, 250k iterations) and the
build ships only ciphertext. Visitors get a password screen; entering the right password decrypts
the list in the browser and saves it locally, so it is asked for once per device.

The password is the decryption key, not a value compared against something in the page. Skipping
the screen or reading the bundle directly yields ciphertext, which is what makes this safe to put
on a public URL — unlike a JavaScript check, which anyone can step past.

The password cannot be recovered from the build. If you lose it, re-run `bundle:leads` with a new
one. To change it, re-bundle and redeploy.

To go back to an empty build:

```bash
npm run bundle:leads -- --clear
```

### Read this before deploying a personal build

A bundled build **contains real business names and phone numbers inside its JavaScript**. That
gives up the "data never leaves your browser" property the plain build has. Two rules follow:

1. **A plaintext bundle belongs only behind access control.** On a public URL anyone can read the
   contact data straight out of the JS bundle. Use `--password` for anything publicly reachable.
2. **Never ship a bundled build to a public site by accident.** `src/data/bundled-leads.json` is
   gitignored, but it stays on your machine once generated, so a later `npm run build` would
   silently include it. Use `npm run build:public`, which clears any bundled leads first.
3. **Run `npm run verify:build` before deploying.** It decrypts the bundle and greps the built
   output for every bundled business name and phone number, failing if any appears in plain text.

Point 3 exists because of a real failure. An earlier version wrote encrypted bundles to a second
filename, `bundled-leads.enc.json`. A stale plaintext `bundled-leads.json` left on the build
machine was still matched by `import.meta.glob`, which embeds *every* match — so a build meant to
be password-gated shipped readable phone numbers, and the app skipped the password screen because
it found plaintext to load. Both files now share one path, so writing it replaces whatever was
there, and `verify:build` checks the artefact rather than trusting the intent.

Saved edits always win over bundled data: the baked-in list only seeds a browser that has nothing
stored yet, so importing a newer file is never reverted. On a personal build, the reset button
clears your edits and restores the bundled list rather than emptying the app.

## When you add more leads to the spreadsheet

Add rows in Excel as usual, then press **Replace lead file** and pick the updated workbook.
Nothing is lost:

- Leads already in the app keep their status, success tick, notes and follow-up dates, matched on
  **business name + phone number**.
- New rows arrive as `Not contacted`, ready to work.
- Counts, filters and the trade/location dropdowns all pick up the new rows automatically.

Some practical notes:

- Add rows to the **`All Current Leads`** sheet. That is the sheet the app reads; rows added only
  to another tab will not appear.
- Row order and position do not matter, and a title or footnote above or below the table is fine —
  the header row is located by content.
- For the evidence link you can either attach a real hyperlink or just paste the URL as plain text
  into the `Source / Verification` column. Both work.
- Changing a business's **phone number** breaks the match, so that lead is treated as new and its
  notes are dropped. Correct a typo in a name freely; correct a phone number and expect to re-enter
  that lead's history.
- Removing a row removes that lead and its notes. The confirmation screen says so before you commit.

### Updating a bundled build

`Replace lead file` updates the browser you did it in. A build with leads baked in still ships the
old list to every *other* device, so refresh the build itself when the spreadsheet grows:

```bash
npm run bundle:leads -- path/to/updated.xlsx --password "your-password"
npm run build:private
npm run verify:build -- --password "your-password"
```

Then redeploy. Anyone who already unlocked that site keeps working from their saved copy — the
bundled list only seeds a browser with nothing stored — so they should use **Replace lead file**
to pull the new rows in, or reset to take the fresh bundle.

## How local persistence works

Three `localStorage` keys hold everything:

| Key                            | Contents                                              |
| ------------------------------ | ----------------------------------------------------- |
| `qld-lead-manager:dataset`     | The imported spreadsheet rows                          |
| `qld-lead-manager:management`  | Your edits, keyed by business name + phone number      |
| `qld-lead-manager:filters`     | Your last-used search, filters and sort                |

Imported facts and your own edits are stored separately on purpose. That split is what lets a
file replacement swap the lead rows while re-attaching your outreach history by key, and it is
the seam where a database-backed version would slot in later — only the management records would
need writing.

Because storage is per-browser and per-origin, your leads do not follow you to another browser,
another machine, or a private window.

## Resetting saved data

Use the **trash icon** in the header, then confirm. That clears the imported leads and every
status, note and follow-up date saved in this browser. Your spreadsheet file on disk is untouched.

To clear it by hand instead, run this in the browser console:

```js
Object.keys(localStorage)
  .filter((key) => key.startsWith('qld-lead-manager:'))
  .forEach((key) => localStorage.removeItem(key));
```

## Project layout

```
src/
  types/lead.ts            Domain types: ImportedLead, LeadManagement, Lead, Filters
  lib/
    importer.ts            Header detection, column mapping, hyperlink extraction
    storage.ts             localStorage read/write and file-replacement reconciliation
    export.ts              CSV export of the current view
    sampleData.ts          Built-in fictional preview rows
    utils.ts               Formatting, URL/phone validation, XML entity decoding
  hooks/useLeads.ts        Single source of truth: data, filters, sorting, actions
  components/
    ui/                    Reusable primitives: Button, Modal, Field, Toast, Tooltip
    ...                    Dashboard, table, mobile cards, detail drawer, filters
```

The lead model is split into `ImportedLead` (read-only spreadsheet facts) and `LeadManagement`
(your editable state); `Lead` is the two joined, and is what the UI renders.

## Data handling

- Spreadsheet content is treated as **display data only**. Formulas are not evaluated
  (`cellFormula: false`), and no imported text is ever rendered as HTML.
- Links are created only for `http://` and `https://` URLs. Anything else — `javascript:`,
  `data:`, relative paths — is rejected and shown as inert text.
- `tel:` links are built from digits and a leading `+` only.
- Exported CSV fields that could be read as formulas by a spreadsheet application are prefixed
  with an apostrophe. Phone-shaped values are exempt so your numbers export cleanly.
- Nothing is uploaded anywhere. The spreadsheet never leaves your browser.

**Keep lead files out of version control.** `.gitignore` excludes `*.xlsx`, `*.xls` and `*.csv`
so contact data is not committed by accident.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · lucide-react · SheetJS (`xlsx`)

SheetJS is loaded on demand at import time rather than in the initial bundle — it is the
heaviest dependency and the dashboard never needs it once your leads are loaded.
