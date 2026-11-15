"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/common/Navbar";
import { ElderDashboard } from "@/components/elder/ElderDashboard";
import { CommandCenterDashboard } from "@/components/command/CommandCenterDashboard";
import { ProactiveEmailEscalationCenter } from "@/components/email/ProactiveEmailEscalationCenter";
import type { KinCareState, Role, Medication, CareCircleMember } from "@/types/kincare";
import { CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<KinCareState | null>(null);
  const [currentRole, setCurrentRole] = useState<Role>("ELDER");
  const [emailCenterOpen, setEmailCenterOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch("/api/kincare");
      const data = await res.json();
      if (data.success && data.state) {
        setState(data.state);
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch("/api/auth");
        const authData = await authRes.json();

        if (authData.authenticated && authData.session?.member) {
          setCurrentRole(authData.session.member.role);
        } else {
          setCurrentRole("ELDER");
        }

        const stateRes = await fetch("/api/kincare");
        const stateData = await stateRes.json();
        if (stateData.success && stateData.state) {
          setState(stateData.state);
        }
      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router]);

  const handleRoleSwitch = async (newRole: Role) => {
    setCurrentRole(newRole);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        showToast(`Switched view to ${newRole === "ELDER" ? "Elder Companion" : newRole === "FAMILY_ADMIN" ? "Family Admin" : "Caretaker"}`);
      }
    } catch {
      showToast(`Switched view to ${newRole}`);
    }
  };

  const handleResetData = async () => {
    if (confirm("Reset all KinCare medication, adherence logs, and email history to default seed state?")) {
      try {
        const res = await fetch("/api/kincare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESET" }),
        });
        const data = await res.json();
        if (data.success) {
          setState(data.state);
          showToast("State reset to Raghavan Iyer default seed data!");
        }
      } catch {
        showToast("Failed to reset state.");
      }
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  };

  const handleDoseAction = async (
    medicationId: string,
    status: "TAKEN" | "SKIPPED_WITH_REASON",
    elderNote?: string,
    scheduledTime?: string
  ) => {
    try {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          status,
          loggedByRole: currentRole,
          elderNote,
          scheduledTime,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast(
          status === "TAKEN"
            ? "Dose logged successfully! Pill inventory updated."
            : "Postponed with reason. Care Circle notified."
        );
      }
    } catch {
      showToast("Error updating dose status.");
    }
  };

  const handleRequestCall = () => {
    showToast("Urgent call ping sent to Anita Iyer and Nurse Priya!");
  };

  const handleUpdateMedication = async (
    action: "ADD" | "UPDATE" | "TOGGLE_ACTIVE" | "DELETE",
    med: Partial<Medication>
  ) => {
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, medication: med }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast(
          action === "ADD"
            ? "Medication added successfully!"
            : action === "DELETE"
            ? "Medication deleted."
            : "Medication updated."
        );
      }
    } catch {
      showToast("Failed to update medication.");
    }
  };

  const handleAddDoctorQuestion = async (question: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_QUESTION", question }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast("Checklist question added for Dr. Arvind Swaminathan.");
      }
    } catch {
      showToast("Error adding doctor question.");
    }
  };

  const handleDeleteDoctorQuestion = async (index: number) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_QUESTION", index }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast("Checklist question removed.");
      }
    } catch {
      showToast("Error deleting question.");
    }
  };

  const handleUpdatePasscode = async (memberId: string, newPasscode: string) => {
    try {
      const res = await fetch("/api/care-circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_PASSCODE", memberId, newPasscode }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast("Passcode updated successfully!");
      }
    } catch {
      showToast("Error updating passcode.");
    }
  };

  const handleAddMember = async (member: Partial<CareCircleMember>) => {
    try {
      const res = await fetch("/api/care-circle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ADD_MEMBER", member }),
      });
      const data = await res.json();
      if (data.success) {
        setState(data.state);
        showToast("Care Circle member added!");
      }
    } catch {
      showToast("Error adding circle member.");
    }
  };

  // Skeleton Loading State (Apple Health Geometry)
  if (loading || !state) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Navbar Skeleton */}
        <div className="w-full h-16 bg-white border-b border-slate-200/60 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            <div className="w-24 h-4 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-8 bg-slate-200 rounded-full animate-pulse" />
            <div className="w-28 h-8 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Dashboard Content Skeleton */}
        <div className="max-w-7xl w-full mx-auto px-8 py-10 space-y-8 flex-1">
          {/* Greeting Skeleton */}
          <div className="h-32 w-full bg-white rounded-3xl ring-1 ring-slate-900/5 p-8 flex items-center justify-between">
            <div className="space-y-3 w-1/2">
              <div className="w-36 h-3 bg-slate-200 rounded-full animate-pulse" />
              <div className="w-64 h-6 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="w-48 h-12 bg-slate-200 rounded-full animate-pulse" />
          </div>

          {/* Cards Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white rounded-3xl ring-1 ring-slate-900/5 p-7 flex flex-col justify-between">
                <div className="w-28 h-3 bg-slate-200 rounded-full animate-pulse" />
                <div className="w-20 h-10 bg-slate-200 rounded-full animate-pulse" />
                <div className="w-32 h-2.5 bg-slate-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>

          {/* Timeline Cards Skeleton */}
          <div className="space-y-4 pt-4">
            <div className="w-48 h-4 bg-slate-200 rounded-full animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-white rounded-3xl ring-1 ring-slate-900/5 p-8 flex items-center justify-between">
                <div className="space-y-3 w-1/2">
                  <div className="w-32 h-3 bg-slate-200 rounded-full animate-pulse" />
                  <div className="w-48 h-5 bg-slate-200 rounded-full animate-pulse" />
                </div>
                <div className="w-36 h-12 bg-slate-200 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        elderProfile={state.elderProfile}
        onRoleSwitch={handleRoleSwitch}
        onOpenEmailCenter={() => setEmailCenterOpen(true)}
        onResetData={handleResetData}
        onLogout={handleLogout}
        emailLogCount={state.emailLogs.length}
      />

      {/* Main Mode View with Smooth Framer Motion Transition */}
      <main className="flex-1 pb-20 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {currentRole === "ELDER" ? (
              <ElderDashboard
                state={state}
                onDoseAction={handleDoseAction}
                onRequestCall={handleRequestCall}
              />
            ) : (
              <CommandCenterDashboard
                state={state}
                currentRole={currentRole}
                onUpdateMedication={handleUpdateMedication}
                onAddDoctorQuestion={handleAddDoctorQuestion}
                onDeleteDoctorQuestion={handleDeleteDoctorQuestion}
                onUpdatePasscode={handleUpdatePasscode}
                onAddMember={handleAddMember}
                onTriggerEscalation={() => setEmailCenterOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Proactive Email & Escalation Center Drawer */}
      <ProactiveEmailEscalationCenter
        isOpen={emailCenterOpen}
        onClose={() => setEmailCenterOpen(false)}
        state={state}
        onRefreshState={refreshState}
      />

      {/* Toast Notification (Pill Shaped) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-5 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 ring-1 ring-white/10">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
