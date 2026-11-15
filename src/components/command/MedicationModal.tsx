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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="medNameInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
          Medication Brand / Generic Name *
        </label>
        <input
          id="medNameInput"
          type="text"
          required
          placeholder="e.g., Amlodipine Besylate"
          aria-label="Medication Brand or Generic Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="medDosageInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Dosage *
          </label>
          <input
            id="medDosageInput"
            type="text"
            required
            placeholder="e.g., 5 mg or 50 mcg"
            aria-label="Dosage"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
          />
        </div>

        <div>
          <label htmlFor="medFormSelect" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Dosage Form
          </label>
          <select
            id="medFormSelect"
            value={form}
            aria-label="Dosage Form"
            onChange={(e) => setForm(e.target.value as MedicationForm)}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
          >
            {FORM_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="medMealSelect" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Meal Instruction
          </label>
          <select
            id="medMealSelect"
            value={instructions}
            aria-label="Meal Instruction"
            onChange={(e) => setInstructions(e.target.value as MealInstruction)}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
          >
            {INSTRUCTION_OPTIONS.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="medTimeInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Daily Intake Time
          </label>
          <input
            id="medTimeInput"
            type="time"
            required
            aria-label="Daily Intake Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label htmlFor="medStockInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Stock Units Remaining
          </label>
          <input
            id="medStockInput"
            type="number"
            min="0"
            value={stock}
            aria-label="Stock Units Remaining"
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition font-mono"
          />
        </div>

        <div>
          <label htmlFor="medThresholdInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Refill Alert Threshold
          </label>
          <input
            id="medThresholdInput"
            type="number"
            min="1"
            value={refillThreshold}
            aria-label="Refill Alert Threshold"
            onChange={(e) => setRefillThreshold(Number(e.target.value))}
            className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition font-mono"
          />
        </div>
      </div>

      <div>
        <label htmlFor="medPurposeInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
          Clinical Purpose / Condition
        </label>
        <input
          id="medPurposeInput"
          type="text"
          placeholder="e.g., Blood pressure control"
          aria-label="Clinical Purpose or Condition"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
        />
      </div>

      <div>
        <label htmlFor="medConflictInput" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Timing Guard & Spacing Precaution Note
        </label>
        <input
          id="medConflictInput"
          type="text"
          placeholder="e.g., Space 2 hours apart from Calcium or antacids"
          aria-label="Timing Guard and Spacing Precaution Note"
          value={conflictNote}
          onChange={(e) => setConflictNote(e.target.value)}
          className="w-full px-5 py-3 bg-slate-50/70 ring-1 ring-slate-900/10 rounded-full text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none transition"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel prescription editing"
          className="px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-98"
        >
          Cancel
        </button>
        <button
          type="submit"
          aria-label={medicationToEdit ? "Update Medication" : "Save Prescription"}
          className="px-7 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/20 active:scale-98"
        >
          {medicationToEdit ? "Update Medication" : "Save Prescription"}
        </button>
      </div>
    </form>
  );
};

/**
 * MedicationModal Component
 * 
 * Provides an accessible modal dialog for adding or editing patient prescriptions.
 * Configures clinical metadata, dosage amounts, dosage forms, schedule times,
 * inventory counts, and timing guard spacing rules.
 * 
 * @param {MedicationModalProps} props - Component properties
 * @returns {React.ReactElement | null} The rendered modal dialog
 */
export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  medicationToEdit,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="bg-white rounded-3xl shadow-[0_25px_60px_rgb(0,0,0,0.14)] ring-1 ring-slate-900/5 max-w-lg w-full p-8 sm:p-10 relative max-h-[90vh] overflow-y-auto"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close medication modal"
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {medicationToEdit ? "Edit Prescription" : "Add Medication"}
              </h3>
              <p className="text-xs text-slate-500 font-normal">Configure dosage, timing rules, and inventory count</p>
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
