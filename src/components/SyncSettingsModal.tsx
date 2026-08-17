import { useState } from 'react';
import { CloudOff, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { clearRemoteUrl, isBuiltInUrl, setRemoteUrl, toCsvUrl } from '@/lib/remoteSource';

interface SyncSettingsModalProps {
  open: boolean;
  onClose: () => void;
  currentUrl: string | null;
  syncing: boolean;
  onSaveAndSync: () => void;
  onDisconnect: () => void;
}

/**
 * Set up the live sheet link.
 *
 * The instructions are specific because the two ways this goes wrong are both
 * setup mistakes, not code problems: sharing an edit link instead of publishing,
 * and publishing as a web page rather than CSV.
 */
export function SyncSettingsModal({
  open,
  onClose,
  currentUrl,
  syncing,
  onSaveAndSync,
  onDisconnect,
}: SyncSettingsModalProps) {
  const [draft, setDraft] = useState(currentUrl ?? '');
  const builtIn = isBuiltInUrl();

  const handleSave = () => {
    if (!draft.trim()) return;
    setRemoteUrl(draft);
    onSaveAndSync();
  };

  const handleDisconnect = () => {
    clearRemoteUrl();
    setDraft('');
    onDisconnect();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Live sheet sync"
      description="Keep this site in step with a Google Sheet, on every device."
      size="lg"
      footer={
        <>
          {currentUrl && !builtIn && (
            <Button variant="danger" onClick={handleDisconnect} className="mr-auto">
              <CloudOff className="h-4 w-4" aria-hidden="true" />
              Disconnect
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={!draft.trim() || syncing}>
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Syncing…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Save and sync now
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ol className="flex flex-col gap-2.5 rounded-xl border border-navy-200 bg-navy-50/60 p-4 text-sm leading-relaxed text-navy-900">
          <li>
            <strong className="font-semibold">1.</strong> Open your lead sheet in Google Sheets.
          </li>
          <li>
            <strong className="font-semibold">2.</strong> Choose{' '}
            <em>File → Share → Publish to web</em>.
          </li>
          <li>
            <strong className="font-semibold">3.</strong> Pick the lead sheet, and set the format to{' '}
            <strong className="font-semibold">Comma-separated values (.csv)</strong> — not a web
            page.
          </li>
          <li>
            <strong className="font-semibold">4.</strong> Press <em>Publish</em> and paste the link
            below.
          </li>
        </ol>

        <TextInput
          label="Published sheet link"
          type="url"
          inputMode="url"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?output=csv"
          hint="An ordinary /edit link works too — it is converted automatically."
          data-autofocus
        />

        {draft.trim() && toCsvUrl(draft) !== draft.trim() && (
          <p className="break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Will fetch: <span className="font-medium">{toCsvUrl(draft)}</span>
          </p>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
          <p className="font-semibold">Two things to know</p>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-4">
            <li>
              A published sheet is readable by anyone who has the link, so treat the lead list as
              public once you publish it.
            </li>
            <li>
              CSV export drops cell links, so put the Google evidence <strong>URL itself</strong> in
              the <em>Source / Verification</em> column as plain text — not a link on the words
              "Open Google evidence".
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Your statuses, notes and follow-up dates stay on your device and are matched back on every
          sync by business name and phone number. Syncing never overwrites them.{' '}
          <a
            href="https://support.google.com/docs/answer/183965"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-medium text-navy-700 underline underline-offset-2"
          >
            Google's guide
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </div>
    </Modal>
  );
}
