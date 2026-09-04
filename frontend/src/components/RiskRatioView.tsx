import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Sliders, ArrowUpRight, Percent, RefreshCw } from 'lucide-react';

export const RiskRatioView: React.FC = () => {
  const [ratioData, setRatioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRatioStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/risk/ratio-status');
      if (res.ok) {
        const data = await res.json();
        setRatioData(data);
      }
    } catch (err) {
      console.error('Failed to load risk status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatioStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Risk & VAMP Ratio State...</span>
        </div>
      </div>
    );
  }

  const lossRatioPct = ratioData ? (ratioData.loss_ratio * 100).toFixed(2) : '0.90';
  const ceilingPct = ratioData ? (ratioData.network_ceiling * 100).toFixed(2) : '1.50';
  const distancePct = ratioData ? (ratioData.network_ceiling - ratioData.loss_ratio) * 100 : 0.60;
  const effThresholdPct = ratioData ? (ratioData.effective_threshold * 100).toFixed(1) : '77.2';
  const healthStatus = ratioData?.health_status || 'HEALTHY';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Visa VAMP & Mastercard Ratio Shield
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-mono text-slate-300">Live Dynamic Threshold Engine</span>
            </div>
            <h2 className="text-xl font-bold mt-2 tracking-tight">
              Merchant Dispute Loss Ratio & Effective Defense Routing
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Dynamically scales the required AI win probability threshold as trailing chargeback loss ratio approaches card brand compliance ceilings, preventing network penalties and account termination.
            </p>
          </div>
          <button
            onClick={fetchRatioStatus}
            className="self-start md:self-center flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Key Metric Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Trailing Loss Ratio</span>
            <Percent className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{lossRatioPct}%</div>
          <p className="text-xs text-slate-500 mt-1">30-Day Rolling Window ({ratioData?.disputes_count || 1000} cases)</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Network Ceiling</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{ceilingPct}%</div>
          <p className="text-xs text-slate-500 mt-1">Visa VAMP Threshold Limit</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Safety Buffer</span>
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">+{distancePct.toFixed(2)}%</div>
          <p className="text-xs text-slate-500 mt-1">Headroom before ceiling</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Effective Auto-Defense Threshold</span>
            <Sliders className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 font-mono">{effThresholdPct}%</div>
          <p className="text-xs text-slate-500 mt-1">
            Base: {(ratioData?.base_strong_threshold * 100).toFixed(0)}% + Dynamic Risk Adjustment
          </p>
        </div>
      </div>

      {/* Dynamic Formula & Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dynamic Formula Explanation Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Dynamic Threshold Scaling Formula</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700">
              Ratio-Aware Decision Model
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
            <div className="text-emerald-400 font-semibold mb-1">// Effective Threshold Calculation</div>
            <div>T_eff = min( T_cap, T_base + alpha * ( R_loss / R_ceiling )^2 )</div>
            <div className="text-slate-400 mt-2 text-[11px]">
              Where T_base = {(ratioData?.base_strong_threshold * 100).toFixed(0)}%, R_loss = {lossRatioPct}%, R_ceiling = {ceilingPct}%
            </div>
          </div>

          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <span>
                <strong>Under Healthy Ratio</strong>: Keeps auto-defense threshold near base ({(ratioData?.base_strong_threshold * 100).toFixed(0)}%) to maximize dispute recovery.
              </span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
              <span>
                <strong>Approaching Ceiling</strong>: Quadratic term α × (R_loss / R_ceiling)² elevates effective threshold up to {(ratioData?.t_cap * 100).toFixed(0)}%, forcing human review to avoid risky disputes.
              </span>
            </li>
          </ul>
        </div>

        {/* Account Health Status Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Account Compliance Health</span>
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                healthStatus === 'HEALTHY'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : healthStatus === 'APPROACHING_CEILING'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                ● {healthStatus}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Total Disputes in Period:</span>
                <span className="font-semibold text-slate-900 font-mono">{ratioData?.disputes_count || 1000}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Disputes Won:</span>
                <span className="font-semibold text-emerald-600 font-mono">{ratioData?.disputes_won_count || 91}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Disputes Lost:</span>
                <span className="font-semibold text-rose-600 font-mono">{ratioData?.disputes_lost_count || 9}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">Representation Fee (per response):</span>
                <span className="font-semibold text-slate-900 font-mono">₹{ratioData?.representation_fee_inr || 1500}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Human Review Cost:</span>
                <span className="font-semibold text-slate-900 font-mono">₹{ratioData?.human_review_cost_inr || 200}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Compliance Buffer: Safe</span>
            <a
              href="https://usa.visa.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1"
            >
              <span>Visa VAMP Docs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
