export type Role = "ELDER" | "FAMILY_ADMIN" | "CARETAKER";

export type MedicationForm = "Tablet" | "Capsule" | "Drops" | "Inhaler" | "Syrup";

export type MealInstruction = 
  | "After Breakfast" 
  | "Empty Stomach" 
  | "Before Sleep" 
  | "With Lunch" 
  | "After Dinner" 
  | "With Food" 
  | string;

export type DoseStatus = "TAKEN" | "MISSED" | "SKIPPED_WITH_REASON" | "UPCOMING";

export type AlertType = 
  | "UPCOMING_DOSE" 
  | "MISSED_DOSE_ESCALATION" 
  | "APPOINTMENT_REMINDER" 
  | "REFILL_WARNING";

export type DeliveryMode = "LIVE_RESEND" | "SIMULATED_PREVIEW";

export interface CareCircleMember {
  id: string;
  name: string;
  role: Role;
  relation: string;
  email: string;
  passcode: string; // 4-digit PIN (1111, 2222, 3333)
  permissions: string[];
  phone?: string;
  avatarBg?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: MedicationForm;
  instructions: MealInstruction;
  scheduledTimes: string[]; // ["08:00", "20:00"]
  stockRemaining: number;
  refillThreshold: number;
  conflictNote?: string; // e.g. "Space 2 hours apart from Calcium supplements"
  active: boolean;
  purpose?: string;
  category?: string;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: DoseStatus;
  takenAt?: string; // ISO string
  elderNote?: string; // e.g. "Feeling slightly dizzy, taking after lunch"
  loggedByRole: Role | "SYSTEM";
  loggedByName?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  dateTime: string; // ISO string
  notes: string;
  checklistQuestions: string[];
  reminderSent: boolean;
  location?: string;
}

export interface EmailAlertLog {
  id: string;
  recipientEmail: string;
  type: AlertType;
  subject: string;
  bodyPreview: string;
  htmlContent?: string;
  sentAt: string; // ISO string
  deliveryMode: DeliveryMode;
  status: "DELIVERED" | "SIMULATED_PREVIEW" | "FAILED";
  triggerSource?: string;
}

export interface ElderProfile {
  id: string;
  name: string;
  age: number;
  bloodGroup: string;
  allergies: string[];
  primaryDoctor: string;
  conditions: string[];
  residence: string;
  emergencyPhone: string;
}

export interface KinCareState {
  elderProfile: ElderProfile;
  careCircle: CareCircleMember[];
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  emailLogs: EmailAlertLog[];
  lastUpdated: string;
}

export interface AuthSession {
  member: CareCircleMember;
  elderProfile: ElderProfile;
  authenticatedAt: string;
}
