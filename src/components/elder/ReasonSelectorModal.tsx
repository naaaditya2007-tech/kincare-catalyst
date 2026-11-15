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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Postpone or Skip Dose</h3>
              <p className="text-sm text-slate-500">
                {medication.name} ({medication.dosage})
              </p>
            </div>
          </div>

          {/* Autonomy Assurance Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 mb-5 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-teal-900 leading-snug">
              <strong>You remain in control.</strong> We share your reason with Anita and Nurse Priya with
              context, avoiding unnecessary emergency alarms.
            </div>
          </div>

          {/* Reason Selector Options (Touch-friendly 1-tap) */}
          <div className="space-y-2.5 mb-5">
            {PRESET_REASONS.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedReason === item.title;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedReason(item.title)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? "border-teal-600 bg-teal-50/50 ring-1 ring-teal-600"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-teal-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Optional Note Textarea */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Optional Note for Family (e.g., blood pressure reading or symptom)
            </label>
            <input
              type="text"
              placeholder="e.g., BP was 132/84, will take pill at 10:30 AM after porridge"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-sm"
            >
              Confirm Reason & Notify
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
