"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useCare } from "@/context/CareContext";
import { ReasonSelectorModal } from "./ReasonSelectorModal";
import { DoseCountdownToast } from "./DoseCountdownToast";

interface ElderDashboardProps {
  state?: KinCareState;
  onDoseAction?: (
    medicationId: string,
    status: "TAKEN" | "SKIPPED_WITH_REASON",
    elderNote?: string,
    scheduledTime?: string
  ) => Promise<void>;
  onRequestCall?: () => void;
}

export const ElderDashboard: React.FC<ElderDashboardProps> = (props) => {
  const care = useCare();
  const state = props.state || care.state;
  const onDoseAction = props.onDoseAction || care.logDoseAction;
  const onRequestCall = props.onRequestCall || care.requestFamilyCall;

  const [selectedMedForSkip, setSelectedMedForSkip] = useState<Medication | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callRequested, setCallRequested] = useState(false);
  const [takingMedId, setTakingMedId] = useState<string | null>(null);

  // Live Countdown Engine states
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [demoRemainingSeconds, setDemoRemainingSeconds] = useState<number | null>(null);
  const [toastMed, setToastMed] = useState<Medication | null>(null);
  const toastFiredForMedIdRef = useRef<string | null>(null);

  // Live 1-second interval ticking engine with memory-safe cleanup
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setDemoRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];

  // Group medications by time periods
  const getTimelineBuckets = () => {
    const morning: Medication[] = [];
    const afternoon: Medication[] = [];
    const night: Medication[] = [];

    if (state?.medications) {
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
    }

    return { morning, afternoon, night };
  };

  const { morning, afternoon, night } = getTimelineBuckets();

  const getMedDoseLog = (medId: string): DoseLog | undefined => {
    return state?.doseLogs?.find((l) => l.medicationId === medId && l.date === todayStr);
  };

  // Determine the next immediate medication due today that has NOT been taken yet
  const nextDueInfo = useMemo(() => {
    if (!state?.medications) return null;

    const untakenMeds = state.medications.filter((m) => {
      if (!m.active) return false;
      const log = state.doseLogs.find((l) => l.medicationId === m.id && l.date === todayStr);
      return log?.status !== "TAKEN";
    });

    if (untakenMeds.length === 0) return null;

    // Fast-Forward Demo override mode for testing live alert & zero toast
    if (demoRemainingSeconds !== null) {
      const targetMed = untakenMeds[0];
      return {
        medication: targetMed,
        remainingSeconds: demoRemainingSeconds,
        isUnder5Minutes: demoRemainingSeconds <= 300,
      };
    }

    const nowH = currentTime.getHours();
    const nowM = currentTime.getMinutes();
    const nowS = currentTime.getSeconds();
    const currentTotalSec = nowH * 3600 + nowM * 60 + nowS;

    let bestMed: Medication | null = null;
    let smallestPositiveDiff = Infinity;
    let fallbackMed: Medication | null = null;
    let smallestOverdueDiff = -Infinity;

    for (const med of untakenMeds) {
      for (const timeStr of med.scheduledTimes) {
        const [h, m] = timeStr.split(":").map(Number);
        const schedSec = h * 3600 + (m || 0) * 60;
        const diff = schedSec - currentTotalSec;

        if (diff >= 0 && diff < smallestPositiveDiff) {
          smallestPositiveDiff = diff;
          bestMed = med;
        } else if (diff < 0 && diff > smallestOverdueDiff) {
          smallestOverdueDiff = diff;
          fallbackMed = med;
        }
      }
    }

    if (bestMed && smallestPositiveDiff !== Infinity) {
      return {
        medication: bestMed,
        remainingSeconds: smallestPositiveDiff,
        isUnder5Minutes: smallestPositiveDiff <= 300,
      };
    }

    if (fallbackMed) {
      return {
        medication: fallbackMed,
        remainingSeconds: 0,
        isUnder5Minutes: true,
      };
    }

    return null;
  }, [state, todayStr, currentTime, demoRemainingSeconds]);

  // Format seconds into live countdown string (e.g. "Due in 00:14:59" or "Due Now")
  const formatCountdown = (totalSec: number) => {
    if (totalSec <= 0) return "Due Now";
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `Due in ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `Due in ${pad(minutes)}:${pad(seconds)}`;
  };

  // Automatically trigger custom toast notification when countdown hits 00:00:00
  useEffect(() => {
    if (!nextDueInfo) return;
    if (nextDueInfo.remainingSeconds === 0) {
      if (toastFiredForMedIdRef.current !== nextDueInfo.medication.id) {
        toastFiredForMedIdRef.current = nextDueInfo.medication.id;
        setToastMed(nextDueInfo.medication);

        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(
            `Time for your ${nextDueInfo.medication.name}. Please take it with water.`
          );
          u.rate = 0.9;
          window.speechSynthesis.speak(u);
        }
      }
    }
  }, [nextDueInfo]);

  if (!state) return null;

  const elder = state.elderProfile;

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
      <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Elder Companion Mode
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
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

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {nextDueInfo && (
            <button
              type="button"
              onClick={() => {
                toastFiredForMedIdRef.current = null;
                setDemoRemainingSeconds(8);
              }}
              title="Fast-forward countdown to 8 seconds to demonstrate live ticking, medical teal transition under 5s, and custom toast notification"
              className="h-14 sm:h-16 px-6 rounded-full border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-900 text-xs sm:text-sm font-extrabold flex items-center gap-2 transition active:scale-98 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>⚡ Test 8s Alert Demo</span>
            </button>
          )}

          {/* Read Schedule Aloud Button (Full Pill) */}
          <button
            type="button"
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
      </div>

      {/* Quick Ping: Request Family Call (Pure Card) */}
      <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-5">
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
          type="button"
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

        {morning.length === 0 && afternoon.length === 0 && night.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200/90 rounded-3xl p-12 text-center bg-white shadow-xs flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">No Medications Scheduled Today</h3>
              <p className="text-base text-slate-600">
                Good health and peace of mind! If you are prescribed new medication, your Family Administrator can add it directly to your schedule.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Morning Dose Group */}
            {morning.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xl">
                  <Sun className="w-6 h-6 text-amber-500" />
                  <span>Morning Schedule (Before 12:00 PM)</span>
                </div>
                <div className="space-y-8 sm:space-y-10">
                  {morning.map((med) => renderMedicationCard(med))}
                </div>
              </div>
            )}

            {/* Afternoon Dose Group */}
            {afternoon.length > 0 && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xl">
                  <Sunset className="w-6 h-6 text-teal-600" />
                  <span>Afternoon Schedule (12:00 PM – 5:00 PM)</span>
                </div>
                <div className="space-y-8 sm:space-y-10">
                  {afternoon.map((med) => renderMedicationCard(med))}
                </div>
              </div>
            )}

            {/* Night Dose Group */}
            {night.length > 0 && (
              <div className="space-y-6 pt-6">
                <div className="flex items-center gap-2.5 text-slate-800 font-bold text-xl">
                  <Moon className="w-6 h-6 text-indigo-600" />
                  <span>Night Schedule (Before Sleep)</span>
                </div>
                <div className="space-y-8 sm:space-y-10">
                  {night.map((med) => renderMedicationCard(med))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upcoming Doctor Visit Card (Apple Health Pure Card) */}
      {nextAppt && (
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Upcoming Doctor Consultation</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
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

            <div className="bg-slate-50 rounded-xl p-4 max-w-sm">
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

      {/* Real-time Dose Countdown Toast */}
      <DoseCountdownToast
        isOpen={!!toastMed}
        medication={toastMed}
        isTaking={takingMedId === toastMed?.id}
        onTakeDose={async (med) => {
          await handleTakeDose(med);
          setToastMed(null);
        }}
        onDismiss={() => setToastMed(null)}
      />
    </div>
  );

  // Helper render function for individual medication card
  function renderMedicationCard(med: Medication) {
    const doseLog = getMedDoseLog(med.id);
    const isTaken = doseLog?.status === "TAKEN";
    const isSkipped = doseLog?.status === "SKIPPED_WITH_REASON";
    const isCurrentlyTaking = takingMedId === med.id;
    const isNextDue = nextDueInfo?.medication.id === med.id && !isTaken;

    return (
      <motion.div
        layout
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        key={med.id}
        className={`bg-white rounded-2xl p-8 shadow-sm transition-all duration-300 relative overflow-hidden ${
          isCurrentlyTaking
            ? "ring-2 ring-teal-500/40 scale-[1.01]"
            : isTaken
            ? "bg-slate-50/70"
            : isSkipped
            ? "bg-amber-50/30"
            : "bg-white"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Details */}
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm sm:text-base font-bold bg-slate-100 text-slate-800 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0D9488]" />
                {med.scheduledTimes.join(", ")}
              </span>

              {/* Live Ticking Countdown Pill Badge */}
              {isNextDue && nextDueInfo && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`text-sm sm:text-base font-extrabold px-4 py-1.5 rounded-full flex items-center gap-2 transition-colors duration-500 shadow-2xs ${
                    nextDueInfo.isUnder5Minutes
                      ? "bg-teal-100 text-teal-900 border border-teal-300 ring-2 ring-teal-500/20"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      nextDueInfo.isUnder5Minutes ? "bg-teal-600 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  <span>{formatCountdown(nextDueInfo.remainingSeconds)}</span>
                </motion.span>
              )}

              <span className="text-sm sm:text-base font-bold bg-teal-50 text-teal-900 px-4 py-1.5 rounded-full border border-teal-200/60">
                {med.instructions}
              </span>

              {med.conflictNote && (
                <span className="text-sm sm:text-base font-bold bg-amber-50 text-amber-900 px-4 py-1.5 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Spacing Guard Active
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3.5 mb-2">
                <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Pill className="w-6 h-6 fill-white text-white" />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {med.name}
                </h3>
              </div>
              <p className="text-lg sm:text-xl text-slate-700 font-normal leading-relaxed">
                Dosage: <strong className="text-slate-900 font-bold">{med.dosage}</strong> ({med.form})
                {med.purpose ? ` • ${med.purpose}` : ""}
              </p>
            </div>

            {/* Spacing Caution Note if present */}
            {med.conflictNote && (
              <div className="text-base sm:text-lg bg-amber-50 rounded-2xl p-4 text-amber-900 flex items-start gap-3 leading-relaxed">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>{med.conflictNote}</span>
              </div>
            )}

            {/* Elder's Reason Note if postponed */}
            {isSkipped && doseLog?.elderNote && (
              <div className="text-base sm:text-lg bg-amber-50 rounded-2xl p-4 text-amber-950 flex items-start gap-3 leading-relaxed">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950 font-bold">Postponed with reason:</strong> &ldquo;{doseLog.elderNote}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Right Action Buttons (Pill-shaped, massive tactile target) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            {isTaken ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="py-4 px-8 rounded-full bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center gap-3 shadow-md shadow-emerald-900/10"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>
                  Taken {doseLog?.takenAt ? `at ${new Date(doseLog.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Today"}
                </span>
              </motion.div>
            ) : isSkipped ? (
              <div className="flex flex-col sm:flex-row gap-3.5">
                <div className="py-4 px-7 rounded-full bg-amber-50 text-amber-900 font-bold text-lg flex items-center justify-center gap-2.5">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span>Postponed / Reason Logged</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleTakeDose(med)}
                  disabled={isCurrentlyTaking}
                  className="py-4 px-8 text-xl rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold transition shadow-md shadow-teal-900/20 active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2.5"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>I Took This</span>
                </button>
              </div>
            ) : (
              <>
                {/* Secondary Pill Button: Not Now / Skip */}
                <button
                  type="button"
                  onClick={() => setSelectedMedForSkip(med)}
                  disabled={isCurrentlyTaking}
                  className="py-4 px-8 text-xl rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition active:scale-98 disabled:opacity-50"
                >
                  Not Now / Skip
                </button>

                {/* Primary Pill Button: I Took This in deep medical teal bg-[#0D9488] with shadow-md shadow-teal-900/20 */}
                <motion.button
                  type="button"
                  onClick={() => handleTakeDose(med)}
                  disabled={isCurrentlyTaking}
                  animate={isCurrentlyTaking ? { scale: [1, 1.05, 1], backgroundColor: "#0F766E" } : {}}
                  transition={{ duration: 0.35 }}
                  className="py-4 px-8 text-xl rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold transition shadow-md shadow-teal-900/20 flex items-center justify-center gap-3 active:scale-98 disabled:opacity-90"
                >
                  {isCurrentlyTaking ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="flex items-center gap-2.5"
                    >
                      <Check className="w-6 h-6 stroke-[3.5] text-white" />
                      <span>Recording Dose...</span>
                    </motion.div>
                  ) : (
                    <>
                      <Check className="w-6 h-6 stroke-[3.5]" />
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
