import {
  ElderProfile,
  CareCircleMember,
  Medication,
  DoseLog,
  Appointment,
  EmailAlertLog,
  KinCareState,
} from "@/types/kincare";

export const DEFAULT_ELDER_PROFILE: ElderProfile = {
  id: "elder_raghavan_01",
  name: "Raghavan Iyer",
  age: 74,
  bloodGroup: "O+",
  allergies: ["Penicillin", "Sulfa drugs"],
  primaryDoctor: "Dr. Arvind Swaminathan (Cardiology)",
  conditions: ["Essential Hypertension", "Type 2 Diabetes (Mild)", "Hypothyroidism"],
  residence: "Flat 402, Kaveri Heights, Bengaluru",
  emergencyPhone: "+91 98450 12345",
};

export const DEFAULT_CARE_CIRCLE: CareCircleMember[] = [
  {
    id: "member_elder_01",
    name: "Raghavan Iyer",
    role: "ELDER",
    relation: "Self (Elder)",
    email: "raghavan.iyer.care@gmail.com",
    passcode: "1111",
    permissions: ["LOG_DOSE", "VIEW_SCHEDULE", "REQUEST_CALL"],
    phone: "+91 98450 12345",
    avatarBg: "bg-teal-700",
  },
  {
    id: "member_family_01",
    name: "Anita Iyer",
    role: "FAMILY_ADMIN",
    relation: "Daughter (Primary Admin)",
    email: "anita.iyer.family@gmail.com",
    passcode: "2222",
    permissions: ["ALL"],
    phone: "+91 98765 43210",
    avatarBg: "bg-indigo-700",
  },
  {
    id: "member_caretaker_01",
    name: "Nurse Priya Thomas",
    role: "CARETAKER",
    relation: "Visiting Geriatric Caretaker",
    email: "priya.thomas.care@gmail.com",
    passcode: "3333",
    permissions: ["LOG_DOSE", "UPDATE_INVENTORY", "DOCTOR_PREP"],
    phone: "+91 94444 88888",
    avatarBg: "bg-emerald-700",
  },
];

export const DEFAULT_MEDICATIONS: Medication[] = [
  {
    id: "med_thyronorm",
    name: "Thyronorm (Levothyroxine)",
    dosage: "50 mcg",
    form: "Tablet",
    instructions: "Empty Stomach",
    scheduledTimes: ["07:00"],
    stockRemaining: 14,
    refillThreshold: 10,
    conflictNote: "Space at least 2 to 4 hours apart from Calcium and Iron supplements.",
    active: true,
    category: "Endocrine",
    purpose: "Thyroid hormone replacement",
  },
  {
    id: "med_amlodipine",
    name: "Amlodipine Besylate",
    dosage: "5 mg",
    form: "Tablet",
    instructions: "After Breakfast",
    scheduledTimes: ["09:00"],
    stockRemaining: 22,
    refillThreshold: 7,
    active: true,
    category: "Cardiovascular",
    purpose: "Blood pressure regulation",
  },
  {
    id: "med_calcium",
    name: "Shelcal-HD (Calcium + Vit D3)",
    dosage: "500 mg",
    form: "Tablet",
    instructions: "After Lunch",
    scheduledTimes: ["13:30"],
    stockRemaining: 6, // Low stock alert trigger
    refillThreshold: 10,
    conflictNote: "Interferes with Levothyroxine absorption; always take in the afternoon.",
    active: true,
    category: "Supplements",
    purpose: "Bone density and joint strength",
  },
  {
    id: "med_metformin",
    name: "Glycomet-SR (Metformin)",
    dosage: "500 mg",
    form: "Tablet",
    instructions: "After Dinner",
    scheduledTimes: ["20:00"],
    stockRemaining: 28,
    refillThreshold: 8,
    active: true,
    category: "Endocrine",
    purpose: "Blood glucose glycemic control",
  },
  {
    id: "med_atorvastatin",
    name: "Atorva (Atorvastatin)",
    dosage: "10 mg",
    form: "Tablet",
    instructions: "Before Sleep",
    scheduledTimes: ["21:30"],
    stockRemaining: 18,
    refillThreshold: 7,
    active: true,
    category: "Cardiovascular",
    purpose: "Cholesterol & cardiac protection",
  },
  {
    id: "med_eyedrops",
    name: "Refresh Tears (Carboxymethylcellulose)",
    dosage: "2 drops each eye",
    form: "Drops",
    instructions: "After Breakfast",
    scheduledTimes: ["08:30"],
    stockRemaining: 2, // Low stock alert trigger
    refillThreshold: 3,
    active: true,
    category: "Ophthalmology",
    purpose: "Ocular moisture & dry eye comfort",
  },
];

export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 86400 * 1000);
  return yesterday.toISOString().split("T")[0];
}

