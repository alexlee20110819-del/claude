import { useState } from 'react';
import { HardHat, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Filters, OutreachStatus, SortDirection, SortField } from '@/types/lead';
import { OUTREACH_STATUSES } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { Select, TextInput } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  tradeOptions: string[];
  locationOptions: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;
  shownCount: number;
  totalCount: number;
}

const SORT_LABELS: Record<SortField, string> = {
  businessName: 'Business name',
  googleRating: 'Google rating',
  googleReviews: 'Review count',
  location: 'Location',
  nextFollowUp: 'Next follow-up',
  updatedAt: 'Last updated',
};

const RATING_OPTIONS = [4.0, 4.3, 4.5, 4.7, 4.9];

export function FilterBar({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  tradeOptions,
  locationOptions,
  sortField,
  sortDirection,
  onSortChange,
  onSortDirectionChange,
  shownCount,
  totalCount,
}: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);

  const patch = (changes: Partial<Filters>) => onChange({ ...filters, ...changes });

  /** Single-select dropdowns write into the multi-select arrays the model uses. */
  const singleValue = (values: string[]) => (values.length === 1 ? values[0]! : '');

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-card sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <TextInput
            label="Search leads"
            srOnlyLabel
            type="search"
            value={filters.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Search business, trade, location or phone…"
            className="[&_input]:pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Status"
            srOnlyLabel
            value={singleValue(filters.statuses)}
            onChange={(event) => {
              const value = event.target.value;
              patch({ statuses: value ? [value as OutreachStatus] : [] });
            }}
            className="w-auto min-w-[9.5rem]"
          >
            <option value="">All statuses</option>
            {OUTREACH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>

          <Select
            label="Successful"
            srOnlyLabel
            value={filters.successful === null ? '' : filters.successful ? 'yes' : 'no'}
            onChange={(event) => {
              const value = event.target.value;
              patch({ successful: value === '' ? null : value === 'yes' });
            }}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="">Any success</option>
            <option value="yes">Successful only</option>
            <option value="no">Not successful</option>
          </Select>

          <Button
            variant={filters.tradeAndConstructionOnly ? 'primary' : 'outline'}
            onClick={() => patch({ tradeAndConstructionOnly: !filters.tradeAndConstructionOnly })}
            aria-pressed={filters.tradeAndConstructionOnly}
          >
            <HardHat className="h-4 w-4" aria-hidden="true" />
            Trades only
          </Button>

          <Button
            variant="outline"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            More filters
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Trade / services"
            value={singleValue(filters.trades)}
            onChange={(event) => patch({ trades: event.target.value ? [event.target.value] : [] })}
          >
            <option value="">All trades</option>
            {tradeOptions.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </Select>

          <Select
            label="Location"
            value={singleValue(filters.locations)}
            onChange={(event) =>
              patch({ locations: event.target.value ? [event.target.value] : [] })
            }
          >
            <option value="">All locations</option>
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </Select>

          <Select
            label="Minimum Google rating"
            value={filters.minRating === null ? '' : String(filters.minRating)}
            onChange={(event) =>
              patch({ minRating: event.target.value ? Number(event.target.value) : null })
            }
          >
            <option value="">Any rating</option>
            {RATING_OPTIONS.map((rating) => (
              <option key={rating} value={rating}>
                {rating.toFixed(1)}+ stars
              </option>
            ))}
          </Select>

          <div className="flex items-end gap-2">
            <TextInput
              label="Reviews from"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.minReviews === null ? '' : String(filters.minReviews)}
              onChange={(event) =>
                patch({ minReviews: event.target.value === '' ? null : Number(event.target.value) })
              }
              placeholder="0"
            />
            <TextInput
              label="to"
              type="number"
              min={0}
              inputMode="numeric"
              value={filters.maxReviews === null ? '' : String(filters.maxReviews)}
              onChange={(event) =>
                patch({ maxReviews: event.target.value === '' ? null : Number(event.target.value) })
              }
              placeholder="Any"
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-sm text-slate-600" role="status" aria-live="polite">
          Showing <strong className="font-semibold text-navy-950">{shownCount}</strong> of{' '}
          {totalCount} leads
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            label="Sort by"
            srOnlyLabel
            value={sortField}
            onChange={(event) => onSortChange(event.target.value as SortField)}
            className="w-auto min-w-[10rem]"
          >
            {(Object.keys(SORT_LABELS) as SortField[]).map((field) => (
              <option key={field} value={field}>
                Sort: {SORT_LABELS[field]}
              </option>
            ))}
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
            aria-label={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(hasActiveFilters && 'text-navy-700')}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}
