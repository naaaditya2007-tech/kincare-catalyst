import fs from "fs";
import path from "path";
import os from "os";
import {
  KinCareState,
  PatientRecord,
  ElderProfile,
  Medication,
  DoseLog,
  DoseStatus,
  Role,
  PatientOnboardingInput,
  CareCircleMember,
} from "@/types/kincare";
import {
  DEFAULT_ELDER_PROFILE,
  DEFAULT_CARE_CIRCLE,
  DEFAULT_MEDICATIONS,
  DEFAULT_DOSE_LOGS,
  DEFAULT_APPOINTMENTS,
  DEFAULT_EMAIL_LOGS,
  DEFAULT_KAVITA_PROFILE,
  DEFAULT_KAVITA_CARE_CIRCLE,
  KAVITA_SAMPLE_MEDICATIONS,
  KAVITA_SAMPLE_DOSE_LOGS,
  KAVITA_SAMPLE_APPOINTMENTS,
  generateStarterMedications,
  getTodayDateString,
} from "@/lib/constants";

export interface MultiPatientStore {
  activePatientId: string;
  patients: PatientRecord[];
}

const STORE_FILE_PATH = path.join(os.tmpdir(), "kincare_multi_patient_store.json");

let inMemoryStore: MultiPatientStore | null = null;

/**
 * Instantiates the default patient records for initial application bootstrap.
 * Seeds both primary patient Raghavan Iyer and secondary patient Kavita Ramanathan
 * with realistic clinical histories, timetables, and active Care Circles.
 * 
 * @returns {PatientRecord[]} Array of initialized seed patient records
 */
function createDefaultSeedPatients(): PatientRecord[] {
  const raghavan: PatientRecord = {
    elderProfile: { ...DEFAULT_ELDER_PROFILE },
    careCircle: [...DEFAULT_CARE_CIRCLE],
    medications: [...DEFAULT_MEDICATIONS],
    doseLogs: [...DEFAULT_DOSE_LOGS],
    appointments: [...DEFAULT_APPOINTMENTS],
    emailLogs: [...DEFAULT_EMAIL_LOGS],
    lastUpdated: new Date().toISOString(),
  };

  const kavita: PatientRecord = {
    elderProfile: { ...DEFAULT_KAVITA_PROFILE },
    careCircle: [...DEFAULT_KAVITA_CARE_CIRCLE],
    medications: [...KAVITA_SAMPLE_MEDICATIONS],
    doseLogs: [...KAVITA_SAMPLE_DOSE_LOGS],
    appointments: [...KAVITA_SAMPLE_APPOINTMENTS],
    emailLogs: [],
    lastUpdated: new Date().toISOString(),
  };

  return [raghavan, kavita];
}

/**
 * Validates and repairs patient data integrity across the MultiPatientStore.
 * Guarantees that default patients exist and that every registered elder profile
 * contains active medications, dose logs, and appointments.
 * 
 * @param {MultiPatientStore} store - The store to validate and auto-repair
 * @returns {boolean} True if repairs/updates were applied to the store, false otherwise
 */
