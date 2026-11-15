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
  const [takingMedId, setTakingMedId] = useState<string | null>(null);

  const elder = state.elderProfile;
  const todayStr = new Date().toISOString().split("T")[0];

  // Group medications by time periods
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

  const getMedDoseLog = (medId: string): DoseLog | undefined => {
    return state.doseLogs.find((l) => l.medicationId === medId && l.date === todayStr);
  };

  // Speech Synthesis
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
    utterance.rate = 0.88;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTakeDose = async (med: Medication) => {
    setTakingMedId(med.id);
    // Subtle satisfying pause to allow the checkmark green flash animation to play
    await new Promise((resolve) => setTimeout(resolve, 550));
    await onDoseAction(med.id, "TAKEN", "Taken with lukewarm water");
    setTakingMedId(null);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Elder Greeting Banner (Apple Health Pure Card) */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs ring-1 ring-slate-900/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Elder Companion Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Good day, {elder.name}
          </h1>
          <p className="text-base sm:text-lg text-slate-500 mt-1 font-normal">
            Today is{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
            . Let&apos;s keep you healthy and peaceful.
          </p>
        </div>

        {/* Read Schedule Aloud Button (Full Pill) */}
        <button
          onClick={handleReadScheduleAloud}
          className={`h-14 sm:h-16 px-8 rounded-full font-bold text-base flex items-center justify-center gap-3 transition shadow-xs active:scale-98 shrink-0 ${
            isSpeaking
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {isSpeaking ? (
            <>
              <VolumeX className="w-5 h-5 stroke-[2.5] animate-pulse" />
              <span>Stop Reading</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
              <span>Read Schedule Aloud</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Ping: Request Family Call (Pure Card) */}
      <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xs ring-1 ring-slate-900/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg sm:text-xl">Need Assistance or Want to Talk?</h3>
            <p className="text-sm sm:text-base text-slate-500">
              One tap will send an instant phone request to Anita and Nurse Priya.
            </p>
          </div>
        </div>

        <button
          onClick={handleCallClick}
          disabled={callRequested}
          className={`h-14 px-8 rounded-full font-bold text-base flex items-center justify-center gap-2.5 transition shrink-0 active:scale-98 shadow-xs ${
            callRequested
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-900 hover:bg-slate-200"
          }`}
        >
          {callRequested ? (
            <>
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Call Requested!</span>
            </>
          ) : (
            <>
              <PhoneCall className="w-4 h-4" />
              <span>Request Family Call</span>
            </>
          )}
        </button>
      </div>

      {/* Medication Timeline Section */}
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Today&apos;s Medication Timeline
          </h2>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {state.medications.filter((m) => m.active).length} Prescribed Pills Today
          </span>
        </div>

        {/* Morning Dose Group */}
        {morning.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Morning (Before 12:00 PM)</span>
            </div>
            <div className="space-y-4">
              {morning.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}

        {/* Afternoon Dose Group */}
        {afternoon.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
              <Sunset className="w-5 h-5 text-teal-600" />
              <span>Afternoon (12:00 PM – 5:00 PM)</span>
            </div>
            <div className="space-y-4">
              {afternoon.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}

        {/* Night Dose Group */}
        {night.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
              <Moon className="w-5 h-5 text-indigo-600" />
              <span>Night (Before Sleep)</span>
            </div>
            <div className="space-y-4">
              {night.map((med) => renderMedicationCard(med))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Doctor Visit Card (Apple Health Pure Card) */}
      {nextAppt && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xs ring-1 ring-slate-900/5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Upcoming Doctor Consultation</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {nextAppt.doctorName}
              </h3>
              <p className="text-base text-slate-500 mt-1 font-normal">
                {nextAppt.specialty} • {nextAppt.hospital}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  {new Date(nextAppt.dateTime).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4.5 max-w-sm ring-1 ring-slate-900/5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Clinical Focus Note:
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
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
    const isCurrentlyTaking = takingMedId === med.id;

    return (
      <motion.div
        layout
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        key={med.id}
        className={`rounded-3xl p-7 sm:p-9 shadow-xs ring-1 transition-all duration-300 relative overflow-hidden ${
          isCurrentlyTaking
            ? "bg-emerald-50/50 ring-4 ring-emerald-500/40 scale-[1.01]"
            : isTaken
            ? "bg-emerald-50/15 ring-emerald-500/20"
            : isSkipped
            ? "bg-amber-50/15 ring-amber-500/20"
            : "bg-white ring-slate-900/5 hover:ring-slate-900/15"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Details */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                {med.scheduledTimes.join(", ")}
              </span>

              <span className="text-xs font-semibold bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200/80">
                {med.instructions}
              </span>

              {med.conflictNote && (
                <span className="text-xs font-semibold bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Spacing Guard
                </span>
              )}
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                <Pill className="w-6 h-6 text-teal-600 shrink-0" />
                {med.name}
              </h3>
              <p className="text-base sm:text-lg text-slate-600 mt-1 font-normal">
                Dosage: <strong>{med.dosage}</strong> ({med.form})
                {med.purpose ? ` • ${med.purpose}` : ""}
              </p>
            </div>

            {/* Spacing Caution Note if present */}
            {med.conflictNote && (
              <div className="text-xs sm:text-sm bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-amber-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{med.conflictNote}</span>
              </div>
            )}

            {/* Elder's Reason Note if postponed */}
            {isSkipped && doseLog?.elderNote && (
              <div className="text-xs sm:text-sm bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-950 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Postponed with reason:</strong> &ldquo;{doseLog.elderNote}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Right Action Buttons (Pill-shaped, 56px+ target) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isTaken ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="h-14 px-8 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  Taken {doseLog?.takenAt ? `at ${new Date(doseLog.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Today"}
                </span>
              </motion.div>
            ) : isSkipped ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="h-14 px-6 rounded-full bg-amber-100 text-amber-900 font-bold text-sm flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Postponed / Reason Logged</span>
                </div>
                <button
                  onClick={() => handleTakeDose(med)}
                  disabled={isCurrentlyTaking}
                  className="h-14 px-6 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition shadow-xs active:scale-98 disabled:opacity-50"
                >
                  Take Now Instead
                </button>
              </div>
            ) : (
              <>
                {/* Secondary Pill Button: Not Now / Skip */}
                <button
                  type="button"
                  onClick={() => setSelectedMedForSkip(med)}
                  disabled={isCurrentlyTaking}
                  className="h-14 px-7 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base transition active:scale-98 disabled:opacity-50"
                >
                  Not Now / Skip
                </button>

                {/* Primary Pill Button: I Took This with satisfying checkmark animation */}
                <motion.button
                  type="button"
                  onClick={() => handleTakeDose(med)}
                  disabled={isCurrentlyTaking}
                  animate={isCurrentlyTaking ? { scale: [1, 1.05, 1], backgroundColor: "#059669" } : {}}
                  transition={{ duration: 0.35 }}
                  className="h-14 px-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-base transition shadow-sm flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-90"
                >
                  {isCurrentlyTaking ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-6 h-6 stroke-[3.5] text-white" />
                      <span>Logging...</span>
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>I Took This</span>
                    </>
                  )}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};
