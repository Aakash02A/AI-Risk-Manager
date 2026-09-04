import React, { useState } from 'react';
import { DisputeCase } from '../types';
import { formatINR, formatPercent, formatReasonLabel, getDecisionBadgeColor } from '../utils/formatters';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Copy,
  Check,
  User,
  Building,
  HelpCircle,
} from 'lucide-react';

interface CaseDetailModalProps {
  disputeCase: DisputeCase | null;
  onClose: () => void;
  onAnalyze: (caseId: string) => void;
  onGenerateResponse: (caseId: string) => void;
  isAnalyzing: boolean;
  isGeneratingResponse: boolean;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  disputeCase,
  onClose,
  onAnalyze,
  onGenerateResponse,
  isAnalyzing,
  isGeneratingResponse,
}) => {
  const [copied, setCopied] = useState(false);

  if (!disputeCase) return null;

  const c = disputeCase;
  const ev = c.evidence;
  const pred = c.prediction;
  const def = c.defense_response;
  const decisionStyle = getDecisionBadgeColor(pred?.decision);

  const handleCopy = () => {
    if (def?.response_text) {
      navigator.clipboard.writeText(def.response_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">{c.case_id}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                  {formatReasonLabel(c.dispute_reason)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Disputed: <span className="font-semibold text-slate-900">{formatINR(c.dispute_amount)}</span> &bull; {c.days_since_order} days since order &bull; Logged: {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-analyze-modal"
              onClick={() => onAnalyze(c.case_id)}
              disabled={isAnalyzing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium text-xs shadow-xs disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-600 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{pred ? 'Re-Run Classifier' : 'Run ML Classifier'}</span>
            </button>

            <button
              id="btn-close-modal"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: ML Routing & Decision Panel */}
          <div className="border border-slate-200 rounded-lg p-5 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <h3 className="text-sm font-semibold text-slate-900">
                  ML Win Probability & Three-Zone Decision Routing
                </h3>
              </div>
              {pred && (
                <span className="text-[11px] font-mono text-slate-500">
                  Model: {pred.model_name} v{pred.model_version}
                </span>
              )}
            </div>

            {pred ? (
              <div className="space-y-4">
                {/* Visual Confidence Gauge */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {formatPercent(pred.win_probability)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Estimated Win Probability</span>
                    </div>

                    <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>

                    <div className="flex items-center">
                      <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide ${decisionStyle.bg} ${decisionStyle.text} ${decisionStyle.border} flex items-center space-x-2`}>
                        <span className={`w-2 h-2 rounded-full ${decisionStyle.dot}`}></span>
                        <span>{pred.decision}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Directive Guidance */}
                  <div className="text-xs sm:text-right max-w-sm">
                    {pred.decision === 'STRONG' && (
                      <div className="text-emerald-800 font-medium bg-emerald-50 p-2.5 rounded-md border border-emerald-200">
                        <strong>DEFEND THIS DISPUTE:</strong> Probability &ge; 70%. High evidentiary confidence. Automated response drafting is authorized.
                      </div>
                    )}
                    {pred.decision === 'BORDERLINE' && (
                      <div className="text-amber-800 font-medium bg-amber-50 p-2.5 rounded-md border border-amber-200">
                        <strong>HUMAN REVIEW REQUIRED:</strong> 40% &le; Probability &lt; 70%. Ambiguous evidence indicators. Adjudicate manually before contesting.
                      </div>
                    )}
                    {pred.decision === 'WEAK' && (
                      <div className="text-rose-800 font-medium bg-rose-50 p-2.5 rounded-md border border-rose-200">
                        <strong>RECOMMEND REFUND:</strong> Probability &lt; 40%. Critical evidence missing. Contesting risks card scheme fees and merchant ratio spikes.
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Zone Distribution Meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span className="text-rose-600">Weak Zone (&lt; 40%)</span>
                    <span className="text-amber-600">Borderline Zone (40% - 70%)</span>
                    <span className="text-emerald-600">Strong Zone (&ge; 70%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex relative">
                    {/* Zones */}
                    <div className="w-[40%] bg-rose-200 h-full"></div>
                    <div className="w-[30%] bg-amber-200 h-full"></div>
                    <div className="w-[30%] bg-emerald-200 h-full"></div>

                    {/* Marker pointer */}
                    <div
                      className="absolute top-0 bottom-0 w-1.5 bg-slate-900 -ml-0.5 shadow-sm"
                      style={{ left: `${Math.min(Math.max(pred.win_probability * 100, 2), 98)}%` }}
                      title={`Current Probability: ${formatPercent(pred.win_probability)}`}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-white rounded-lg border border-dashed border-slate-300">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">This dispute case has not been evaluated by the ML model yet.</p>
                <button
                  id="btn-run-classifier-prompt"
                  onClick={() => onAnalyze(c.case_id)}
                  disabled={isAnalyzing}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Random Forest Classifier</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Recorded Case Evidence Dossier */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Building className="w-4 h-4 text-slate-600" />
              <span>Evidentiary Repository Checklist</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Order Exists */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Order Record</span>
                  {ev.order_exists ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.order_exists ? 'Verified in OMS' : 'No Order Record'}
                </p>
              </div>

              {/* Invoice Exists */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Tax Invoice</span>
                  {ev.invoice_exists ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.invoice_exists ? 'Fiscal Invoice Attached' : 'Missing Invoice'}
                </p>
              </div>

              {/* Payment Confirmed */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Payment Standard</span>
                  {ev.payment_confirmed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.payment_confirmed ? '3DS Authorized & Captured' : 'Unconfirmed Capture'}
                </p>
              </div>

              {/* Delivery Carrier Status */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Carrier Fulfillment</span>
                  {ev.delivery_status === 'delivered_confirmed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : ev.delivery_status === 'delivered_unconfirmed' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.delivery_status.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              {/* Tracking Waybill */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Carrier Tracking</span>
                  {ev.tracking_number_present ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.tracking_number_present ? 'Waybill ID Attached' : 'No Tracking Number'}
                </p>
              </div>

              {/* Customer Communication */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Communication Log</span>
                  {ev.customer_communication === 'acknowledged_receipt' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : ev.customer_communication === 'complained_before' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <span className="text-slate-400 text-xs font-mono">-</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.customer_communication.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              {/* Refund Status */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Prior Refund</span>
                  {ev.refund_status === 'no_refund' ? (
                    <span className="text-xs text-slate-400 font-mono">None</span>
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.refund_status.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>

              {/* Customer Prior Disputes */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Dispute History</span>
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  {ev.customer_prior_dispute_count} prior chargeback(s)
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Merchant Defense Response (Gemini LLM) */}
          <div className="border border-slate-200 rounded-lg p-5 bg-white shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Evidence-Grounded Defense Rebuttal Statement</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Strictly drafted from case evidence. Restricted exclusively to STRONG disputes.
                </p>
              </div>

              {pred?.decision === 'STRONG' && (
                <button
                  id="btn-draft-defense"
                  onClick={() => onGenerateResponse(c.case_id)}
                  disabled={isGeneratingResponse}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingResponse ? 'animate-spin' : ''}`} />
                  <span>{def ? 'Re-Draft Defense' : 'Draft Formal Defense'}</span>
                </button>
              )}
            </div>

            {/* If NOT STRONG: Policy restriction banner */}
            {pred && pred.decision !== 'STRONG' && (
              <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center space-x-2 font-semibold mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Automated Defense Response Generation is Disabled</span>
                </div>
                <p>
                  Per operational policy, defense responses can ONLY be generated for disputes with <strong>STRONG</strong> win confidence. Current decision is <strong>{pred.decision}</strong>.
                  {pred.decision === 'BORDERLINE'
                    ? ' Borderline disputes require manual human adjudication before filing.'
                    : ' Weak disputes are recommended for full refund to avoid scheme arbitration fees.'}
                </p>
              </div>
            )}

            {/* Defense text display */}
            {def?.response_text ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                  <span className="font-mono">Generated by: {def.generated_by} &bull; {new Date(def.created_at).toLocaleString()}</span>
                  <button
                    id="btn-copy-defense"
                    onClick={handleCopy}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Rebuttal</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {def.response_text}
                </pre>
              </div>
            ) : pred?.decision === 'STRONG' ? (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <FileText className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600">Case classified as STRONG. Click "Draft Formal Defense" to generate the 8-part rebuttal package.</p>
              </div>
            ) : null}
          </div>

          {/* Section 4: Chronological Audit Trail (Section 27) */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>Chronological Audit Trail</span>
            </h3>

            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
              {c.audit_logs.length === 0 ? (
                <p className="p-4 text-xs text-slate-400">No audit log entries recorded yet.</p>
              ) : (
                c.audit_logs.map((log, index) => (
                  <div key={index} className="p-3 flex items-start justify-between text-xs space-x-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900">{log.action}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {log.actor}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            id="btn-close-footer"
            onClick={onClose}
            className="px-4 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
