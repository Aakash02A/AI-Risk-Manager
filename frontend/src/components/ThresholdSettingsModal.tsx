import React, { useState, useEffect } from 'react';
import { Sliders, X, Check, AlertTriangle } from 'lucide-react';
import { formatPercent } from '../utils/formatters';

interface ThresholdSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeak: number;
  currentStrong: number;
  onSave: (weak: number, strong: number) => void;
}

export const ThresholdSettingsModal: React.FC<ThresholdSettingsModalProps> = ({
  isOpen,
  onClose,
  currentWeak,
  currentStrong,
  onSave,
}) => {
  const [weak, setWeak] = useState(currentWeak);
  const [strong, setStrong] = useState(currentStrong);

  // Sync internal slider values when modal opens or when thresholds update
  useEffect(() => {
    if (isOpen) {
      setWeak(currentWeak);
      setStrong(currentStrong);
    }
  }, [isOpen, currentWeak, currentStrong]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (weak >= strong) {
      alert('Weak threshold must be strictly lower than strong threshold.');
      return;
    }
    onSave(weak, strong);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">Three-Zone Decision Threshold Policy</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            The three-zone routing policy converts calibrated ML win probabilities into three operational directives. Configure the cutoffs to adjust merchant risk tolerance.
          </p>

          <div className="space-y-4">
            {/* Weak Cutoff */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-rose-900">Weak Cutoff (Refund Recommended)</label>
                <span className="text-xs font-mono font-bold text-rose-800">{formatPercent(weak)}</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.50"
                step="0.05"
                value={weak}
                onChange={(e) => setWeak(parseFloat(e.target.value))}
                className="w-full accent-rose-600"
              />
              <p className="text-[11px] text-rose-700 mt-1">
                Disputes with win probability &lt; {formatPercent(weak)} are recommended for immediate refund to prevent costly defense friction.
              </p>
            </div>

            {/* Strong Cutoff */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-emerald-900">Strong Cutoff (Automated Defense)</label>
                <span className="text-xs font-mono font-bold text-emerald-800">{formatPercent(strong)}</span>
              </div>
              <input
                type="range"
                min="0.55"
                max="0.90"
                step="0.05"
                value={strong}
                onChange={(e) => setStrong(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <p className="text-[11px] text-emerald-700 mt-1">
                Disputes with win probability &ge; {formatPercent(strong)} authorize automated evidence packaging and formal defense filing.
              </p>
            </div>

            {/* Borderline Zone Preview */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <div className="font-semibold flex items-center space-x-1.5 mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Human Review Zone: {formatPercent(weak)} to {formatPercent(strong)}</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Any dispute in this range is held for manual agent review. Raising the Strong threshold increases precision but widens review burden.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setWeak(0.40);
                setStrong(0.70);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Reset to Recommended Default (0.40 / 0.70)
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Thresholds</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
