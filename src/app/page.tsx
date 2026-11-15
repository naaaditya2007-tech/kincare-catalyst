"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PasscodeGate } from "@/components/auth/PasscodeGate";
import { DEFAULT_ELDER_PROFILE } from "@/lib/constants";
import { ElderProfile } from "@/types/kincare";
import { Heart, ShieldCheck, Activity, Users, Clock, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [elderProfile, setElderProfile] = useState<ElderProfile>(DEFAULT_ELDER_PROFILE);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if session already exists
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.session) {
          router.push("/dashboard");
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => setCheckingAuth(false));

    // Also fetch latest state profile if available
    fetch("/api/kincare")
      .then((res) => res.json())
      .then((data) => {
        if (data.state?.elderProfile) {
          setElderProfile(data.state.elderProfile);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleUnlockSuccess = () => {
    router.push("/dashboard");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center animate-pulse">
            <Heart className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-500">Securing Care Vault...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-slate-900 flex flex-col justify-between selection:bg-teal-100 selection:text-teal-900">
      {/* Top Subtle Announcement */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs py-3 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">KinCare</span>
            <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded uppercase">
              Geriatric Telemetry
            </span>
          </div>

          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" /> End-to-End Care Circle Security
            </span>
            <span>•</span>
            <span className="text-teal-700 font-medium">Apple Health & Linear Precision</span>
          </div>
        </div>
      </header>

      {/* Main Content Area: Hero + Passcode Vault Gate */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14">
        {/* Left Side: Editorial Pitch & System Pillars */}
        <div className="max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Autonomous Elderly Care & Medication Management</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Dignity for Elders. <br />
            <span className="text-teal-600">Peace of mind</span> for Families.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            KinCare bridges the generational divide with dual-interface design: high-accessibility,
            audio-guided companion for seniors, paired with a command center for family caregivers and visiting nurses.
          </p>

          {/* Three Key Pillar Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <Activity className="w-5 h-5 text-teal-600 mb-1.5" />
              <div className="text-xs font-bold text-slate-900">Smart Timing Guard</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Detects drug interactions (e.g., Calcium vs Thyroid)</div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <Users className="w-5 h-5 text-indigo-600 mb-1.5" />
              <div className="text-xs font-bold text-slate-900">Autonomy First</div>
              <div className="text-[11px] text-slate-500 mt-0.5">1-tap reason explanations eliminate false alarms</div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <Clock className="w-5 h-5 text-emerald-600 mb-1.5" />
              <div className="text-xs font-bold text-slate-900">Resend Alerts</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Proactive emails and missed-dose escalation</div>
            </div>
          </div>
        </div>

        {/* Right Side: Passcode Gate with Quick Judge Access */}
        <div className="w-full max-w-md">
          <PasscodeGate elderProfile={elderProfile} onSuccess={handleUnlockSuccess} />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        KinCare Geriatric Care Protocol • Raghavan Iyer Care Circle (Bengaluru, India) • Hackathon Edition
      </footer>
    </main>
  );
}
