import React, { useState } from 'react';
import { Sparkles, Loader2, X, ChevronRight, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { MigrationJob, UserMigrationStatus } from '../../types';
import Markdown from 'react-markdown';

interface MigrationAdvisorWidgetProps {
  activeJob: MigrationJob | null;
  onClose: () => void;
}

export const MigrationAdvisorWidget: React.FC<MigrationAdvisorWidgetProps> = ({ activeJob, onClose }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAdvice = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const errorLogs = activeJob?.userStatuses?.filter(s => s.status === 'FAILED') || [];
      const jobContext = {
        status: activeJob?.status,
        totalUsers: (activeJob as any)?._count?.userStatuses || activeJob?.totalUsers || activeJob?.userStatuses?.length || 0,
        failedCount: errorLogs.length,
        duration: activeJob?.createdAt ? new Date().getTime() - new Date(activeJob.createdAt).getTime() : 0,
      };

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobContext, errorLogs: errorLogs.slice(0, 10) }), // Send up to 10 recent errors
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch advice');
      }

      const data = await res.json();
      setAdvice(data.suggestion);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 transform transition-transform animate-slideLeft">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-900/10">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Migration Advisor</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {!advice && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Need optimization or troubleshooting?</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 max-w-[250px]">
                The AI Advisor can analyze your current active job, throughput, and error logs to provide actionable next steps.
              </p>
            </div>
            <button 
              onClick={handleGenerateAdvice}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Insights</span>
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Analyzing migration context & logs...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex flex-col items-center text-center">
            <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
            <button 
              onClick={handleGenerateAdvice}
              className="mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {advice && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-sm text-slate-800 dark:text-slate-300 space-y-2 leading-relaxed [&>h1]:text-lg [&>h1]:font-bold [&>h2]:text-base [&>h2]:font-bold [&>h3]:text-sm [&>h3]:font-bold [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>li]:mb-1 [&>p]:mb-2 [&>pre]:bg-slate-100 [&>pre]:dark:bg-slate-800 [&>pre]:p-2 [&>pre]:rounded [&>code]:bg-slate-100 [&>code]:dark:bg-slate-800 [&>code]:px-1 [&>code]:rounded">
              <Markdown>{advice}</Markdown>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={handleGenerateAdvice}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Insights</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
