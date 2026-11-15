"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pill, AlertTriangle } from "lucide-react";
import { Medication, MedicationForm, MealInstruction } from "@/types/kincare";

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Partial<Medication>) => void;
  medicationToEdit?: Medication | null;
}

const FORM_OPTIONS: MedicationForm[] = ["Tablet", "Capsule", "Drops", "Inhaler", "Syrup"];
const INSTRUCTION_OPTIONS: MealInstruction[] = [
  "Empty Stomach",
  "After Breakfast",
  "With Lunch",
  "After Lunch",
  "After Dinner",
  "Before Sleep",
  "With Food",
];

interface FormInnerProps {
  medicationToEdit?: Medication | null;
  onClose: () => void;
  onSave: (med: Partial<Medication>) => void;
}

const MedicationFormInner: React.FC<FormInnerProps> = ({ medicationToEdit, onClose, onSave }) => {
  const [name, setName] = useState(medicationToEdit?.name || "");
  const [dosage, setDosage] = useState(medicationToEdit?.dosage || "");
  const [form, setForm] = useState<MedicationForm>(medicationToEdit?.form || "Tablet");
  const [instructions, setInstructions] = useState<MealInstruction>(
    medicationToEdit?.instructions || "After Breakfast"
  );
  const [time, setTime] = useState(medicationToEdit?.scheduledTimes[0] || "08:00");
  const [stock, setStock] = useState(medicationToEdit?.stockRemaining ?? 30);
  const [refillThreshold, setRefillThreshold] = useState(medicationToEdit?.refillThreshold ?? 10);
  const [conflictNote, setConflictNote] = useState(medicationToEdit?.conflictNote || "");
  const [purpose, setPurpose] = useState(medicationToEdit?.purpose || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: medicationToEdit?.id,
      name: name.trim(),
      dosage: dosage.trim() || "1 dose",
      form,
      instructions,
      scheduledTimes: [time],
      stockRemaining: Number(stock) || 0,
      refillThreshold: Number(refillThreshold) || 5,
      conflictNote: conflictNote.trim() || undefined,
      purpose: purpose.trim() || undefined,
      active: medicationToEdit?.active !== undefined ? medicationToEdit.active : true,
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Medication Brand / Generic Name *
        </label>
        <input
          type="text"
          required
          placeholder="e.g., Amlodipine Besylate"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Dosage *
          </label>
          <input
            type="text"
            required
            placeholder="e.g., 5 mg or 50 mcg"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Dosage Form
          </label>
          <select
            value={form}
            onChange={(e) => setForm(e.target.value as MedicationForm)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none bg-white"
          >
            {FORM_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Meal Instruction
          </label>
          <select
            value={instructions}
            onChange={(e) => setInstructions(e.target.value as MealInstruction)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none bg-white"
          >
            {INSTRUCTION_OPTIONS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Daily Intake Time
          </label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Stock Units Remaining
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Refill Alert Threshold
          </label>
          <input
            type="number"
            min="1"
            value={refillThreshold}
            onChange={(e) => setRefillThreshold(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
          Clinical Purpose / Condition
        </label>
        <input
          type="text"
          placeholder="e.g., Blood pressure control"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Timing Guard & Spacing Precaution Note
        </label>
        <input
          type="text"
          placeholder="e.g., Space 2 hours apart from Calcium or antacids"
          value={conflictNote}
          onChange={(e) => setConflictNote(e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition shadow-sm"
        >
          {medicationToEdit ? "Update Medication" : "Save Prescription"}
        </button>
      </div>
    </form>
  );
};

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  medicationToEdit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {medicationToEdit ? "Edit Prescription" : "Add New Medication"}
              </h3>
              <p className="text-xs text-slate-500">Configure dosage, timing rules, and inventory count</p>
            </div>
          </div>

          <MedicationFormInner
            key={medicationToEdit?.id || "new_med"}
            medicationToEdit={medicationToEdit}
            onClose={onClose}
            onSave={onSave}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
