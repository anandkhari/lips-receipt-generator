import { PaymentRecordStatus } from './types';

/**
 * Calculates deterministic sequential receipt number
 */
export function calculateReceiptNumber(
  sequenceIndex: number,
  prefix: string = 'LIPS/STP/2026/',
  startingNoStr: string = '001'
): string {
  const startNum = parseInt(startingNoStr.replace(/\D/g, '') || '1', 10);
  const padLength = Math.max(startingNoStr.length, 3);
  const nextNumber = startNum + sequenceIndex;
  return `${prefix}${String(nextNumber).padStart(padLength, '0')}`;
}

/**
 * Calculates payment totals, balance, and payment status
 */
export function calculatePaymentTotals(
  admissionFee: number,
  monthlyFee: number,
  status: PaymentRecordStatus,
  customAmountPaid: number
): {
  totalDue: number;
  amountPaid: number;
  balanceDue: number;
  computedStatus: PaymentRecordStatus;
} {
  const totalDue = Math.max(0, admissionFee + monthlyFee);

  let amountPaid = totalDue;
  if (status === 'Partial') {
    amountPaid = Math.max(0, Math.min(customAmountPaid, totalDue));
  }

  const balanceDue = Math.max(0, totalDue - amountPaid);
  const computedStatus: PaymentRecordStatus = balanceDue === 0 ? 'Paid' : 'Partial';

  return {
    totalDue,
    amountPaid,
    balanceDue,
    computedStatus,
  };
}

/**
 * Generates a clean human-readable summary of payment fee components
 */
export function formatPaymentType(admissionFee: number, monthlyFee: number): string {
  if (admissionFee > 0 && monthlyFee > 0) {
    return 'Admission + Monthly';
  }
  if (admissionFee > 0) {
    return 'Admission Fee';
  }
  if (monthlyFee > 0) {
    return 'Monthly / Training Fee';
  }
  return 'Special Training Fee';
}
