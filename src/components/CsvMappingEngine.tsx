import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
} from 'lucide-react';
import { CSVUserRow, TenantStatusResponse, AdminRole } from '../types';

interface CsvMappingEngineProps {
  tenantStatus: TenantStatusResponse;
  currentRole: AdminRole;
  onInitializeJob: (mappings: CSVUserRow[]) => Promise<void>;
  isInitializing: boolean;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const CsvMappingEngine: React.FC<CsvMappingEngineProps> = ({
  tenantStatus,
  currentRole,
  onInitializeJob,
  isInitializing,
}) => {
  const [rows, setRows] = useState<CSVUserRow[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate a single parsed row
  const validateRow = (sourceUPN: string, targetUPN: string, index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (!sourceUPN || !sourceUPN.trim()) {
      errors.push('SourceUPN is required');
    } else if (!EMAIL_REGEX.test(sourceUPN.trim())) {
      errors.push(`Invalid source email format: "${sourceUPN}"`);
    }

    if (!targetUPN || !targetUPN.trim()) {
      errors.push('TargetUPN is required');
    } else if (!EMAIL_REGEX.test(targetUPN.trim())) {
      errors.push(`Invalid target email format: "${targetUPN}"`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // Parse CSV text
  const parseCSVText = (text: string, name = 'user-mappings.csv') => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('CSV file appears to be empty or has only header row.');
      return;
    }

    // Header validation
    const header = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const sourceIdx = header.findIndex((h) => h.toLowerCase() === 'sourceupn');
    const targetIdx = header.findIndex((h) => h.toLowerCase() === 'targetupn');
    const mailIdx = header.findIndex((h) => h.toLowerCase() === 'migratemailbox');
    const driveIdx = header.findIndex((h) => h.toLowerCase() === 'migrateonedrive');

    if (sourceIdx === -1 || targetIdx === -1) {
      alert('CSV must contain "SourceUPN" and "TargetUPN" columns.');
      return;
    }

    const parsedRows: CSVUserRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const sourceUPN = cols[sourceIdx] || '';
      const targetUPN = cols[targetIdx] || '';
      const migrateMailbox = mailIdx !== -1 ? cols[mailIdx].toLowerCase() !== 'false' : true;
      const migrateOneDrive = driveIdx !== -1 ? cols[driveIdx].toLowerCase() !== 'false' : true;

      const validation = validateRow(sourceUPN, targetUPN, i);

      parsedRows.push({
        id: `row-${i}-${Date.now()}`,
        sourceUPN,
        targetUPN,
        migrateMailbox,
        migrateOneDrive,
        isValid: validation.isValid,
        errors: validation.errors,
      });
    }

    setRows(parsedRows);
    setFileName(name);
  };

  // Handle file upload through click or drag-and-drop
  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv format file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        parseCSVText(content, file.name);
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Download Sample CSV Template
  const handleDownloadSample = () => {
    const srcDomain = tenantStatus.source.domain || 'contoso.onmicrosoft.com';
    const tgtDomain = tenantStatus.target.domain || 'fabrikam.com';

    const csvContent =
      'SourceUPN,TargetUPN,MigrateMailbox,MigrateOneDrive\r\n' +
      `alex.wilber@${srcDomain},alex.wilber@${tgtDomain},true,true\r\n` +
      `adele.vance@${srcDomain},adele.vance@${tgtDomain},true,true\r\n` +
      `megan.bowen@${srcDomain},megan.bowen@${tgtDomain},true,true\r\n` +
      `isaiah.langer@${srcDomain},isaiah.langer@${tgtDomain},true,false\r\n` +
      `lee.gu@${srcDomain},lee.gu@${tgtDomain},false,true\r\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'm365_migration_user_mapping_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load Built-in Demo Enterprise Presets
  const handleLoadSampleUsers = () => {
    const srcDomain = tenantStatus.source.domain || 'contoso.onmicrosoft.com';
    const tgtDomain = tenantStatus.target.domain || 'fabrikam.com';

    const sampleText =
      'SourceUPN,TargetUPN,MigrateMailbox,MigrateOneDrive\n' +
      `alex.wilber@${srcDomain},alex.wilber@${tgtDomain},true,true\n` +
      `adele.vance@${srcDomain},adele.vance@${tgtDomain},true,true\n` +
      `megan.bowen@${srcDomain},megan.bowen@${tgtDomain},true,true\n` +
      `isaiah.langer@${srcDomain},isaiah.langer@${tgtDomain},true,true\n` +
      `lee.gu@${srcDomain},lee.gu@${tgtDomain},true,true\n` +
      `lynne.robbins@${srcDomain},lynne.robbins@${tgtDomain},true,true\n` +
      `invalid-user-format,corrupted@${tgtDomain},true,true`; // Intentionally include 1 invalid row to demonstrate validation

    parseCSVText(sampleText, 'enterprise-demo-directory.csv');
  };

  // Toggle item options
  const toggleOption = (id: string, field: 'migrateMailbox' | 'migrateOneDrive') => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: !r[field] } : r))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    setRows([]);
    setFileName(null);
  };

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const bothTenantsConnected =
    tenantStatus.source.connected && tenantStatus.target.connected;

  const canInitialize =
    bothTenantsConnected && validRows.length > 0 && !isInitializing && currentRole !== 'AUDITOR';

  return (
    <div className="space-y-6">
      {/* Visual File Drop Zone & Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-400" />
              <span>User Identity & Workload CSV Mapping</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload an RFC-4180 compliant CSV containing user identity mappings between the source and target tenant.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-sample-csv"
              onClick={handleDownloadSample}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Download Template CSV</span>
            </button>

            <button
              id="btn-load-sample-users"
              onClick={handleLoadSampleUsers}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900 text-blue-300 text-xs font-medium rounded-lg border border-blue-800 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load 7 Sample Accounts</span>
            </button>
          </div>
        </div>

        {/* Drop Zone Area */}
        <div
          id="csv-drop-zone"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div className="text-sm font-medium text-slate-200">
              {fileName ? (
                <span className="text-blue-400 font-semibold">{fileName}</span>
              ) : (
                <>Drag and drop your user-mapping CSV file here, or <span className="text-blue-400 underline">browse</span></>
              )}
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Expected columns: <code className="text-slate-400 font-mono">SourceUPN</code>, <code className="text-slate-400 font-mono">TargetUPN</code>, <code className="text-slate-400 font-mono">MigrateMailbox</code>, <code className="text-slate-400 font-mono">MigrateOneDrive</code>
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Data Table & Validation Summary */}
      {rows.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Table Header & Metrics */}
          <div className="p-4 border-b border-slate-800 bg-slate-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="text-xs font-semibold text-slate-300">
                Mapped User Payloads ({rows.length})
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                <span>{validRows.length} Valid</span>
              </span>
              {invalidRows.length > 0 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800">
                  <AlertCircle className="h-3 w-3" />
                  <span>{invalidRows.length} Formatted with Errors</span>
                </span>
              )}
            </div>

            <button
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Table</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Source UPN (Origin)</th>
                  <th className="py-3 px-4">Target UPN (Destination)</th>
                  <th className="py-3 px-4 text-center">Exchange Mailbox</th>
                  <th className="py-3 px-4 text-center">OneDrive Files</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      !row.isValid ? 'bg-rose-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.isValid ? (
                        <span className="inline-flex items-center text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-400" title={row.errors.join(', ')}>
                          <AlertCircle className="h-4 w-4" />
                        </span>
                      )}
                    </td>

                    {/* Source UPN with validation error highlighting */}
                    <td className="py-3 px-4 font-mono">
                      <span className={!row.isValid && !EMAIL_REGEX.test(row.sourceUPN) ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                        {row.sourceUPN || <span className="text-rose-500 italic">Missing field</span>}
                      </span>
                      {!row.isValid && !EMAIL_REGEX.test(row.sourceUPN) && (
                        <p className="text-[10px] text-rose-400 mt-0.5">Invalid email syntax</p>
                      )}
                    </td>

                    {/* Target UPN */}
                    <td className="py-3 px-4 font-mono">
                      <span className={!row.isValid && !EMAIL_REGEX.test(row.targetUPN) ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                        {row.targetUPN || <span className="text-rose-500 italic">Missing field</span>}
                      </span>
                      {!row.isValid && !EMAIL_REGEX.test(row.targetUPN) && (
                        <p className="text-[10px] text-rose-400 mt-0.5">Invalid email syntax</p>
                      )}
                    </td>

                    {/* Mailbox toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleOption(row.id, 'migrateMailbox')}
                        className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-colors cursor-pointer ${
                          row.migrateMailbox
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {row.migrateMailbox ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* OneDrive toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleOption(row.id, 'migrateOneDrive')}
                        className={`inline-flex items-center justify-center h-6 w-6 rounded border transition-colors cursor-pointer ${
                          row.migrateOneDrive
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {row.migrateOneDrive ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                    </td>

                    {/* Row delete */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prominent Action Button Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-semibold text-slate-200">
              Pipeline Readiness Status:
            </span>
            {bothTenantsConnected ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Both Tenants Connected
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Both Source & Target must be connected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {validRows.length === 0
              ? 'Upload or load a CSV with at least one valid row to activate the pipeline.'
              : `${validRows.length} valid user mappings ready for SQLite persistence & background processing.`}
          </p>
        </div>

        <button
          id="btn-initialize-pipeline"
          disabled={!canInitialize}
          onClick={() => onInitializeJob(validRows)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all ${
            canInitialize
              ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-500/25 active:scale-98'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
          }`}
        >
          <span>{isInitializing ? 'Creating Pipeline Job...' : 'Initialize Tenant Migration Pipeline'}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
