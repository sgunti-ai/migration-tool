import React, { useState, useMemo } from 'react';
import { DiscoveredUser } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ExternalLink,
  Download,
  Layers,
  CheckSquare,
  Square,
  X,
  User,
  HardDrive,
  Mail,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

interface UserListTableProps {
  users: DiscoveredUser[];
  isLoading: boolean;
  onSelectUser: (user: DiscoveredUser) => void;
  onExportSelected: (selectedUsers: DiscoveredUser[], format: 'csv' | 'json') => void;
  onStageMigrationWave?: (selectedUsers: DiscoveredUser[]) => void;
}

type SortField = 'displayName' | 'upn' | 'department' | 'jobTitle' | 'mfaStatus' | 'mailboxSizeMB' | 'oneDriveUsedGB' | 'accountEnabled';
type SortOrder = 'asc' | 'desc';

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  isLoading,
  onSelectUser,
  onExportSelected,
  onStageMigrationWave,
}) => {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Local Search
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      result = result.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.upn.toLowerCase().includes(q) ||
          (u.department && u.department.toLowerCase().includes(q)) ||
          (u.jobTitle && u.jobTitle.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'mailboxSizeMB' || sortField === 'oneDriveUsedGB') {
        valA = Number(valA || 0);
        valB = Number(valB || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, tableSearch, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Selection helpers
  const isAllCurrentSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.has(u.id));
  const selectedUsersList = useMemo(() => {
    return users.filter((u) => selectedUserIds.has(u.id));
  }, [users, selectedUserIds]);

  const toggleSelectAll = () => {
    const next = new Set(selectedUserIds);
    if (isAllCurrentSelected) {
      paginatedUsers.forEach((u) => next.delete(u.id));
    } else {
      paginatedUsers.forEach((u) => next.add(u.id));
    }
    setSelectedUserIds(next);
  };

  const toggleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedUserIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUserIds(next);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600 opacity-60 group-hover:opacity-100 transition" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  return (
    <div className="space-y-3">
      {/* Table Sub-header toolbar: Search + Count + Page Size */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => {
                setTableSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Quick search user name, UPN, dept..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span className="text-xs text-slate-400 whitespace-nowrap">
            Showing <strong className="text-white">{filteredUsers.length}</strong> of{' '}
            <strong className="text-white">{users.length}</strong> users
          </span>
        </div>

        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          <span className="text-xs text-slate-400">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Main High-Performance Table */}
      <div className="w-full rounded-xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                {/* Checkbox Column */}
                <th className="w-12 px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="p-1 text-slate-400 hover:text-white rounded transition"
                    title={isAllCurrentSelected ? 'Deselect all' : 'Select all'}
                  >
                    {isAllCurrentSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </th>

                {/* User & UPN */}
                <th
                  onClick={() => handleSort('displayName')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Entra ID User / UPN</span>
                    {renderSortIcon('displayName')}
                  </div>
                </th>

                {/* Department */}
                <th
                  onClick={() => handleSort('department')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-40"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Department</span>
                    {renderSortIcon('department')}
                  </div>
                </th>

                {/* Job Title */}
                <th
                  onClick={() => handleSort('jobTitle')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-44"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>Job Title</span>
                    {renderSortIcon('jobTitle')}
                  </div>
                </th>

                {/* MFA Status */}
                <th
                  onClick={() => handleSort('mfaStatus')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-32"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>MFA Status</span>
                    {renderSortIcon('mfaStatus')}
                  </div>
                </th>

                {/* Assigned Licenses */}
                <th className="px-4 py-3 w-52">
                  <span>Assigned Licenses</span>
                </th>

                {/* Mailbox Size */}
                <th
                  onClick={() => handleSort('mailboxSizeMB')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-28 text-right"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>Mailbox</span>
                    {renderSortIcon('mailboxSizeMB')}
                  </div>
                </th>

                {/* OneDrive */}
                <th
                  onClick={() => handleSort('oneDriveUsedGB')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-28 text-right"
                >
                  <div className="flex items-center justify-end space-x-1.5">
                    <span>OneDrive</span>
                    {renderSortIcon('oneDriveUsedGB')}
                  </div>
                </th>

                {/* Status */}
                <th
                  onClick={() => handleSort('accountEnabled')}
                  className="px-4 py-3 cursor-pointer group hover:text-white transition w-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-1.5">
                    <span>Status</span>
                    {renderSortIcon('accountEnabled')}
                  </div>
                </th>

                {/* Action */}
                <th className="px-4 py-3 w-24 text-right">
                  <span>Action</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 py-3.5 text-center">
                      <div className="w-4 h-4 bg-slate-800 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="w-32 h-3.5 bg-slate-800 rounded" />
                          <div className="w-48 h-2.5 bg-slate-850 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-24 h-3 bg-slate-800 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-28 h-3 bg-slate-800 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-20 h-5 bg-slate-800 rounded-full" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="w-32 h-5 bg-slate-800 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="w-16 h-3 bg-slate-800 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="w-16 h-3 bg-slate-800 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-14 h-4 bg-slate-800 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="w-12 h-6 bg-slate-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <User className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-60" />
                    <p className="text-sm font-medium text-slate-400">No discovered users match the criteria</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try clearing search filters or scanning the tenant again
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelected = selectedUserIds.has(user.id);
                  const mb = Number(user.mailboxSizeMB || 0);
                  const mailboxDisplay = mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
                  const oneDriveGB = Number(user.oneDriveUsedGB || 0).toFixed(1);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => onSelectUser(user)}
                      className={`cursor-pointer transition-colors duration-150 group ${
                        isSelected
                          ? 'bg-blue-950/20 hover:bg-blue-950/30'
                          : 'hover:bg-slate-800/50 bg-transparent'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-12 px-3 py-3 text-center" onClick={(e) => toggleSelectUser(user.id, e)}>
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-white rounded transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Display Name & UPN */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition truncate">
                              {user.displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
                              {user.upn}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 text-slate-300">
                        {user.department ? (
                          <span className="truncate block">{user.department}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Job Title */}
                      <td className="px-4 py-3 text-slate-400">
                        {user.jobTitle ? (
                          <span className="truncate block" title={user.jobTitle}>
                            {user.jobTitle}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">—</span>
                        )}
                      </td>

                      {/* MFA Status */}
                      <td className="px-4 py-3">
                        {user.mfaStatus === 'ENFORCED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Enforced
                          </span>
                        ) : user.mfaStatus === 'ENABLED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ShieldAlert className="w-3 h-3" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <ShieldX className="w-3 h-3" />
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Licenses */}
                      <td className="px-4 py-3">
                        {user.licenses && user.licenses.length > 0 ? (
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate max-w-[140px]">
                              {user.licenses[0]}
                            </span>
                            {user.licenses.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                                +{user.licenses.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No license</span>
                        )}
                      </td>

                      {/* Mailbox Size */}
                      <td className="px-4 py-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        {mailboxDisplay}
                      </td>

                      {/* OneDrive */}
                      <td className="px-4 py-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {oneDriveGB} GB
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {user.accountEnabled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700">
                            Disabled
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          id={`btn-view-user-${user.id}`}
                          onClick={() => onSelectUser(user)}
                          className="px-2.5 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition inline-flex items-center space-x-1"
                          title="Inspect details"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(currentPage * pageSize, filteredUsers.length)}
            </strong>{' '}
            of <strong className="text-white">{filteredUsers.length}</strong> results
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono text-white bg-slate-800 rounded border border-slate-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Floating Batch Selection Toolbar */}
      {selectedUserIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl px-5 py-3 flex items-center space-x-4 animate-slideUp">
          <div className="flex items-center space-x-2 border-r border-slate-700/80 pr-4">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">
              {selectedUserIds.size} <span className="text-slate-400 font-normal">users selected</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-batch-export-csv"
              onClick={() => onExportSelected(selectedUsersList, 'csv')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-batch-export-json"
              onClick={() => onExportSelected(selectedUsersList, 'json')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>

            {onStageMigrationWave && (
              <button
                id="btn-batch-stage-wave"
                onClick={() => onStageMigrationWave(selectedUsersList)}
                className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stage for Migration Wave</span>
              </button>
            )}

            <button
              id="btn-batch-deselect"
              onClick={() => setSelectedUserIds(new Set())}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
