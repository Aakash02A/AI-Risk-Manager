import React from 'react';
import { SystemStats } from '../types';
import { formatINR } from '../utils/formatters';
import { ShieldCheck, AlertCircle, RefreshCw, FileQuestion } from 'lucide-react';

interface StatsOverviewProps {
  stats: SystemStats | null;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Cases */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Disputes</p>
        <p className="text-xl font-bold text-slate-900 mt-1">{stats.total_cases}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{formatINR(stats.total_disputed_inr)} at stake</p>
      </div>

      {/* Money Defended */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Money Defended</p>
        <p className="text-xl font-bold text-emerald-700 mt-1">{formatINR(stats.money_defended_inr)}</p>
        <p className="text-xs text-emerald-600 mt-0.5 font-medium">Strong confidence cases</p>
      </div>

      {/* Strong Cases */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Strong (Defend)</p>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
        <p className="text-xl font-bold text-slate-900 mt-1">{stats.strong_count}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center">
          <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" />
          Prob &ge; 70%
        </p>
      </div>

      {/* Borderline Cases */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Borderline (Review)</p>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        </div>
        <p className="text-xl font-bold text-slate-900 mt-1">{stats.borderline_count}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center">
          <AlertCircle className="w-3 h-3 text-amber-500 mr-1" />
          40% &le; Prob &lt; 70%
        </p>
      </div>

      {/* Weak Cases */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weak (Refund)</p>
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        </div>
        <p className="text-xl font-bold text-slate-900 mt-1">{stats.weak_count}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center">
          <RefreshCw className="w-3 h-3 text-rose-500 mr-1" />
          Prob &lt; 40%
        </p>
      </div>

      {/* Unclassified Cases */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unanalyzed</p>
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        </div>
        <p className="text-xl font-bold text-slate-900 mt-1">{stats.unclassified_count}</p>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center">
          <FileQuestion className="w-3 h-3 text-slate-400 mr-1" />
          Awaiting ML
        </p>
      </div>
    </div>
  );
};
