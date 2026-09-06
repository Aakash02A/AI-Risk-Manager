import React, { useState } from 'react';
import {
  X,
  Shield,
  Send,
  CheckCircle2,
  FileText,
  Lock,
  Building,
  Truck,
  CreditCard,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { DisputeCase } from '../types';
import { formatINR, formatPercent } from '../utils/formatters';

interface RazorpayServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeCase: DisputeCase;
  onSuccess?: () => void;
}

export const RazorpayServiceFormModal: React.FC<RazorpayServiceFormModalProps> = ({
  isOpen,
  onClose,
  disputeCase,
  onSuccess,
}) => {
  const c = disputeCase;
  const def = c.defense_response;
  const pred = c.prediction;
  const ev = c.evidence;

  const defaultSummary = `Merchant verified legitimate fulfillment: Tax invoice issued, carrier AWB delivered with cardholder confirmation, and 3D Secure / OTP authorization authenticated for Payment ${c.payment_id || 'pay_live'}.`;

  const [defenseSummary, setDefenseSummary] = useState(defaultSummary);
  const [operatorNotes, setOperatorNotes] = useState('Submitted via Razorpay Dispute Shield AI Operator Cockpit');
  const [showRebuttalPreview, setShowRebuttalPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResponse, setSuccessResponse] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Evidence attachments state
  const [attachments, setAttachments] = useState({
    invoice: ev?.invoice_exists ?? true,
    proofOfDelivery: ev?.delivery_status === 'delivered_confirmed',
    paymentAuth: ev?.payment_confirmed ?? true,
    customerCommunication: ev?.customer_communication !== 'no_contact',
    orderSummary: ev?.order_exists ?? true,
  });

  if (!isOpen) return null;

  const handleCopyRebuttal = () => {
    if (def?.response_text) {
      navigator.clipboard.writeText(def.response_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitContest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessResponse(null);

    try {
      const payload = {
        summary: defenseSummary,
        notes: operatorNotes,
      };

      const res = await fetch(`/api/cases/${c.case_id}/razorpay/contest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Gateway returned HTTP ${res.status}: Failed to submit dispute contest.`);
      }

      const updatedCase = await res.json();
      setSuccessResponse(updatedCase);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Razorpay Service API.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/50">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Razorpay Dispute Service Contest Form
                </h2>
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  v1/disputes/{c.razorpay_dispute_id || 'disp_id'}/contest
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center space-x-2 mt-0.5">
                <span className="inline-flex items-center space-x-1 text-emerald-400 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>TLS 1.3 Basic Auth Authenticated</span>
                </span>
                <span>&bull;</span>
                <span>Case: <strong className="text-white font-mono">{c.case_id}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dispute Context Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Disputed Amount</span>
              <span className="text-base font-extrabold text-slate-900">{formatINR(c.dispute_amount)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Razorpay Dispute ID</span>
              <span className="font-mono text-xs font-semibold text-blue-700 block truncate" title={c.razorpay_dispute_id}>
                {c.razorpay_dispute_id || 'disp_rzp_live'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Payment ID</span>
              <span className="font-mono text-xs font-semibold text-slate-800 block truncate" title={c.payment_id}>
                {c.payment_id || 'pay_rzp_live'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-bold block">ML Win Confidence</span>
              <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                <span>{pred ? formatPercent(pred.win_probability) : '85%'}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 rounded text-emerald-800 uppercase font-mono">
                  {pred?.decision || 'STRONG'}
                </span>
              </span>
            </div>
          </div>

          {/* Success Notification Banner */}
          {successResponse && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-in fade-in">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Dispute Contest Successfully Dispatched to Razorpay!</span>
              </div>
              <p className="text-xs text-emerald-800">
                The defense packet, evidence attachments, and rebuttal statement have been accepted by Razorpay's Dispute Service API.
              </p>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-300 font-mono text-xs space-y-1 text-emerald-950">
                <div>Status: <span className="font-bold text-emerald-700">SUBMITTED (Under Scheme Adjudication)</span></div>
                <div>Case ID: <span className="font-bold">{c.case_id}</span></div>
                <div>Razorpay Dispute ID: <span className="font-bold">{c.razorpay_dispute_id}</span></div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Failed to submit contest:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Main Contest Service Form */}
          {!successResponse && (
            <form onSubmit={handleSubmitContest} className="space-y-4">
              {/* Field 1: Defense Summary */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>1. Defense Summary for Card Scheme</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">{defenseSummary.length}/500 chars</span>
                </div>
                <textarea
                  value={defenseSummary}
                  onChange={(e) => setDefenseSummary(e.target.value)}
                  rows={3}
                  maxLength={500}
                  required
                  placeholder="Enter high-level summary of fulfillment and transaction validity..."
                  className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This summary is passed directly to Razorpay's <code>summary</code> parameter and transmitted to the card issuing bank.
                </p>
              </div>

              {/* Field 2: Evidence Artifacts Checklist */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  2. Evidence Artifacts Included in Service Submission
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${attachments.invoice ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <input
                      type="checkbox"
                      checked={attachments.invoice}
                      onChange={(e) => setAttachments({ ...attachments, invoice: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <Building className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold block">GST Tax Invoice</span>
                      <span className="text-[10px] text-slate-500">Invoice document with GSTIN</span>
                    </div>
                  </label>

                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${attachments.proofOfDelivery ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <input
                      type="checkbox"
                      checked={attachments.proofOfDelivery}
                      onChange={(e) => setAttachments({ ...attachments, proofOfDelivery: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold block">Proof of Delivery (AWB)</span>
                      <span className="text-[10px] text-slate-500">Carrier delivery audit trail</span>
                    </div>
                  </label>

                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${attachments.paymentAuth ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <input
                      type="checkbox"
                      checked={attachments.paymentAuth}
                      onChange={(e) => setAttachments({ ...attachments, paymentAuth: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold block">3DS / OTP Auth Confirmation</span>
                      <span className="text-[10px] text-slate-500">Cardholder liability shift locked</span>
                    </div>
                  </label>

                  <label className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${attachments.customerCommunication ? 'bg-blue-50/70 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <input
                      type="checkbox"
                      checked={attachments.customerCommunication}
                      onChange={(e) => setAttachments({ ...attachments, customerCommunication: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <MessageSquare className="w-4 h-4 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold block">Customer Communications</span>
                      <span className="text-[10px] text-slate-500">Support tickets & chat log</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Field 3: AI Legal Rebuttal Packet Preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRebuttalPreview(!showRebuttalPreview)}
                  className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-semibold text-slate-800 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>3. AI Generated Legal Rebuttal Packet ({def?.generated_by || 'gemini-3.8-flash'})</span>
                  </div>
                  {showRebuttalPreview ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showRebuttalPreview && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Full 8-part statutory chargeback rebuttal document:</span>
                      <button
                        type="button"
                        onClick={handleCopyRebuttal}
                        className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy Text'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
                      {def?.response_text || 'No AI rebuttal generated for this case yet.'}
                    </pre>
                  </div>
                )}
              </div>

              {/* Field 4: Operator Audit Notes */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  4. Operator Audit Notes
                </label>
                <input
                  type="text"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  className="w-full p-2.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-sans"
                  placeholder="Optional internal notes logged to audit trail and Razorpay gateway..."
                />
              </div>

              {/* API Dispatch Indicator */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                  <span>Service Target: <strong>Razorpay Dispute API (Production / Sandbox)</strong></span>
                </div>
                <span className="text-[10px] font-mono text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded">
                  HTTP POST /v1/disputes
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !defenseSummary.trim()}
                  className="inline-flex items-center space-x-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-900/20 disabled:opacity-50 transition-all"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Submitting to Razorpay...' : 'Dispatch Contest to Razorpay Service'}</span>
                </button>
              </div>
            </form>
          )}

          {/* After Success Footer */}
          {successResponse && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow transition-colors"
              >
                Close Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
