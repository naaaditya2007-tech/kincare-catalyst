"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PasscodeGate } from "@/components/auth/PasscodeGate";
import { DEFAULT_ELDER_PROFILE } from "@/lib/constants";
import { ElderProfile } from "@/types/kincare";
import { Heart, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [elderProfile, setElderProfile] = useState<ElderProfile>(DEFAULT_ELDER_PROFILE);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center animate-pulse shadow-sm">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">Loading KinCare...</span>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-white grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Full-Height Raw Image with Human Connection */}
      <div className="relative hidden lg:block h-full w-full overflow-hidden bg-slate-900">
        {/* Calming, warm human connection / care scene */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1600&auto=format&fit=crop"
          alt="Gentle caring hands in warm natural sunlight"
          className="absolute inset-0 h-full w-full object-cover object-center filter brightness-[0.92] contrast-[1.02]"
        />

        {/* Ambient Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-slate-950/30" />

        {/* Top Floating Logo Pill */}
        <div className="absolute top-10 left-10 z-10 flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white">
          <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">KinCare</span>
          <span className="text-white/60 text-xs">•</span>
          <span className="text-xs font-medium text-white/90">Elder Companion & Telemetry</span>
        </div>

        {/* Bottom Editorial Caption */}
        <div className="absolute bottom-12 left-12 right-12 z-10 max-w-lg space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-300/30 text-teal-200 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Dignity-Preserving Care Technology</span>
          </div>

          <h2 className="text-2xl xl:text-3xl font-medium tracking-tight text-white leading-snug">
            &ldquo;Autonomy is not about managing alone. It is about staying in control of every decision.&rdquo;
          </h2>

          <p className="text-sm text-slate-300 font-light leading-relaxed">
            Protecting Raghavan Iyer with verified dosage timing, proactive family alerts, and gentle audio reminders.
          </p>
        </div>
      </div>

      {/* Right Column: Pure White Canvas with Massive Whitespace */}
      <div className="min-h-screen bg-white p-8 sm:p-12 lg:p-20 xl:p-24 flex flex-col justify-center items-center">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">KinCare</span>
          </div>

          {/* Passcode Gate Component */}
          <PasscodeGate elderProfile={elderProfile} onSuccess={handleUnlockSuccess} />
        </div>
      </div>
    </main>
  );
}