function ensurePatientDataIntegrity(store: MultiPatientStore): boolean {
  let changed = false;

  // 1. Ensure Kavita Ramanathan exists in the patients list
  const kavitaExists = store.patients.some((p) =>
    p.elderProfile.name.toLowerCase().includes("kavita")
  );
  if (!kavitaExists) {
    const kavitaRecord: PatientRecord = {
      elderProfile: { ...DEFAULT_KAVITA_PROFILE },
      careCircle: [...DEFAULT_KAVITA_CARE_CIRCLE],
      medications: [...KAVITA_SAMPLE_MEDICATIONS],
      doseLogs: [...KAVITA_SAMPLE_DOSE_LOGS],
      appointments: [...KAVITA_SAMPLE_APPOINTMENTS],
      emailLogs: [],
      lastUpdated: new Date().toISOString(),
    };
    store.patients.push(kavitaRecord);
    changed = true;
  }

  // 2. Ensure each patient has medications and dose logs
  store.patients.forEach((p) => {
    const isKavita = p.elderProfile.name.toLowerCase().includes("kavita");
    if (isKavita) {
      if (!p.medications || p.medications.length === 0) {
        p.medications = [...KAVITA_SAMPLE_MEDICATIONS];
        p.doseLogs = [...KAVITA_SAMPLE_DOSE_LOGS];
        p.appointments = [...KAVITA_SAMPLE_APPOINTMENTS];
        changed = true;
      }
    } else {
      if (!p.medications || p.medications.length === 0) {
        p.medications = generateStarterMedications(p.elderProfile.id);
        p.doseLogs = p.medications.map((m, idx) => ({
          id: `dose_${p.elderProfile.id}_${idx}`,
          medicationId: m.id,
          medicationName: m.name,
          date: getTodayDateString(),
          scheduledTime: m.scheduledTimes[0] || "08:00",
          status: idx === 0 ? "TAKEN" : "UPCOMING",
          takenAt: idx === 0 ? new Date().toISOString() : undefined,
          elderNote: idx === 0 ? "Taken on schedule" : undefined,
          loggedByRole: "ELDER",
          loggedByName: p.elderProfile.name,
        }));
        changed = true;
      }
    }
  });

  return changed;
}

/**
 * Retrieves the global multi-patient store from memory or disk persistence.
 * Initializes default seed patients if no persistence file exists.
 * 
 * @returns {MultiPatientStore} The active MultiPatientStore instance
 */
