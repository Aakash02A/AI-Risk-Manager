import React, { useState, useEffect } from 'react';
import { ModelMetricsData, ThresholdCandidate } from '../types';
import { formatINR, formatPercent, formatRealtimeTimestamp, formatTimeOnly } from '../utils/formatters';
import { Cpu, CheckCircle2, AlertTriangle, TrendingUp, DollarSign, BarChart2, ShieldAlert } from 'lucide-react';

export const ModelEvaluationView: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsData | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, thresholdsRes] = await Promise.all([
          fetch('/api/model/metrics'),
          fetch('/api/model/thresholds'),
        ]);

        if (metricsRes.ok) {
          const data = await metricsRes.json();
          setMetrics(data);
        }
        if (thresholdsRes.ok) {
          const data = await thresholdsRes.json();
          setThresholds(data);
        }
      } catch (err) {
        console.error('Failed to load model metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <Cpu className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" />
        <p className="text-xs font-medium">Loading held-out test evaluation benchmarks...</p>
      </div>
    );
  }

  if (!metrics) return null;

  const cm = metrics.confusion_matrix;
  const df = metrics.defense_metrics;
  const rb = metrics.routing_breakdown;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Model Specifications */}
      <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-slate-900 text-white">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {metrics.model_name} (v{metrics.model_version}) — Held-Out Test Evaluation
              </h2>
              <p className="text-xs text-slate-500">
                Trained on 10,000 synthetic chargeback dispute records with 80% train / 20% test stratified partition
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <div className="text-right">
            <p className="text-slate-400 font-medium">Dataset Total</p>
            <p className="font-semibold text-slate-900 font-mono">10,000 Cases</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-slate-400 font-medium">Held-Out Test Set</p>
            <p className="font-semibold text-slate-900 font-mono">{metrics.test_cases_count.toLocaleString()} Cases (20%)</p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <p className="text-slate-400 font-medium">Evaluation Status</p>
            <p className="font-semibold text-emerald-700">Production Calibrated</p>
            <p className="text-[10px] font-mono text-slate-500">
              {formatTimeOnly((metrics as any).evaluated_at || new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Core Statistical Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Test Accuracy</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{formatPercent(metrics.accuracy)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Overall classification rate</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Precision (p &ge; 0.5)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{formatPercent(metrics.precision_binary_50)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Binary baseline precision</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recall (p &ge; 0.5)</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{formatPercent(metrics.recall_binary_50)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Winnable cases captured</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ROC-AUC</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">{metrics.roc_auc.toFixed(4)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Discrimination capacity</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Defense Precision</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{formatPercent(df.defense_precision)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Strong zone win rate (p &ge; 0.70)</p>
        </div>
      </div>

      {/* Confusion Matrix & Routing Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-slate-700" />
            <span>Held-Out Confusion Matrix (2,000 Test Cases)</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Evaluated at binary threshold p &ge; 0.50. Demonstrates strong separation between winnable and non-winnable cases.
          </p>

          <div className="grid grid-cols-2 gap-3 font-mono text-center">
            {/* True Negative */}
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <span className="text-xs text-slate-500 block">True Negative (TN)</span>
              <span className="text-2xl font-bold text-slate-900 block mt-1">{cm.true_negative}</span>
              <span className="text-[10px] text-slate-400">Correctly identified unwinnable</span>
            </div>

            {/* False Positive */}
            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50">
              <span className="text-xs text-rose-700 block font-semibold">False Positive (FP)</span>
              <span className="text-2xl font-bold text-rose-800 block mt-1">{cm.false_positive}</span>
              <span className="text-[10px] text-rose-600">Lost cases incorrectly defended</span>
            </div>

            {/* False Negative */}
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="text-xs text-amber-700 block font-semibold">False Negative (FN)</span>
              <span className="text-2xl font-bold text-amber-800 block mt-1">{cm.false_negative}</span>
              <span className="text-[10px] text-amber-600">Winnable cases missed</span>
            </div>

            {/* True Positive */}
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <span className="text-xs text-emerald-800 block font-semibold">True Positive (TP)</span>
              <span className="text-2xl font-bold text-emerald-900 block mt-1">{cm.true_positive}</span>
              <span className="text-[10px] text-emerald-700">Correctly defended & won</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Key Insight:</strong> High-risk false positives ({cm.false_positive} cases at 0.50 threshold) are compressed by the three-zone routing policy, which raises the defense threshold to <strong>0.70</strong>, driving defense precision to <strong>{formatPercent(df.defense_precision)}</strong>.
          </div>
        </div>

        {/* Operational Economics */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Defense Performance & Financial Impact</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Simulated recovery economics across the 2,000 held-out test disputes
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
              <div>
                <span className="text-xs font-semibold text-emerald-900 block">Money Successfully Defended</span>
                <span className="text-[11px] text-emerald-700">{df.correctly_defended_count} cases won at p &ge; 0.70</span>
              </div>
              <span className="text-base font-bold text-emerald-800 font-mono">{formatINR(df.money_defended_inr)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-rose-200 bg-rose-50/40">
              <div>
                <span className="text-xs font-semibold text-rose-900 block">False-Positive Defense Cost</span>
                <span className="text-[11px] text-rose-700">{df.false_positive_count} contested disputes that were lost</span>
              </div>
              <span className="text-base font-bold text-rose-800 font-mono">{formatINR(df.false_positive_cost_inr)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/40">
              <div>
                <span className="text-xs font-semibold text-amber-900 block">Borderline Volume (Human Review)</span>
                <span className="text-[11px] text-amber-700">{rb.borderline_count} cases pending manual adjudication</span>
              </div>
              <span className="text-base font-bold text-amber-800 font-mono">{formatINR(df.borderline_amount_inr)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Net Financial Recovery</span>
                <span className="text-[11px] text-slate-500">Money Defended minus False Positive Cost</span>
              </div>
              <span className="text-base font-extrabold text-slate-900 font-mono">
                {formatINR(df.money_defended_inr - df.false_positive_cost_inr)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Comparison Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Decision Threshold Trade-Off Analysis</h3>
          <p className="text-xs text-slate-500">
            Comparative performance across 5 representative threshold configurations evaluated on the 2,000 held-out test cases.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Thresholds (Weak / Strong)</th>
                <th className="py-2.5 px-4">Cases Defended</th>
                <th className="py-2.5 px-4">Human Review</th>
                <th className="py-2.5 px-4">Defense Precision</th>
                <th className="py-2.5 px-4">Money Won (₹)</th>
                <th className="py-2.5 px-4">FP Cost (₹)</th>
                <th className="py-2.5 px-4">Net Recovered (₹)</th>
                <th className="py-2.5 px-4">Policy Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {thresholds.map((t, idx) => {
                const isRecommended = t.weak_threshold === 0.40 && t.strong_threshold === 0.70;
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50 transition-colors ${
                      isRecommended ? 'bg-emerald-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4">
                      {t.weak_threshold.toFixed(2)} / {t.strong_threshold.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4">{t.cases_defended}</td>
                    <td className="py-2.5 px-4">{t.cases_review}</td>
                    <td className="py-2.5 px-4 text-emerald-700">
                      {formatPercent(t.defense_precision)}
                    </td>
                    <td className="py-2.5 px-4">{formatINR(t.money_defended_inr)}</td>
                    <td className="py-2.5 px-4 text-rose-700">{formatINR(t.false_positive_cost_inr)}</td>
                    <td className="py-2.5 px-4 text-slate-900">{formatINR(t.net_recovered_inr)}</td>
                    <td className="py-2.5 px-4">
                      {isRecommended ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Recommended Default
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal font-sans">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
