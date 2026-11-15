"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock, HeartHandshake, ShieldAlert, AlertCircle, Utensils, MessageSquare } from "lucide-react";
import { Medication } from "@/types/kincare";

interface ReasonSelectorModalProps {
  medication: Medication | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReason: (reason: string, customNote?: string) => void;
}

const PRESET_REASONS = [
  {
    id: "after_food",
    icon: Utensils,
    title: "Taking after food / meal",
    desc: "Waiting for breakfast or lunch to settle before swallowing.",
  },
  {
    id: "unwell",
    icon: AlertCircle,
    title: "Feeling slightly dizzy / unwell",
    desc: "Need 20–30 minutes to rest before taking this pill.",
  },
  {
    id: "delay_30",
    icon: Clock,
    title: "Postponing 30 minutes",
    desc: "Busy with morning routine or just finished tea.",
  },
  {
    id: "doctor_advised",
    icon: ShieldAlert,
    title: "Doctor advised temporary pause",
    desc: "Physician instructed to hold pending today's checkup.",
  },
];

export const ReasonSelectorModal: React.FC<ReasonSelectorModalProps> = ({
  medication,
  isOpen,
  onClose,
  onSubmitReason,
}) => {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0].title);
  const [customNote, setCustomNote] = useState("");

  if (!isOpen || !medication) return null;

  const handleSubmit = () => {
    onSubmitReason(selectedReason, customNote.trim() || undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl shadow-[0_25px_60px_rgb(0,0,0,0.14)] ring-1 ring-slate-900/5 max-w-lg w-full p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Postpone Dose</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {medication.name} ({medication.dosage})
              </p>
            </div>
          </div>

          {/* Autonomy Assurance Banner */}
          <div className="bg-teal-50/70 ring-1 ring-teal-600/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-teal-900 leading-snug font-medium">
              <strong className="font-bold">Autonomy first.</strong> We notify Anita and Nurse Priya of your reason with context,
              avoiding false emergency alarms.
            </div>
          </div>

          {/* Reason Selector Options (Touch-friendly 1-tap) */}
          <div className="space-y-2.5 mb-6">
            {PRESET_REASONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedReason === item.title;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReason(item.title)}
                  className={`w-full text-left p-4 rounded-2xl transition flex items-center justify-between ${
                    isSelected
                      ? "bg-teal-50/60 ring-2 ring-teal-600 shadow-2xs"
                      : "bg-white hover:bg-slate-50 ring-1 ring-slate-900/5"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-teal-600 text-white shadow-2xs" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-teal-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Optional Note Input */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Optional Note for Family
            </label>
            <input
              type="text"
              placeholder="e.g., Blood pressure was 130/80, taking at 10:30 AM after porridge"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-sm font-medium focus:outline-none bg-slate-50/70 ring-1 ring-slate-900/10 focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>

          {/* Action Buttons (Pill-shaped with hover lift) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition active:scale-98"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3.5 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 active:scale-98"
            >
              Confirm & Notify
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
