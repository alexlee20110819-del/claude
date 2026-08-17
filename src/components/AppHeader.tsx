import { Download, MapPinned, RefreshCw, Trash2 } from 'lucide-react';
import type { LeadDataset } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatDateTime } from '@/lib/utils';

interface AppHeaderProps {
  dataset: LeadDataset | null;
  filteredCount: number;
  onReplace: () => void;
  onExport: () => void;
  onReset: () => void;
}

export function AppHeader({
  dataset,
  filteredCount,
  onReplace,
  onExport,
  onReset,
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
                    {dataset.leads.length} leads · imported {formatDateTime(dataset.importedAt)}
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
