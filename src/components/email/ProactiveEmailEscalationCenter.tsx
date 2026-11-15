"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Send,
  AlertOctagon,
  FileCheck2,
  BellRing,
  Eye,
  CheckCircle2,
  Zap,
  Clock,
} from "lucide-react";
import { KinCareState, EmailAlertLog } from "@/types/kincare";
import { EmailPreviewModal } from "./EmailPreviewModal";

interface ProactiveEmailEscalationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  state: KinCareState;
  onRefreshState: () => Promise<void>;
}

export const ProactiveEmailEscalationCenter: React.FC<ProactiveEmailEscalationCenterProps> = ({
  isOpen,
  onClose,
  state,
  onRefreshState,
}) => {
  const [targetEmail, setTargetEmail] = useState("anita.iyer.family@gmail.com");
  const [triggeringWorkflow, setTriggeringWorkflow] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [previewLog, setPreviewLog] = useState<EmailAlertLog | null>(null);

  if (!isOpen) return null;

  const handleTriggerWorkflow = async (workflowType: "UPCOMING_DOSE" | "MISSED_DOSE_ESCALATION" | "DOCTOR_BRIEF") => {
    if (!targetEmail.trim()) {
      setFeedbackMsg({ type: "error", text: "Please provide a valid recipient email" });
      return;
    }

    setTriggeringWorkflow(workflowType);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: workflowType,
          targetEmail: targetEmail.trim(),
          medicationName: "Amlodipine Besylate 5mg",
          elderNote: "Feeling slightly dizzy, waiting until after light meal",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({
          type: "success",
          text: data.result?.message || `Dispatched ${workflowType} successfully!`,
        });
        await onRefreshState();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to trigger workflow" });
      }
    } catch {
      setFeedbackMsg({ type: "error", text: "Network error triggering alert engine" });
    } finally {
      setTriggeringWorkflow(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs">
        <motion.div
          initial={{ x: "100%", opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white border-l border-slate-200 shadow-2xl w-full max-w-2xl h-full flex flex-col p-6 sm:p-8 overflow-y-auto"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  Proactive Email & Escalation Center
                </h2>
                <p className="text-xs text-slate-500">Autonomous alert dispatch & live audit engine</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tester Recipient Input Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                Target Recipient Email (Judge Live Test)
              </label>
              <span className="text-[11px] text-teal-700 font-medium">Type any address to test</span>
            </div>

            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="Enter your personal or judge email to test live delivery"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:border-teal-600 focus:outline-none shadow-inner"
            />
            <p className="text-[11px] text-slate-500 mt-2">
              If <code>RESEND_API_KEY</code> is present in environment, dispatches live email. Otherwise,
              instant fallback records the dispatch in the Audit Log below with fully rendered HTML preview!
            </p>
          </div>

          {/* Feedback banner */}
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-xs font-semibold mb-6 flex items-center gap-2 ${
                feedbackMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </motion.div>
          )}

          {/* 3 Real Workflow Action Buttons */}
          <div className="space-y-3 mb-8">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Trigger One-Click Autonomous Workflows
            </div>

            {/* Workflow 1: Upcoming Dose Reminder */}
            <button
              onClick={() => handleTriggerWorkflow("UPCOMING_DOSE")}
              disabled={!!triggeringWorkflow}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-teal-500 bg-white hover:bg-teal-50/20 transition flex items-center justify-between group shadow-xs active:scale-99"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Send Upcoming Dose Reminder</div>
                  <div className="text-xs text-slate-500">
                    Dispatches today&apos;s full medication schedule and spacing precautions to Care Circle
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 group-hover:bg-teal-600 group-hover:text-white transition">
                {triggeringWorkflow === "UPCOMING_DOSE" ? "Sending..." : "Dispatch"}
              </span>
            </button>

            {/* Workflow 2: Simulate Missed Dose Escalation */}
            <button
              onClick={() => handleTriggerWorkflow("MISSED_DOSE_ESCALATION")}
              disabled={!!triggeringWorkflow}
              className="w-full text-left p-4 rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/70 transition flex items-center justify-between group shadow-xs active:scale-99"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-rose-950 text-sm">Simulate Missed Dose Escalation</div>
                  <div className="text-xs text-rose-800/80">
                    Marks overdue dose, bundles Raghavan&apos;s last note (&ldquo;Feeling dizzy&rdquo;) and notifies family
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 group-hover:bg-rose-600 group-hover:text-white transition">
                {triggeringWorkflow === "MISSED_DOSE_ESCALATION" ? "Escalating..." : "Trigger"}
              </span>
            </button>

            {/* Workflow 3: Doctor Appointment Brief */}
            <button
              onClick={() => handleTriggerWorkflow("DOCTOR_BRIEF")}
              disabled={!!triggeringWorkflow}
              className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 transition flex items-center justify-between group shadow-xs active:scale-99"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Send Doctor Appointment Brief</div>
                  <div className="text-xs text-slate-500">
                    Compiles patient history, active meds, and discussion checklist for Dr. Arvind Swaminathan
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition">
                {triggeringWorkflow === "DOCTOR_BRIEF" ? "Compiling..." : "Dispatch"}
              </span>
            </button>
          </div>

          {/* Live Email Dispatch Audit Log */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Live Email Dispatch Audit Trail ({state.emailLogs.length})
              </span>
              <span className="text-[11px] text-slate-400">Click any row to inspect HTML</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 flex-1 overflow-y-auto">
              {state.emailLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No email alerts logged yet. Trigger one above!
                </div>
              ) : (
                state.emailLogs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setPreviewLog(log)}
                    className="p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{log.subject}</div>
                      <div className="text-slate-500 text-[11px] truncate mt-0.5">
                        To: {log.recipientEmail} • {new Date(log.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.deliveryMode === "LIVE_RESEND"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {log.deliveryMode}
                      </span>
                      <Eye className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Preview Modal */}
          <EmailPreviewModal
            isOpen={!!previewLog}
            emailLog={previewLog}
            onClose={() => setPreviewLog(null)}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
