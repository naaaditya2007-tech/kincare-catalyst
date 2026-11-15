"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PhoneCall,
  Calendar,
  Pill,
  Sun,
  Sunset,
  Moon,
  Check,
  Sparkles,
  Info,
} from "lucide-react";
import { KinCareState, Medication, DoseLog } from "@/types/kincare";
import { ReasonSelectorModal } from "./ReasonSelectorModal";

interface ElderDashboardProps {
  state: KinCareState;
  onDoseAction: (
    medicationId: string,
    status: "TAKEN" | "SKIPPED_WITH_REASON",
    elderNote?: string,
    scheduledTime?: string
  ) => Promise<void>;
  onRequestCall: () => void;
}

export const ElderDashboard: React.FC<ElderDashboardProps> = ({
  state,
  onDoseAction,
  onRequestCall,
}) => {
  const [selectedMedForSkip, setSelectedMedForSkip] = useState<Medication | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callRequested, setCallRequested] = useState(false);

  const elder = state.elderProfile;
  const todayStr = new Date().toISOString().split("T")[0];

  // Group medications by time periods (Morning, Afternoon, Night)
  const getTimelineBuckets = () => {
    const morning: Medication[] = [];
    const afternoon: Medication[] = [];
    const night: Medication[] = [];

    state.medications
      .filter((m) => m.active)
      .forEach((med) => {
        const time = med.scheduledTimes[0] || "08:00";
        const hour = parseInt(time.split(":")[0], 10);
        if (hour < 12) {
          morning.push(med);
        } else if (hour < 17) {
          afternoon.push(med);
        } else {
          night.push(med);
        }
      });

    return { morning, afternoon, night };
  };

  const { morning, afternoon, night } = getTimelineBuckets();

  // Find status for a medication today
  const getMedDoseLog = (medId: string): DoseLog | undefined => {
    return state.doseLogs.find((l) => l.medicationId === medId && l.date === todayStr);
  };

  // Speech Synthesis: Read schedule aloud
  const handleReadScheduleAloud = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lines: string[] = [
      `Hello ${elder.name}. Here is your medication schedule for today.`,
    ];

    if (morning.length > 0) {
      lines.push("In the morning:");
      morning.forEach((m) => {
        const log = getMedDoseLog(m.id);
        const statusText = log?.status === "TAKEN" ? "already taken" : "scheduled for " + m.scheduledTimes.join(", ");
        lines.push(`${m.name}, ${m.dosage}, ${m.instructions}. Status: ${statusText}.`);
      });
    }

    if (afternoon.length > 0) {
      lines.push("In the afternoon:");
      afternoon.forEach((m) => {
        const log = getMedDoseLog(m.id);
        const statusText = log?.status === "TAKEN" ? "already taken" : "scheduled for " + m.scheduledTimes.join(", ");
        lines.push(`${m.name}, ${m.dosage}, ${m.instructions}. Status: ${statusText}.`);
      });
    }

    if (night.length > 0) {
      lines.push("At night before sleep:");
      night.forEach((m) => {
        const log = getMedDoseLog(m.id);
        const statusText = log?.status === "TAKEN" ? "already taken" : "scheduled for " + m.scheduledTimes.join(", ");
        lines.push(`${m.name}, ${m.dosage}, ${m.instructions}. Status: ${statusText}.`);
      });
    }

    lines.push("Take your time, drink plenty of water, and have a peaceful day.");

    const utterance = new SpeechSynthesisUtterance(lines.join(" "));
    utterance.rate = 0.88; // gentle, deliberate cadence for elders
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTakeDose = async (med: Medication) => {
    await onDoseAction(med.id, "TAKEN", "Taken with lukewarm water");
  };

  const handleCallClick = () => {
    setCallRequested(true);
    onRequestCall();
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance("Request sent. Anita and Nurse Priya have been notified to call you.");
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setCallRequested(false), 5000);
  };

  const nextAppt = state.appointments[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Elder Greeting Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-teal-700 tracking-wide uppercase flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Elder Dignity Companion Mode
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Good day, {elder.name}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 mt-1">
            Today is{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            . Let&apos;s keep you healthy and comfortable.
          </p>
        </div>

        {/* Read Schedule Aloud Button (56px+ target, high accessibility) */}
        <button
          onClick={handleReadScheduleAloud}
          className={`h-14 sm:h-16 px-6 sm:px-8 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-150 shadow-md ${
            isSpeaking
              ? "bg-rose-600 text-white hover:bg-rose-700 ring-4 ring-rose-200"
              : "bg-teal-700 text-white hover:bg-teal-800 ring-4 ring-teal-100"
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-6 h-6 stroke-[2.5] animate-pulse" />
              <span>Stop Reading</span>
            </>
          ) : (
            <>
              <Volume2 className="w-6 h-6 stroke-[2.5]" />
              <span>Read Schedule Aloud</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Action Strip: Request Family Call */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-teal-50/60 border border-teal-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg sm:text-xl">Need Help or Want to Chat?</h3>
            <p className="text-sm sm:text-base text-slate-600">
              One tap will send a direct request to your daughter Anita and Nurse Priya.
            </p>
          </div>
        </div>

        <button
          onClick={handleCallClick}
          disabled={callRequested}
          className={`h-14 px-7 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition shrink-0 ${
            callRequested
              ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {callRequested ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Call Requested!</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-5 h-5" />
              <span>Request Family Call</span>
            </>
          )}
        </button>
      </div>

      {/* Medication Timeline Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Today&apos;s Medication Timeline
          </h2>
          <span className="text-sm font-semibold text-slate-500">
            {state.medications.filter((m) => m.active).length} Prescribed Pills Today
          </span>
        </div>

        {/* Morning Dose Group */}
        {morning.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-lg sm:text-xl border-b border-amber-200 pb-2">
              <Sun className="w-6 h-6 text-amber-600" />
              <span>Morning Doses (Before 12:00 PM)</span>
            </div>
            <div className="space-y-4">
              {morning.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}

        {/* Afternoon Dose Group */}
        {afternoon.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-lg sm:text-xl border-b border-teal-200 pb-2">
              <Sunset className="w-6 h-6 text-teal-600" />
              <span>Afternoon Doses (12:00 PM – 5:00 PM)</span>
            </div>
            <div className="space-y-4">
              {afternoon.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}

        {/* Night Dose Group */}
        {night.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg sm:text-xl border-b border-indigo-200 pb-2">
              <Moon className="w-6 h-6 text-indigo-600" />
              <span>Night Doses (Evening & Before Sleep)</span>
            </div>
            <div className="space-y-4">
              {night.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Doctor Visit Card */}
      {nextAppt && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm">
          <div className="flex items-center gap-3 text-teal-700 font-bold text-sm uppercase tracking-wider mb-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Upcoming Doctor Visit
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                {nextAppt.doctorName}
              </h3>
              <p className="text-base text-slate-600 mt-0.5">
                {nextAppt.specialty} • {nextAppt.hospital}
              </p>
              <p className="text-sm font-medium text-teal-700 mt-2 bg-teal-50 px-3 py-1 rounded-lg inline-block">
                Scheduled:{" "}
                {new Date(nextAppt.dateTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm">
              <div className="text-xs font-semibold uppercase text-slate-500 mb-1">
                Clinical Focus Note:
              </div>
              <p className="text-sm text-slate-700 leading-relaxed italic">
                &ldquo;{nextAppt.notes}&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reason Selector Modal */}
      <ReasonSelectorModal
        isOpen={!!selectedMedForSkip}
        medication={selectedMedForSkip}
        onClose={() => setSelectedMedForSkip(null)}
        onSubmitReason={(reason, note) => {
          if (selectedMedForSkip) {
            onDoseAction(
              selectedMedForSkip.id,
              "SKIPPED_WITH_REASON",
              note ? `${reason} — ${note}` : reason
            );
          }
        }}
      />
    </div>
  );

  // Helper render function for individual medication card
  function renderMedicationCard(med: Medication) {
    const doseLog = getMedDoseLog(med.id);
    const isTaken = doseLog?.status === "TAKEN";
    const isSkipped = doseLog?.status === "SKIPPED_WITH_REASON";

    return (
      <div
        key={med.id}
        className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-7 shadow-xs ${
          isTaken
            ? "border-emerald-300 bg-emerald-50/20"
            : isSkipped
            ? "border-amber-300 bg-amber-50/20"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Details */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-600" />
                {med.scheduledTimes.join(", ")}
              </span>

              <span className="text-xs sm:text-sm font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
                {med.instructions}
              </span>

              {med.conflictNote && (
                <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Spacing Guard
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-6 h-6 text-teal-600 shrink-0" />
                {med.name}
              </h3>
              <p className="text-base sm:text-lg text-slate-600 mt-1">
                Dosage: <strong>{med.dosage}</strong> ({med.form})
                {med.purpose ? ` • For ${med.purpose}` : ""}
              </p>
            </div>

            {/* Conflict Note if present */}
            {med.conflictNote && (
              <div className="text-sm bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{med.conflictNote}</span>
              </div>
            )}

            {/* Elder's Note if skipped/postponed */}
            {isSkipped && doseLog?.elderNote && (
              <div className="text-sm bg-amber-100/70 border border-amber-300 rounded-xl p-3 text-amber-950 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Postponed with reason:</strong> &ldquo;{doseLog.elderNote}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Right Action Buttons (56px+ touch target) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isTaken ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="h-14 px-6 rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>
                  Taken {doseLog?.takenAt ? `at ${new Date(doseLog.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Today"}
                </span>
              </motion.div>
            ) : isSkipped ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="h-14 px-5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span>Postponed / Reason Logged</span>
                </div>
                <button
                  onClick={() => handleTakeDose(med)}
                  className="h-14 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition shadow-sm"
                >
                  Take Now Instead
                </button>
              </div>
            ) : (
              <>
                {/* Secondary Button: Not Now / Skip */}
                <button
                  type="button"
                  onClick={() => setSelectedMedForSkip(med)}
                  className="h-14 px-6 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-base sm:text-lg transition active:scale-98"
                >
                  Not Now / Skip
                </button>

                {/* Primary Button: I Took This (56px+ target) */}
                <button
                  type="button"
                  onClick={() => handleTakeDose(med)}
                  className="h-14 px-8 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-base sm:text-lg transition shadow-md flex items-center justify-center gap-2.5 active:scale-98"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>I Took This</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
};
