"use client";

import React, { useState } from "react";
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
import { MedicationModal } from "./MedicationModal";
import { ClinicalBriefModal } from "./ClinicalBriefModal";
import { CareCircleModal } from "./CareCircleModal";

interface CommandCenterDashboardProps {
  state: KinCareState;
  currentRole: Role;
  onUpdateMedication: (action: "ADD" | "UPDATE" | "TOGGLE_ACTIVE" | "DELETE", med: Partial<Medication>) => Promise<void>;
  onAddDoctorQuestion: (question: string) => Promise<void>;
  onDeleteDoctorQuestion: (index: number) => Promise<void>;
  onUpdatePasscode: (memberId: string, newPasscode: string) => Promise<void>;
  onAddMember: (member: Partial<CareCircleMember>) => Promise<void>;
  onTriggerEscalation: () => void;
}

export const CommandCenterDashboard: React.FC<CommandCenterDashboardProps> = ({
  state,
  currentRole,
  onUpdateMedication,
  onAddDoctorQuestion,
  onDeleteDoctorQuestion,
  onUpdatePasscode,
  onAddMember,
  onTriggerEscalation,
}) => {
  const [activeTab, setActiveTab] = useState<"medications" | "adherence" | "appointments" | "careCircle">("medications");
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [medToEdit, setMedToEdit] = useState<Medication | null>(null);
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [circleModalOpen, setCircleModalOpen] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Command Center Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-teal-600" />
            Care Circle Command Center • {currentRole === "FAMILY_ADMIN" ? "Family Administrator" : "Caretaker View"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Oversight: {elder.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time adherence telemetry, prescription safety guard, and collaborative doctor prep
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCircleModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-teal-600" />
            <span>Passcode & Circle</span>
          </button>

          <button
            onClick={() => setBriefModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Doctor Brief</span>
          </button>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Adherence % */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Adherence</span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{adherencePercent}%</span>
            <span className="text-xs text-slate-500">
              ({takenCount}/{activeMedsCount} taken)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Pill Stock Alerts */}
        <div
          className={`border rounded-2xl p-5 shadow-xs transition ${
            lowStockMeds.length > 0
              ? "bg-amber-50/40 border-amber-300"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Refill Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockMeds.length > 0 ? "text-amber-600" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{lowStockMeds.length}</span>
            <span className="text-xs text-slate-500">
              {lowStockMeds.length === 1 ? "medication low" : "medications low"}
            </span>
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-2 truncate">
            {lowStockMeds.length > 0
              ? lowStockMeds.map((m) => `${m.name} (${m.stockRemaining} left)`).join(", ")
              : "All stock levels adequate"}
          </div>
        </div>

        {/* KPI 3: Next Appointment Countdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Doctor Visit</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {daysUntilAppt > 0 ? `In ${daysUntilAppt}d` : "Today"}
            </span>
            <span className="text-xs text-slate-500 truncate max-w-[120px]">
              {nextAppt ? nextAppt.doctorName.split(" ").slice(-1)[0] : "None"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 truncate">
            {nextAppt ? nextAppt.hospital : "No upcoming review scheduled"}
          </div>
        </div>

        {/* KPI 4: Active Care Circle */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Care Circle</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{state.careCircle.length}</span>
            <span className="text-xs text-slate-500">connected members</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-2">
            1 Elder, 1 Family, 1 Visiting Nurse
          </div>
        </div>
      </div>

      {/* Smart Timing Guard Banner */}
      {timingConflicts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                  Autonomous Timing Guard Notice
                </span>
                <span className="text-xs text-amber-800 font-semibold">
                  {timingConflicts.length} Potential Interaction Detected
                </span>
              </div>

              {timingConflicts.map((c) => (
                <div key={c.id} className="mt-2 text-xs sm:text-sm text-amber-950">
                  <strong>{c.title}:</strong> {c.description}{" "}
                  <span className="font-semibold underline underline-offset-2">Recommendation:</span> {c.remedy}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Controls */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("medications")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "medications"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medications & Inventory ({state.medications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("adherence")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "adherence"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Adherence & Elder Feed ({state.doseLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("appointments")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === "appointments"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Doctor Prep Checklist</span>
        </button>
      </div>

      {/* Tab 1: Medication Schedule & Inventory Manager */}
      {activeTab === "medications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Prescriptions & Stock Telemetry</h2>
            <button
              onClick={() => {
                setMedToEdit(null);
                setMedModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medication</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.medications.map((med) => {
              const isLow = med.stockRemaining <= med.refillThreshold;
              return (
                <div
                  key={med.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                    !med.active
                      ? "opacity-60 border-slate-200 bg-slate-50"
                      : isLow
                      ? "border-amber-300"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        {med.instructions}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-500">
                        {med.scheduledTimes.join(", ")}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      {med.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {med.dosage} • {med.form} {med.purpose ? `(${med.purpose})` : ""}
                    </p>

                    {med.conflictNote && (
                      <div className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-2 mt-2">
                        {med.conflictNote}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Inventory Stock</div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        <span className={isLow ? "text-amber-600" : "text-slate-900"}>
                          {med.stockRemaining} units
                        </span>
                        {isLow && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                            REFILL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRestock(med, 30)}
                        title="Add 30 units to inventory"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        +30
                      </button>
                      <button
                        onClick={() => {
                          setMedToEdit(med);
                          setMedModalOpen(true);
                        }}
                        title="Edit prescription"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onUpdateMedication("TOGGLE_ACTIVE", { id: med.id })}
                        title={med.active ? "Pause prescription" : "Resume prescription"}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                      >
                        {med.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onUpdateMedication("DELETE", { id: med.id })}
                        title="Delete prescription"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Chronological Adherence & Elder Feedback</h2>
            <button
              onClick={onTriggerEscalation}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Simulate Overdue Escalation</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100">
            {state.doseLogs.map((log) => {
              const isTaken = log.status === "TAKEN";
              const isSkipped = log.status === "SKIPPED_WITH_REASON";
              const isMissed = log.status === "MISSED";

              return (
                <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
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
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{log.date}</span>
                    </div>

                    <div className="text-base font-bold text-slate-900">{log.medicationName}</div>

                    {/* Empathy-driven Elder Note callout */}
                    {log.elderNote && (
                      <div className="text-xs sm:text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mt-1.5 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900">Elder Comment:</strong> &ldquo;{log.elderNote}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-xs text-slate-400">Logged by</div>
                    <div className="text-xs font-semibold text-slate-700">{log.loggedByName || log.loggedByRole}</div>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Next Consultation</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {nextAppt?.doctorName || "Dr. Arvind Swaminathan"}
                </h3>
                <p className="text-xs text-slate-500">
                  {nextAppt?.specialty} • {nextAppt?.hospital}
                </p>
              </div>

              <button
                onClick={() => setBriefModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>View Full Clinical Brief</span>
              </button>
            </div>

            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Collaborative Discussion Checklist ({nextAppt?.checklistQuestions?.length || 0} Questions)
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Both Anita and Nurse Priya can add questions here to ensure everything is addressed during the OPD visit.
              </p>

              <div className="space-y-2 mb-4">
                {(nextAppt?.checklistQuestions || []).map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="font-bold text-teal-700">Q{idx + 1}.</span>
                      <span className="text-slate-800">{q}</span>
                    </div>

                    <button
                      onClick={() => onDeleteDoctorQuestion(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Question Input */}
              <form onSubmit={handleQuestionSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new question for Dr. Arvind Swaminathan (e.g. check HbA1c target)..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-teal-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
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
