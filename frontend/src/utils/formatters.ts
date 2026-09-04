import { Decision, DisputeReason } from '../types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(val: number): string {
  return `${Math.round(val * 100)}%`;
}

export function formatReasonLabel(reason: DisputeReason): string {
  switch (reason) {
    case 'item_not_received':
      return 'Item Not Received';
    case 'not_as_described':
      return 'Not As Described';
    case 'unauthorized_transaction':
      return 'Unauthorized Transaction';
    case 'duplicate_charge':
      return 'Duplicate Charge';
    default:
      return reason;
  }
}

export function getDecisionBadgeColor(decision?: Decision | null): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  switch (decision) {
    case 'STRONG':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600',
      };
    case 'BORDERLINE':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-600',
      };
    case 'WEAK':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
        dot: 'bg-rose-600',
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}
