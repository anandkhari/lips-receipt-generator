import { Student, Payment, ReceiptType } from './types';
import { formatPaymentType } from './receipt';

/**
 * Normalizes phone number into international format for WhatsApp URL
 * Example: '9876543210' -> '919876543210' (assuming standard 10-digit Indian number)
 */
export function formatWhatsAppPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits, prepend standard Indian country code 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Builds the official WhatsApp text summary for the fee receipt
 */
export function buildWhatsAppReceiptMessage(params: {
  studentName: string;
  receiptNumber: string;
  studentClass?: string;
  division?: string;
  programme?: string;
  sport?: string;
  admissionFee: number;
  monthlyFee?: number;
  amountPaid: number;
  balanceDue?: number;
  paymentDate: string;
}): string {
  const {
    studentName,
    receiptNumber,
    studentClass = 'Class 8',
    division,
    programme = 'Special Training Programme',
    sport = 'Sports',
    admissionFee,
    monthlyFee = 0,
    amountPaid,
    balanceDue = 0,
    paymentDate,
  } = params;

  const classDisplay = division ? `${studentClass}-${division.toUpperCase()}` : studentClass;
  const paymentTypeLabel = formatPaymentType(admissionFee, monthlyFee);

  return (
    `*Little India Public School — Special Training Programme*\n` +
    `*Official Fee Payment Receipt*\n\n` +
    `Dear Parent,\n` +
    `We have received the fee payment for *${studentName}*. Please find the receipt details below:\n\n` +
    `📄 *Receipt Number:* ${receiptNumber}\n` +
    `👤 *Student Name:* ${studentName}\n` +
    `🏫 *Class / Division:* ${classDisplay}\n` +
    `🏅 *Programme:* ${programme}\n` +
    `⚽ *Sport:* ${sport}\n` +
    `🗓 *Payment Date:* ${paymentDate}\n` +
    `📋 *Fee Component:* ${paymentTypeLabel}\n` +
    `💰 *Amount Paid:* ₹${amountPaid.toLocaleString('en-IN')}\n` +
    (balanceDue > 0 ? `⚠️ *Balance Due:* ₹${balanceDue.toLocaleString('en-IN')}\n` : `✅ *Status:* Fully Paid\n`) +
    `\n` +
    `Please find the official A4 receipt PDF attached.\n\n` +
    `_Little India Public School, Thadaparambu, Malappuram, Kerala_`
  );
}

/**
 * Triggers PDF generation on server and returns the Blob & generated filename
 */
export async function generatePdfBlob(params: {
  student: Student;
  payment?: Payment;
  receiptNumber: string;
  admissionFee: number;
  receiptType?: ReceiptType;
}): Promise<{ blob: Blob; filename: string }> {
  const { student, payment, receiptNumber, admissionFee, receiptType } = params;

  const response = await fetch('/api/generate-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      student,
      payment,
      receiptNumber,
      admissionFee,
      receiptType,
    }),
  });

  if (!response.ok) {
    let errText = 'Failed to generate PDF.';
    try {
      const errData = await response.json();
      if (errData?.error) errText = errData.error;
    } catch {
      // response not JSON
    }
    throw new Error(errText);
  }

  const blob = await response.blob();

  let filename = `LIPS-STP-${receiptNumber.replace(/[^a-zA-Z0-9]/g, '-')}-${student.studentName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = disposition.match(/filename="?([^";]+)"?/);
    if (matches && matches[1]) {
      filename = matches[1].trim();
    }
  }

  return { blob, filename };
}

export type WhatsAppShareResult = {
  success: boolean;
  method: 'native-share' | 'whatsapp-web-fallback';
  filename: string;
  formattedPhone: string;
  messageText: string;
  cancelled?: boolean;
  error?: string;
};

/**
 * Orchestrates sending receipt via WhatsApp:
 * 1. Checks if browser can share PDF file via Web Share API
 * 2. If supported, triggers native share
 * 3. If unsupported or native share fails/unavailable, triggers fallback:
 *    downloads the PDF file and opens WhatsApp Web with the prefilled message.
 */
export async function sendReceiptViaWhatsApp(params: {
  student: Student;
  payment?: Payment;
  receiptNumber: string;
  admissionFee: number;
  receiptType?: ReceiptType;
  phone?: string;
}): Promise<WhatsAppShareResult> {
  const { student, payment, receiptNumber, admissionFee, receiptType, phone } = params;

  const effectivePhone = phone || payment?.phone || student.phone || '';
  const formattedPhone = formatWhatsAppPhone(effectivePhone);

  const amountPaid = payment ? payment.amountPaid : student.amount || admissionFee;
  const balanceDue = payment ? payment.balanceDue : 0;
  const monthlyFee = payment ? payment.monthlyFee : 0;

  const messageText = buildWhatsAppReceiptMessage({
    studentName: student.studentName,
    receiptNumber: receiptNumber,
    studentClass: payment?.studentClass || student.className,
    division: payment?.division || student.division,
    programme: payment?.programme || student.programme,
    sport: payment?.sport || student.sport,
    admissionFee: admissionFee,
    monthlyFee: monthlyFee,
    amountPaid: amountPaid,
    balanceDue: balanceDue,
    paymentDate: payment?.paymentDate || student.paymentDate,
  });

  // 1. Fetch PDF Blob from backend
  const { blob, filename } = await generatePdfBlob({
    student,
    payment,
    receiptNumber,
    admissionFee,
    receiptType,
  });

  // 2. Create File object
  const pdfFile = new File([blob], filename, { type: 'application/pdf' });

  // 3. Test Web Share API file-sharing capability
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [pdfFile] });

  if (canShareFiles && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `LIPS Fee Receipt - ${student.studentName}`,
        text: messageText,
      });

      return {
        success: true,
        method: 'native-share',
        filename,
        formattedPhone,
        messageText,
      };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return {
          success: false,
          method: 'native-share',
          filename,
          formattedPhone,
          messageText,
          cancelled: true,
        };
      }
      console.warn('Native share failed, falling back to download + WhatsApp Web:', err);
    }
  }

  // 4. Fallback for Windows desktop Chrome / unsupported environments:
  // Step A: Trigger immediate download of the PDF so the user has the file ready to attach
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);

  // Step B: Open WhatsApp Web in a new window with prefilled message
  const waUrl = formattedPhone
    ? `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(messageText)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');

  return {
    success: true,
    method: 'whatsapp-web-fallback',
    filename,
    formattedPhone,
    messageText,
  };
}
