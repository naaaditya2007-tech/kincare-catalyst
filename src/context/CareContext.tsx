"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  KinCareState,
  Role,
  Medication,
  CareCircleMember,
  DoseLog,
  ElderProfile,
  PatientOnboardingInput,
} from "@/types/kincare";

interface CareContextType {
  state: KinCareState | null;
  loading: boolean;
  currentRole: Role;
  allPatients: ElderProfile[];
  setCurrentRole: (role: Role) => Promise<void>;
  switchPatient: (patientId: string) => Promise<void>;
  createPatient: (input: PatientOnboardingInput) => Promise<void>;
  refreshState: () => Promise<void>;
  logDoseAction: (
    medicationId: string,
    status: "TAKEN" | "SKIPPED_WITH_REASON",
    elderNote?: string,
    scheduledTime?: string
  ) => Promise<void>;
  updateMedication: (
    action: "ADD" | "UPDATE" | "TOGGLE_ACTIVE" | "DELETE",
    med: Partial<Medication>
  ) => Promise<void>;
  addDoctorQuestion: (question: string) => Promise<void>;
  deleteDoctorQuestion: (index: number) => Promise<void>;
  updatePasscode: (memberId: string, newPasscode: string) => Promise<void>;
  addCareCircleMember: (member: Partial<CareCircleMember>) => Promise<void>;
  resetToSeedData: () => Promise<void>;
  requestFamilyCall: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  emailCenterOpen: boolean;
  setEmailCenterOpen: (open: boolean) => void;
  onboardingModalOpen: boolean;
  setOnboardingModalOpen: (open: boolean) => void;
  handleLogout: () => Promise<void>;
}

const CareContext = createContext<CareContextType | undefined>(undefined);

/**
 * CareProvider Component
 * 
 * Top-level React Context Provider managing global state for the KinCare platform.
 * Synchronizes real-time dose actions, multi-patient switching, inventory levels,
 * appointments, and proactive email dispatch across Elder Companion and Care Circle dashboards.
 * 
 * @param {{ children: ReactNode }} props - React component children
 * @returns {React.ReactElement} The rendered Context Provider
 */
