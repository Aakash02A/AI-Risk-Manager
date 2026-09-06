import React from 'react';
import { DisputeCase, DisputeReason, Decision } from '../types';
import { formatINR, formatPercent, formatReasonLabel, getDecisionBadgeColor, formatRealtimeTimestamp, formatRelativeTime } from '../utils/formatters';
import { Search, Filter, ShieldCheck, AlertCircle, RefreshCw, Sparkles, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

interface DisputeTableProps {
  cases: DisputeCase[];
  loading?: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedReason: string;
  setSelectedReason: (reason: string) => void;
  selectedDecision: string;
  setSelectedDecision: (decision: string) => void;
  onSelectCase: (c: DisputeCase) => void;
  onAnalyzeCase: (caseId: string) => void;
  analyzingCaseId: string | null;
}

export const DisputeTable: React.FC<DisputeTableProps> = ({
  cases,
  loading,
  searchQuery,
  setSearchQuery,
  selectedReason,
  setSelectedReason,
  selectedDecision,
  setSelectedDecision,
  onSelectCase,
  onAnalyzeCase,
  analyzingCaseId,
}) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Filter Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-disputes"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Case ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
          />
        </div>

        {/* Reason Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Reason:</span>
          <select
            id="select-filter-reason"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">All Reasons</option>
            <option value="item_not_received">Item Not Received</option>
            <option value="not_as_described">Not As Described</option>
            <option value="unauthorized_transaction">Unauthorized Transaction</option>
            <option value="duplicate_charge">Duplicate Charge</option>
          </select>
        </div>

        {/* Decision Filter Pills */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-medium text-slate-500 mr-1">Decision:</span>
          {['', 'STRONG', 'BORDERLINE', 'WEAK', 'UNCLASSIFIED'].map((status) => {
            const isSelected = selectedDecision === status;
            return (
              <button
                key={status}
                id={`filter-decision-${status || 'all'}`}
                onClick={() => setSelectedDecision(status)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {status === '' ? 'All' : status === 'UNCLASSIFIED' ? 'Pending' : status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Disputes Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Case & Razorpay ID</th>
              <th className="py-3 px-4">Disputed Amount</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Age</th>
              <th className="py-3 px-4">Evidence Checklist</th>
              <th className="py-3 px-4">ML Win Probability & Routing</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>

          </thead>
          <tbody className="divide-y divide-slate-200">
            {cases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No dispute cases match the active filter criteria.
                </td>
              </tr>
            ) : (
              cases.map((c) => {
                const decisionStyle = getDecisionBadgeColor(c.prediction?.decision);
                return (
                  <tr
                    key={c.case_id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectCase(c)}
                  >
                    {/* Case ID and Razorpay Identifiers */}
                    <td className="py-3 px-4 text-slate-900">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900">{c.case_id}</span>
                          {c.card_network && (
                            <span className="text-[9px] font-extrabold px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {c.card_network}
                            </span>
                          )}
                          {c.razorpay_status === 'submitted' && (
                            <span className="text-[9px] font-bold px-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Submitted
                            </span>
                          )}
                          {c.razorpay_status === 'accepted' && (
                            <span className="text-[9px] font-bold px-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Refunded
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span className="text-blue-600">{c.razorpay_dispute_id || 'disp_rzp'}</span>
                          <span>•</span>
                          <span>{c.payment_id || 'pay_rzp'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Disputed Amount */}
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatINR(c.dispute_amount)}
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {formatReasonLabel(c.dispute_reason)}
                      </span>
                    </td>

                    {/* Age */}
                    <td className="py-3 px-4 text-slate-600 font-mono font-medium">
                      {c.days_since_order}d ago
                    </td>

                    {/* Evidence Checklist Indicators */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-600">
                        {/* Order */}
                        <span
                          title={c.evidence.order_exists ? 'Order Verified' : 'Missing Order'}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                            c.evidence.order_exists ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          ORD
                        </span>

                        {/* Invoice */}
                        <span
                          title={c.evidence.invoice_exists ? 'Tax Invoice Available' : 'Missing Invoice'}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                            c.evidence.invoice_exists ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          INV
                        </span>

                        {/* 3DS / Payment */}
                        <span
                          title={c.evidence.payment_confirmed ? '3DS Confirmed' : 'Payment Unconfirmed'}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                            c.evidence.payment_confirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          3DS
                        </span>

                        {/* Delivery */}
                        <span
                          title={`Fulfillment: ${c.evidence.delivery_status}`}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                            c.evidence.delivery_status === 'delivered_confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.evidence.delivery_status === 'delivered_unconfirmed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          DEL
                        </span>

                        {/* Tracking */}
                        <span
                          title={c.evidence.tracking_number_present ? 'Carrier Tracking Waybill Attached' : 'No Tracking'}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                            c.evidence.tracking_number_present ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          TRK
                        </span>
                      </div>
                    </td>

                    {/* ML Prediction & Routing */}
                    <td className="py-3 px-4">
                      {c.prediction ? (
                        <div className="flex items-center space-x-2.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm leading-none">
                              {formatPercent(c.prediction.win_probability)}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">calibrated</span>
                          </div>

                          <div
                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${decisionStyle.bg} ${decisionStyle.text} ${decisionStyle.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${decisionStyle.dot}`}></span>
                            <span>{c.prediction.decision}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 text-xs font-medium text-slate-500 bg-slate-50">
                          Awaiting ML Inference
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end space-x-2">
                        <button
                          id={`btn-analyze-${c.case_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAnalyzeCase(c.case_id);
                          }}
                          disabled={analyzingCaseId === c.case_id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium text-xs transition-colors disabled:opacity-50 shrink-0 shadow-2xs"
                        >
                          <Sparkles className={`w-3 h-3 text-indigo-500 ${analyzingCaseId === c.case_id ? 'animate-spin' : ''}`} />
                          <span>{c.prediction ? 'Re-Analyze' : 'Analyze ML'}</span>
                        </button>

                        <button
                          id={`btn-view-${c.case_id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCase(c);
                          }}
                          className="inline-flex items-center space-x-0.5 px-2.5 py-1 rounded bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition-colors shrink-0 shadow-2xs"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
