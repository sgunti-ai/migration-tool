import React from 'react';
import { ExternalLink, CheckCircle2, ChevronRight } from 'lucide-react';

export const MigrationProjectDashboard: React.FC = () => {
  return (
    <div className="w-full bg-slate-50 min-h-[800px] text-slate-800 font-sans border border-slate-200 rounded-md overflow-hidden">
      {/* Top Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center text-lg">
          <span className="text-teal-700 cursor-pointer hover:underline">Migration</span>
          <ChevronRight className="h-5 w-5 mx-1 text-slate-400" />
          <span className="text-slate-600 font-medium">MigrationProject1</span>
        </div>
        <button className="flex items-center space-x-2 border border-teal-700 text-teal-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-50 transition-colors">
          <span>Submit Idea</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-slate-200">
        <div className="flex space-x-6 text-sm font-bold text-slate-500 uppercase tracking-wide">
          <div className="py-3 border-b-2 border-teal-700 text-teal-700">
            Dashboard
          </div>
          <div className="py-3 border-b-2 border-transparent hover:text-slate-700 cursor-pointer">
            Reports
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 space-y-8 bg-slate-100 min-h-screen">
        
        {/* Section 1: Accounts Migration */}
        <section>
          <h2 className="text-xl text-slate-700 font-semibold mb-4">Accounts Migration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Welcome Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded flex flex-col">
              <div className="p-4 flex-1">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Welcome</h3>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
                  <div className="h-3 w-full bg-transparent"></div>
                  <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Accounts Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded flex flex-col">
              <div className="p-4 flex-1">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Accounts</h3>
                <div className="flex space-x-12 mb-6">
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Users</div>
                    <div className="text-lg font-semibold text-slate-800">14</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Groups</div>
                    <div className="text-lg font-semibold text-slate-800">12</div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Discovered</span>
                    <span className="font-semibold text-slate-800">26</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-600">Matched</span>
                    <span className="font-semibold text-slate-800">5</span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-600">Needs your attention</span>
                    <span className="font-semibold text-slate-800">0</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <a href="#" className="text-teal-700 hover:underline text-sm font-medium">Open</a>
              </div>
            </div>

            {/* Events Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded flex flex-col">
              <div className="p-4 flex-1">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Events</h3>
                <div className="space-y-3">
                  <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                  <div className="h-3 w-full bg-transparent"></div>
                  <div className="h-3 w-2/3 bg-slate-200 rounded"></div>
                  <div className="h-3 w-5/6 bg-slate-200 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded flex flex-col">
              <div className="p-4 flex-1">
                <h3 className="text-lg font-medium text-slate-700 mb-4">Tasks</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Account Migration Task</span>
                  </div>
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Account Migration Task</span>
                  </div>
                  <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Account Migration Task</span>
                  </div>
                  <div className="flex items-center space-x-2 pb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-slate-600 truncate">Account Discovery Task</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-100">
                <a href="#" className="text-teal-700 hover:underline text-sm font-medium">Show All</a>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Content Migration */}
        <section>
          <h2 className="text-xl text-slate-700 font-semibold mb-4 mt-8">Content Migration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Mail Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded h-32 flex flex-col p-4">
              <h3 className="text-lg font-medium text-slate-700">Mail</h3>
            </div>

            {/* SharePoint Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded h-32 flex flex-col p-4">
              <h3 className="text-lg font-medium text-slate-700">SharePoint</h3>
            </div>

            {/* OneDrive Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded h-32 flex flex-col p-4">
              <h3 className="text-lg font-medium text-slate-700">OneDrive</h3>
            </div>

            {/* Public Folders Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded h-32 flex flex-col p-4">
              <h3 className="text-lg font-medium text-slate-700">Public Folders</h3>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};
