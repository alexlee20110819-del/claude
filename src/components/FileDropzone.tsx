import { useCallback, useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFile: (file: File) => void | Promise<void>;
  onLoadSample?: () => void;
  busy?: boolean;
  error?: string | null;
  compact?: boolean;
}

const ACCEPTED = '.xlsx,.xls,.csv';
const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

/**
 * First-run upload area.
 *
 * Accepts drag-and-drop or a file picker, and is the only place a file enters
 * the app. Nothing here uploads anywhere — the file is read in the browser with
 * SheetJS and kept in localStorage.
 */
export function FileDropzone({
  onFile,
  onLoadSample,
  busy = false,
  error = null,
  compact = false,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      void onFile(file);
      // Reset so re-selecting the same file still fires a change event.
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFile],
  );

  const hasValidExtension = (file: File) =>
    ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));

  return (
    <div className={cn('w-full', compact ? '' : 'mx-auto max-w-2xl')}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file && !hasValidExtension(file)) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'rounded-2xl border-2 border-dashed bg-white text-center transition-colors',
          compact ? 'p-6' : 'p-8 sm:p-12',
          dragging ? 'border-navy-500 bg-navy-50' : 'border-slate-300',
          busy && 'pointer-events-none opacity-70',
        )}
      >
        <div className="flex flex-col items-center gap-4">
          <span
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl',
              dragging ? 'bg-navy-100 text-navy-700' : 'bg-slate-100 text-slate-500',
            )}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="h-6 w-6" aria-hidden="true" />
            )}
          </span>

          <div className="space-y-1.5">
            <h2 className={cn('font-semibold text-navy-950', compact ? 'text-base' : 'text-lg')}>
              {busy ? 'Reading your lead file…' : 'Import your lead spreadsheet'}
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500">
              Drop <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.xlsx</code> or{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">.csv</code> here, or choose
              a file. The <strong className="font-semibold text-slate-700">All Current Leads</strong>{' '}
              worksheet is used when present.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button size="lg" onClick={() => inputRef.current?.click()} disabled={busy}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Choose file
            </Button>
            {onLoadSample && (
              <Button variant="outline" size="lg" onClick={onLoadSample} disabled={busy}>
                Preview with sample data
              </Button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            onChange={(event) => handleFiles(event.target.files)}
            className="sr-only"
            aria-label="Choose a lead spreadsheet to import"
          />

          {error && (
            <p role="alert" className="max-w-md text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {!compact && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Your file is read in this browser and saved locally. Nothing is uploaded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
