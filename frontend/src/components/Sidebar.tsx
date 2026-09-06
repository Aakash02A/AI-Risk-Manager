import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Cpu,
  FileText,
  Sliders,
  Plus,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export type ModuleType = 'operations' | 'risk' | 'model' | 'audit' | 'settings';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  onOpenNewCase: () => void;
  weakThreshold: number;
  strongThreshold: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  onOpenNewCase,
  weakThreshold,
  strongThreshold,
}) => {
  const navItems: { id: ModuleType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    {
      id: 'operations',
      label: 'Dispute Operations',
      icon: LayoutDashboard,
    },
    {
      id: 'risk',
      label: 'Risk & Ratio Engine',
      icon: ShieldAlert,
      badge: 'VAMP',
    },
    {
      id: 'model',
      label: 'ML Model Evaluation',
      icon: Cpu,
    },
    {
      id: 'audit',
      label: 'Audit & Activity Logs',
      icon: FileText,
    },
    {
      id: 'settings',
      label: 'Threshold Policy',
      icon: Sliders,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-950/40">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                Razorpay Shield
              </h1>
              <span className="text-[9px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 py-0.2 rounded">RZP</span>
            </div>
            <p className="text-[11px] text-slate-400">AI Dispute Assistant</p>
          </div>
        </div>

        {/* Ecosystem & Model Status Pill */}
        <div className="mt-3 flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-400">Razorpay Live Sync</span>
          </div>
          <span className="text-[10px] text-sky-400 font-mono font-bold">v1.0</span>
        </div>
      </div>


      {/* Primary Action Button */}
      <div className="p-3">
        <button
          id="sidebar-btn-new-case"
          onClick={onOpenNewCase}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold py-2 px-3 rounded-lg text-xs shadow-md shadow-emerald-950/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Dispute Case</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border border-slate-700/60'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center space-x-1">
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Policy Summary Card at Bottom of Sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="bg-slate-800/60 rounded-lg p-2.5 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              3-Zone Policy
            </span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Weak / Strong</span>
            <span className="text-emerald-400 font-semibold">
              {weakThreshold.toFixed(2)} / {strongThreshold.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