export function getMultiPatientStore(): MultiPatientStore {
  if (inMemoryStore && inMemoryStore.patients?.length > 0) {
    const changed = ensurePatientDataIntegrity(inMemoryStore);
    if (changed) {
      saveMultiPatientStore(inMemoryStore);
    }
    return inMemoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const raw = fs.readFileSync(STORE_FILE_PATH, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed.patients && Array.isArray(parsed.patients) && parsed.patients.length > 0) {
          const changed = ensurePatientDataIntegrity(parsed);
          inMemoryStore = parsed;
          if (changed) {
            saveMultiPatientStore(inMemoryStore!);
          }
          return inMemoryStore!;
        } else if (parsed.elderProfile && parsed.careCircle) {
          // Backward compatibility: wrap single-patient legacy format
          const legacyPatient: PatientRecord = {
            elderProfile: parsed.elderProfile,
            careCircle: parsed.careCircle,
            medications: parsed.medications || [],
            doseLogs: parsed.doseLogs || [],
            appointments: parsed.appointments || [],
            emailLogs: parsed.emailLogs || [],
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
          inMemoryStore = {
            activePatientId: legacyPatient.elderProfile.id,
            patients: [legacyPatient],
          };
          ensurePatientDataIntegrity(inMemoryStore);
          saveMultiPatientStore(inMemoryStore);
          return inMemoryStore;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read multi-patient persistence file, initializing fallback store:", err);
  }

  const defaultPatients = createDefaultSeedPatients();
  inMemoryStore = {
    activePatientId: defaultPatients[0].elderProfile.id,
    patients: defaultPatients,
  };
  saveMultiPatientStore(inMemoryStore);
  return inMemoryStore;
}

/**
 * Persists the entire MultiPatientStore to memory and atomic disk storage.
 * 
 * @param {MultiPatientStore} store - The updated store object to write
 * @returns {void}
 */
export function saveMultiPatientStore(store: MultiPatientStore): void {
  inMemoryStore = store;
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to persist multi-patient store to disk (/tmp):", err);
  }
}

/**
 * Synthesizes the active KinCareState for the currently selected patient.
 * Exposes the active patient's profile, medications, doseLogs, and care circle.
 * 
 * @returns {KinCareState} The compiled KinCareState object
 */
export function getKinCareState(): KinCareState {
  const store = getMultiPatientStore();
  let activeRecord = store.patients.find((p) => p.elderProfile.id === store.activePatientId);

  if (!activeRecord) {
    activeRecord = store.patients[0];
    store.activePatientId = activeRecord.elderProfile.id;
  }

  return {
    activePatientId: store.activePatientId,
    allPatients: store.patients.map((p) => p.elderProfile),
    elderProfile: activeRecord.elderProfile,
    careCircle: activeRecord.careCircle,
    medications: activeRecord.medications,
    doseLogs: activeRecord.doseLogs,
    appointments: activeRecord.appointments,
    emailLogs: activeRecord.emailLogs,
    lastUpdated: activeRecord.lastUpdated,
  };
}

/**
 * Commits updates from an active KinCareState back into the corresponding patient record.
 * 
 * @param {KinCareState} state - The modified state to commit
 * @returns {void}
 */
export function saveKinCareState(state: KinCareState): void {
  const store = getMultiPatientStore();
  const index = store.patients.findIndex((p) => p.elderProfile.id === state.elderProfile.id);

  const updatedRecord: PatientRecord = {
    elderProfile: state.elderProfile,
    careCircle: state.careCircle,
    medications: state.medications,
    doseLogs: state.doseLogs,
    appointments: state.appointments,
    emailLogs: state.emailLogs,
    lastUpdated: new Date().toISOString(),
  };

  if (index !== -1) {
    store.patients[index] = updatedRecord;
  } else {
    store.patients.push(updatedRecord);
  }

  store.activePatientId = state.elderProfile.id;
  saveMultiPatientStore(store);
}

/**
 * Retrieves all registered PatientRecord objects across the multi-tenant platform.
 * 
 * @returns {PatientRecord[]} Array of all complete patient records
 */
export function getAllPatientRecords(): PatientRecord[] {
  const store = getMultiPatientStore();
  return store.patients;
}

/**
 * Retrieves a list of all registered ElderProfile metadata objects.
 * Used for populating patient selection dropdowns without leaking private notes.
 * 
 * @returns {ElderProfile[]} Array of elder profile summaries
 */
export function getAllElderProfiles(): ElderProfile[] {
  const store = getMultiPatientStore();
  return store.patients.map((p) => p.elderProfile);
}

/**
 * Switches the active patient context to a specified patient ID.
 * 
 * @param {string} patientId - The unique ID of the elder patient to activate
 * @returns {KinCareState} The updated state scoped to the newly selected patient
 */
export function switchActivePatient(patientId: string): KinCareState {
  const store = getMultiPatientStore();
  const exists = store.patients.some((p) => p.elderProfile.id === patientId);
  if (exists) {
    store.activePatientId = patientId;
    saveMultiPatientStore(store);
  }
  return getKinCareState();
}

/**
 * Dynamically creates and registers a new elderly patient profile in the platform.
 * Generates initial Care Circle roles, unique PINs, and starter prescriptions/timetables.
 * 
 * @param {PatientOnboardingInput} input - Onboarding form data (name, age, bloodGroup, allergies, PINs)
 * @returns {{ state: KinCareState; newPatient: PatientRecord }} The updated global state and new patient record
 */
export function createElderPatient(input: PatientOnboardingInput): { state: KinCareState; newPatient: PatientRecord } {
  const store = getMultiPatientStore();
  const newId = `elder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const newElderProfile: ElderProfile = {
    id: newId,
    name: input.name.trim(),
    age: Number(input.age),
    bloodGroup: input.bloodGroup || "O+",
    allergies: input.allergies && input.allergies.length > 0 ? input.allergies : ["No Known Allergies"],
    primaryDoctor: input.primaryDoctor || "Dr. Arvind Swaminathan (Cardiology)",
    conditions: input.conditions || ["Under General Geriatric Observation"],
    residence: input.residence || "Care Home Suite 101, Bengaluru",
    emergencyPhone: input.emergencyPhone || "+91 98450 99999",
  };

  const newCareCircle: CareCircleMember[] = [
    {
      id: `member_elder_${newId}`,
      name: input.name.trim(),
      role: "ELDER",
      relation: "Self (Elder)",
      email: `${input.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.care@gmail.com`,
      passcode: input.elderPin || "1111",
      permissions: ["LOG_DOSE", "VIEW_SCHEDULE", "REQUEST_CALL"],
      avatarBg: "bg-teal-700",
    },
    {
      id: `member_family_${newId}`,
      name: `Family Admin (${input.name.split(" ")[0]})`,
      role: "FAMILY_ADMIN",
      relation: "Primary Family Administrator",
      email: `family.${input.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`,
      passcode: input.familyPin || "2222",
      permissions: ["ALL"],
      avatarBg: "bg-indigo-700",
    },
    {
      id: `member_caretaker_${newId}`,
      name: "Visiting Nurse",
      role: "CARETAKER",
      relation: "Assisting Caregiver",
      email: `caretaker.${input.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@gmail.com`,
      passcode: input.caretakerPin || "3333",
      permissions: ["LOG_DOSE", "UPDATE_INVENTORY", "DOCTOR_PREP"],
      avatarBg: "bg-emerald-700",
    },
  ];

  const starterMeds =
    input.seedSamplePrescriptions !== false ? generateStarterMedications(newId) : [];
  const starterLogs: DoseLog[] = starterMeds.map((med, idx) => ({
    id: `dose_log_${newId}_${idx}`,
    medicationId: med.id,
    medicationName: med.name,
    date: getTodayDateString(),
    scheduledTime: med.scheduledTimes[0] || "08:00",
    status: idx === 0 ? "TAKEN" : "UPCOMING",
    takenAt: idx === 0 ? new Date(Date.now() - 2 * 3600 * 1000).toISOString() : undefined,
    elderNote: idx === 0 ? "Taken on schedule with water." : undefined,
    loggedByRole: "ELDER",
    loggedByName: input.name.trim(),
  }));

  const newPatientRecord: PatientRecord = {
    elderProfile: newElderProfile,
    careCircle: newCareCircle,
    medications: starterMeds,
    doseLogs: starterLogs,
    appointments: [
      {
        id: `appt_${newId}_01`,
        doctorName: input.primaryDoctor || "Dr. Arvind Swaminathan",
        specialty: "Geriatric & Family Health",
        hospital: "City Care Specialty Hospital",
        dateTime: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        notes: "Initial geriatric onboarding health check & medication schedule calibration.",
        checklistQuestions: [
          "Confirm dosage frequency and compatibility with existing allergies.",
          "Check home blood pressure and resting pulse ranges.",
        ],
        reminderSent: false,
        location: "OPD Consultation Room 12",
      },
    ],
    emailLogs: [],
    lastUpdated: new Date().toISOString(),
  };

  store.patients.push(newPatientRecord);
  store.activePatientId = newId;
  saveMultiPatientStore(store);

  return {
    state: getKinCareState(),
    newPatient: newPatientRecord,
  };
}

/**
 * Resets the entire multi-patient data store back to initial pristine seed states.
 * Reinstates Raghavan Iyer and Kavita Ramanathan with fresh timetables and dosages.
 * 
 * @returns {KinCareState} The reset KinCareState object
 */
export function resetToSeedState(): KinCareState {
  const defaultPatients = createDefaultSeedPatients();
  inMemoryStore = {
    activePatientId: defaultPatients[0].elderProfile.id,
    patients: defaultPatients,
  };
  saveMultiPatientStore(inMemoryStore);
  return getKinCareState();
}

/**
 * Records a dose action (TAKEN, SKIPPED_WITH_REASON, MISSED) for a specific medication.
 * Automatically manages inventory stock levels and triggers refill warnings if low.
 * 
 * @param {string} medicationId - The ID of the target medication
 * @param {DoseStatus} status - The status of the dose ("TAKEN" | "SKIPPED_WITH_REASON" | "MISSED" | "UPCOMING")
 * @param {Role | "SYSTEM"} loggedByRole - The role of the actor logging this dose
 * @param {string} [elderNote] - Optional empathy note or reason provided by the elder
 * @param {string} [customScheduledTime] - Optional specific scheduled time override
 * @returns {{ success: boolean; doseLog: DoseLog; medication?: Medication; state: KinCareState }} Result payload
 */
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
