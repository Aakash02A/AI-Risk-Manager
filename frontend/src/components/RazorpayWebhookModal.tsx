import React, { useState } from 'react';
import { X, Zap, Shield, CheckCircle2, ArrowRight, RefreshCw, Layers, Copy, Check } from 'lucide-react';

interface RazorpayWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RazorpayWebhookModal: React.FC<RazorpayWebhookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const scenarios = [
    {
      name: 'High-Value Electronics — Item Not Received',
      amount: 54200,
      reason: 'item_not_received',
      scheme: 'VISA',
      paymentId: 'pay_Nq9G1K0pPzY6',
      disputeId: 'disp_K3aL9x8zWqR1',
      description: 'Customer ordered ₹54,200 laptop on Razorpay and later filed an Item Not Received chargeback with issuing bank.',
    },
    {
      name: 'Luxury Goods — Unauthorized Transaction Claim',
      amount: 210000,
      reason: 'unauthorized_transaction',
      scheme: 'MASTERCARD',
      paymentId: 'pay_M8vX3b9pLqZ2',
      disputeId: 'disp_H9wR4t7mVkP8',
      description: 'Friendly fraud claim on high-ticket purchase after 3DS biometric OTP step-up verification.',
    },
    {
      name: 'SaaS / D2C — Duplicate Billing Dispute',
      amount: 18900,
      reason: 'duplicate_charge',
      scheme: 'RUPAY',
      paymentId: 'pay_B2qW9k0tYv8m',
      disputeId: 'disp_T4zL7p2mXnQ5',
      description: 'Customer claims recurring billing was disputed through RuPay issuing bank.',
    },
  ];

  const current = scenarios[selectedScenario];

  const simulatedPayload = {
    entity: 'event',
    account_id: 'acc_RZPMerchantLive',
    event: 'dispute.created',
    contains: ['dispute'],
    payload: {
      dispute: {
        entity: {
          id: current.disputeId,
          payment_id: current.paymentId,
          amount: current.amount * 100, // in paise
          currency: 'INR',
          amount_deducted: current.amount * 100,
          reason_code: current.reason,
          status: 'action_required',
          phase: 'chargeback',
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(simulatedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerWebhook = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      const res = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Razorpay-Signature': 'mock_rzp_hmac_sha256_valid_signature',
        },
        body: JSON.stringify(simulatedPayload),
      });

      if (!res.ok) throw new Error('Webhook ingestion failed');
      const data = await res.json();
      setSuccessMessage(`Success! Ingested Razorpay dispute ${data.razorpay_dispute_id} (${data.case_id}). AI prediction & audit trail generated.`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      // Fallback to simulate endpoint
      try {
        const fallbackRes = await fetch(`/api/razorpay/simulate?reason=${current.reason}&amount=${current.amount}`, {
          method: 'POST',
        });
        if (fallbackRes.ok) {
          const fbData = await fallbackRes.json();
          setSuccessMessage(`Success! Ingested dispute ${fbData.razorpay_dispute_id}.`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
          return;
        }
      } catch (fbErr) {}
      alert('Error triggering webhook: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Razorpay Co-branding */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-sky-950 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Razorpay Ecosystem</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">Live Ingestion</span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulate Razorpay Dispute Webhook
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Scenario Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Dispute Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {scenarios.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedScenario(idx)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedScenario === idx
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">₹{sc.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-200 text-slate-700 font-semibold">{sc.scheme}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-600 line-clamp-1">{sc.name}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Context:</span> {current.description}
            </p>
          </div>

          {/* JSON Webhook Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Razorpay Standard Webhook Payload (POST /api/webhooks/razorpay)</span>
              </label>
              <button
                onClick={handleCopyJson}
                className="inline-flex items-center space-x-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 text-sky-300 font-mono text-xs p-3.5 rounded-xl overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(simulatedPayload, null, 2)}
            </pre>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-medium animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Triggers automatic ML win scoring & VAMP ratio evaluation
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleTriggerWebhook}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Webhook...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Ingest Live Razorpay Webhook</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
