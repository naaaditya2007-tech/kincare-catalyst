"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Delete, Sparkles, ChevronDown, Check, UserPlus } from "lucide-react";
import { Role, ElderProfile, PatientRecord, PatientOnboardingInput } from "@/types/kincare";
import { ElderOnboardingModal } from "./ElderOnboardingModal";

interface PasscodeGateProps {
  elderProfile: ElderProfile;
  onSuccess: (role: Role) => void;
  onPatientChange?: (newProfile: ElderProfile) => void;
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({
  elderProfile,
  onSuccess,
  onPatientChange,
}) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  // Multi-patient states
  const [patientsList, setPatientsList] = useState<ElderProfile[]>([elderProfile]);
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ElderProfile>(elderProfile);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  // Fetch all registered patients and records
  useEffect(() => {
    let isCancelled = false;
    fetch("/api/kincare")
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled || !data?.success) return;
        if (data.allPatients && data.allPatients.length > 0) {
          setPatientsList(data.allPatients);
          const current =
            data.allPatients.find(
              (p: ElderProfile) => p.id === data.state?.activePatientId
            ) || data.allPatients[0];
          setSelectedPatient(current);
          if (onPatientChange) onPatientChange(current);
        }
        if (data.patientRecords) {
          setPatientRecords(data.patientRecords);
        }
      })
      .catch((err) => {
        console.warn("Failed to load patient records:", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [onPatientChange]);

  // Derived current patient record for dynamic PINs
  const currentRecord = patientRecords.find(
    (p) => p.elderProfile.id === selectedPatient.id
  );

  const elderPin =
    currentRecord?.careCircle.find((m) => m.role === "ELDER")?.passcode || "1111";
  const familyPin =
    currentRecord?.careCircle.find((m) => m.role === "FAMILY_ADMIN")?.passcode || "2222";
  const caretakerPin =
    currentRecord?.careCircle.find((m) => m.role === "CARETAKER")?.passcode || "3333";

  const verifyPin = useCallback(
    async (passcodeToTest: string) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passcode: passcodeToTest,
            patientId: selectedPatient.id,
          }),
        });
        const data = await res.json();
        if (data.success && data.member) {
          setLoading(false);
          setPin("");
          onSuccess(data.member.role);
        } else {
          setErrorMsg(data.error || "Incorrect 4-digit passcode");
          setShakeKey((prev) => prev + 1);
          setPin("");
          setLoading(false);
        }
      } catch {
        setErrorMsg("Failed to authenticate. Please try again.");
        setShakeKey((prev) => prev + 1);
        setPin("");
        setLoading(false);
      }
    },
    [onSuccess, selectedPatient.id]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (loading) return;
      setErrorMsg(null);
      setPin((prevPin) => {
        if (prevPin.length >= 4) return prevPin;
        const nextPin = prevPin + digit;
        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
        return nextPin;
      });
    },
    [loading, verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  }, [loading]);

  const handleClear = useCallback(() => {
    if (loading) return;
    setPin("");
    setErrorMsg(null);
  }, [loading]);

  // Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  // 1-Click Auto Login with dynamic PINs
  const handleQuickUnlock = async (role: Role, code: string) => {
    if (loading) return;
    setLoading(false);
    setErrorMsg(null);
    setPin(code);
    await verifyPin(code);
  };

  const handleSelectPatient = (patient: ElderProfile) => {
    setSelectedPatient(patient);
    setPatientDropdownOpen(false);
    setPin("");
    setErrorMsg(null);
    if (onPatientChange) onPatientChange(patient);
  };

  const handleOnboardNewPatient = async (input: PatientOnboardingInput) => {
    try {
      const res = await fetch("/api/kincare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_PATIENT", patientData: input }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.allPatients) setPatientsList(data.allPatients);
        if (data.patientRecords) setPatientRecords(data.patientRecords);
        if (data.newPatient) {
          setSelectedPatient(data.newPatient.elderProfile);
          if (onPatientChange) onPatientChange(data.newPatient.elderProfile);
        }
      }
    } catch (err) {
      console.error("Failed to register patient:", err);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center">
      {/* Header Typography */}
      <div className="text-left mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-widest mb-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Care Vault Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed mt-1">
          Select an elder profile and enter your 4-digit passkey.
        </p>
      </div>

      {/* Dynamic Patient Selector Dropdown */}
      <div className="relative mb-3.5">
        <button
          type="button"
          onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
          className="w-full flex items-center justify-between p-2.5 px-4 rounded-full bg-slate-50 hover:bg-slate-100/90 ring-1 ring-slate-900/5 text-xs transition active:scale-[0.99] group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
              {selectedPatient.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="truncate text-left">
              <span className="font-extrabold text-slate-900 tracking-tight">{selectedPatient.name}</span>
              <span className="text-slate-300 mx-1.5">•</span>
              <span className="text-slate-600 font-medium">Age {selectedPatient.age}</span>
              <span className="text-slate-300 mx-1.5">•</span>
              <span className="font-extrabold text-teal-700">{selectedPatient.bloodGroup}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 ring-1 ring-teal-500/20 px-2.5 py-0.5 rounded-full">
              Switch
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
          </div>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {patientDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.08)] ring-1 ring-slate-900/5 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto"
            >
              <div className="p-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/70">
                Registered Elder Profiles ({patientsList.length})
              </div>

              {patientsList.map((patient) => {
                const isSelected = patient.id === selectedPatient.id;
                return (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full p-3 px-4 flex items-center justify-between text-xs text-left hover:bg-slate-50 transition ${
                      isSelected ? "bg-teal-50/50 font-bold text-teal-900" : "text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                          isSelected ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {patient.name[0]}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-slate-900">{patient.name}</div>
                        <div className="text-[10px] text-slate-600 font-medium leading-relaxed">
                          Age {patient.age} • {patient.bloodGroup} • {patient.allergies[0] || "No allergies"}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                );
              })}

              <div className="p-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setPatientDropdownOpen(false);
                    setOnboardingOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-900/20"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Onboard Another Elder Profile</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tactile 4-PIN Circles */}
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="flex justify-center items-center gap-3.5 my-3"
      >
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <motion.div
              key={index}
              animate={{ scale: isFilled ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                isFilled
                  ? "bg-slate-900 border-slate-900 shadow-xs"
                  : "border-slate-300 bg-white"
              }`}
            />
          );
        })}
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center text-xs font-semibold text-rose-600 mb-2.5 bg-rose-50 border border-rose-200 py-1 px-3 rounded-full"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fully Rounded Keypad (Tactile circular buttons with micro-border and hover lift) */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={loading || pin.length >= 4}
            className="w-14 h-14 mx-auto rounded-full bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xl transition-all duration-150 flex items-center justify-center shadow-xs ring-1 ring-slate-900/10 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-40"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || pin.length === 0}
          className="w-14 h-14 mx-auto rounded-full hover:bg-slate-100 text-slate-500 text-[11px] font-extrabold uppercase tracking-widest transition active:scale-95 disabled:opacity-30 flex items-center justify-center"
        >
          CLEAR
        </button>
        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={loading || pin.length >= 4}
          className="w-14 h-14 mx-auto rounded-full bg-white hover:bg-slate-50 text-slate-900 font-extrabold text-xl transition-all duration-150 flex items-center justify-center shadow-xs ring-1 ring-slate-900/10 hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={loading || pin.length === 0}
          className="w-14 h-14 mx-auto rounded-full hover:bg-slate-100 text-slate-500 transition flex items-center justify-center active:scale-95 disabled:opacity-30"
        >
          <Delete className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Dynamic 1-Click Auto Login Buttons (Reading actual PINs from selected patient) */}
      <div className="border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            1-Click Demo Quick Access
          </span>
          <span className="text-[10px] text-teal-700 font-bold truncate max-w-[130px]">
            {selectedPatient.name.split(" ")[0]}&apos;s Circle
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickUnlock("ELDER", elderPin)}
            disabled={loading}
            className="px-2 py-2 rounded-2xl bg-white hover:bg-slate-50 ring-1 ring-slate-900/5 shadow-2xs text-slate-800 text-[11px] font-semibold text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col items-center justify-center group active:scale-95"
          >
            <span className="font-extrabold text-slate-900 tracking-tight leading-tight">Elder View</span>
            <span className="text-[9px] text-teal-700 font-mono font-bold mt-0.5">PIN: {elderPin}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickUnlock("FAMILY_ADMIN", familyPin)}
            disabled={loading}
            className="px-2 py-2 rounded-2xl bg-white hover:bg-slate-50 ring-1 ring-slate-900/5 shadow-2xs text-slate-800 text-[11px] font-semibold text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col items-center justify-center group active:scale-95"
          >
            <span className="font-extrabold text-slate-900 tracking-tight leading-tight">Family Admin</span>
            <span className="text-[9px] text-indigo-700 font-mono font-bold mt-0.5">PIN: {familyPin}</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickUnlock("CARETAKER", caretakerPin)}
            disabled={loading}
            className="px-2 py-2 rounded-2xl bg-white hover:bg-slate-50 ring-1 ring-slate-900/5 shadow-2xs text-slate-800 text-[11px] font-semibold text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex flex-col items-center justify-center group active:scale-95"
          >
            <span className="font-extrabold text-slate-900 tracking-tight leading-tight">Caretaker</span>
            <span className="text-[9px] text-emerald-700 font-mono font-bold mt-0.5">PIN: {caretakerPin}</span>
          </button>
        </div>
      </div>

      {/* Sleek Secondary Action Button: Register New Elder Profile */}
      <div className="mt-3.5 text-center">
        <button
          type="button"
          onClick={() => setOnboardingOpen(true)}
          className="w-full py-2.5 px-4 rounded-full bg-teal-50/80 hover:bg-teal-100/90 text-teal-900 ring-1 ring-teal-600/20 text-xs font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.99]"
        >
          <UserPlus className="w-3.5 h-3.5 text-teal-600" />
          <span>+ Register New Elder Profile</span>
        </button>
      </div>

      {/* Onboarding Modal */}
      <ElderOnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSubmit={handleOnboardNewPatient}
      />
    </div>
  );
};
