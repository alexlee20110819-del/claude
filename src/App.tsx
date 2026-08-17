import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Inbox, ShieldCheck } from 'lucide-react';
import type { Filters, ImportResult, Lead, OutreachStatus } from '@/types/lead';
import { useLeads } from '@/hooks/useLeads';
import { importLeadFile } from '@/lib/importer';
import { loadSampleDataset } from '@/lib/sampleData';
import { exportLeadsToCsv } from '@/lib/export';
import { AppHeader } from '@/components/AppHeader';
import { FileDropzone } from '@/components/FileDropzone';
import { FilterBar } from '@/components/FilterBar';
import { LeadCardList } from '@/components/LeadCardList';
import { LeadDetailDrawer } from '@/components/LeadDetailDrawer';
import { LeadTable } from '@/components/LeadTable';
import { SummaryCards, statusFilterPatch } from '@/components/SummaryCards';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ToastProvider, useToast } from '@/components/ui/Toast';

export default function App() {
  return (
    <ToastProvider>
      <LeadManager />
    </ToastProvider>
  );
}

function LeadManager() {
  const {
    isReady,
    hasBundledLeads,
    dataset,
    leads,
    filteredLeads,
    stats,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    sortField,
    sortDirection,
    toggleSort,
    tradeOptions,
    locationOptions,
    setStatus,
    setSuccessful,
    updateField,
    importDataset,
    replaceDataset,
    resetAll,
  } = useLeads();

  const { toast } = useToast();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Re-read the selected lead from the live list so the drawer reflects edits.
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  const runImport = useCallback(
    async (file: File, mode: 'initial' | 'replace') => {
      setImporting(true);
      setImportError(null);
      try {
        const result: ImportResult = await importLeadFile(file);

        if (mode === 'replace') {
          const summary = replaceDataset(result);
          setReplaceOpen(false);
          toast(
            summary.matched > 0
              ? `Imported ${summary.total} leads · outreach kept for ${summary.matched} matching business${summary.matched === 1 ? '' : 'es'}.`
              : `Imported ${summary.total} leads from ${file.name}.`,
          );
          if (summary.dropped > 0) {
            toast(
              `${summary.dropped} edited lead${summary.dropped === 1 ? '' : 's'} from the previous file had no match and ${summary.dropped === 1 ? 'was' : 'were'} removed.`,
              'info',
            );
          }
        } else {
          importDataset(result);
          toast(`Imported ${result.dataset.leads.length} leads from ${file.name}.`);
        }

        for (const warning of result.warnings) toast(warning, 'info');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'That file could not be read as a spreadsheet.';
        setImportError(message);
        toast(message, 'error');
      } finally {
        setImporting(false);
      }
    },
    [importDataset, replaceDataset, toast],
  );

  const handleLoadSample = useCallback(() => {
    const result = loadSampleDataset();
    importDataset(result);
    toast('Loaded sample preview data. Import your own file to replace it.', 'info');
  }, [importDataset, toast]);

  const handleStatusChange = useCallback(
    (lead: Lead, status: OutreachStatus) => {
      setStatus(lead, status);
      toast(`${lead.businessName} → ${status}`, status === 'Successful' ? 'success' : 'info');
    },
    [setStatus, toast],
  );

  const handleSuccessChange = useCallback(
    (lead: Lead, successful: boolean) => {
      setSuccessful(lead, successful);
      toast(
        successful
          ? `${lead.businessName} marked as successful.`
          : `${lead.businessName} moved back to Follow-up.`,
        successful ? 'success' : 'info',
      );
    },
    [setSuccessful, toast],
  );

  const handleExport = useCallback(() => {
    if (filteredLeads.length === 0) {
      toast('There are no leads in the current view to export.', 'info');
      return;
    }
    const fileName = exportLeadsToCsv(filteredLeads);
    toast(`Exported ${filteredLeads.length} lead${filteredLeads.length === 1 ? '' : 's'} to ${fileName}.`);
  }, [filteredLeads, toast]);

  const handleReset = useCallback(() => {
    resetAll();
    setResetOpen(false);
    setSelectedLeadId(null);
    toast(
      hasBundledLeads
        ? 'Your edits were cleared and the built-in lead list was restored.'
        : 'All locally saved leads and edits have been cleared.',
      'info',
    );
  }, [hasBundledLeads, resetAll, toast]);

  const handleStatusCardFilter = useCallback(
    (status: OutreachStatus | null) => setFilters(statusFilterPatch(status, filters)),
    [filters, setFilters],
  );

  // Avoid a flash of the upload screen while localStorage is being read.
  if (!isReady) {
    return <div className="min-h-screen bg-slate-50" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#lead-list"
        className="sr-only-focusable absolute left-4 top-4 z-50 rounded-lg bg-navy-900 px-3 py-2 text-sm font-medium text-white"
      >
        Skip to lead list
      </a>

      <AppHeader
        dataset={dataset}
        filteredCount={filteredLeads.length}
        onReplace={() => {
          setImportError(null);
          setReplaceOpen(true);
        }}
        onExport={handleExport}
        onReset={() => setResetOpen(true)}
      />

      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 sm:py-6">
        {!dataset ? (
          <div className="py-8 sm:py-16">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl">
                Work your Queensland website leads
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                Import your lead spreadsheet to call businesses, open their Google Business evidence,
                and track every outreach outcome — all stored locally in this browser.
              </p>
            </div>
            <FileDropzone
              onFile={(file) => runImport(file, 'initial')}
              onLoadSample={handleLoadSample}
              busy={importing}
              error={importError}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SummaryCards
              stats={stats}
              filters={filters}
              onFilterByStatus={handleStatusCardFilter}
            />

            <FilterBar
              filters={filters}
              onChange={(next: Filters) => setFilters(next)}
              onClear={clearFilters}
              hasActiveFilters={hasActiveFilters}
              tradeOptions={tradeOptions}
              locationOptions={locationOptions}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortChange={(field) => {
                if (field !== sortField) toggleSort(field);
              }}
              onSortDirectionChange={() => toggleSort(sortField)}
              shownCount={filteredLeads.length}
              totalCount={leads.length}
            />

            <div id="lead-list">
              {filteredLeads.length === 0 ? (
                <EmptyState hasActiveFilters={hasActiveFilters} onClear={clearFilters} />
              ) : (
                <>
                  <LeadTable
                    leads={filteredLeads}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSort={toggleSort}
                    onOpenLead={(lead) => setSelectedLeadId(lead.id)}
                    onStatusChange={handleStatusChange}
                    onSuccessChange={handleSuccessChange}
                  />
                  <LeadCardList
                    leads={filteredLeads}
                    onOpenLead={(lead) => setSelectedLeadId(lead.id)}
                    onStatusChange={handleStatusChange}
                    onSuccessChange={handleSuccessChange}
                  />
                </>
              )}
            </div>

            <p className="flex items-center justify-center gap-1.5 py-4 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Leads and edits are stored only in this browser. Nothing is uploaded anywhere.
            </p>
          </div>
        )}
      </main>

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
        onStatusChange={handleStatusChange}
        onSuccessChange={handleSuccessChange}
        onFieldChange={updateField}
      />

      <Modal
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title="Replace lead file"
        description="Upload a newer spreadsheet to replace the current lead list."
        size="lg"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="space-y-1.5 text-sm text-amber-900">
              <p className="font-semibold">Your outreach history is matched, not merged blindly.</p>
              <p className="leading-relaxed">
                Leads in the new file whose <strong>business name and phone number</strong> match a
                current lead keep their status, success tick, notes and follow-up dates. Any edited
                lead that is not in the new file is removed along with its notes. The original
                spreadsheet on your computer is never modified.
              </p>
            </div>
          </div>

          <FileDropzone
            onFile={(file) => runImport(file, 'replace')}
            busy={importing}
            error={importError}
            compact
          />
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={hasBundledLeads ? 'Clear all your edits?' : 'Reset all local data?'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset} data-autofocus>
              {hasBundledLeads ? 'Clear my edits' : 'Delete everything'}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {hasBundledLeads
            ? 'This clears every status, note and follow-up date you have saved in this browser, and restores the built-in lead list to its original state. This cannot be undone.'
            : 'This clears the imported leads and every status, note and follow-up date saved in this browser. Your original spreadsheet file is not affected. This cannot be undone.'}
        </p>
      </Modal>
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onClear,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-navy-950">No leads match your filters</h3>
        <p className="mt-1 text-sm text-slate-500">
          {hasActiveFilters
            ? 'Try widening your search or clearing the active filters.'
            : 'This lead file contains no rows to display.'}
        </p>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
