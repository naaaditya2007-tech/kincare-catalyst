"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Delete, Sparkles } from "lucide-react";
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

  const verifyPin = useCallback(
    async (passcodeToTest: string) => {
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
    [onSuccess]
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

  // 1-Click Auto Login buttons
  const handleQuickUnlock = async (role: Role, code: string) => {
    if (loading) return;
    setLoading(false);
    setErrorMsg(null);
    setPin(code);
    await verifyPin(code);
  };

  return (
    <div className="w-full flex flex-col justify-center">
      {/* Header Typography */}
      <div className="text-left mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Care Vault Access</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
          Enter your 4-digit passkey to access Raghavan Iyer&apos;s care circle.
        </p>
      </div>

      {/* Selected Patient Pill */}
      <div className="flex items-center justify-between p-2.5 px-4 rounded-full bg-slate-50 border border-slate-200/80 mb-4 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">
            RI
          </div>
          <span className="font-semibold text-slate-900">{elderProfile.name}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Age {elderProfile.age}</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-teal-700">{elderProfile.bloodGroup}</span>
        </div>
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Active</span>
      </div>

      {/* Tactile 4-PIN Circles */}
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="flex justify-center items-center gap-3.5 my-4"
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
            className="text-center text-xs font-semibold text-rose-600 mb-3 bg-rose-50 border border-rose-200 py-1.5 px-3 rounded-full"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fully Rounded Keypad (14x14 tactile circular buttons) */}
      <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            disabled={loading || pin.length >= 4}
            className="w-14 h-14 mx-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium text-xl transition duration-100 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || pin.length === 0}
          className="w-14 h-14 mx-auto rounded-full border border-transparent hover:bg-slate-100 text-slate-500 text-[11px] font-semibold tracking-wider transition active:scale-95 disabled:opacity-30 flex items-center justify-center"
        >
          CLEAR
        </button>
        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={loading || pin.length >= 4}
          className="w-14 h-14 mx-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium text-xl transition duration-100 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          disabled={loading || pin.length === 0}
          className="w-14 h-14 mx-auto rounded-full border border-transparent hover:bg-slate-100 text-slate-500 transition flex items-center justify-center active:scale-95 disabled:opacity-30"
        >
          <Delete className="w-4 h-4 stroke-[1.8]" />
        </button>
      </div>

      {/* Demo / Judge Quick Access (1-Click Auto Login Buttons) */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            1-Click Auto Login
          </span>
          <span className="text-[10px] text-teal-700 font-semibold">Demo Access</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickUnlock("ELDER", "1111")}
            disabled={loading}
            className="px-2.5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold text-center transition flex flex-col items-center justify-center group active:scale-95 shadow-2xs"
          >
            <span className="font-bold text-slate-900 leading-tight">Elder View</span>
            <span className="text-[9px] text-teal-700 font-mono mt-0.5">PIN: 1111</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickUnlock("FAMILY_ADMIN", "2222")}
            disabled={loading}
            className="px-2.5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold text-center transition flex flex-col items-center justify-center group active:scale-95 shadow-2xs"
          >
            <span className="font-bold text-slate-900 leading-tight">Family Admin</span>
            <span className="text-[9px] text-indigo-700 font-mono mt-0.5">PIN: 2222</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickUnlock("CARETAKER", "3333")}
            disabled={loading}
            className="px-2.5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold text-center transition flex flex-col items-center justify-center group active:scale-95 shadow-2xs"
          >
            <span className="font-bold text-slate-900 leading-tight">Caretaker</span>
            <span className="text-[9px] text-emerald-700 font-mono mt-0.5">PIN: 3333</span>
          </button>
        </div>
      </div>
    </div>
  );
};
