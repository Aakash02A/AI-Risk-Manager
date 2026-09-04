import React from 'react';
import { ShieldCheck, Cpu, Sliders, RotateCcw, Plus, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'operations' | 'model';
  setActiveTab: (tab: 'operations' | 'model') => void;
  onResetDemo: () => void;
  onOpenNewCase: () => void;
  onOpenSettings: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetDemo,
  onOpenNewCase,
  onOpenSettings,
  isResetting,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  Chargeback Evidence Responder
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  ML Model Online
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Machine learning probability routing & evidence-grounded dispute defense
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="tab-operations"
              onClick={() => setActiveTab('operations')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'operations'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dispute Operations</span>
            </button>
            <button
              id="tab-model"
              onClick={() => setActiveTab('model')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'model'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Model Evaluation</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-reset-demo"
              onClick={onResetDemo}
              disabled={isResetting}
              title="Restore standard canonical cases (Case A, Case B, Case C)"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Canonical Demo</span>
            </button>

            <button
              id="btn-threshold-settings"
              onClick={onOpenSettings}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Thresholds</span>
            </button>

            <button
              id="btn-new-dispute"
              onClick={onOpenNewCase}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Dispute</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
