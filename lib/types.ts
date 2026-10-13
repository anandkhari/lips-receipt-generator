export type PaymentStatus = 'Paid' | 'Unpaid';
export type PaymentRecordStatus = 'Paid' | 'Partial';
export type ReceiptType = 'Scholarship' | 'Standard Training Program';

export interface Student {
  id: string;
  slNo: number;
  studentName: string;
  studentId?: string;
  className: string;
  division?: string;
  programme: string;
  receiptType?: ReceiptType;
  sport: string;
  phone?: string;
  paymentDate: string;
  amount: number;
  amountFormatted: string;
  paymentStatus: PaymentStatus;
  rawRow?: Record<string, unknown>;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  studentClass?: string;
  division?: string;
  phone?: string;
  programme: string;
  receiptType?: ReceiptType;
  sport?: string;
  paymentDate: string;

  admissionFee: number;
  monthlyFee: number;

  totalDue: number;
  amountPaid: number;
  balanceDue: number;

  paymentStatus: PaymentRecordStatus;

  paymentMethod: string;
  remarks?: string;
  createdAt: Date;
}


export interface ReceiptSettingsData {
  programme: string;
  sport: string;
  admissionFee: string;
  prefix: string;
  startingNo: string;
}
