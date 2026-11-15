"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Check, X, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { Medication } from "@/types/kincare";

interface DoseCountdownToastProps {
  isOpen: boolean;
  medication: Medication | null;
  onTakeDose: (med: Medication) => Promise<void>;
  onDismiss: () => void;
  isTaking?: boolean;
}

export const DoseCountdownToast: React.FC<DoseCountdownToastProps> = ({
  isOpen,
  medication,
  onTakeDose,
  onDismiss,
  isTaking = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && medication && (
        <motion.div
          key="dose-toast"
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-teal-100/80 ring-1 ring-slate-900/5 relative overflow-hidden">
            {/* Top decorative teal glow */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600" />

            <div className="flex items-start justify-between gap-4">
              {/* Pulsing Icon and Live Alert Badge */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-12 w-12 rounded-full bg-teal-400 opacity-30 animate-ping" />
                  <div className="relative w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-900/20">
                    <Pill className="w-6 h-6 fill-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      Live Dose Alert
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Scheduled for {medication.scheduledTimes.join(", ")}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    Time for your {medication.name}
                  </h3>
                </div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={onDismiss}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dose Details */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-slate-700">
                <span>Dosage: <strong className="font-bold text-slate-900">{medication.dosage}</strong></span>
                <span className="text-slate-300">•</span>
                <span className="font-medium text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-md">
                  {medication.instructions}
                </span>
                {medication.purpose && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{medication.purpose}</span>
                  </>
                )}
              </div>

              {medication.conflictNote && (
                <div className="text-xs sm:text-sm bg-amber-50 text-amber-900 p-2.5 rounded-xl flex items-center gap-2 border border-amber-200/60">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{medication.conflictNote}</span>
                </div>
              )}
            </div>

            {/* Direct Action Inside Toast: "I Took This" */}
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="w-full sm:w-auto px-5 py-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition active:scale-98"
              >
                Remind Me Later
              </button>

              <button
                type="button"
                disabled={isTaking}
                onClick={async () => {
                  await onTakeDose(medication);
                  onDismiss();
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold text-base transition shadow-lg shadow-teal-900/25 flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-70"
              >
                {isTaking ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging Dose...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>I Took This</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
