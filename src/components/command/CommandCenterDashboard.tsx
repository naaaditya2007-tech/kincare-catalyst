"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Users,
  Pill,
  Clock,
  Plus,
  Edit2,
  Trash2,
  FileText,
  KeyRound,
  ShieldAlert,
  Sparkles,
  MessageSquare,
  AlertOctagon,
  Pause,
  Play,
} from "lucide-react";
import { KinCareState, Medication, Role, CareCircleMember } from "@/types/kincare";
import { detectTimingConflicts } from "@/lib/timingGuard";
import { useCare } from "@/context/CareContext";
import { MedicationModal } from "./MedicationModal";
import { ClinicalBriefModal } from "./ClinicalBriefModal";
import { CareCircleModal } from "./CareCircleModal";

interface CommandCenterDashboardProps {
  state?: KinCareState;
  currentRole?: Role;
  onUpdateMedication?: (action: "ADD" | "UPDATE" | "TOGGLE_ACTIVE" | "DELETE", med: Partial<Medication>) => Promise<void>;
  onAddDoctorQuestion?: (question: string) => Promise<void>;
  onDeleteDoctorQuestion?: (index: number) => Promise<void>;
  onUpdatePasscode?: (memberId: string, newPasscode: string) => Promise<void>;
  onAddMember?: (member: Partial<CareCircleMember>) => Promise<void>;
  onTriggerEscalation?: () => void;
}

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = (props) => {
  const care = useCare();
  const state = props.state || care.state;
  const currentRole = props.currentRole || care.currentRole;
  const onUpdateMedication = props.onUpdateMedication || care.updateMedication;
  const onAddDoctorQuestion = props.onAddDoctorQuestion || care.addDoctorQuestion;
  const onDeleteDoctorQuestion = props.onDeleteDoctorQuestion || care.deleteDoctorQuestion;
  const onUpdatePasscode = props.onUpdatePasscode || care.updatePasscode;
  const onAddMember = props.onAddMember || care.addCareCircleMember;
  const onTriggerEscalation = props.onTriggerEscalation || (() => care.setEmailCenterOpen(true));

  const [activeTab, setActiveTab] = useState<"medications" | "adherence" | "appointments">("medications");
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [medToEdit, setMedToEdit] = useState<Medication | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");

  if (!state) return null;

  const elder = state.elderProfile;
  const timingConflicts = detectTimingConflicts(state.medications);

  // Adherence Calculation for today
  const todayStr = (state.lastUpdated || "2026-11-15").split("T")[0];
  const todayLogs = state.doseLogs.filter((l) => l.date === todayStr);
  const takenCount = todayLogs.filter((l) => l.status === "TAKEN").length;
  const activeMedsCount = state.medications.filter((m) => m.active).length;
  const adherencePercent = activeMedsCount > 0 ? Math.round((takenCount / activeMedsCount) * 100) : 100;

  // Low stock inventory count
  const lowStockMeds = state.medications.filter((m) => m.stockRemaining <= m.refillThreshold);

  // Next appointment countdown safely calculated from state timestamp
  const nextAppt = state.appointments[0];
  const apptTime = nextAppt?.dateTime ? new Date(nextAppt.dateTime).getTime() : 0;
  const referenceTime = state.lastUpdated ? new Date(state.lastUpdated).getTime() : 0;
  const daysUntilAppt =
    apptTime > referenceTime ? Math.max(0, Math.ceil((apptTime - referenceTime) / (1000 * 60 * 60 * 24))) : 0;

  const handleRestock = async (med: Medication, amount = 30) => {
    await onUpdateMedication("UPDATE", {
      id: med.id,
      stockRemaining: med.stockRemaining + amount,
    });
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    await onAddDoctorQuestion(newQuestionText.trim());
    setNewQuestionText("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Care Circle Command Center • {currentRole === "FAMILY_ADMIN" ? "Family Administrator" : "Caretaker"}
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-500 font-medium tracking-tight">
            Patient Oversight:{" "}
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 inline-block">
              {elder.name}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2 font-normal">
            Real-time adherence telemetry, prescription safety guard, and doctor visit briefing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCircleModalOpen(true)}
            className="px-5 py-2.5 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-2 transition shadow-2xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
            <span>Passcode & Circle</span>
          </button>

          <button
            onClick={() => setBriefModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Doctor Brief</span>
          </button>
        </div>
      </div>

      {/* Top KPI Strip (Apple Health Massive Bold Numbers & Whitespace) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Adherence % */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today&apos;s Adherence
              </span>
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {adherencePercent}%
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({takenCount}/{activeMedsCount} taken)
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-5 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Pill Stock Alerts */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Refill Alerts
              </span>
              <AlertTriangle className={`w-4 h-4 ${lowStockMeds.length > 0 ? "text-amber-600" : "text-slate-400"}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {lowStockMeds.length}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {lowStockMeds.length === 1 ? "med low" : "meds low"}
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-600 mt-4 truncate">
            {lowStockMeds.length > 0
              ? lowStockMeds.map((m) => `${m.name} (${m.stockRemaining} left)`).join(", ")
              : "All stock levels adequate"}
          </div>
        </div>

        {/* KPI 3: Next Appointment Countdown */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Doctor Visit
              </span>
              <Calendar className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {daysUntilAppt > 0 ? `In ${daysUntilAppt}d` : "Today"}
              </span>
              <span className="text-xs font-medium text-slate-500 truncate max-w-[120px]">
                {nextAppt ? nextAppt.doctorName.split(" ").slice(-1)[0] : "None"}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-4 truncate">
            {nextAppt ? nextAppt.hospital : "No consultation scheduled"}
          </div>
        </div>

        {/* KPI 4: Active Care Circle */}
        <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Care Circle
              </span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
                {state.careCircle.length}
              </span>
              <span className="text-xs font-medium text-slate-500">members</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-4">
            1 Elder, 1 Family, 1 Visiting Nurse
          </div>
        </div>
      </div>

      {/* Killer Feature: Autonomous Timing Guard Notice (Hero Amber Card) */}
      {timingConflicts.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-6 text-amber-900 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.95, 1, 0.95] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm"
              >
                <ShieldAlert className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full inline-block">
                  Autonomous Timing Guard • Active Clinical Safeguard
                </span>
                <h3 className="text-xl font-bold text-amber-950 tracking-tight mt-1">
                  Absorption Interaction: Shelcal-HD (Calcium) blocks Thyronorm (Levothyroxine)
                </h3>
              </div>
            </div>

            <span className="text-xs font-bold text-amber-900 bg-amber-100/90 px-3.5 py-1.5 rounded-full shrink-0 self-start md:self-auto">
              Patient Actively Protected
            </span>
          </div>

          <p className="text-sm text-amber-900/90 leading-relaxed font-normal">
            Calcium carbonate in <strong>Shelcal-HD (500mg)</strong> binds with synthetic thyroid hormone in <strong>Thyronorm (50mcg)</strong> in the gastrointestinal tract, causing up to <strong>50% loss in therapeutic bioavailability</strong>. Rather than triggering reactive alarms, KinCare&apos;s timing guard automatically enforces a safe administration schedule:
          </p>

          {/* Visual Safe Window Buffer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/90 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                07:00
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Thyronorm (Levothyroxine 50mcg)</div>
                <div className="text-[11px] text-teal-700 font-medium">Empty Stomach with plain water</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                13:30
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Shelcal-HD (Calcium + Vit D3 500mg)</div>
                <div className="text-[11px] text-amber-800 font-medium">After Lunch • 6h 30m safe spacing window maintained</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pill-Shaped Tab Selector */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("medications")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "medications"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>Medications & Inventory ({state.medications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("adherence")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "adherence"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Adherence & Elder Feed ({state.doseLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "appointments"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Doctor Prep Checklist</span>
        </button>
      </div>

      {/* Tab 1: Medication Schedule & Inventory Manager */}
      {activeTab === "medications" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Active Prescriptions</h2>
            <button
              onClick={() => {
                setMedToEdit(null);
                setMedModalOpen(true);
              }}
              className="px-5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {state.medications.map((med) => {
              const isLow = med.stockRemaining <= med.refillThreshold;
              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition flex flex-col justify-between ${
                    !med.active
                      ? "opacity-60 bg-slate-50"
                      : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full">
                        {med.instructions}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        {med.scheduledTimes.join(", ")}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {med.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {med.dosage} • {med.form} {med.purpose ? `(${med.purpose})` : ""}
                      </p>
                    </div>

                    {med.conflictNote && (
                      <div className="text-[11px] bg-amber-50 text-amber-900 rounded-xl p-3 leading-relaxed">
                        {med.conflictNote}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Inventory</div>
                      <div className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                        <span className={isLow ? "text-amber-600" : "text-slate-900"}>
                          {med.stockRemaining} units
                        </span>
                        {isLow && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                            LOW
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRestock(med, 30)}
                        title="Add 30 units to inventory"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-semibold transition"
                      >
                        +30
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMedToEdit(med);
                          setMedModalOpen(true);
                        }}
                        title="Edit prescription"
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateMedication("TOGGLE_ACTIVE", { id: med.id })}
                        title={med.active ? "Pause prescription" : "Resume prescription"}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition"
                      >
                        {med.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateMedication("DELETE", { id: med.id })}
                        title="Delete prescription"
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Adherence & Elder Notes Feed */}
      {activeTab === "adherence" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Chronological Adherence Feed
            </h2>
            <button
              onClick={onTriggerEscalation}
              className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Simulate Overdue Escalation</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] divide-y divide-slate-100">
            {state.doseLogs.map((log) => {
              const isTaken = log.status === "TAKEN";
              const isSkipped = log.status === "SKIPPED_WITH_REASON";
              const isMissed = log.status === "MISSED";

              return (
                <div key={log.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isTaken
                            ? "bg-emerald-100 text-emerald-800"
                            : isSkipped
                            ? "bg-amber-100 text-amber-800"
                            : isMissed
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{log.scheduledTime}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{log.date}</span>
                    </div>

                    <div className="text-base font-bold text-slate-900">{log.medicationName}</div>

                    {/* Empathy-driven Elder Note callout */}
                    {log.elderNote && (
                      <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl p-3.5 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Elder Comment:</strong> &ldquo;{log.elderNote}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[11px] text-slate-400">Logged by</div>
                    <div className="text-xs font-semibold text-slate-800">{log.loggedByName || log.loggedByRole}</div>
                    {log.takenAt && (
                      <div className="text-[11px] text-emerald-700 font-mono">
                        {new Date(log.takenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Appointments & Doctor Prep */}
      {activeTab === "appointments" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Next Consultation</span>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  {nextAppt?.doctorName || "Dr. Arvind Swaminathan"}
                </h3>
                <p className="text-sm text-slate-500 font-normal">
                  {nextAppt?.specialty} • {nextAppt?.hospital}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBriefModalOpen(true)}
                className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Clinical Brief</span>
              </button>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Discussion Checklist ({nextAppt?.checklistQuestions?.length || 0} Questions)
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Care circle members can add discussion points to ensure complete clinical coverage during the OPD visit.
              </p>

              <div className="space-y-3 mb-5">
                {(nextAppt?.checklistQuestions || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-bold text-teal-700">Q{idx + 1}.</span>
                      <span className="text-slate-800">{q}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteDoctorQuestion(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-full transition"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Question Input (Pill Shaped) */}
              <form onSubmit={handleQuestionSubmit} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Add a new question for Dr. Arvind Swaminathan..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-full text-xs sm:text-sm focus:border-slate-900 focus:outline-none bg-slate-50/50"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MedicationModal
        isOpen={medModalOpen}
        onClose={() => setMedModalOpen(false)}
        medicationToEdit={medToEdit}
        onSave={(data) => {
          if (medToEdit) {
            onUpdateMedication("UPDATE", data);
          } else {
            onUpdateMedication("ADD", data);
          }
        }}
      />

      <ClinicalBriefModal
        isOpen={briefModalOpen}
        onClose={() => setBriefModalOpen(false)}
        state={state}
      />

      <CareCircleModal
        isOpen={circleModalOpen}
        onClose={() => setCircleModalOpen(false)}
        careCircle={state.careCircle}
        onUpdatePasscode={onUpdatePasscode}
        onAddMember={onAddMember}
      />
    </div>
  );
};
