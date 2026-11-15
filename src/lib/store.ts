import fs from "fs";
import path from "path";
import os from "os";
import {
  KinCareState,
  Medication,
  DoseLog,
  DoseStatus,
  Role,
} from "@/types/kincare";
import {
  createDefaultState,
  getTodayDateString,
} from "@/lib/constants";

const STORE_FILE_PATH = path.join(os.tmpdir(), "kincare_eldercare_store.json");

let inMemoryState: KinCareState | null = null;

export function getKinCareState(): KinCareState {
  if (inMemoryState) {
    return inMemoryState;
  }

  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed.elderProfile && parsed.careCircle && parsed.medications) {
          inMemoryState = parsed;
          return inMemoryState!;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read persistence file, initializing fallback memory store:", err);
  }

  inMemoryState = createDefaultState();
  saveKinCareState(inMemoryState);
  return inMemoryState;
}

export function saveKinCareState(state: KinCareState): void {
  state.lastUpdated = new Date().toISOString();
  inMemoryState = state;
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist state to disk (/tmp):", err);
  }
}

export function resetToSeedState(): KinCareState {
  inMemoryState = createDefaultState();
  saveKinCareState(inMemoryState);
  return inMemoryState;
}

// Helper Domain Mutations
export function recordDoseAction(
  medicationId: string,
  status: DoseStatus,
  loggedByRole: Role | "SYSTEM",
  elderNote?: string,
  customScheduledTime?: string
): { success: boolean; doseLog: DoseLog; medication?: Medication; state: KinCareState } {
  const state = getKinCareState();
  const medIndex = state.medications.findIndex((m) => m.id === medicationId);
  const med = medIndex !== -1 ? state.medications[medIndex] : null;

  if (!med) {
    throw new Error(`Medication with id ${medicationId} not found`);
  }

  const today = getTodayDateString();
  const scheduledTime = customScheduledTime || med.scheduledTimes[0] || "08:00";

  // Check if an existing dose log exists for this med + scheduledTime today
  const existingLogIndex = state.doseLogs.findIndex(
    (l) => l.medicationId === medicationId && l.date === today && l.scheduledTime === scheduledTime
  );

  const doseLog: DoseLog = {
    id: existingLogIndex !== -1 ? state.doseLogs[existingLogIndex].id : `dose_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    medicationId,
    medicationName: med.name,
    date: today,
    scheduledTime,
    status,
    takenAt: status === "TAKEN" ? new Date().toISOString() : undefined,
    elderNote: elderNote || (existingLogIndex !== -1 ? state.doseLogs[existingLogIndex].elderNote : undefined),
    loggedByRole,
    loggedByName:
      state.careCircle.find((m) => m.role === loggedByRole)?.name ||
      (loggedByRole === "ELDER" ? state.elderProfile.name : loggedByRole),
  };

  if (existingLogIndex !== -1) {
    state.doseLogs[existingLogIndex] = doseLog;
  } else {
    state.doseLogs.unshift(doseLog);
  }

  // Decrement stock if TAKEN
  if (status === "TAKEN" && med.stockRemaining > 0) {
    med.stockRemaining -= 1;
    state.medications[medIndex] = med;

    // If stock drops at or below refill threshold, record refill alert if not already logged recently
    if (med.stockRemaining <= med.refillThreshold) {
      const recentRefillAlert = state.emailLogs.find(
        (e) => e.type === "REFILL_WARNING" && e.subject.includes(med.name)
      );
      if (!recentRefillAlert) {
        state.emailLogs.unshift({
          id: `email_refill_${Date.now()}`,
          recipientEmail: state.careCircle.find((c) => c.role === "FAMILY_ADMIN")?.email || "family@example.com",
          type: "REFILL_WARNING",
          subject: `Automated Stock Notice: ${med.name} low (${med.stockRemaining} left)`,
          bodyPreview: `${med.name} has reached ${med.stockRemaining} units remaining. Threshold is ${med.refillThreshold}. Please replenish.`,
          sentAt: new Date().toISOString(),
          deliveryMode: "SIMULATED_PREVIEW",
          status: "DELIVERED",
          triggerSource: "Automatic Inventory Monitor",
        });
      }
    }
  }

  saveKinCareState(state);
  return { success: true, doseLog, medication: med, state };
}
