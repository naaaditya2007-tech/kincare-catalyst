"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Delete, Sparkles, ArrowRight } from "lucide-react";
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
    },
    [onSuccess]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);
        setErrorMsg(null);
        if (nextPin.length === 4) {
          verifyPin(nextPin);
        }
      }
    },
    [pin, verifyPin]
  );

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
    <div className="w-full">
      {/* Header Typography */}
      <div className="text-left mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Care Vault Access</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Welcome back
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-2 font-normal">
          Enter your 4-digit passkey to access Raghavan Iyer&apos;s care circle.
        </p>
      </div>

      {/* Selected Patient Pill (Clean Minimalist) */}
      <div className="flex items-center justify-between p-3.5 px-5 rounded-full bg-slate-50 border border-slate-200/80 mb-8 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
            RI
          </div>
          <span className="font-semibold text-slate-900 text-sm">{elderProfile.name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-600">Age {elderProfile.age}</span>
          <span className="text-slate-400">•</span>
          <span className="font-bold text-teal-700">{elderProfile.bloodGroup}</span>
        </div>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Patient</span>
      </div>

      {/* Tactile 4-PIN Circles */}
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="flex justify-center items-center gap-4 my-8"
      >
        {[0, 1, 2, 3].map((index) => {
          const isFilled = pin.length > index;
          return (
            <motion.div
              key={index}
              animate={{ scale: isFilled ? 1.15 : 1 }}
              transition={{ type: "spring", stiffness: 450, damping: 28 }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                isFilled
                  ? "bg-slate-900 border-slate-900 shadow-sm"
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
            className="text-center text-xs font-semibold text-rose-600 mb-6 bg-rose-50 border border-rose-200 py-2 px-4 rounded-full"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fully Rounded Circular Keypad (Human Designed / Apple Elegance) */}
      <div className="grid grid-cols-3 gap-3.5 max-w-[260px] mx-auto mb-10">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={loading || pin.length >= 4}
            className="w-16 h-16 mx-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium text-2xl transition duration-100 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={handleClear}
          disabled={loading || pin.length === 0}
          className="w-16 h-16 mx-auto rounded-full border border-transparent hover:bg-slate-100 text-slate-500 text-xs font-semibold tracking-wider transition active:scale-95 disabled:opacity-30 flex items-center justify-center"
        >
          CLEAR
        </button>
        <button
          onClick={() => handleDigit("0")}
          disabled={loading || pin.length >= 4}
          className="w-16 h-16 mx-auto rounded-full border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-medium text-2xl transition duration-100 flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={loading || pin.length === 0}
          className="w-16 h-16 mx-auto rounded-full border border-transparent hover:bg-slate-100 text-slate-500 transition flex items-center justify-center active:scale-95 disabled:opacity-30"
        >
          <Delete className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>

      {/* Demo / Judge Quick Access Box (Sleek Minimalist Pills) */}
      <div className="border-t border-slate-100 pt-6">
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Demo / Judge Quick Access
          </span>
          <span className="text-[11px] text-teal-700 font-semibold">1-Click Auto Login</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleQuickUnlock("ELDER", "1111")}
            disabled={loading}
            className="px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold text-left transition flex items-center justify-between group active:scale-98 shadow-2xs"
          >
            <div>
              <div className="font-bold text-slate-900">Elder View</div>
              <div className="text-[10px] text-slate-500 font-mono">PIN: 1111</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => handleQuickUnlock("FAMILY_ADMIN", "2222")}
            disabled={loading}
            className="px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold text-left transition flex items-center justify-between group active:scale-98 shadow-2xs"
          >
            <div>
              <div className="font-bold text-slate-900">Family Admin</div>
              <div className="text-[10px] text-slate-500 font-mono">PIN: 2222</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
          </button>

          <button
            onClick={() => handleQuickUnlock("CARETAKER", "3333")}
            disabled={loading}
            className="px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-800 text-xs font-semibold text-left transition flex items-center justify-between group active:scale-98 shadow-2xs"
          >
            <div>
              <div className="font-bold text-slate-900">Caretaker</div>
              <div className="text-[10px] text-slate-500 font-mono">PIN: 3333</div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      </div>
    </div>
  );
};
