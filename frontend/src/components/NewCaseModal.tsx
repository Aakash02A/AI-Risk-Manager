import React, { useState, useEffect } from 'react';
import { DisputeReason, DeliveryStatus, CustomerCommunication, RefundStatus } from '../types';
import { X, Plus, Sparkles, RotateCcw } from 'lucide-react';

interface NewCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export const NewCaseModal: React.FC<NewCaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const generateNewCaseId = () => `CB-${Math.floor(1030 + Math.random() * 8900)}-IN`;

  const [caseId, setCaseId] = useState(generateNewCaseId());
  const [disputeAmount, setDisputeAmount] = useState('35000');
  const [disputeReason, setDisputeReason] = useState<DisputeReason>('item_not_received');
  const [daysSinceOrder, setDaysSinceOrder] = useState('12');

  // Evidence states
  const [orderExists, setOrderExists] = useState(true);
  const [invoiceExists, setInvoiceExists] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('delivered_confirmed');
  const [trackingNumberPresent, setTrackingNumberPresent] = useState(true);
  const [customerCommunication, setCustomerCommunication] = useState<CustomerCommunication>('acknowledged_receipt');
  const [refundStatus, setRefundStatus] = useState<RefundStatus>('no_refund');
  const [customerPriorDisputeCount, setCustomerPriorDisputeCount] = useState('0');

  // Function to reset all fields cleanly
  const resetForm = () => {
    setCaseId(generateNewCaseId());
    setDisputeAmount('35000');
    setDisputeReason('item_not_received');
    setDaysSinceOrder('12');
    setOrderExists(true);
    setInvoiceExists(true);
    setPaymentConfirmed(true);
    setDeliveryStatus('delivered_confirmed');
    setTrackingNumberPresent(true);
    setCustomerCommunication('acknowledged_receipt');
    setRefundStatus('no_refund');
    setCustomerPriorDisputeCount('0');
  };

  // Reset whenever the modal is opened afresh
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      case_id: caseId.trim(),
      dispute_amount: parseFloat(disputeAmount) || 10000,
      dispute_reason: disputeReason,
      days_since_order: parseInt(daysSinceOrder, 10) || 1,
      evidence: {
        order_exists: orderExists,
        invoice_exists: invoiceExists,
        payment_confirmed: paymentConfirmed,
        delivery_status: deliveryStatus,
        tracking_number_present: trackingNumberPresent,
        customer_communication: customerCommunication,
        refund_status: refundStatus,
        customer_prior_dispute_count: parseInt(customerPriorDisputeCount, 10) || 0,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">Ingest New Dispute Case</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Dispute Basic Identity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispute Case ID</label>
              <input
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                required
                className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disputed Amount (₹ INR)</label>
              <input
                type="number"
                value={disputeAmount}
                onChange={(e) => setDisputeAmount(e.target.value)}
                required
                min="100"
                step="100"
                className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Claimed Dispute Reason</label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="item_not_received">Item Not Received</option>
                <option value="not_as_described">Not As Described</option>
                <option value="unauthorized_transaction">Unauthorized Transaction</option>
                <option value="duplicate_charge">Duplicate Charge</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Days Since Transaction</label>
              <input
                type="number"
                value={daysSinceOrder}
                onChange={(e) => setDaysSinceOrder(e.target.value)}
                required
                min="1"
                max="365"
                className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          {/* Evidence Details */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Case Evidence Indicators
            </h3>

            {/* Checkbox Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={orderExists}
                  onChange={(e) => setOrderExists(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>Order Exists</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={invoiceExists}
                  onChange={(e) => setInvoiceExists(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>Invoice Exists</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>3DS Confirmed</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackingNumberPresent}
                  onChange={(e) => setTrackingNumberPresent(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span>Tracking Waybill</span>
              </label>
            </div>

            {/* Categorical Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Carrier Fulfillment</label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value as DeliveryStatus)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                >
                  <option value="delivered_confirmed">Delivered (Confirmed)</option>
                  <option value="delivered_unconfirmed">Delivered (Unconfirmed)</option>
                  <option value="not_delivered">Not Delivered</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Customer Communication</label>
                <select
                  value={customerCommunication}
                  onChange={(e) => setCustomerCommunication(e.target.value as CustomerCommunication)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                >
                  <option value="acknowledged_receipt">Acknowledged Receipt</option>
                  <option value="complained_before">Complained Before</option>
                  <option value="no_contact">No Contact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Prior Refund Status</label>
                <select
                  value={refundStatus}
                  onChange={(e) => setRefundStatus(e.target.value as RefundStatus)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md"
                >
                  <option value="no_refund">No Refund</option>
                  <option value="partial_refund">Partial Refund</option>
                  <option value="full_refund">Full Refund</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Cardholder Prior Disputes Count</label>
              <input
                type="number"
                value={customerPriorDisputeCount}
                onChange={(e) => setCustomerPriorDisputeCount(e.target.value)}
                min="0"
                max="20"
                className="w-32 text-xs font-mono px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear / Reset Form</span>
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
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Ingesting...' : 'Ingest & Record Dispute'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