export const CareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [state, setState] = useState<KinCareState | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRoleState] = useState<Role>("ELDER");
  const [emailCenterOpen, setEmailCenterOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

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
          setCurrentRoleState(authData.session.member.role);
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
  }, []);

  const setCurrentRole = useCallback(
    async (newRole: Role) => {
      setCurrentRoleState(newRole);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        const data = await res.json();
        if (data.success && data.member) {
          showToast(
            `Switched view to ${
              newRole === "ELDER"
                ? "Elder Companion"
                : newRole === "FAMILY_ADMIN"
                ? "Family Admin"
                : "Caretaker"
            }`
          );
        }
      } catch {
        showToast(`Switched view to ${newRole}`);
      }
    },
    [showToast]
  );

  const switchPatient = useCallback(
    async (patientId: string) => {
      try {
        const res = await fetch("/api/kincare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "SWITCH_PATIENT", patientId }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast(`Active elder switched to ${data.state.elderProfile.name}`);
        }
      } catch {
        showToast("Failed to switch patient profile.");
      }
    },
    [showToast]
  );

  const createPatient = useCallback(
    async (input: PatientOnboardingInput) => {
      try {
        const res = await fetch("/api/kincare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CREATE_PATIENT", patientData: input }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast(`Onboarded new elder profile: ${input.name}`);
        }
      } catch {
        showToast("Failed to onboard new patient profile.");
      }
    },
    [showToast]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // Continue to redirect
    }
    // Completely clear stale state upon logout
    setState(null);
    setCurrentRoleState("ELDER");
    setEmailCenterOpen(false);
    setOnboardingModalOpen(false);
    setToastMessage(null);
    router.replace("/");
  }, [router]);

  // INSTANT OPTIMISTIC SYNCHRONIZATION FOR DOSE ACTIONS
  const logDoseAction = useCallback(
    async (
      medicationId: string,
      status: "TAKEN" | "SKIPPED_WITH_REASON",
      elderNote?: string,
      scheduledTime?: string
    ) => {
      // 1. Optimistic instant local update
      setState((prevState) => {
        if (!prevState) return prevState;

        const med = prevState.medications.find((m) => m.id === medicationId);
        const medName = med ? med.name : "Medication";
        const nowIso = new Date().toISOString();
        const todayStr = nowIso.split("T")[0];

        const newLog: DoseLog = {
          id: `log-${Date.now()}`,
          medicationId,
          medicationName: medName,
          date: todayStr,
          scheduledTime: scheduledTime || (med ? med.scheduledTimes[0] : "08:00"),
          status,
          takenAt: status === "TAKEN" ? nowIso : undefined,
          elderNote,
          loggedByRole: currentRole,
          loggedByName:
            currentRole === "ELDER"
              ? prevState.elderProfile.name
              : currentRole === "FAMILY_ADMIN"
              ? "Anita Iyer (Daughter)"
              : "Nurse Priya Nair",
        };

        const filteredLogs = prevState.doseLogs.filter(
          (l) => !(l.medicationId === medicationId && l.date === todayStr)
        );

        const updatedMeds = prevState.medications.map((m) => {
          if (m.id === medicationId && status === "TAKEN") {
            return {
              ...m,
              stockRemaining: Math.max(0, m.stockRemaining - 1),
            };
          }
          return m;
        });

        return {
          ...prevState,
          medications: updatedMeds,
          doseLogs: [newLog, ...filteredLogs],
          lastUpdated: nowIso,
        };
      });

      showToast(
        status === "TAKEN"
          ? "Dose logged successfully! Pill inventory updated."
          : "Postponed with reason. Care Circle notified."
      );

      // 2. Persist to server API
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
        if (data.success && data.state) {
          setState(data.state);
        }
      } catch (err) {
        console.error("Dose action server sync failed:", err);
        refreshState();
      }
    },
    [currentRole, showToast, refreshState]
  );

  const updateMedication = useCallback(
    async (action: "ADD" | "UPDATE" | "TOGGLE_ACTIVE" | "DELETE", med: Partial<Medication>) => {
      try {
        const res = await fetch("/api/medications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, medication: med }),
        });
        const data = await res.json();
        if (data.success && data.state) {
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
    },
    [showToast]
  );

  const addDoctorQuestion = useCallback(
    async (question: string) => {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ADD_QUESTION", question }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast("Checklist question added for Dr. Arvind Swaminathan.");
        }
      } catch {
        showToast("Error adding doctor question.");
      }
    },
    [showToast]
  );

  const deleteDoctorQuestion = useCallback(
    async (index: number) => {
      try {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "DELETE_QUESTION", index }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast("Checklist question removed.");
        }
      } catch {
        showToast("Error deleting question.");
      }
    },
    [showToast]
  );

  const updatePasscode = useCallback(
    async (memberId: string, newPasscode: string) => {
      try {
        const res = await fetch("/api/care-circle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "UPDATE_PASSCODE", memberId, newPasscode }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast("Passcode updated successfully!");
        }
      } catch {
        showToast("Error updating passcode.");
      }
    },
    [showToast]
  );

  const addCareCircleMember = useCallback(
    async (member: Partial<CareCircleMember>) => {
      try {
        const res = await fetch("/api/care-circle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ADD_MEMBER", member }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast("Care Circle member added!");
        }
      } catch {
        showToast("Error adding circle member.");
      }
    },
    [showToast]
  );

  const resetToSeedData = useCallback(async () => {
    if (confirm("Reset all KinCare medication, adherence logs, and email history to default seed state?")) {
      try {
        const res = await fetch("/api/kincare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "RESET" }),
        });
        const data = await res.json();
        if (data.success && data.state) {
          setState(data.state);
          showToast("State reset to Raghavan Iyer default seed data!");
        }
      } catch {
        showToast("Failed to reset state.");
      }
    }
  }, [showToast]);

  const requestFamilyCall = useCallback(() => {
    showToast("Urgent call ping sent to Anita Iyer and Nurse Priya!");
  }, [showToast]);

  const allPatients = state?.allPatients || (state?.elderProfile ? [state.elderProfile] : []);

  return (
    <CareContext.Provider
      value={{
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
        showToast,
        emailCenterOpen,
        setEmailCenterOpen,
        onboardingModalOpen,
        setOnboardingModalOpen,
        handleLogout,
      }}
    >
      {children}
    </CareContext.Provider>
  );
};

/**
 * Custom React hook to access KinCare global care context.
 * 
 * @throws {Error} If called outside of a CareProvider component tree
 * @returns {CareContextType} The active KinCare context object
 */
export const useCare = (): CareContextType => {
  const context = useContext(CareContext);
  if (!context) {
    throw new Error("useCare must be used within a CareProvider");
  }
  return context;
};
