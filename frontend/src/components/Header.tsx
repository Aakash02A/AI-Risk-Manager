import React from 'react';
import { Sliders, Plus, Search, ChevronRight, Zap } from 'lucide-react';
import { ModuleType } from './Sidebar';

interface HeaderProps {
  activeModule: ModuleType;
  onOpenNewCase: () => void;
  onOpenSettings: () => void;
  onOpenRazorpayWebhook?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  onOpenNewCase,
  onOpenSettings,
  onOpenRazorpayWebhook,
  searchQuery,
  setSearchQuery,
}) => {
  const moduleTitles: Record<ModuleType, { title: string; subtitle: string }> = {
    operations: {
      title: 'Dispute Operations Workspace',
      subtitle: 'Razorpay payment disputes, probability routing, and AI evidence response engine',
    },
    risk: {
      title: 'Risk & Ratio Engine',
      subtitle: 'Visa VAMP loss ratio monitoring, dynamic effective threshold scaling & compliance',
    },
    model: {
      title: 'ML Model Performance & Evaluation',
      subtitle: 'Random Forest Classifier performance metrics, ROC-AUC, and threshold policy trade-offs',
    },
    audit: {
      title: 'Audit Trail & Event History',
      subtitle: 'Immutable system event trail, evidence logs, and operator decision actions',
    },
    settings: {
      title: 'Three-Zone Threshold Policy Settings',
      subtitle: 'Configure base weak and strong probability thresholds and financial trade-off parameters',
    },
  };

  const current = moduleTitles[activeModule] || moduleTitles.operations;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
      <div className="px-6 py-3.5 flex items-center justify-between">
        {/* Module Title and Breadcrumb */}
        <div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-0.5">
            <span className="font-semibold text-blue-900">Razorpay Dispute Shield</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="capitalize font-medium text-blue-700">{activeModule}</span>
          </div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
            {current.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1">{current.subtitle}</p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Search */}
          <div className="relative hidden md:block w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search disputes, Case ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Simulate Razorpay Webhook Button */}
          {onOpenRazorpayWebhook && (
            <button
              id="btn-simulate-razorpay-webhook"
              onClick={onOpenRazorpayWebhook}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-blue-200 rounded-lg text-xs font-bold text-blue-800 bg-blue-50/90 hover:bg-blue-100 transition-colors shadow-2xs"
              title="Simulate incoming Razorpay dispute webhook"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>Razorpay Webhook</span>
            </button>
          )}

          {/* Action Buttons */}
          <button
            id="btn-threshold-settings"
            onClick={onOpenSettings}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Thresholds</span>
          </button>

          <button
            id="btn-header-new-dispute"
            onClick={onOpenNewCase}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Case</span>
          </button>
        </div>
      </div>
    </header>
  );
};

