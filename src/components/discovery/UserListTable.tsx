import React, { useMemo, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  ValidationModule,
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  GridApi,
  themeQuartz,
} from 'ag-grid-community';

import { DiscoveredUser } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  ExternalLink, 
  Download, 
  Layers, 
  CheckSquare, 
  X,
  User,
  HardDrive
} from 'lucide-react';

// Register all community features and validation module for diagnostics
ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

// Modern AG Grid Quartz Dark Theme Configuration
const customQuartzDark = themeQuartz.withParams({
  backgroundColor: '#0b1120',
  headerBackgroundColor: '#0f172a',
  oddRowBackgroundColor: '#0b1120',
  rowHoverColor: '#1e293b80',
  selectedRowBackgroundColor: '#1e3a8a30',
  borderColor: '#1e293b',
  headerTextColor: '#94a3b8',
  foregroundColor: '#e2e8f0',
  fontFamily: 'inherit',
  fontSize: 13,
  cellHorizontalPadding: 14,
  rowHeight: 48,
  headerHeight: 44,
});

interface UserListTableProps {
  users: DiscoveredUser[];
  isLoading: boolean;
  onSelectUser: (user: DiscoveredUser) => void;
  onExportSelected: (selectedUsers: DiscoveredUser[], format: 'csv' | 'json') => void;
  onStageMigrationWave?: (selectedUsers: DiscoveredUser[]) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  isLoading,
  onSelectUser,
  onExportSelected,
  onStageMigrationWave,
}) => {
  const gridRef = useRef<AgGridReact<DiscoveredUser>>(null);
  const [gridApi, setGridApi] = useState<GridApi<DiscoveredUser> | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<DiscoveredUser[]>([]);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
    params.api.sizeColumnsToFit();
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    const selected = event.api.getSelectedRows();
    setSelectedUsers(selected);
  }, []);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<DiscoveredUser>[]>(() => {
    return [
      {
        headerName: '',
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 50,
        pinned: 'left',
        lockPosition: 'left',
        suppressMenu: true,
        sortable: false,
        filter: false,
        resizable: false,
      },
      {
        headerName: 'User Principal Name & Name',
        field: 'displayName',
        minWidth: 260,
        flex: 1.5,
        cellRenderer: (params: any) => {
          const user = params.data as DiscoveredUser;
          if (!user) return null;
          return (
            <div className="flex items-center space-x-3 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                {user.displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate hover:text-blue-400 transition cursor-pointer">
                  {user.displayName}
                </div>
                <div className="text-xs text-slate-400 truncate font-mono">{user.upn}</div>
              </div>
            </div>
          );
        },
      },
      {
        headerName: 'Department',
        field: 'department',
        minWidth: 150,
        flex: 1,
        cellRenderer: (params: any) => {
          return (
            <span className="text-xs text-slate-300">
              {params.value || <span className="text-slate-500 italic">Unassigned</span>}
            </span>
          );
        },
      },
      {
        headerName: 'Job Title',
        field: 'jobTitle',
        minWidth: 180,
        flex: 1.2,
        cellRenderer: (params: any) => {
          return (
            <span className="text-xs text-slate-400 truncate block" title={params.value}>
              {params.value || <span className="text-slate-500 italic">—</span>}
            </span>
          );
        },
      },
      {
        headerName: 'MFA Status',
        field: 'mfaStatus',
        width: 140,
        cellRenderer: (params: any) => {
          const status = params.value;
          if (status === 'ENFORCED') {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Enforced
              </span>
            );
          }
          if (status === 'ENABLED') {
            return (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldAlert className="w-3 h-3" />
                Enabled
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldX className="w-3 h-3" />
              Disabled
            </span>
          );
        },
      },
      {
        headerName: 'Licenses',
        field: 'licenses',
        minWidth: 200,
        flex: 1.2,
        cellRenderer: (params: any) => {
          const licenses = params.value as string[] | undefined;
          if (!licenses || licenses.length === 0) {
            return <span className="text-xs text-slate-500 italic">No license</span>;
          }
          const first = licenses[0];
          const rest = licenses.length - 1;
          return (
            <div className="flex items-center space-x-1.5 truncate">
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 truncate">
                {first}
              </span>
              {rest > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                  +{rest}
                </span>
              )}
            </div>
          );
        },
      },
      {
        headerName: 'Mailbox Size',
        field: 'mailboxSizeMB',
        width: 130,
        cellRenderer: (params: any) => {
          const mb = Number(params.value || 0);
          const gb = mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
          return (
            <span className="text-xs font-mono text-slate-300">
              {gb}
            </span>
          );
        },
      },
      {
        headerName: 'OneDrive',
        field: 'oneDriveUsedGB',
        width: 120,
        cellRenderer: (params: any) => {
          const gb = Number(params.value || 0);
          return (
            <span className="text-xs font-mono text-slate-300 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-slate-500" />
              {gb.toFixed(1)} GB
            </span>
          );
        },
      },
      {
        headerName: 'Status',
        field: 'accountEnabled',
        width: 100,
        cellRenderer: (params: any) => {
          const enabled = params.value;
          return enabled ? (
            <span className="text-[11px] font-medium text-emerald-400">Active</span>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">Disabled</span>
          );
        },
      },
      {
        headerName: 'Actions',
        width: 90,
        pinned: 'right',
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const user = params.data as DiscoveredUser;
          return (
            <button
              id={`btn-view-user-${user.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectUser(user);
              }}
              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition flex items-center space-x-1"
              title="Inspect discovered details"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
          );
        },
      },
    ];
  }, [onSelectUser]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      filter: true,
      resizable: true,
      cellClass: 'flex items-center text-slate-300',
    };
  }, []);

  return (
    <div className="relative space-y-4">
      {/* AG Grid Container styled with modern dark palette */}
      <div
        className="w-full rounded-xl overflow-hidden border border-slate-800/80 shadow-inner"
        style={{
          height: '540px',
          backgroundColor: '#0b1120',
        }}
      >
        <AgGridReact<DiscoveredUser>
          ref={gridRef}
          theme={customQuartzDark}
          rowData={users}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowSelection={{
            mode: 'multiRow',
            headerCheckbox: true,
            checkboxes: true,
            enableClickSelection: false,
          }}
          pagination={true}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onGridReady={onGridReady}
          onSelectionChanged={onSelectionChanged}
          onRowDoubleClicked={(e) => e.data && onSelectUser(e.data)}
          loading={isLoading}
          overlayLoadingTemplate={
            '<div class="flex items-center space-x-2 text-slate-400 p-4"><div class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div><span>Scanning tenant user directory...</span></div>'
          }
          overlayNoRowsTemplate={
            '<div class="text-center py-12 text-slate-500"><p class="text-sm">No discovered users match your filter criteria.</p><p class="text-xs text-slate-600 mt-1">Try resetting filters or initiating a tenant scan.</p></div>'
          }
        />
      </div>

      {/* Floating Batch Selection Toolbar */}
      {selectedUsers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl px-5 py-3 flex items-center space-x-4 animate-slideUp">
          <div className="flex items-center space-x-2 border-r border-slate-700/80 pr-4">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">
              {selectedUsers.length} <span className="text-slate-400 font-normal">users selected</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-batch-export-csv"
              onClick={() => onExportSelected(selectedUsers, 'csv')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="btn-batch-export-json"
              onClick={() => onExportSelected(selectedUsers, 'json')}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600 transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>

            {onStageMigrationWave && (
              <button
                id="btn-batch-stage-wave"
                onClick={() => onStageMigrationWave(selectedUsers)}
                className="px-3.5 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stage for Migration Wave</span>
              </button>
            )}

            <button
              id="btn-batch-deselect"
              onClick={() => {
                gridApi?.deselectAll();
                setSelectedUsers([]);
              }}
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
