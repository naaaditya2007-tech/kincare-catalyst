"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Delete, Sparkles } from "lucide-react";
import { Role, ElderProfile } from "@/types/kincare";

interface PasscodeGateProps {
  elderProfile: ElderProfile;
  onSuccess: (role: Role) => void;
}

export const PasscodeGate: React.FC<PasscodeGateProps> = ({ elderProfile, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const verifyPin = useCallback(async (passcodeToTest: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcodeToTest }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        onSuccess(data.member.role);
      } else {
        setErrorMsg(data.error || "Incorrect 4-digit passcode");
        setShakeKey((prev) => prev + 1);
        setPin("");
      }
    } catch {
      setErrorMsg("Failed to authenticate. Please try again.");
      setShakeKey((prev) => prev + 1);
      setPin("");
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  }, [pin, verifyPin]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  }, []);

  const handleClear = useCallback(() => {
    setPin("");
    setErrorMsg(null);
  }, []);

  // Keyboard support
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

  // Quick judge access handler
  const handleQuickUnlock = async (role: Role, code: string) => {
    setPin(code);
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, passcode: code }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        onSuccess(data.member.role);
      } else {
        setErrorMsg(data.error || "Failed to switch role");
      }
    } catch {
      setErrorMsg("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Vault Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/5 p-6 sm:p-8"
      >
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 mb-3 shadow-inner">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Care Vault Passcode Gate
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Secure, encrypted access for Elder, Family, and Caretakers
          </p>
        </div>

        {/* Selected Elder Card */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
              RI
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                {elderProfile.name}
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                  {elderProfile.bloodGroup}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Age {elderProfile.age} • Allergies: {elderProfile.allergies.join(", ")}
              </div>
            </div>
          </div>
          <Shield className="w-4 h-4 text-teal-600" />
        </div>

        {/* PIN Indicators with Shake */}
        <motion.div
          key={shakeKey}
          animate={shakeKey > 0 ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex justify-center items-center gap-4 my-6"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <motion.div
                key={index}
                animate={{ scale: isFilled ? 1.15 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  isFilled
                    ? "bg-teal-600 border-teal-600 shadow-sm shadow-teal-600/30"
                    : "border-slate-300 bg-slate-50"
                }`}
              />
            );
          })}
        </motion.div>

        {/* Error Notice */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-center text-xs font-medium text-rose-600 mb-4 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-lg"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactile Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              disabled={loading || pin.length >= 4}
              className="h-13 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-lg transition duration-75 flex items-center justify-center shadow-xs active:scale-95 disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={loading || pin.length === 0}
            className="h-13 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold tracking-wider transition active:scale-95 disabled:opacity-40"
          >
            CLEAR
          </button>
          <button
            onClick={() => handleDigit("0")}
            disabled={loading || pin.length >= 4}
            className="h-13 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-lg transition duration-75 flex items-center justify-center shadow-xs active:scale-95 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={loading || pin.length === 0}
            className="h-13 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition flex items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Delete className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Demo / Judge Quick Access Box */}
        <div className="border-t border-slate-200 pt-5 mt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Demo / Judge Quick Access (1-Click Auto-Login)
            </span>
            <span className="text-[11px] text-teal-600 font-semibold">1-Click PINs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickUnlock("ELDER", "1111")}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 text-teal-900 text-xs font-semibold text-left transition flex flex-col justify-between group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Elder View</span>
                <span className="text-[10px] bg-teal-200/80 px-1.5 py-0.2 rounded font-mono font-bold">1111</span>
              </div>
              <span className="text-[11px] text-teal-700 font-normal mt-0.5">Raghavan (74)</span>
            </button>

            <button
              onClick={() => handleQuickUnlock("FAMILY_ADMIN", "2222")}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-900 text-xs font-semibold text-left transition flex flex-col justify-between group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Family Admin</span>
                <span className="text-[10px] bg-indigo-200/80 px-1.5 py-0.2 rounded font-mono font-bold">2222</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-normal mt-0.5">Anita (Daughter)</span>
            </button>

            <button
              onClick={() => handleQuickUnlock("CARETAKER", "3333")}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-900 text-xs font-semibold text-left transition flex flex-col justify-between group active:scale-98"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Caretaker</span>
                <span className="text-[10px] bg-emerald-200/80 px-1.5 py-0.2 rounded font-mono font-bold">3333</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-normal mt-0.5">Nurse Priya</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
