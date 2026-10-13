import React from 'react';
import { GraduationCap, Settings, RotateCcw, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onResetForm: () => void;
}

export default function Header({ onOpenSettings, onResetForm }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Left section: LIPS Crest & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-400/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
                  Manual Studio
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  In-Memory • No DB
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-0.5">
                Little India Public School
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                Special Training Programme — Official Fee Receipt Generator
              </p>
            </div>
          </div>

          {/* Right section: Settings & Reset Actions */}
          <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={onResetForm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer active:scale-95"
              title="Reset form fields to blank"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-950/30 transition-all cursor-pointer active:scale-95"
              title="Configure Receipt Prefix and Numbering"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Receipt Settings</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
