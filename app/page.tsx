'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import ReceiptSettings from '@/components/ReceiptSettings';
import ReceiptPreview from '@/components/receipt/ReceiptPreview';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { Student, Payment, PaymentRecordStatus, ReceiptSettingsData, ReceiptType } from '@/lib/types';
import { calculatePaymentTotals, calculateReceiptNumber } from '@/lib/receipt';
import { sendReceiptViaWhatsApp, generatePdfBlob, WhatsAppShareResult } from '@/lib/whatsapp';
import {
  User,
  CreditCard,
  Calendar,
  AlertCircle,
  Download,
  Eye,
  RotateCcw,
  Loader2,
  CheckCircle2,
  X,
  FileText,
  Phone,
  Receipt,
} from 'lucide-react';

export default function Home() {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. Student Details State
  const [studentName, setStudentName] = useState('Meenakshi Vinoop');
  const [studentClass, setStudentClass] = useState('Class 8');
  const [studentDivision, setStudentDivision] = useState('A');
  const [studentPhone, setStudentPhone] = useState('9876543210');
  const [studentId, setStudentId] = useState('LIPS/2026/042');

  // 2. Programme & Sport
  const [programme, setProgramme] = useState('Special Training Programme');
  const [sport, setSport] = useState('Football');
  const [otherSportText, setOtherSportText] = useState('');

  // 3. Fee Breakdown
  const [includeAdmissionFee, setIncludeAdmissionFee] = useState(true);
  const [admissionFeeAmount, setAdmissionFeeAmount] = useState<number>(1000);

  const [includeMonthlyFee, setIncludeMonthlyFee] = useState(false);
  const [monthlyFeeAmount, setMonthlyFeeAmount] = useState<number>(2500);

  // 4. Payment Status & Mode
  const [paymentStatus, setPaymentStatus] = useState<PaymentRecordStatus>('Paid');
  const [partialAmountPaid, setPartialAmountPaid] = useState<number>(1000);
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [otherMethodText, setOtherMethodText] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // 5. Receipt Numbering Settings
  const [receiptSettings, setReceiptSettings] = useState<ReceiptSettingsData>({
    programme: 'Special Training Programme',
    sport: 'Football',
    admissionFee: '₹1,000',
    prefix: 'LIPS/STP/2026/',
    startingNo: '001',
  });

  // 6. UI Modals & Feedback
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<WhatsAppShareResult | null>(null);

  // Update admission fee when settings change
  const handleReceiptSettingChange = (field: keyof ReceiptSettingsData, value: string) => {
    setReceiptSettings((prev) => ({ ...prev, [field]: value }));
    if (field === 'admissionFee') {
      const parsed = parseInt(value.replace(/\D/g, '') || '1000', 10);
      setAdmissionFeeAmount(parsed);
    }
  };

  // Reset form to clean template
  const handleResetForm = () => {
    setStudentName('');
    setStudentClass('Class 8');
    setStudentDivision('A');
    setStudentPhone('');
    setStudentId('');
    setProgramme(receiptSettings.programme || 'Special Training Programme');
    setSport(receiptSettings.sport || 'Football');
    setOtherSportText('');
    setIncludeAdmissionFee(true);
    const parsedFee = parseInt(receiptSettings.admissionFee.replace(/\D/g, '') || '1000', 10);
    setAdmissionFeeAmount(parsedFee);
    setIncludeMonthlyFee(false);
    setMonthlyFeeAmount(2500);
    setPaymentStatus('Paid');
    setPartialAmountPaid(parsedFee);
    setPaymentDate(todayStr);
    setPaymentMethod('UPI');
    setOtherMethodText('');
    setRemarks('');
    setErrorMessage(null);
  };

  // Compute live payment figures
  const effectiveSport = sport === 'Other' ? (otherSportText.trim() || 'Sports') : sport;
  const effectiveMethod = paymentMethod === 'Other' ? (otherMethodText.trim() || 'Other') : paymentMethod;

  const admissionComponent = includeAdmissionFee ? Math.max(0, admissionFeeAmount) : 0;
  const monthlyComponent = includeMonthlyFee ? Math.max(0, monthlyFeeAmount) : 0;

  const { totalDue, amountPaid, balanceDue, computedStatus } = calculatePaymentTotals(
    admissionComponent,
    monthlyComponent,
    paymentStatus,
    partialAmountPaid
  );

  const receiptNumber = useMemo(() => {
    return calculateReceiptNumber(0, receiptSettings.prefix, receiptSettings.startingNo);
  }, [receiptSettings.prefix, receiptSettings.startingNo]);

  const receiptType: ReceiptType = programme.toLowerCase().includes('scholarship')
    ? 'Scholarship'
    : 'Standard Training Program';

  // Live Student Object
  const currentStudent: Student = useMemo(() => ({
    id: 'current-student',
    slNo: 1,
    studentName: studentName.trim() || 'STUDENT NAME',
    studentId: studentId.trim() || undefined,
    className: studentClass.trim() || 'Class 8',
    division: studentDivision.trim() || undefined,
    programme: programme,
    receiptType: receiptType,
    sport: effectiveSport,
    phone: studentPhone.trim() || undefined,
    paymentDate: paymentDate,
    amount: amountPaid,
    amountFormatted: `₹${amountPaid.toLocaleString('en-IN')}`,
    paymentStatus: computedStatus === 'Paid' ? 'Paid' : 'Unpaid',
  }), [
    studentName,
    studentId,
    studentClass,
    studentDivision,
    programme,
    receiptType,
    effectiveSport,
    studentPhone,
    paymentDate,
    amountPaid,
    computedStatus,
  ]);

  // Live Payment Object
  const currentPayment: Payment = useMemo(() => ({
    id: 'current-payment',
    receiptNumber: receiptNumber,
    studentId: currentStudent.id,
    studentName: currentStudent.studentName,
    studentClass: currentStudent.className,
    division: currentStudent.division,
    phone: currentStudent.phone,
    programme: currentStudent.programme,
    receiptType: currentStudent.receiptType,
    sport: currentStudent.sport,
    paymentDate: paymentDate,
    admissionFee: admissionComponent,
    monthlyFee: monthlyComponent,
    totalDue: totalDue,
    amountPaid: amountPaid,
    balanceDue: balanceDue,
    paymentStatus: computedStatus,
    paymentMethod: effectiveMethod,
    remarks: remarks.trim() || undefined,
    createdAt: new Date(),
  }), [
    receiptNumber,
    currentStudent,
    paymentDate,
    admissionComponent,
    monthlyComponent,
    totalDue,
    amountPaid,
    balanceDue,
    computedStatus,
    effectiveMethod,
    remarks,
  ]);

  // Validation
  const validateForm = (): boolean => {
    if (!studentName.trim()) {
      setErrorMessage('Please enter a student name.');
      return false;
    }
    if (!includeAdmissionFee && !includeMonthlyFee) {
      setErrorMessage('Please include at least one fee component (Admission Fee or Monthly Fee).');
      return false;
    }
    if (amountPaid <= 0) {
      setErrorMessage('Amount paid must be greater than ₹0.');
      return false;
    }
    setErrorMessage(null);
    return true;
  };

  // Preview Receipt Trigger
  const handlePreviewReceipt = () => {
    if (!validateForm()) return;
    setIsPreviewOpen(true);
  };

  // Direct PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!validateForm()) return;
    setIsGeneratingPdf(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
      const { blob, filename } = await generatePdfBlob({
        student: currentStudent,
        payment: currentPayment,
        receiptNumber: receiptNumber,
        admissionFee: admissionComponent,
        receiptType: receiptType,
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err: unknown) {
      console.error('Download error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF.';
      setErrorMessage(msg);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // WhatsApp Share Handler
  const handleSendWhatsApp = async () => {
    if (!validateForm()) return;
    setIsSharingWhatsApp(true);
    setErrorMessage(null);

    try {
      const result = await sendReceiptViaWhatsApp({
        student: currentStudent,
        payment: currentPayment,
        receiptNumber: receiptNumber,
        admissionFee: admissionComponent,
        receiptType: receiptType,
        phone: studentPhone,
      });

      if (result.cancelled) {
        return;
      }

      if (result.success) {
        setShareSuccessNotice(result);
      }
    } catch (err: unknown) {
      console.error('WhatsApp send error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to send receipt via WhatsApp.';
      setErrorMessage(msg);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 text-slate-900 font-sans">
      {/* 1. Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetForm={handleResetForm}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-xs sm:text-sm shadow-sm animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 block">Action Incomplete</span>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs sm:text-sm shadow-sm animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">Official A4 Receipt PDF downloaded successfully.</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-sm space-y-6">
          
          {/* Form Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Fee Receipt Form
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Enter student payment details below to generate, download, or share an official receipt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Receipt No:</span>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {receiptNumber}
              </span>
            </div>
          </div>

          {/* 1. Student Details Section */}
          <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Student & Parent Details</span>
            </label>

            {/* Name, Class, Division */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEENAKSHI VINOOP"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Class 8"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-xs"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Division
                </label>
                <input
                  type="text"
                  placeholder="A"
                  value={studentDivision}
                  onChange={(e) => setStudentDivision(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-xs uppercase"
                />
              </div>
            </div>

            {/* WhatsApp Phone & Admission ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recipient WhatsApp Phone *</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Used by <strong>Send via WhatsApp</strong> to message the parent directly.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admission No. / Student ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. LIPS/2026/042"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Programme & Sport Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programme / Receipt Type *
              </label>
              <select
                value={programme}
                onChange={(e) => setProgramme(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Special Training Programme">Special Training Programme</option>
                <option value="Scholarship">Scholarship</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sport
              </label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Football">Football</option>
                <option value="Kho Kho">Kho Kho</option>
                <option value="Swimming">Swimming</option>
                <option value="Other">Other</option>
              </select>
              {sport === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify sport"
                  value={otherSportText}
                  onChange={(e) => setOtherSportText(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>

          {/* 3. Fee Breakdown Components */}
          <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Fee Components
            </label>

            {/* Admission Fee Component */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAdmissionFee}
                  onChange={(e) => setIncludeAdmissionFee(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">Admission Fee</span>
                  <span className="text-[11px] text-slate-500">Registration / Programme Admission</span>
                </div>
              </label>

              {includeAdmissionFee && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={admissionFeeAmount}
                    onChange={(e) => setAdmissionFeeAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs sm:text-sm font-mono font-bold text-slate-800 text-right outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Monthly / Training Fee Component */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeMonthlyFee}
                  onChange={(e) => setIncludeMonthlyFee(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 block">Monthly / Training Fee</span>
                  <span className="text-[11px] text-slate-500">Regular sports coaching / training fee</span>
                </div>
              </label>

              {includeMonthlyFee && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={monthlyFeeAmount}
                    onChange={(e) => setMonthlyFeeAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    className="w-28 bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs sm:text-sm font-mono font-bold text-slate-800 text-right outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4. Payment Status & Partial Handling */}
          <div className="bg-slate-50/80 rounded-xl p-4 sm:p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Payment Status
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="Paid"
                    checked={paymentStatus === 'Paid'}
                    onChange={() => setPaymentStatus('Paid')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Paid (Full)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value="Partial"
                    checked={paymentStatus === 'Partial'}
                    onChange={() => {
                      setPaymentStatus('Partial');
                      if (partialAmountPaid <= 0 || partialAmountPaid > totalDue) {
                        setPartialAmountPaid(Math.min(totalDue, 1000));
                      }
                    }}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Partial Payment</span>
                </label>
              </div>
            </div>

            {paymentStatus === 'Partial' && (
              <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-bold text-amber-900">
                    Amount Paid Now:
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-800">₹</span>
                    <input
                      type="number"
                      min="1"
                      max={totalDue}
                      value={partialAmountPaid}
                      onChange={(e) => setPartialAmountPaid(parseInt(e.target.value || '0', 10))}
                      className="w-28 bg-white border border-amber-300 rounded-lg p-1.5 text-xs sm:text-sm font-mono font-bold text-amber-900 text-right outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-amber-800 pt-1 border-t border-amber-200/60 font-medium">
                  <span>Calculated Balance Due:</span>
                  <strong className="text-rose-700 font-mono font-bold">
                    ₹{balanceDue.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 5. Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Payment Date *</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>Payment Method *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>

              {paymentMethod === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify payment method"
                  value={otherMethodText}
                  onChange={(e) => setOtherMethodText(e.target.value)}
                  className="mt-1.5 w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          </div>

          {/* 6. Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Admission and October month fee received"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs sm:text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 7. Summary Ribbon */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-medium text-slate-300">
                Total Due: <strong className="text-white font-mono">₹{totalDue.toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-medium text-emerald-300">
                Paid: <strong className="font-mono text-emerald-400">₹{amountPaid.toLocaleString('en-IN')}</strong>
              </span>
              {balanceDue > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="font-medium text-amber-300">
                    Balance: <strong className="font-mono text-amber-400">₹{balanceDue.toLocaleString('en-IN')}</strong>
                  </span>
                </>
              )}
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Status: <strong className={computedStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}>{computedStatus}</strong>
            </span>
          </div>

          {/* 8. Action Buttons Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Secondary Action: Clear */}
            <div>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer w-full sm:w-auto"
                title="Clear all fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
            </div>

            {/* Primary Actions: Preview Receipt, Send via WhatsApp, Download PDF */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              
              {/* PREVIEW RECEIPT BUTTON */}
              <button
                type="button"
                onClick={handlePreviewReceipt}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Eye className="w-4 h-4 text-slate-600" />
                <span>Preview Receipt</span>
              </button>

              {/* SEND VIA WHATSAPP BUTTON */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={isSharingWhatsApp || isGeneratingPdf}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-950/20 hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isSharingWhatsApp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Send via WhatsApp</span>
                  </>
                )}
              </button>

              {/* DOWNLOAD PDF BUTTON */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf || isSharingWhatsApp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

            </div>

          </div>

        </div>

      </main>

      {/* =========================================================
          RECEIPT PREVIEW MODAL (Triggered by 'Preview Receipt')
      ========================================================= */}
      {isPreviewOpen && (
        <ReceiptPreview
          student={currentStudent}
          receiptNumber={receiptNumber}
          admissionFee={admissionComponent}
          payment={currentPayment}
          receiptType={receiptType}
          phone={studentPhone}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      {/* =========================================================
          RECEIPT SETTINGS MODAL
      ========================================================= */}
      <ReceiptSettings
        settings={receiptSettings}
        onChange={handleReceiptSettingChange}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* =========================================================
          WHATSAPP SHARE FEEDBACK / FALLBACK MODAL
      ========================================================= */}
      {shareSuccessNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#25D366] shrink-0">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {shareSuccessNotice.method === 'native-share'
                      ? 'Receipt Shared Successfully'
                      : 'PDF Downloaded & WhatsApp Web Opened'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {shareSuccessNotice.method === 'native-share'
                      ? 'The receipt file was passed to your device sharing dialog.'
                      : 'Follow the steps below to attach your PDF.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShareSuccessNotice(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareSuccessNotice.method === 'whatsapp-web-fallback' ? (
              <div className="space-y-3 text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">PDF Downloaded:</span>
                    <p className="text-slate-600 text-xs font-mono mt-0.5">
                      {shareSuccessNotice.filename}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">WhatsApp Web Opened:</span>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {shareSuccessNotice.formattedPhone
                        ? `Chat opened for +${shareSuccessNotice.formattedPhone} with prefilled receipt details.`
                        : 'WhatsApp Web opened with prefilled receipt details.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="font-bold text-emerald-600 bg-emerald-100 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-slate-900">Manual File Attachment:</span>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      Desktop web browsers do not allow web apps to directly attach files to WhatsApp Web chat. Simply drag the downloaded PDF into the chat or click the 📎 paperclip attachment icon.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                Receipt PDF and summary message sent to sharing provider.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShareSuccessNotice(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Little India Public School. Special Training Programme Fee Receipt Portal.</p>
        </div>
      </footer>
    </div>
  );
}
