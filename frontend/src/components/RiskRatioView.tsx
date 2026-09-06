import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowUpRight,
  Percent,
  RefreshCw,
  TrendingUp,
  Scale,
  DollarSign,
  Info,
  ShieldCheck,
  AlertOctagon,
  Zap,
  HelpCircle,
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

export const RiskRatioView: React.FC = () => {
  const [ratioData, setRatioData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Interactive Sandbox Simulator State
  const [simulatedLossRatio, setSimulatedLossRatio] = useState<number>(0.009);

  const fetchRatioStatus = async () => {
    setIsPolling(true);
    try {
      const res = await fetch('/api/risk/ratio-status');
      if (res.ok) {
        const data = await res.json();
        setRatioData(data);
        if (data.synced_timestamp_millis) {
          setLastSyncedTime(new Date(data.synced_timestamp_millis));
        } else {
          setLastSyncedTime(new Date());
        }
        if (typeof data.loss_ratio === 'number') {
          setSimulatedLossRatio(data.loss_ratio);
        }
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 3000);
      }
    } catch (err) {
      console.error('Failed to load risk status:', err);
    } finally {
      setLoading(false);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    fetchRatioStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Connecting to Risk & Ratio Decision Engine...
        </span>
      </div>
    );
  }

  // Real backend metrics
  const liveLossRatio = ratioData?.loss_ratio ?? 0.009;
  const ceiling = ratioData?.network_ceiling ?? 0.015;
  const tBase = ratioData?.base_strong_threshold ?? 0.70;
  const tWeak = ratioData?.base_weak_threshold ?? 0.40;
  const tCap = ratioData?.t_cap ?? 0.95;
  const alpha = ratioData?.alpha ?? 0.20;

  const liveLossRatioPct = (liveLossRatio * 100).toFixed(2);
  const ceilingPct = (ceiling * 100).toFixed(2);
  const liveDistancePct = ((ceiling - liveLossRatio) * 100).toFixed(2);
  const liveEffThreshold = ratioData?.effective_threshold ?? 0.772;
  const liveEffThresholdPct = (liveEffThreshold * 100).toFixed(1);
  const healthStatus = ratioData?.health_status || 'HEALTHY';

  // Dynamic Simulator Calculation
  const simRatioTerm = simulatedLossRatio / ceiling;
  const simDynamicAdjustment = alpha * (simRatioTerm * simRatioTerm);
  const simRawEffective = tBase + simDynamicAdjustment;
  const simEffectiveThreshold = Math.min(tCap, Math.max(tBase, simRawEffective));
  const simEffPct = (simEffectiveThreshold * 100).toFixed(1);
  const simDistancePct = ((ceiling - simulatedLossRatio) * 100).toFixed(2);

  const simHealthStatus =
    simulatedLossRatio >= ceiling
      ? 'OVER_CEILING'
      : simulatedLossRatio >= 0.8 * ceiling
      ? 'APPROACHING_CEILING'
      : 'HEALTHY';

  // Visual Gauge Calculation (0% to 2.0% scale)
  const maxGaugeScale = 0.02; // 2.0%
  const gaugePercent = Math.min(100, Math.max(0, (liveLossRatio / maxGaugeScale) * 100));
  const ceilingMarkerPercent = (ceiling / maxGaugeScale) * 100; // 75% mark on the 2.0% scale

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Hero Header Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-20 w-60 h-60 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Card Brand Compliance Shield</span>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Visa VAMP & Mastercard ECP Rulebook</span>
              <span className="text-slate-500">•</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                healthStatus === 'HEALTHY'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  : healthStatus === 'APPROACHING_CEILING'
                  ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                  : 'bg-rose-950 text-rose-300 border border-rose-700/60'
              }`}>
                ● Status: {healthStatus.replace('_', ' ')}
              </span>
              <span className="text-slate-500">•</span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-200 border border-slate-700">
                <span>Live DB Portfolio: <strong>{ratioData?.active_cases_count ?? 10} Cases</strong></span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400">Defended: <strong>{formatINR(ratioData?.money_defended_inr ?? 455000)}</strong></span>
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Merchant Dispute Loss Ratio & Dynamic Defense Router
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Card networks enforce a strict <strong>1.50% chargeback loss ratio ceiling</strong>. If your dispute losses cross this threshold, your merchant account incurs fines of ₹500,000+ or payment revocation. This engine dynamically tightens AI auto-defense thresholds when risk rises, forcing manual triage on borderline cases to protect your processing credentials.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
            <button
              onClick={fetchRatioStatus}
              disabled={isPolling}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isPolling ? 'animate-spin' : ''}`} />
              <span>{isPolling ? 'Polling Engine...' : 'Poll Live Ratio Engine'}</span>
            </button>
            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${isPolling ? 'animate-ping' : ''}`}></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">
                Last synced: <span className="text-white font-bold">{lastSyncedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
              </span>
              {justSynced && (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/50 px-1.5 py-0.5 rounded animate-pulse">
                  Synced!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Network Compliance Gauge Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Live Card Network Penalty Spectrum (0.00% to 2.00%)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Your current trailing position relative to Card Scheme Acquirer Monitoring Program limits.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="text-slate-500">Current Loss Ratio:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm">
              {liveLossRatioPct}%
            </span>
          </div>
        </div>

        {/* Visual Progress Meter */}
        <div className="space-y-2 pt-2">
          <div className="relative h-6 rounded-full bg-slate-100 overflow-hidden flex shadow-inner border border-slate-200">
            {/* Safe Zone (0 - 1.0%) */}
            <div className="h-full bg-emerald-500/80 w-[50%] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              SAFE ZONE (&lt;1.00%)
            </div>
            {/* Warning Zone (1.0% - 1.50%) */}
            <div className="h-full bg-amber-500/80 w-[25%] flex items-center justify-center text-[10px] font-bold text-slate-900 tracking-wider">
              WARNING (1.00% - 1.50%)
            </div>
            {/* Breach Zone (1.50%+) */}
            <div className="h-full bg-rose-600/90 w-[25%] flex items-center justify-center text-[10px] font-bold text-white tracking-wider">
              VAMP BREACH (≥1.50%)
            </div>

            {/* Live Indicator Pin */}
            <div
              className="absolute top-0 bottom-0 w-1.5 bg-slate-950 shadow-lg transition-all duration-500 z-10"
              style={{ left: `${gaugePercent}%` }}
              title={`Current Ratio: ${liveLossRatioPct}%`}
            >
              <div className="absolute -top-7 -translate-x-1/2 bg-slate-950 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                You are here: {liveLossRatioPct}%
              </div>
            </div>
          </div>

          {/* Scale Labels */}
          <div className="flex justify-between text-[10px] font-mono text-slate-600 px-1 pt-1">
            <span>0.00%</span>
            <span>0.50%</span>
            <span>1.00% (Watchlist)</span>
            <span className="font-bold text-rose-800">1.50% (Visa Ceiling)</span>
            <span>2.00%</span>
          </div>
        </div>
      </div>

      {/* 3. Primary Real-Time Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Trailing Loss Ratio</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">{liveLossRatioPct}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {ratioData?.disputes_lost_count || 9} lost of {ratioData?.disputes_count || 1000} disputes (30-day window)
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Card Scheme Ceiling</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono tracking-tight">{ceilingPct}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Visa VAMP & Mastercard ECP enforcement threshold
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Compliance Headroom</span>
            <span className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tracking-tight">+{liveDistancePct}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Safety margin before entering the acquirer watch zone
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Effective Auto Threshold</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Sliders className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono tracking-tight">{liveEffThresholdPct}%</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Base ({formatPercent(tBase)}) + {((liveEffThreshold - tBase) * 100).toFixed(1)}% dynamic risk penalty
          </p>
        </div>
      </div>

      {/* 4. INTERACTIVE RATIO SANDBOX & WHAT-IF SIMULATOR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 mb-1">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Interactive Policy Sandbox</span>
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                What-If Scenario Simulator: Test How the Decision Engine Reacts
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Drag the slider to test how the engine dynamically tightens the auto-defense bar if chargebacks spike.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Presets:</span>
              <button
                type="button"
                onClick={() => setSimulatedLossRatio(0.0045)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs"
              >
                🟢 Normal (0.45%)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLossRatio(0.0115)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-xs"
              >
                🟡 Holiday Surge (1.15%)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedLossRatio(0.0165)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 shadow-xs"
              >
                🔴 Fraud Wave (1.65%)
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Slider Control */}
          <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-1.5">
                <span>Simulated Merchant Loss Ratio</span>
                <span className="text-slate-400 font-normal">({(simulatedLossRatio * 100).toFixed(2)}%)</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-extrabold text-slate-900 bg-white px-3 py-1 rounded-md border border-slate-300 shadow-2xs">
                  {(simulatedLossRatio * 100).toFixed(2)}%
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  simHealthStatus === 'HEALTHY'
                    ? 'bg-emerald-100 text-emerald-800'
                    : simHealthStatus === 'APPROACHING_CEILING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {simHealthStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0.002"
              max="0.022"
              step="0.0005"
              value={simulatedLossRatio}
              onChange={(e) => setSimulatedLossRatio(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.20% (Ultra Safe)</span>
              <span>1.00% (Watchlist)</span>
              <span className="text-rose-600 font-bold">1.50% (Visa Ceiling)</span>
              <span>2.20% (Severe Fines)</span>
            </div>
          </div>

          {/* Dynamic Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box A: Effective Threshold Outcome */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                  Required Win Probability
                </span>
                <div className="text-3xl font-black text-indigo-950 font-mono mt-1">{simEffPct}%</div>
                <p className="text-xs text-indigo-700 mt-1 leading-snug">
                  Cases with win probability &lt; {simEffPct}% are locked from automated filing to prevent fee losses.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-100 text-[11px] font-mono text-indigo-800">
                Formula Adjustment: +{((simEffectiveThreshold - tBase) * 100).toFixed(1)}%
              </div>
            </div>

            {/* Box B: Buffer to Network Ceiling */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              parseFloat(simDistancePct) > 0
                ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                : 'border-rose-200 bg-rose-50/40 text-rose-950'
            }`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block mb-1">
                  Headroom to 1.50% Ceiling
                </span>
                <div className="text-3xl font-black font-mono mt-1">
                  {parseFloat(simDistancePct) > 0 ? `+${simDistancePct}%` : `${simDistancePct}%`}
                </div>
                <p className="text-xs mt-1 leading-snug">
                  {parseFloat(simDistancePct) > 0
                    ? 'Safe headroom remaining before card network monitoring fines trigger.'
                    : 'CEILING BREACHED: Risk of monthly card acquirer penalties ($5,000+) and termination.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] font-mono">
                {parseFloat(simDistancePct) > 0 ? 'Status: Protected' : 'Action: Concede non-essential disputes'}
              </div>
            </div>

            {/* Box C: Step-by-Step Mathematical Calculation */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-900 text-white font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Live Math Trace</span>
                  <span className="text-[10px]">T_base = {formatPercent(tBase)}</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-300">
                  <div>Ratio Term = {(simRatioTerm).toFixed(3)}</div>
                  <div>Penalty = {alpha} × ({(simRatioTerm).toFixed(3)})² = {(simDynamicAdjustment * 100).toFixed(2)}%</div>
                  <div className="pt-1 text-emerald-400 font-bold border-t border-slate-800">
                    T_eff = min({formatPercent(tCap)}, {formatPercent(tBase)} + {(simDynamicAdjustment * 100).toFixed(2)}%) = {simEffPct}%
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-sans leading-tight">
                As the loss ratio rises toward 1.50%, the quadratic penalty accelerates automatically.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Three-Zone Decision Spectrum Visualizer */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Three-Zone Actionable Decision Spectrum (0% to 100% Win Probability)</span>
          </h3>
          <p className="text-xs text-slate-500">
            How incoming dispute cases are triaged based on the calibrated ML win probability ($p$).
          </p>
        </div>

        {/* Visual 3-Zone Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Weak Zone */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-900">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>WEAK ZONE</span>
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">0% to {formatPercent(tWeak)}</span>
            </div>
            <p className="text-xs text-rose-800 font-medium">Directive: Recommend Immediate Refund</p>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Disputes where documentation is missing (e.g. unconfirmed carrier delivery). Conceding upfront avoids the ₹1,500 scheme fee and protects the loss ratio.
            </p>
          </div>

          {/* Borderline Zone */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>BORDERLINE ZONE</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">
                {formatPercent(tWeak)} to {liveEffThresholdPct}%
              </span>
            </div>
            <p className="text-xs text-amber-800 font-medium">Directive: Hold for Human Review</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Auto-response is locked. A human risk officer evaluates edge-case evidence (customer communications, partial delivery) before committing funds.
            </p>
          </div>

          {/* Strong Zone */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>STRONG ZONE</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                ≥ {liveEffThresholdPct}%
              </span>
            </div>
            <p className="text-xs text-emerald-800 font-medium">Directive: Automated Evidence Defense</p>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              High-confidence cases with 3DS authorization, signed delivery, and zero prior history. Generates full formal 8-part rebuttal package.
            </p>
          </div>
        </div>
      </div>

      {/* 6. Card Network Rulebook Comparison & Financial Shield */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Network Rulebook Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Card Brand Monitoring Programs</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-700">
              Industry Benchmarks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2 px-3">Card Network</th>
                  <th className="py-2 px-3">Program Name</th>
                  <th className="py-2 px-3">Loss Ceiling</th>
                  <th className="py-2 px-3">Penalty Imposed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Visa</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">VAMP Standard</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-700">1.50%</td>
                  <td className="py-2.5 px-3 text-slate-600">₹500,000+ / mo fines</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Mastercard</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">ECP Tier 1</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-700">1.50%</td>
                  <td className="py-2.5 px-3 text-slate-600">Acquirer compliance audit</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">American Express</td>
                  <td className="py-2.5 px-3 text-slate-600 font-mono">HRMP Program</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-700">1.00%</td>
                  <td className="py-2.5 px-3 text-slate-600">Mandatory rolling reserve</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Guardrails Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Operational Cost & Fee Avoidance Guardrails</span>
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                Cost Guard
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900 block">Representation Fee Penalty</span>
                  <span className="text-[11px] text-slate-500">Incurred when contesting a lost dispute</span>
                </div>
                <span className="font-bold text-rose-700 font-mono text-sm">
                  ₹{ratioData?.representation_fee_inr || 1500} / dispute
                </span>
              </div>

              <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-semibold text-slate-900 block">Human Review Triage Cost</span>
                  <span className="text-[11px] text-slate-500">Operator review cost on borderline cases</span>
                </div>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  ₹{ratioData?.human_review_cost_inr || 200} / review
                </span>
              </div>

              <div className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div>
                  <span className="font-semibold text-emerald-950 block">Net Revenue Defended</span>
                  <span className="text-[11px] text-emerald-700">
                    Protected across {ratioData?.strong_cases_count ?? 5} auto-defended cases ({ratioData?.active_cases_count ?? 10} total in DB)
                  </span>
                </div>
                <span className="font-extrabold text-emerald-800 font-mono text-sm">
                  {formatINR(ratioData?.money_defended_inr ?? 455000)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Powered by dynamic mathematical risk optimization</span>
            <a
              href="https://usa.visa.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center space-x-1"
            >
              <span>Card Scheme Rules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskRatioView;
