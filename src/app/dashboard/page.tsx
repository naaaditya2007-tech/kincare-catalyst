"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/common/Navbar";
import { ElderDashboard } from "@/components/elder/ElderDashboard";
import { CommandCenterDashboard } from "@/components/command/CommandCenterDashboard";
import { ProactiveEmailEscalationCenter } from "@/components/email/ProactiveEmailEscalationCenter";
import { ElderOnboardingModal } from "@/components/auth/ElderOnboardingModal";
import { CareProvider, useCare } from "@/context/CareContext";
import { CheckCircle2 } from "lucide-react";

function DashboardContent() {
  const {
    state,
    loading,
    currentRole,
    allPatients,
    setCurrentRole,
    switchPatient,
    createPatient,
    refreshState,
    logDoseAction,
    updateMedication,
    addDoctorQuestion,
    deleteDoctorQuestion,
    updatePasscode,
    addCareCircleMember,
    resetToSeedData,
    requestFamilyCall,
    toastMessage,
    emailCenterOpen,
    setEmailCenterOpen,
    onboardingModalOpen,
    setOnboardingModalOpen,
    handleLogout,
  } = useCare();

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
          <div className="h-32 w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex items-center justify-between">
            <div className="space-y-3 w-1/2">
              <div className="w-36 h-3 bg-slate-200 rounded-full animate-pulse" />
              <div className="w-64 h-6 bg-slate-200 rounded-full animate-pulse" />
            </div>
            <div className="w-48 h-12 bg-slate-200 rounded-full animate-pulse" />
          </div>

          {/* Cards Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex flex-col justify-between">
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
              <div key={i} className="h-36 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 flex items-center justify-between">
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
      {/* Top Navbar with Dynamic Multi-Patient Switcher */}
      <Navbar
        currentRole={currentRole}
        elderProfile={state.elderProfile}
        allPatients={allPatients}
        onRoleSwitch={setCurrentRole}
        onSwitchPatient={switchPatient}
        onOpenOnboarding={() => setOnboardingModalOpen(true)}
        onOpenEmailCenter={() => setEmailCenterOpen(true)}
        onResetData={resetToSeedData}
        onLogout={handleLogout}
        emailLogCount={state.emailLogs.length}
      />

      {/* Main Mode View with Smooth Framer Motion Transition */}
      <main className="flex-1 pb-20 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.elderProfile.id}-${currentRole}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {currentRole === "ELDER" ? (
              <ElderDashboard
                state={state}
                onDoseAction={logDoseAction}
                onRequestCall={requestFamilyCall}
              />
            ) : (
              <CommandCenterDashboard
                state={state}
                currentRole={currentRole}
                onUpdateMedication={updateMedication}
                onAddDoctorQuestion={addDoctorQuestion}
                onDeleteDoctorQuestion={deleteDoctorQuestion}
                onUpdatePasscode={updatePasscode}
                onAddMember={addCareCircleMember}
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

      {/* Patient Onboarding Modal */}
      <ElderOnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        onSubmit={createPatient}
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

export default function DashboardPage() {
  return (
    <CareProvider>
      <DashboardContent />
    </CareProvider>
  );
}
