import { Cloud, CloudOff, Download, Loader2, MapPinned, RefreshCw, Trash2 } from 'lucide-react';
import type { LeadDataset } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatDateTime, formatRelative } from '@/lib/utils';

interface AppHeaderProps {
  dataset: LeadDataset | null;
  filteredCount: number;
  onReplace: () => void;
  onExport: () => void;
  onReset: () => void;
  remoteUrl: string | null;
  syncing: boolean;
  lastSync: string;
  onSync: () => void;
  onOpenSyncSettings: () => void;
}

export function AppHeader({
  dataset,
  filteredCount,
  onReplace,
  onExport,
  onReset,
  remoteUrl,
  syncing,
  lastSync,
  onSync,
  onOpenSyncSettings,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white">
            <MapPinned className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-base font-semibold leading-tight text-navy-950">
              Queensland Lead Manager
            </h1>
            <p className="text-xs text-slate-500">
              {dataset ? (
                <>
                  {dataset.isSample ? (
                    <span className="font-medium text-amber-700">Sample preview data</span>
                  ) : (
                    <span className="font-medium text-slate-600">{dataset.fileName}</span>
                  )}
                  <span className="hidden sm:inline">
                    {' · '}
                    {dataset.leads.length} leads
                    {remoteUrl
                      ? ` · synced ${syncing ? 'now…' : formatRelative(lastSync).toLowerCase()}`
                      : ` · imported ${formatDateTime(dataset.importedAt)}`}
                  </span>
                </>
              ) : (
                'Website-development outreach'
              )}
            </p>
          </div>
        </div>

        {dataset && (
          <div className="flex flex-wrap items-center gap-2">
            {remoteUrl ? (
              <Tooltip label="Check the linked Google Sheet for changes">
                <Button variant="outline" onClick={onSync} disabled={syncing}>
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Cloud className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync now'}</span>
                </Button>
              </Tooltip>
            ) : (
              <Tooltip label="Keep this site in step with a Google Sheet">
                <Button variant="outline" onClick={onOpenSyncSettings}>
                  <CloudOff className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Set up live sync</span>
                </Button>
              </Tooltip>
            )}

            <Tooltip label="Download the leads currently shown, as CSV">
              <Button variant="outline" onClick={onExport} disabled={filteredCount === 0}>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Export current view</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </Tooltip>

            <Tooltip label="Upload a newer spreadsheet, keeping your outreach history">
              <Button variant="outline" onClick={onReplace}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Replace lead file</span>
                <span className="sm:hidden">Replace</span>
              </Button>
            </Tooltip>

            {remoteUrl && (
              <Tooltip label="Change or disconnect the linked sheet">
                <Button variant="ghost" size="icon" onClick={onOpenSyncSettings} aria-label="Live sync settings">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Tooltip>
            )}

            <Tooltip label="Delete all locally saved leads and edits">
              <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset all local data">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </header>
  );
}
