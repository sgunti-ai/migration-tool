import React from 'react';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

export interface FilterState {
  search: string;
  department: string;
  mfaStatus: string;
  license: string;
  accountEnabled: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  totalFiltered: number;
  totalAll: number;
  departments: string[];
  licenses: string[];
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
  totalAll,
  departments,
  licenses,
}) => {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.department !== 'ALL' ||
    filters.mfaStatus !== 'ALL' ||
    filters.license !== 'ALL' ||
    filters.accountEnabled !== 'ALL';

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-user-search"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search by name, UPN, title, or department..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-800/80 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Department */}
          <select
            id="select-department-filter"
            value={filters.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* MFA Status */}
          <select
            id="select-mfa-filter"
            value={filters.mfaStatus}
            onChange={(e) => onFilterChange({ mfaStatus: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All MFA Status</option>
            <option value="ENFORCED">Enforced (Conditional Access)</option>
            <option value="ENABLED">Enabled</option>
            <option value="DISABLED">Disabled</option>
          </select>

          {/* License SKU */}
          <select
            id="select-license-filter"
            value={filters.license}
            onChange={(e) => onFilterChange({ license: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Licenses</option>
            {licenses.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Account Status */}
          <select
            id="select-account-status-filter"
            value={filters.accountEnabled}
            onChange={(e) => onFilterChange({ accountEnabled: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Account States</option>
            <option value="true">Enabled Only</option>
            <option value="false">Disabled Only</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              id="btn-reset-filters"
              onClick={onReset}
              className="px-2.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition flex items-center space-x-1"
              title="Reset all filters"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter status banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Showing <strong className="text-white">{totalFiltered}</strong> of{' '}
            <strong className="text-white">{totalAll}</strong> discovered users
          </span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-medium border border-blue-500/20">
              Filtered
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