export const DEFAULT_DOSE_LOGS: DoseLog[] = [
  {
    id: "dose_log_yesterday_01",
    medicationId: "med_calcium",
    medicationName: "Shelcal-HD (Calcium + Vit D3)",
    date: getYesterdayDateString(),
    scheduledTime: "13:30",
    status: "SKIPPED_WITH_REASON",
    takenAt: undefined,
    elderNote: "Stomach felt upset, resting.",
    loggedByRole: "ELDER",
    loggedByName: "Raghavan Iyer",
  },
  {
    id: "dose_log_01",
    medicationId: "med_thyronorm",
    medicationName: "Thyronorm (Levothyroxine)",
    date: getTodayDateString(),
    scheduledTime: "07:00",
    status: "TAKEN",
    takenAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    elderNote: "Took with full glass of lukewarm water on empty stomach as instructed.",
    loggedByRole: "ELDER",
    loggedByName: "Raghavan Iyer",
  },
  {
    id: "dose_log_02",
    medicationId: "med_eyedrops",
    medicationName: "Refresh Tears (Carboxymethylcellulose)",
    date: getTodayDateString(),
    scheduledTime: "08:30",
    status: "TAKEN",
    takenAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    elderNote: "Applied without stinging.",
    loggedByRole: "ELDER",
    loggedByName: "Raghavan Iyer",
  },
  {
    id: "dose_log_03",
    medicationId: "med_amlodipine",
    medicationName: "Amlodipine Besylate",
    date: getTodayDateString(),
    scheduledTime: "09:00",
    status: "SKIPPED_WITH_REASON",
    takenAt: undefined,
    elderNote: "Feeling slightly dizzy, taking after lunch meal instead.",
    loggedByRole: "ELDER",
    loggedByName: "Raghavan Iyer",
  },
  {
    id: "dose_log_04",
    medicationId: "med_calcium",
    medicationName: "Shelcal-HD (Calcium + Vit D3)",
    date: getTodayDateString(),
    scheduledTime: "13:30",
    status: "UPCOMING",
    loggedByRole: "SYSTEM",
  },
  {
    id: "dose_log_05",
    medicationId: "med_metformin",
    medicationName: "Glycomet-SR (Metformin)",
    date: getTodayDateString(),
    scheduledTime: "20:00",
    status: "UPCOMING",
    loggedByRole: "SYSTEM",
  },
  {
    id: "dose_log_06",
    medicationId: "med_atorvastatin",
    medicationName: "Atorva (Atorvastatin)",
    date: getTodayDateString(),
    scheduledTime: "21:30",
    status: "UPCOMING",
    loggedByRole: "SYSTEM",
  },
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: "appt_cardio_01",
    doctorName: "Dr. Arvind Swaminathan",
    specialty: "Interventional Cardiology",
    hospital: "Apollo Speciality Hospital, Bannerghatta",
    dateTime: new Date(Date.now() + 3 * 86400 * 1000 + 4 * 3600 * 1000).toISOString(),
    notes: "Quarterly cardiac assessment & BP calibration. Bring 14-day home BP reading log.",
    checklistQuestions: [
      "Check whether morning dizzy spell is related to Amlodipine peak vasodilation.",
      "Review latest Lipid Panel and Serum Creatinine lab values.",
      "Evaluate if knee stiffness allows resuming 30-min morning lawn walks.",
      "Check if Calcium supplement timing needs adjustment with winter diet.",
    ],
    reminderSent: false,
    location: "OPD Suite 204, 2nd Floor",
  },
];

export const DEFAULT_EMAIL_LOGS: EmailAlertLog[] = [
  {
    id: "email_log_01",
    recipientEmail: "anita.iyer.family@gmail.com",
    type: "UPCOMING_DOSE",
    subject: "KinCare Morning Schedule: Raghavan Iyer (3 Meds Scheduled)",
    bodyPreview: "Morning medications scheduled: Thyronorm 50mcg (07:00), Refresh Tears (08:30), Amlodipine 5mg (09:00).",
    sentAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    deliveryMode: "SIMULATED_PREVIEW",
    status: "DELIVERED",
    triggerSource: "Scheduled Morning Digest",
  },
  {
    id: "email_log_02",
    recipientEmail: "anita.iyer.family@gmail.com",
    type: "REFILL_WARNING",
    subject: "Refill Notice: Shelcal-HD (Calcium) is at 6 tablets remaining",
    bodyPreview: "Shelcal-HD has fallen below your 10 tablet refill buffer. Please reorder from pharmacy.",
    sentAt: new Date(Date.now() - 1 * 86400 * 1000).toISOString(),
    deliveryMode: "SIMULATED_PREVIEW",
    status: "DELIVERED",
    triggerSource: "Pill Inventory Monitor",
  },
];

export function createDefaultState(): KinCareState {
  const defaultProfile = { ...DEFAULT_ELDER_PROFILE };
  return {
    activePatientId: defaultProfile.id,
    allPatients: [defaultProfile],
    elderProfile: defaultProfile,
    careCircle: [...DEFAULT_CARE_CIRCLE],
    medications: [...DEFAULT_MEDICATIONS],
    doseLogs: [...DEFAULT_DOSE_LOGS],
    appointments: [...DEFAULT_APPOINTMENTS],
    emailLogs: [...DEFAULT_EMAIL_LOGS],
    lastUpdated: new Date().toISOString(),
  };
}
