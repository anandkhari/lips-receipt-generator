'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Download,
  FileText,
  Edit3,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Student, Payment, ReceiptType } from '@/lib/types';
import ReceiptTemplate from './ReceiptTemplate';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import { sendReceiptViaWhatsApp, WhatsAppShareResult } from '@/lib/whatsapp';

interface ReceiptPreviewProps {
  student: Student;
  receiptNumber: string;
  admissionFee: number;
  payment?: Payment;
  receiptType?: ReceiptType;
  phone?: string;
  onClose: () => void;
  onEditPayment?: (payment: Payment) => void;
}

export default function ReceiptPreview({
  student,
  receiptNumber,
  admissionFee,
  payment,
  receiptType,
  phone,
  onClose,
  onEditPayment,
}: ReceiptPreviewProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WhatsApp sharing states
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState<boolean>(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState<WhatsAppShareResult | null>(null);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shareSuccessNotice) {
          setShareSuccessNotice(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, shareSuccessNotice]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(1.6, Math.round((prev + 0.1) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleFitToScreen = useCallback(() => {
    if (!mainContainerRef.current) return;
    const containerHeight = mainContainerRef.current.clientHeight;
    const containerWidth = mainContainerRef.current.clientWidth;

    // Approximate A4 dimensions in px at 96 DPI: ~794px width, ~1123px height
    const targetHeight = 1123 + 48; // with padding
    const targetWidth = 794 + 48;

    const scaleY = containerHeight / targetHeight;
    const scaleX = containerWidth / targetWidth;
    const bestFit = Math.max(0.4, Math.min(1.2, Math.min(scaleX, scaleY)));

    setZoom(Math.round(bestFit * 100) / 100);
  }, []);

  // Set initial fit on smaller screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      handleFitToScreen();
    }
  }, [handleFitToScreen]);

  // Frontend PDF download handler
  const handleDownloadPdf = async () => {
    if (isGenerating || isSharingWhatsApp) return;

    if (!student || !student.studentName?.trim()) {
      setErrorMessage('Please provide a valid student name before downloading the PDF.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setDownloadSuccess(false);

    try {
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
        let errText = 'Unable to generate PDF. Please try again.';
        try {
          const errData = await response.json();
          if (errData?.error) errText = errData.error;
        } catch {
          // not JSON
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

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadSuccess(true);
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 5000);
    } catch (err: unknown) {
      console.error('PDF download error:', err);
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Unable to generate PDF. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // WhatsApp share handler
  const handleSendWhatsApp = async () => {
    if (isSharingWhatsApp || isGenerating) return;

    if (!student || !student.studentName?.trim()) {
      setErrorMessage('Please provide a student name before sharing.');
      return;
    }

    setIsSharingWhatsApp(true);
    setErrorMessage(null);

    try {
      const result = await sendReceiptViaWhatsApp({
        student,
        payment,
        receiptNumber,
        admissionFee,
        receiptType,
        phone: phone || payment?.phone || student.phone,
      });

      if (result.cancelled) {
        // User closed native share dialog
        return;
      }

      if (result.success) {
        setShareSuccessNotice(result);
      }
    } catch (err: unknown) {
      console.error('WhatsApp share failed:', err);
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to share receipt via WhatsApp.';
      setErrorMessage(msg);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-preview-title"
    >
      {/* =========================================================
          TOP BAR (HEADER)
      ========================================================= */}
      <header className="shrink-0 h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-10 shadow-md">
        {/* LEFT: Title & Receipt Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2
              id="receipt-preview-title"
              className="text-sm sm:text-base font-bold text-white tracking-tight truncate"
            >
              Receipt Preview
            </h2>
            <p className="text-xs text-slate-400 truncate">
              <span className="font-semibold text-emerald-400">{receiptNumber}</span>
              <span className="mx-1.5 opacity-40">•</span>
              <span className="text-slate-300 font-medium">{student.studentName}</span>
            </p>
          </div>
        </div>

        {/* CENTER: Zoom Controls */}
        <div className="hidden md:flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg p-1 text-slate-300">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 0.4}
            className="p-1.5 rounded hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom Out (-10%)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs font-semibold rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer min-w-[50px] text-center"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 1.6}
            className="p-1.5 rounded hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom In (+10%)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={handleFitToScreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
            title="Reset 100%"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* RIGHT: Close X */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer text-xs font-medium"
            title="Close Preview (Esc)"
            aria-label="Close Preview"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 rounded text-slate-400">
              Esc
            </kbd>
          </button>
        </div>
      </header>

      {/* =========================================================
          MAIN WORKSPACE: A4 RECEIPT CANVAS
      ========================================================= */}
      <main
        ref={mainContainerRef}
        className="flex-1 overflow-auto bg-slate-900/90 p-4 sm:p-8 flex justify-center items-start"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="transition-transform duration-150 origin-top flex justify-center py-2"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            marginBottom: zoom > 1 ? `${(zoom - 1) * 1150}px` : '24px',
          }}
        >
          {/* Authentic A4 Document Card */}
          <div className="bg-white rounded-xs shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.1)] overflow-visible">
            <ReceiptTemplate
              student={student}
              receiptNumber={receiptNumber}
              admissionFee={admissionFee}
              payment={payment}
              receiptType={receiptType}
            />
          </div>
        </div>
      </main>

      {/* =========================================================
          FOOTER BAR
      ========================================================= */}
      <footer className="shrink-0 h-16 bg-slate-900 border-t border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3 z-10">
        {/* Left Actions: Close & Edit Payment */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            Close
          </button>

          {payment && onEditPayment && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditPayment(payment);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-800/80 border border-slate-700 rounded-lg hover:bg-slate-700 hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Edit Details</span>
            </button>
          )}
        </div>

        {/* Center: Feedback / Status message */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
          {isGenerating ? (
            <div className="flex items-center gap-2 text-amber-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Rendering PDF document...</span>
            </div>
          ) : isSharingWhatsApp ? (
            <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Preparing WhatsApp receipt...</span>
            </div>
          ) : downloadSuccess ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>PDF downloaded successfully.</span>
            </div>
          ) : errorMessage ? (
            <div className="flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div className="text-slate-400 text-xs">
              <span>Standard A4 Portrait • 210 × 297 mm</span>
            </div>
          )}
        </div>

        {/* Right Actions: Send WhatsApp & Download PDF */}
        <div className="flex items-center gap-2.5">
          {errorMessage && (
            <div className="sm:hidden text-xs text-rose-400 mr-2 truncate max-w-[120px]">
              {errorMessage}
            </div>
          )}

          {/* Send via WhatsApp Button */}
          <button
            type="button"
            onClick={handleSendWhatsApp}
            disabled={isSharingWhatsApp || isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1caa51] text-white transition-all cursor-pointer shadow-md shadow-emerald-950/40 active:scale-95 disabled:opacity-50"
            title="Send receipt PDF via WhatsApp"
          >
            {isSharingWhatsApp ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <WhatsAppIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Send via</span>
                <span>WhatsApp</span>
              </>
            )}
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGenerating || isSharingWhatsApp}
            className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg active:scale-95 ${
              isGenerating
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed opacity-80'
                : downloadSuccess
                ? 'bg-emerald-700 text-white hover:bg-emerald-600 ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* =========================================================
          WHATSAPP SHARE NOTIFICATION MODAL (Desktop Fallback)
      ========================================================= */}
      {shareSuccessNotice && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
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
                      : 'Receipt PDF Downloaded & WhatsApp Web Opened'}
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
    </div>
  );
}
