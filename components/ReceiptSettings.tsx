'use client';

import React from 'react';
import { Settings, Info, X } from 'lucide-react';
import { ReceiptSettingsData } from '@/lib/types';

interface ReceiptSettingsProps {
  settings: ReceiptSettingsData;
  onChange: (field: keyof ReceiptSettingsData, value: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ReceiptSettings({
  settings,
  onChange,
  isOpen = true,
  onClose,
}: ReceiptSettingsProps) {
  if (!isOpen) return null;

  const content = (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xl w-full max-w-md">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-900 text-white shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Receipt Settings
            </h3>
            <p className="text-xs text-slate-500">
              Configure parameters for receipt numbering
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Programme Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Default Programme
          </label>
          <input
            type="text"
            value={settings.programme}
            onChange={(e) => onChange('programme', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
          />
        </div>

        {/* Sport Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Default Sport
          </label>
          <select
            value={settings.sport}
            onChange={(e) => onChange('sport', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
          >
            <option value="">Select Sport</option>
            <option value="Football">Football</option>
            <option value="Kho Kho">Kho Kho</option>
            <option value="Swimming">Swimming</option>
          </select>
        </div>

        {/* Admission Fee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Default Admission Fee
          </label>
          <input
            type="text"
            value={settings.admissionFee}
            onChange={(e) => onChange('admissionFee', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
          />
        </div>

        {/* Receipt Prefix */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Receipt Prefix
          </label>
          <input
            type="text"
            value={settings.prefix}
            onChange={(e) => onChange('prefix', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
          />
        </div>

        {/* Starting Receipt Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Receipt Sequence Number
          </label>
          <input
            type="text"
            value={settings.startingNo}
            onChange={(e) => onChange('startingNo', e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-medium"
          />
        </div>
      </div>

      {/* Description Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-slate-600 text-xs">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-normal">
          Changes take effect immediately on current receipt and PDF generation.
        </p>
      </div>

      {onClose && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
        role="dialog"
        aria-modal="true"
      >
        {content}
      </div>
    );
  }

  return content;
}
