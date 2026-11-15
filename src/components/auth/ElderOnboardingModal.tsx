"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, KeyRound, Sparkles, Check } from "lucide-react";
import { PatientOnboardingInput } from "@/types/kincare";

interface ElderOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PatientOnboardingInput) => Promise<void>;
}

export const ElderOnboardingModal: React.FC<ElderOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [allergiesText, setAllergiesText] = useState("None known");
  const [primaryDoctor, setPrimaryDoctor] = useState("Dr. Arvind Swaminathan (Cardiology)");
  const [elderPin, setElderPin] = useState("4444");
  const [familyPin, setFamilyPin] = useState("8888");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please provide the elder's full name.");
      return;
    }
    if (!age || Number(age) < 50 || Number(age) > 120) {
      setErrorMsg("Please enter a realistic age between 50 and 120.");
      return;
    }
    if (!/^\d{4}$/.test(elderPin)) {
      setErrorMsg("Elder PIN must be exactly 4 digits (e.g. 4444).");
      return;
    }
    if (!/^\d{4}$/.test(familyPin)) {
      setErrorMsg("Family Admin PIN must be exactly 4 digits (e.g. 8888).");
      return;
    }

    const allergies = allergiesText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        name: name.trim(),
        age: Number(age),
        bloodGroup,
        allergies: allergies.length > 0 ? allergies : ["No Known Allergies"],
        primaryDoctor,
        elderPin,
        familyPin,
      });
      onClose();
    } catch {
      setErrorMsg("Failed to onboard new patient. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Register Elder Profile</span>
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </h2>
                <p className="text-xs text-slate-500">
                  Add a new elderly patient to the KinCare Care Circle network
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto py-5 space-y-4 flex-1 pr-1">
            {errorMsg && (
              <div className="p-3 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Elder Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kavita Ramanathan or Judge Test Patient"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Age *
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="e.g. 76"
                  required
                  min={50}
                  max={120}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
                >
                  {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Known Drug Allergies (Comma-separated)
              </label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, NSAIDs, Sulfa drugs"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Primary Physician / Hospital
              </label>
              <input
                type="text"
                value={primaryDoctor}
                onChange={(e) => setPrimaryDoctor(e.target.value)}
                placeholder="e.g. Dr. Arvind Swaminathan (Cardiology)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Passkey Setup Section */}
            <div className="bg-teal-50/60 border border-teal-100 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                <span>Custom Passcode Security Setup (4-Digit PINs)</span>
              </div>
              <p className="text-xs text-teal-800">
                Set unique PINs for this elder&apos;s Care Circle. The login keypad will automatically adapt to them!
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Elder PIN (for Companion Mode)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={elderPin}
                    onChange={(e) => setElderPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="4444"
                    className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl font-mono font-bold text-base text-center tracking-widest text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Family Admin PIN (Full Control)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={familyPin}
                    onChange={(e) => setFamilyPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="8888"
                    className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl font-mono font-bold text-base text-center tracking-widest text-slate-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{submitting ? "Creating Patient..." : "Create & Activate Profile"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
